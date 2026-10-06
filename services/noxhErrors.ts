import { ServiceError } from './errors';

/** Đã có hồ sơ ở dự án này (máy chủ trả kèm `ho_so_id`) → màn mở hồ sơ đó. */
export class NoxhConflictError extends ServiceError {
  constructor(
    message: string,
    public readonly hoSoId: string,
  ) {
    super(message, 'CONFLICT');
    this.name = 'NoxhConflictError';
  }
}
