/** Lỗi nghiệp vụ có thông điệp tiếng Việt, hiển thị trực tiếp cho người dùng. */
export class ServiceError extends Error {
  constructor(
    message: string,
    public readonly code: 'UNAUTHORIZED' | 'NOT_FOUND' | 'CONFLICT' | 'NETWORK' | 'UNKNOWN' = 'UNKNOWN',
    /** Ô nhập liên quan (nếu lỗi gắn với một trường cụ thể của form). */
    public readonly field?: string,
  ) {
    super(message);
    this.name = 'ServiceError';
  }
}

export function getErrorMessage(error: unknown): string {
  if (error instanceof ServiceError) return error.message;
  return 'Đã có lỗi xảy ra. Vui lòng thử lại.';
}

/** Trường bị lỗi do server báo về (dùng để gắn lỗi đúng ô nhập). */
export function getErrorField(error: unknown): string | undefined {
  return error instanceof ServiceError ? error.field : undefined;
}
