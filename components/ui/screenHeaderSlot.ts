import { createContext } from 'react';

/** Tiêu đề có nút quay lại được `Screen` ghim cố định ở đầu màn (mobile) — luôn bấm được "Quay lại" khi đang cuộn. */
export interface PinnedHeader {
  title: string;
  subtitle?: string;
  onBack: () => void;
}

/** `Screen` cung cấp; `ScreenHeader` có `onBack` đăng ký vào đây thay vì tự vẽ trong nội dung cuộn. */
export const ScreenHeaderSlot = createContext<((header: PinnedHeader | null) => void) | null>(null);
