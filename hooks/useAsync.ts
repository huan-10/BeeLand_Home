import { useCallback, useEffect, useRef, useState } from 'react';

import { getErrorMessage } from '@/services/errors';

export interface AsyncState<T> {
  data: T | undefined;
  /** Đang tải lần đầu (chưa có dữ liệu). */
  loading: boolean;
  /** Đang tải lại khi đã có dữ liệu (kéo để làm mới). */
  refreshing: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Chạy một hàm async và quản lý trạng thái loading / error / data.
 * `deps` quyết định khi nào gọi lại `fn`.
 */
export function useAsync<T>(fn: () => Promise<T>, deps: readonly unknown[]): AsyncState<T> {
  const [data, setData] = useState<T | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const requestId = useRef(0);
  const fnRef = useRef(fn);
  fnRef.current = fn;

  const run = useCallback(async (mode: 'load' | 'refresh') => {
    const id = ++requestId.current;
    if (mode === 'load') setLoading(true);
    else setRefreshing(true);
    setError(null);
    try {
      const result = await fnRef.current();
      if (id === requestId.current) setData(result);
    } catch (e) {
      if (id === requestId.current) setError(getErrorMessage(e));
    } finally {
      if (id === requestId.current) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, []);

  useEffect(() => {
    void run('load');
    return () => {
      // Bỏ qua kết quả của request cũ khi deps thay đổi hoặc unmount.
      requestId.current++;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  const refetch = useCallback(() => run('refresh'), [run]);

  return { data, loading, refreshing, error, refetch };
}
