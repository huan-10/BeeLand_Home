/**
 * Lớp truy cập dữ liệu duy nhất của ứng dụng.
 * Màn hình và hooks chỉ được gọi các hàm ở đây, không import từ `data/mock`.
 * Khi có backend thật, chỉ cần sửa thân các hàm trong thư mục này.
 */
export * from './authService';
export * from './contractService';
export * from './dashboardService';
export * from './errors';
export * from './handoverService';
export * from './homeModules';
export * from './filePicker';
export * from './notificationService';
export * from './noxhService';
export * from './paymentService';
export * from './receiptService';
export * from './receiptFile';
export { setActiveSession } from './session';
export { clearCustomerDataCache } from './supabase/customerData';
