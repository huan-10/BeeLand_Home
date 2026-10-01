/** Lỗi nghiệp vụ có thông điệp tiếng Việt, hiển thị trực tiếp cho người dùng. */
export class ServiceError extends Error {
  constructor(
    message: string,
    public readonly code: 'UNAUTHORIZED' | 'NOT_FOUND' | 'NETWORK' | 'UNKNOWN' = 'UNKNOWN',
  ) {
    super(message);
    this.name = 'ServiceError';
  }
}

export function getErrorMessage(error: unknown): string {
  if (error instanceof ServiceError) return error.message;
  return 'Đã có lỗi xảy ra. Vui lòng thử lại.';
}
