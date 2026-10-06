import type { Contract, ContractCounts, ContractFilter, ContractListItem } from '@/types';

import { calcPercent } from './payment';

/** Đếm hợp đồng cho các tab lọc: Tất cả / Đang hiệu lực / Đã tất toán. */
export function countContractsByStatus(contracts: Pick<Contract, 'status'>[]): ContractCounts {
  return {
    all: contracts.length,
    active: contracts.filter((c) => c.status === 'active').length,
    completed: contracts.filter((c) => c.status === 'completed').length,
  };
}

/** Khớp từ khóa với mã hợp đồng, mã căn hoặc tên dự án (bỏ dấu, hoa/thường, khoảng trắng, "/", "-"). */
export function matchesContractSearch(contract: Pick<Contract, 'code' | 'unitCode' | 'projectName'>, keyword: string | undefined): boolean {
  const normalize = (v: string) =>
    v
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/gi, 'd')
      .toLowerCase()
      .replace(/[\s/-]/g, '');
  const k = keyword ? normalize(keyword) : '';
  return !k || [contract.code, contract.unitCode, contract.projectName].some((v) => normalize(v).includes(k));
}

export function matchesContractFilter(contract: Contract, filter: ContractFilter): boolean {
  if (filter.status && filter.status !== 'all' && contract.status !== filter.status) return false;
  if (filter.type && filter.type !== 'all' && contract.type !== filter.type) return false;
  return matchesContractSearch(contract, filter.search);
}

/** Tổng của danh sách hợp đồng đang xem (dòng tổng quan gọn ở thanh bám dính). */
export function summarizeContractList(items: Pick<ContractListItem, 'totalValue' | 'summary'>[]) {
  const totalValue = items.reduce((s, c) => s + c.totalValue, 0);
  const paidAmount = items.reduce((s, c) => s + c.summary.paidAmount, 0);
  return { count: items.length, totalValue, paidAmount, paidPercent: calcPercent(paidAmount, totalValue) };
}

/** "Căn A1-1107 · A1 · Tầng 11" — bỏ phần trống (dữ liệu thật có thể thiếu toà / tầng). */
export function unitLine(contract: Pick<Contract, 'unitCode' | 'block' | 'floor'>, withFloor = true): string {
  return [`Căn ${contract.unitCode}`, contract.block, withFloor && contract.floor > 0 ? `Tầng ${contract.floor}` : '']
    .filter(Boolean)
    .join(' · ');
}

/** Nhãn trạng thái hiển thị: tên gốc trên server nếu có, không thì nhãn chung của app. */
export function contractStatusText(contract: Pick<Contract, 'statusLabel'>, fallback: string): string {
  return contract.statusLabel || fallback;
}
