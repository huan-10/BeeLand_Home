/**
 * Cấu hình nguồn dữ liệu đăng nhập / đăng ký.
 *
 * - `mock`: giả lập trong máy (OTP 8888, dữ liệu `data/mock/user.ts`).
 * - `api`: dùng chung database Supabase với web `beeland` và `beeland-app_2026` (xem `docs/auth-flow.md`).
 * Mặc định `api`; đặt `EXPO_PUBLIC_AUTH_BACKEND=mock` để chạy thử giao diện mà không gọi server thật.
 */
export const AUTH_BACKEND: 'mock' | 'api' = process.env.EXPO_PUBLIC_AUTH_BACKEND === 'mock' ? 'mock' : 'api';

/**
 * Nguồn dữ liệu Nhà ở xã hội (`services/noxhService.ts`) — đi theo `AUTH_BACKEND`: `api` gọi `fn_portal_noxh_*` thật
 * (`services/noxhApi.ts`, các thao tác của khách GHI vào database thật — `docs/database.md`), `mock` dùng dữ liệu giả.
 * Chạy thử giao diện offline: `EXPO_PUBLIC_AUTH_BACKEND=mock npx expo start`.
 */
export const NOXH_BACKEND: 'mock' | 'api' = AUTH_BACKEND;

/** Server Supabase dùng chung (giống `beeland-app_2026/sevicesSupabase/axiosApiSupabase.ts`). */
export const SUPABASE_URL = 'https://api-beelandv2.beesky.vn';

/** Anon key công khai — RLS chặn đọc bảng; chỉ gọi được các RPC cổng khách hàng (fn_portal_login, fn_portal_my_contracts…). */
export const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlzcyI6InN1cGFiYXNlIiwiaWF0IjoxNzg3NTQ2ODQ0LCJleHAiOjE5NDUyMjY4NDR9.ftDz2g-LgHuMoXnFMzTtbIfgDodnntv5fGbbonqWYiw';

/**
 * Tài khoản hệ thống (nhân viên) để app tra hồ sơ khách hàng và tạo tài khoản cổng khách hàng trước khi khách đăng nhập —
 * cách làm giống app 2026 (đăng nhập `cloud-auth` → JWT). Nên là tài khoản thuộc công ty `beesky1` để thấy khách của MỌI công ty.
 * Đặt trong `.env.local` (không commit): EXPO_PUBLIC_KH_SERVICE_COMPANY / _EMAIL / _PASSWORD.
 *
 * ⚠ Biến `EXPO_PUBLIC_*` được đóng gói vào app: ai giải nén app đều đọc được tài khoản này.
 * Hướng an toàn lâu dài: edge function `portal-auth` (`../beeland/supabase/functions/portal-auth`).
 */
export const SERVICE_ACCOUNT = {
  company: process.env.EXPO_PUBLIC_KH_SERVICE_COMPANY ?? '',
  email: process.env.EXPO_PUBLIC_KH_SERVICE_EMAIL ?? '',
  password: process.env.EXPO_PUBLIC_KH_SERVICE_PASSWORD ?? '',
};
