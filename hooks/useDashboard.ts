import { getDashboardSummary } from '@/services';

import { useAsync } from './useAsync';

export function useDashboard() {
  return useAsync(getDashboardSummary, []);
}
