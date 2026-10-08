import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';

import { checkoutPaid, secondsLeft } from '@/lib/paymentTarget';
import { PaymentBlockedError, clearCustomerDataCache, getPaymentStatus, startPayment, type PaymentBlockReason } from '@/services';
import { getErrorMessage } from '@/services/errors';
import type { PaymentCheckout, PayTarget } from '@/types';

/** Hỏi lại trạng thái tài khoản định danh mỗi 5 giây (như web BookingVAQRDialog). */
export const PAYMENT_POLL_MS = 5000;

/** `blocked`: máy chủ chặn theo nghiệp vụ (dự án chưa có tài khoản nhận tiền / chờ ban quản lý tạo tài khoản). */
export type CheckoutPhase = 'loading' | 'error' | 'blocked' | 'ready' | 'paid' | 'expired';

export interface PaymentCheckoutState {
  phase: CheckoutPhase;
  checkout: PaymentCheckout | null;
  error: string | null;
  /** Lý do chặn khi `phase = 'blocked'`. */
  blockReason: PaymentBlockReason | null;
  /** Số giây còn lại của mã giữ chỗ; null = không có hạn. */
  remaining: number | null;
  /** Booking / đặt cọc đã được tự duyệt sau khi nhận tiền. */
  approved: boolean;
  retry: () => void;
}

/**
 * Màn QR: mở mã (máy chủ tạo / dùng lại tài khoản định danh) → hỏi trạng thái mỗi 5 giây khi màn đang hiển thị →
 * số tiền nhận tăng = đã thanh toán (xoá dữ liệu đệm để hợp đồng / phiếu thu tải lại). Giữ chỗ: đếm ngược tới hạn.
 */
export function usePaymentCheckout(target: Pick<PayTarget, 'contractId' | 'dot' | 'contractCode'> | null): PaymentCheckoutState {
  const [phase, setPhase] = useState<CheckoutPhase>('loading');
  const [checkout, setCheckout] = useState<PaymentCheckout | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [blockReason, setBlockReason] = useState<PaymentBlockReason | null>(null);
  const [approved, setApproved] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const [focused, setFocused] = useState(true);
  const [attempt, setAttempt] = useState(0);
  const runId = useRef(0);
  const contractId = target?.contractId ?? null;
  const dot = target?.dot ?? null;
  const contractCode = target?.contractCode ?? '';
  const phaseRef = useRef(phase);
  phaseRef.current = phase;

  const retry = useCallback(() => setAttempt((n) => n + 1), []);

  // Quay lại màn sau khi đã xong / lỗi → mở lại mã mới (tab ẩn vẫn giữ trạng thái cũ).
  useFocusEffect(
    useCallback(() => {
      setFocused(true);
      if (phaseRef.current !== 'loading' && phaseRef.current !== 'ready') retry();
      return () => setFocused(false);
    }, [retry]),
  );

  useEffect(() => {
    if (!contractId) return;
    const id = ++runId.current;
    setPhase('loading');
    setCheckout(null);
    setError(null);
    setBlockReason(null);
    setApproved(false);
    startPayment({ contractId, dot, contractCode })
      .then((c) => {
        if (id !== runId.current) return;
        setCheckout(c);
        setPhase('ready');
      })
      .catch((e: unknown) => {
        if (id !== runId.current) return;
        setError(getErrorMessage(e));
        if (e instanceof PaymentBlockedError) {
          setBlockReason(e.reason);
          setPhase('blocked');
        } else {
          setPhase('error');
        }
      });
  }, [contractId, dot, contractCode, attempt]);

  // Theo dõi thanh toán khi màn đang hiển thị.
  useEffect(() => {
    if (phase !== 'ready' || !checkout || !focused) return;
    const id = runId.current;
    const timer = setInterval(() => {
      getPaymentStatus(checkout.vaId)
        .then((s) => {
          if (id !== runId.current) return;
          if (checkoutPaid(checkout, s)) {
            setApproved(s.approved);
            setPhase('paid');
            clearCustomerDataCache();
          } else if (!s.active) {
            setPhase('expired');
          }
        })
        .catch(() => undefined); // Lỗi mạng tạm thời → thử lại lần sau.
    }, PAYMENT_POLL_MS);
    return () => clearInterval(timer);
  }, [phase, checkout, focused]);

  // Đồng hồ đếm ngược (chỉ mã giữ chỗ có hạn).
  const hasExpiry = phase === 'ready' && !!checkout?.expiresAt;
  useEffect(() => {
    if (!hasExpiry) return;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [hasExpiry]);

  const remaining = phase === 'ready' ? secondsLeft(checkout?.expiresAt, now) : null;
  useEffect(() => {
    if (remaining === 0) setPhase('expired');
  }, [remaining]);

  return { phase, checkout, error, blockReason, remaining, approved, retry };
}
