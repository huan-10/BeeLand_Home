import type { Receipt, ReceiptAllocation, ReceiptAllocationPart } from '@/types';

/** Một đợt trong lịch đầy đủ (kể cả đợt chờ mốc), đúng thứ tự phân bổ của máy chủ. */
export interface AllocationDot {
  dot_tt: number;
  dot_tt_text: string | null;
  phai_thu: number | null;
  phai_thu_pbt: number | null;
}

/** Một dòng chi tiết phiếu thu tính vào lịch. `nhom` phân loại y như fn_contract_payment_schedule. */
export interface AllocationLine {
  ma_phieu_id: string;
  dot_tt: number | null;
  nhom: 'GOC' | 'PBT' | 'LAI';
  loai_ten: string | null;
  so_tien: number | null;
  /** Dòng kế thừa từ hợp đồng gốc (chuyển nhượng) — tính vào lịch nhưng không có trong danh sách phiếu. */
  ke_thua?: boolean;
}

export interface AllocationInput {
  chuyen_nhuong: boolean;
  dot: AllocationDot[];
  /** Theo ngày phiếu tăng dần. */
  dong: AllocationLine[];
}

const num = (v: number | null | undefined) => Number(v) || 0;
const dotName = (d: AllocationDot) => d.dot_tt_text || `Đợt ${d.dot_tt}`;
const PART_LABEL = { GOC: 'tiền căn hộ', PBT: 'phí bảo trì' } as const;

/**
 * Chia tiền từng phiếu vào các đợt, cùng luật fn_contract_payment_schedule (tổng mỗi đợt khớp "đã thu" của lịch):
 * gốc và phí bảo trì là hai dòng tiền riêng; dòng gắn đợt N vào đợt N, dòng không gắn đợt vào từ đợt đầu;
 * dư của đợt chảy sang đợt sau. Trong một đợt, tiền chảy từ đợt trước dùng trước, rồi tới phiếu cũ hơn (FIFO).
 * Tiền lãi không vào đợt nào.
 */
export function allocateReceipts(input: AllocationInput): Map<string, ReceiptAllocation> {
  const result = new Map<string, ReceiptAllocation>();
  const entry = (id: string) => {
    let a = result.get(id);
    if (!a) {
      a = { typeLabel: '', parts: [], interestAmount: 0, unallocatedAmount: 0, transferred: input.chuyen_nhuong };
      result.set(id, a);
    }
    return a;
  };
  const types = new Map<string, Set<string>>();
  for (const l of input.dong) {
    if (l.ke_thua) continue;
    const a = entry(l.ma_phieu_id);
    if (l.loai_ten) types.set(l.ma_phieu_id, (types.get(l.ma_phieu_id) ?? new Set()).add(l.loai_ten));
    if (l.nhom === 'LAI') {
      a.interestAmount += num(l.so_tien);
      if (!a.interestLabel && num(l.dot_tt) > 0) {
        const d = input.dot.find((x) => x.dot_tt === l.dot_tt);
        a.interestLabel = d ? dotName(d) : `Đợt ${l.dot_tt}`;
      }
    }
  }
  for (const [id, set] of types) entry(id).typeLabel = [...set].join(', ');

  const addPart = (id: string, label: string, amount: number) => {
    const parts: ReceiptAllocationPart[] = entry(id).parts;
    const last = parts.find((p) => p.label === label);
    if (last) last.amount += amount;
    else parts.push({ label, amount });
  };

  for (const nhom of ['GOC', 'PBT'] as const) {
    const lines = input.dong.filter((l) => l.nhom === nhom && num(l.so_tien) > 0);
    if (input.chuyen_nhuong) {
      for (const l of lines) if (!l.ke_thua) entry(l.ma_phieu_id).unallocatedAmount += num(l.so_tien);
      continue;
    }
    const firstIndex = new Map<number, number>();
    input.dot.forEach((d, i) => firstIndex.has(d.dot_tt) || firstIndex.set(d.dot_tt, i));
    const queue: { line: AllocationLine; left: number }[] = [];
    const enter = (i: number) =>
      lines
        .filter((l) => (num(l.dot_tt) > 0 ? firstIndex.get(num(l.dot_tt)) === i : i === 0))
        .forEach((line) => queue.push({ line, left: num(line.so_tien) }));
    input.dot.forEach((d, i) => {
      enter(i);
      let need = num(nhom === 'GOC' ? d.phai_thu : d.phai_thu_pbt);
      while (need > 0 && queue.length > 0) {
        const chunk = queue[0];
        const take = Math.min(chunk.left, need);
        if (!chunk.line.ke_thua) addPart(chunk.line.ma_phieu_id, `${dotName(d)} · ${PART_LABEL[nhom]}`, take);
        chunk.left -= take;
        need -= take;
        if (chunk.left <= 0) queue.shift();
      }
    });
    // Dư sau đợt cuối + dòng gắn đợt không có trong lịch → chưa trừ vào đâu.
    for (const c of queue) if (!c.line.ke_thua) entry(c.line.ma_phieu_id).unallocatedAmount += c.left;
    for (const l of lines) {
      if (!l.ke_thua && num(l.dot_tt) > 0 && !firstIndex.has(num(l.dot_tt))) entry(l.ma_phieu_id).unallocatedAmount += num(l.so_tien);
    }
  }
  return result;
}

export interface ReceiptsSummary {
  /** Tổng tiền các phiếu. */
  total: number;
  /** Phần trừ vào các đợt của hợp đồng. */
  intoContract: number;
  interest: number;
  unallocated: number;
}

/** Tổng đối chiếu đầu tab Phiếu thu; chỉ khi mọi phiếu có phân bổ (thiếu dữ liệu → null, không hiện số sai). */
export function summarizeReceipts(receipts: Pick<Receipt, 'amount' | 'allocation' | 'status'>[]): ReceiptsSummary | null {
  const paid = receipts.filter((r) => r.status !== 'cancelled');
  if (paid.length === 0 || paid.some((r) => !r.allocation)) return null;
  const s: ReceiptsSummary = { total: 0, intoContract: 0, interest: 0, unallocated: 0 };
  for (const r of paid) {
    const a = r.allocation as ReceiptAllocation;
    s.total += r.amount;
    s.intoContract += a.parts.reduce((t, p) => t + p.amount, 0);
    s.interest += a.interestAmount;
    s.unallocated += a.unallocatedAmount;
  }
  return s;
}
