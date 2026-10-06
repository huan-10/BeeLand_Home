import { useEffect, useMemo, useState } from 'react';

import { withAccountPhone } from '@/lib/noxhForm';

import {
  getApplication,
  getLoaiCan,
  getMyApplications,
  getMyLotteries,
  getPublishedResult,
  getPublishedResults,
  getRound,
  getRounds,
} from '@/services';
import { onSessionChange } from '@/services/session';

import { useAsync } from './useAsync';

/** Tăng mỗi khi phiên đổi (kết nối NOXH, chuyển công ty, đăng xuất) → các hook NOXH tải lại. */
function useSessionVersion(): number {
  const [version, setVersion] = useState(0);
  useEffect(() => onSessionChange(() => setVersion((v) => v + 1)), []);
  return version;
}

/** Đợt nhận hồ sơ của các chủ đầu tư khách có tài khoản. */
export function useNoxhRounds() {
  const v = useSessionVersion();
  return useAsync(() => getRounds(), [v]);
}

export function useNoxhRound(id: string | undefined) {
  const v = useSessionVersion();
  return useAsync(async () => {
    if (!id) throw new Error('missing id');
    return getRound(id);
  }, [id, v]);
}

export function useNoxhLoaiCan(dotId: string | undefined) {
  return useAsync(async () => (dotId ? getLoaiCan(dotId) : []), [dotId]);
}

/** Hồ sơ của khách ở mọi công ty đã kết nối NOXH. */
export function useNoxhApplications() {
  const v = useSessionVersion();
  return useAsync(() => getMyApplications(), [v]);
}

/**
 * Chi tiết hồ sơ. `accountPhone` = SĐT khách đang đăng nhập: hồ sơ chưa có SĐT (tài khoản cổng trống `di_dong`) thì điền vào
 * bản chụp — form bước 2 hiện đúng số, kiểm "còn thiếu" và dữ liệu gửi lên khớp nhau (máy chủ vẫn ưu tiên SĐT của tài khoản).
 */
export function useNoxhApplication(id: string | undefined, accountPhone?: string | null) {
  const v = useSessionVersion();
  const state = useAsync(async () => {
    if (!id) throw new Error('missing id');
    return getApplication(id);
  }, [id, v]);
  const data = useMemo(
    () => (state.data ? { ...state.data, kh_snapshot: withAccountPhone(state.data.kh_snapshot, accountPhone) } : undefined),
    [state.data, accountPhone],
  );
  return { ...state, data };
}

/** Các lượt bốc thăm + giờ máy chủ. */
export function useNoxhLotteries() {
  const v = useSessionVersion();
  return useAsync(() => getMyLotteries(), [v]);
}

export function usePublishedResults() {
  const v = useSessionVersion();
  return useAsync(() => getPublishedResults(), [v]);
}

/** Kết quả của một đợt đã công bố (tải khi chọn đợt). */
export function usePublishedResult(btId: string | undefined) {
  return useAsync(async () => (btId ? getPublishedResult(btId) : null), [btId]);
}
