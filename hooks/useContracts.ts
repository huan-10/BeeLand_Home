import { getContractById, getContracts } from '@/services';
import type { ContractFilter } from '@/types';

import { useAsync } from './useAsync';

export function useContracts(filter: ContractFilter = {}) {
  return useAsync(() => getContracts(filter), [filter.status, filter.type, filter.search]);
}

export function useContract(id: string | undefined) {
  return useAsync(async () => {
    if (!id) throw new Error('missing id');
    return getContractById(id);
  }, [id]);
}
