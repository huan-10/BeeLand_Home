import { ScrollViewStyleReset } from 'expo-router/html';
import type { ReactNode } from 'react';

import { colors } from '@/theme';

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
        <meta name="theme-color" content={colors.primary[500]} />
        <meta name="apple-mobile-web-app-title" content="BeeSky" />

        {/* Tắt cuộn body để ScrollView trên web hoạt động giống native. */}
        <ScrollViewStyleReset />
        <style dangerouslySetInnerHTML={{ __html: globalStyles }} />
      </head>
      <body>{children}</body>
    </html>
  );
}

const globalStyles = `
body {
  background-color: ${colors.background};
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}`;
