import { ScrollViewStyleReset } from 'expo-router/html';
import type { ReactNode } from 'react';

import { borderWidth, motion, semantic } from '@/theme';

// File chỉ dùng trên web để cấu hình HTML gốc khi render tĩnh.
// Chạy trong Node.js, không truy cập được DOM hay API trình duyệt.
export default function Root({ children }: { children: ReactNode }) {
  return (
    <html lang="vi">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover, shrink-to-fit=no" />
        <title>BeeSky – Khách hàng</title>
        <meta name="description" content="BeeSky – tra cứu hợp đồng, lịch thanh toán và phiếu thu bất động sản." />
        <meta name="theme-color" content={semantic.brand} />
        <meta name="apple-mobile-web-app-title" content="BeeSky" />

        {/* Tắt cuộn body để ScrollView trên web hoạt động giống native. */}
        <ScrollViewStyleReset />
        <style dangerouslySetInnerHTML={{ __html: globalStyles }} />
      </head>
      <body>{children}</body>
    </html>
  );
}

// Focus ring nhìn thấy được khi dùng bàn phím; tôn trọng prefers-reduced-motion.
const globalStyles = `
body {
  background-color: ${semantic.bg};
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
:focus-visible {
  outline: ${borderWidth.strong}px solid ${semantic.focusRing};
  outline-offset: ${borderWidth.strong}px;
}
[role="button"], [role="tab"], [role="link"], a, button {
  touch-action: manipulation;
  transition: background-color ${motion.fast}ms ease-out, opacity ${motion.fast}ms ease-out,
    transform ${motion.base}ms ease-out, box-shadow ${motion.base}ms ease-out;
}
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}`;
