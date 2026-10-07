import { mockRequestCategories, mockRequestRows } from '@/data/mock/requests';
import { mockContracts } from '@/data/mock/contracts';
import { validateNoxhFile } from '@/lib/noxh';
import { REQUEST_FILE_MAX_MB, requestErrorMessage, toCustomerRequest, validateRequestForm } from '@/lib/requests';
import type { CustomerRequest, NoxhFormat, RequestOptions } from '@/types';

import { AUTH_BACKEND } from './config';
import { ServiceError } from './errors';
import { clone, simulateLatency } from './mockLatency';
import type { PickedFile } from './noxhService';
import { requirePortalToken } from './session';
import { edge, rpc } from './supabase/client';
import { publicStorageUrl, uploadToSignedUrl } from './supabase/storage';

/**
 * Yêu cầu khách hàng — CÙNG luồng web khách hàng (`PortalAccountService`): token phiên cổng khách hàng →
 * `fn_portal_request_options` / `fn_portal_request_create` / `fn_portal_my_requests`; tệp qua edge `portal-request-files`
 * (`upload-url` → tải lên link ký vào kho riêng tư `drive-files` → gửi `drive-files:<path>`; `download-url` → link xem 10 phút).
 * Ghi thật khi KHÁCH bấm "Gửi yêu cầu" (người dùng duyệt 2026-10-06); máy chủ gán nguồn "App khách hàng" (`p_nguon: 'app'`), trạng thái "Mới tiếp nhận" (`new`), số phiếu.
 */

const BUCKET = 'drive-files';
/** Định dạng máy chủ nhận (`fn_portal_request_file_check`; webp không có trong bộ chọn tệp của app). */
export const REQUEST_FORMATS: NoxhFormat[] = ['jpg', 'png', 'pdf', 'doc', 'docx', 'xls', 'xlsx'];

export interface NewRequestInput {
  title: string;
  content: string;
  categoryId?: string;
  contractId?: string;
  files: PickedFile[];
}

/** Lỗi máy chủ → câu cho khách (hàm / edge chưa triển khai → "chưa bật"). */
async function guard<T>(run: () => Promise<T>): Promise<T> {
  try {
    return await run();
  } catch (e) {
    if (e instanceof ServiceError) throw new ServiceError(requestErrorMessage(e.message), e.code, e.field);
    throw e;
  }
}

type Envelope<T> = { data?: T; error?: string };
async function filesCall<T>(body: Record<string, unknown>, fallback: string): Promise<T> {
  const res = await edge<Envelope<T> & { msg?: string }>('portal-request-files', body);
  if (res?.error) throw new ServiceError(requestErrorMessage(String(res.error)));
  if (!res?.data) throw new ServiceError(requestErrorMessage(res?.msg ? String(res.msg) : fallback));
  return res.data;
}

/** Kiểm tệp ngay trên máy (định dạng, HEIC, ≤ 10 MB) trước khi xin link tải lên. */
export function checkRequestFile(file: PickedFile): string | null {
  const check = validateNoxhFile(file, REQUEST_FORMATS, REQUEST_FILE_MAX_MB);
  return check.ok ? null : check.message;
}

/* ---------------- Luồng thật ---------------- */

async function apiOptions(): Promise<RequestOptions> {
  const res = await rpc<{ loai?: { id: string; name: string }[]; hop_dong?: { id: string; name: string }[] } | null>('fn_portal_request_options', {
    p_token: requirePortalToken(),
  });
  return { categories: res?.loai ?? [], contracts: res?.hop_dong ?? [] };
}

async function apiList(): Promise<CustomerRequest[]> {
  const res = await rpc<{ rows?: Record<string, unknown>[] } | null>('fn_portal_my_requests', { p_token: requirePortalToken() });
  return (res?.rows ?? []).map(toCustomerRequest);
}

async function apiUpload(file: PickedFile): Promise<string> {
  const token = requirePortalToken();
  const signed = await filesCall<{ path?: string; token?: string }>(
    { action: 'upload-url', token, ten: file.name, size: file.size, type: file.type ?? '' },
    'Không tạo được liên kết tải lên',
  );
  if (!signed.path || !signed.token) throw new ServiceError('Không tạo được liên kết tải lên');
  await uploadToSignedUrl(BUCKET, signed.path, signed.token, file);
  return `${BUCKET}:${signed.path}`;
}

