import type { Contract, ContractCounts, ContractFilter } from '@/types';

/** Đếm hợp đồng cho các tab lọc: Tất cả / Đang hiệu lực / Đã tất toán. */
export function countContractsByStatus(contracts: Pick<Contract, 'status'>[]): ContractCounts {
  return {
    all: contracts.length,
    active: contracts.filter((c) => c.status === 'active').length,
    completed: contracts.filter((c) => c.status === 'completed').length,
  };
}

/** Khớp từ khóa với mã hợp đồng (bỏ qua hoa/thường, khoảng trắng và dấu "/" , "-"). */
export function matchesContractCode(contract: Pick<Contract, 'code'>, keyword: string | undefined): boolean {
  const normalize = (v: string) => v.toLowerCase().replace(/[\s/-]/g, '');
  const k = keyword ? normalize(keyword) : '';
  return !k || normalize(contract.code).includes(k);
}

export function matchesContractFilter(contract: Contract, filter: ContractFilter): boolean {
  if (filter.status && filter.status !== 'all' && contract.status !== filter.status) return false;
  if (filter.type && filter.type !== 'all' && contract.type !== filter.type) return false;
  return matchesContractCode(contract, filter.search);
}
