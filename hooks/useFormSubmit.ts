import { useCallback, useState } from 'react';

import { getErrorField, getErrorMessage } from '@/services/errors';

export interface SubmitFailure {
  message: string;
  /** Ô nhập server báo lỗi (nếu có). */
  field?: string;
}

/**
 * Chạy một thao tác gửi form (gọi services), quản lý trạng thái loading và
 * chuyển lỗi thành { message, field } để gắn đúng ô nhập.
 */
export function useFormSubmit<TArgs extends unknown[], TResult>(action: (...args: TArgs) => Promise<TResult>) {
  const [submitting, setSubmitting] = useState(false);

  const submit = useCallback(
    async (...args: TArgs): Promise<{ ok: true; result: TResult } | { ok: false; error: SubmitFailure }> => {
      setSubmitting(true);
      try {
        const result = await action(...args);
        return { ok: true, result };
      } catch (e) {
        return { ok: false, error: { message: getErrorMessage(e), field: getErrorField(e) } };
      } finally {
        setSubmitting(false);
      }
    },
    [action],
  );

  return { submit, submitting };
}
