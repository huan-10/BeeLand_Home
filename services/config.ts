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
