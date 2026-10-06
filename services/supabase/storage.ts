import { SUPABASE_ANON_KEY, SUPABASE_URL } from '../config';
import { ServiceError } from '../errors';

/** Tệp người dùng chọn: web có `blob` (File), native chỉ có `uri`. */
export interface UploadableFile {
  name: string;
  size: number;
  type: string | null;
  uri: string;
  blob?: Blob;
}

/**
 * URL ký do máy chủ tạo có thể mang host nội bộ (kong) → đổi sang host công khai của Supabase
 * (giống `toPublicStorageUrl` của web). Không có `/storage/v1/` → giữ nguyên.
 */
export function publicStorageUrl(url: string): string {
  const i = url.indexOf('/storage/v1/');
  return i < 0 ? url : `${SUPABASE_URL.replace(/\/+$/, '')}${url.slice(i)}`;
}

/** React Native nhận phần tệp dạng `{ uri, name, type }` trong FormData (không phải Blob). */
function nativeFilePart(file: UploadableFile): Blob {
  const part = { uri: file.uri, name: file.name, type: file.type ?? 'application/octet-stream' };
  return part as unknown as Blob;
}

/** PUT multipart bằng XMLHttpRequest (lớp mạng native của React Native; web là XHR của trình duyệt). */
function putMultipart(url: string, headers: Record<string, string>, body: FormData): Promise<{ status: number; text: string }> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('PUT', url);
    Object.entries(headers).forEach(([k, v]) => xhr.setRequestHeader(k, v));
    xhr.onload = () => resolve({ status: xhr.status, text: String(xhr.responseText ?? '') });
    xhr.onerror = () => reject(new Error('XMLHttpRequest network error'));
    xhr.ontimeout = () => reject(new Error('XMLHttpRequest timeout'));
    xhr.send(body);
  });
}

/**
 * Tải tệp lên bằng URL ký (giống `uploadToSignedUrl` của supabase-js): PUT multipart tới
 * `/storage/v1/object/upload/sign/<bucket>/<path>?token=…`, không ghi đè (`x-upsert: false`).
 *
 * Không dùng `fetch`: ở Expo SDK 57 `fetch` toàn cục là `expo/fetch`, không nhận phần tệp `{ uri, name, type }`
 * của React Native ("Unsupported FormDataPart implementation") → iOS/Android báo nhầm thành lỗi mạng.
 */
export async function uploadToSignedUrl(bucket: string, path: string, token: string, file: UploadableFile): Promise<void> {
  const body = new FormData();
  body.append('cacheControl', '3600');
  if (file.blob) body.append('', file.blob, file.name);
  else body.append('', nativeFilePart(file));
  const url = `${SUPABASE_URL}/storage/v1/object/upload/sign/${bucket}/${path.split('/').map(encodeURIComponent).join('/')}?token=${encodeURIComponent(token)}`;
  let res: { status: number; text: string };
  try {
    res = await putMultipart(url, { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}`, 'x-upsert': 'false' }, body);
  } catch {
    throw new ServiceError('Không kết nối được máy chủ. Vui lòng kiểm tra mạng và thử lại.', 'NETWORK');
  }
  if (res.status < 200 || res.status >= 300) throw new ServiceError('Tải tệp lên thất bại, vui lòng thử lại.');
}