async function apiCreate(input: NewRequestInput, onProgress?: (done: number, total: number) => void): Promise<{ id: string; code: string }> {
  const files: string[] = [];
  for (let i = 0; i < input.files.length; i++) {
    onProgress?.(i, input.files.length);
    const file = input.files[i];
    if (file) files.push(await apiUpload(file));
  }
  onProgress?.(input.files.length, input.files.length);
  const res = await rpc<{ id?: string; so_phieu?: string } | null>('fn_portal_request_create', {
    p_token: requirePortalToken(),
    p_tieu_de: input.title.trim(),
    p_noi_dung: input.content.trim() || null,
    p_loai_id: input.categoryId ?? null,
    p_pgc_id: input.contractId ?? null,
    p_dinh_kem: files,
    p_nguon: 'app',
  });
  return { id: String(res?.id ?? ''), code: String(res?.so_phieu ?? '') };
}

/* ---------------- Dữ liệu giả ---------------- */

const mockStore = clone(mockRequestRows);

/* ---------------- API cho màn hình ---------------- */

/** Loại yêu cầu + hợp đồng của khách để chọn khi gửi. */
export async function getRequestOptions(): Promise<RequestOptions> {
  if (AUTH_BACKEND === 'api') return guard(apiOptions);
  await simulateLatency();
  return {
    categories: clone(mockRequestCategories),
    contracts: mockContracts.map((c) => ({ id: c.id, name: [c.code, c.unitCode, c.projectName].filter(Boolean).join(' · ') })),
  };
}

/** Yêu cầu của khách đang đăng nhập, mới nhất trước (kèm lịch sử phản hồi). */
export async function getMyRequests(): Promise<CustomerRequest[]> {
  if (AUTH_BACKEND === 'api') return guard(apiList);
  await simulateLatency();
  return mockStore.map(toCustomerRequest).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function getMyRequest(id: string): Promise<CustomerRequest> {
  const found = (await getMyRequests()).find((r) => r.id === id);
  if (!found) throw new ServiceError('Không tìm thấy yêu cầu.', 'NOT_FOUND');
  return found;
}

/** Gửi yêu cầu (tải tệp trước, báo tiến độ `done/total`). */
export async function createRequest(input: NewRequestInput, onProgress?: (done: number, total: number) => void): Promise<{ id: string; code: string }> {
  const errors = validateRequestForm({ title: input.title, content: input.content, files: input.files.length });
  const first = errors.title ?? errors.content ?? errors.files;
  if (first) throw new ServiceError(first, 'UNKNOWN', errors.title ? 'title' : errors.content ? 'content' : 'files');
  for (const f of input.files) {
    const bad = checkRequestFile(f);
    if (bad) throw new ServiceError(`${f.name}: ${bad}`, 'UNKNOWN', 'files');
  }
  if (AUTH_BACKEND === 'api') return guard(() => apiCreate(input, onProgress));
  for (let i = 0; i <= input.files.length; i++) {
    onProgress?.(i, input.files.length);
    await simulateLatency(150, 300);
  }
  const now = new Date().toISOString();
  const seq = String(mockStore.length + 1).padStart(4, '0');
  const id = `yc-${Date.now()}`;
  const code = `YC${now.slice(2, 10).replace(/-/g, '')}-${seq}`;
  const cat = mockRequestCategories.find((c) => c.id === input.categoryId);
  const contract = mockContracts.find((c) => c.id === input.contractId);
  mockStore.unshift({
    id,
    so_phieu: code,
    tieu_de: input.title.trim(),
    noi_dung: input.content.trim() || null,
    loai: cat?.name ?? null,
    trang_thai: 'Mới tiếp nhận',
    mau: 'blue',
    hop_dong: contract?.code ?? null,
    created_at: now,
    updated_at: null,
    dinh_kem: input.files.map((f) => `mock/yeu-cau/${f.name}`),
    lich_su: [{ noi_dung: 'Khách hàng gửi yêu cầu từ app', trang_thai: 'Mới tiếp nhận', ngay: now }],
  });
  return { id, code };
}

/** Link xem tệp đính kèm (10 phút) — chỉ tệp thuộc yêu cầu của chính khách. */
export async function openRequestFile(path: string): Promise<string> {
  if (AUTH_BACKEND === 'api') {
    return guard(async () => {
      const res = await filesCall<{ url?: string }>({ action: 'download-url', token: requirePortalToken(), path }, 'Không mở được tệp');
      const url = publicStorageUrl(String(res.url ?? ''));
      if (!/^https?:\/\//i.test(url)) throw new ServiceError('Không mở được tệp');
      return url;
    });
  }
  await simulateLatency(100, 200);
  return '';
}
