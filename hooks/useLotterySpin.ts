import { useCallback, useEffect, useRef, useState } from 'react';
import { useReducedMotion } from 'react-native-reanimated';

import { spinLottery } from '@/services';
import { getErrorMessage, ServiceError } from '@/services/errors';
import type { NoxhSpinResult } from '@/types';

/** Lồng cầu quay tối thiểu (song song với lời gọi máy chủ) để khách thấy rõ thao tác bốc thăm. */
const MIN_SPIN_MS = 2500;
/** Quá thời gian này → báo mất kết nối, cho thử lại (máy chủ trả cùng kết quả). */
const TIMEOUT_MS = 20000;
/** Máy chủ báo chưa mở đợt → khoá nút, đếm lùi. */
const COOLDOWN_S = 15;

const NOT_OPEN = 'Chưa đến giờ bốc thăm';
const OFFLINE = 'Mất kết nối — Thử lại';

const delay = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

export interface LotterySpinState {
  spin: () => Promise<void>;
  spinning: boolean;
  result: NoxhSpinResult | null;
  error: string | null;
  /** Số giây còn khoá nút sau lỗi "chưa đến giờ". */
  cooldown: number;
}

/** Bốc thăm một lượt: chặn bấm đúp, quay ≥ 2,5 s, quá 20 s thì huỷ, chưa mở đợt thì khoá 15 s. */
export function useLotterySpin(btHoSoId: string): LotterySpinState {
  const reduceMotion = useReducedMotion();
  const inFlight = useRef(false);
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState<NoxhSpinResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return;
    const id = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(id);
  }, [cooldown]);

  const spin = useCallback(async () => {
    if (inFlight.current) return;
    inFlight.current = true;
    setSpinning(true);
    setError(null);
    let timer: ReturnType<typeof setTimeout> | undefined;
    try {
      const timeout = new Promise<never>((_, reject) => {
        timer = setTimeout(() => reject(new ServiceError(OFFLINE, 'NETWORK')), TIMEOUT_MS);
      });
      const [res] = await Promise.race([Promise.all([spinLottery(btHoSoId), delay(reduceMotion ? 0 : MIN_SPIN_MS)]), timeout]);
      setResult(res);
    } catch (e) {
      const message = getErrorMessage(e);
      if (message === NOT_OPEN) {
        setError('Ban tổ chức chưa mở đợt, vui lòng thử lại sau ít giây');
        setCooldown(COOLDOWN_S);
      } else if (e instanceof ServiceError && e.code === 'NETWORK') {
        setError(OFFLINE);
      } else {
        setError(message);
      }
    } finally {
      if (timer) clearTimeout(timer);
      inFlight.current = false;
      setSpinning(false);
    }
  }, [btHoSoId, reduceMotion]);

  return { spin, spinning, result, error, cooldown };
}
