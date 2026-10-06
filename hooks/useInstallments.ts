import { getInstallments } from '@/services';

import { useAsync } from './useAsync';

export function useInstallments(contractId: string) {
  return useAsync(() => getInstallments(contractId), [contractId]);
}
