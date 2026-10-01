import { getContractById, getContractCounts, getContracts } from '@/services';
import type { ContractFilter } from '@/types';

import { useAsync } from './useAsync';

/** Danh sách hợp đồng theo bộ lọc, kèm số lượng cho từng tab lọc. */
export function useContracts(filter: ContractFilter = {}) {
  return useAsync(async () => {
    const [items, counts] = await Promise.all([getContracts(filter), getContractCounts(filter.search)]);
    return { items, counts };
  }, [filter.status, filter.type, filter.search]);
}

export function useContract(id: string | undefined) {
  return useAsync(async () => {
    if (!id) throw new Error('missing id');
    return getContractById(id);
  }, [id]);
}
