import type { FundRow, ScheduleRow } from '@/lib/handover';

/**
 * Dữ liệu giả bàn giao (chạy offline `EXPO_PUBLIC_AUTH_BACKEND=mock`) — cùng dạng dòng database để đi qua đúng hàm ghép của bản thật.
 * Ngày tính lệch theo hôm nay (`dayOffset`) để lịch luôn có buổi "sắp tới".
 */
export interface MockFund extends Omit<FundRow, 'tu_ngay' | 'den_ngay'> {
  fromOffset: number | null;
  toOffset: number | null;
}

export const mockFunds: MockFund[] = [
  {
    id: 'qbg-001',
    so_qbg: 'QBG-2026-0007',
    state: 'HANDING_OVER',
    khach_hang_id: 'user-001',
    phieu_giu_cho_id: 'ct-001',
    ky_hieu: 'A-1203',
    so_hdmb: 'HDMB/2026/001',
    fromOffset: -3,
    toOffset: 12,
    dien_tich_hd: 72.5,
    dien_tich_bg: 73.1,
    pt_tang_giam: 0.83,
    pt_tien_do: 80,
    pt_tien_do_pbt: 100,
    ghi_chu: 'Mang theo CCCD bản gốc và hợp đồng mua bán khi nhận nhà.',
  },
  {
    id: 'qbg-002',
    so_qbg: 'QBG-2025-0112',
    state: 'HANDED_OVER',
    khach_hang_id: 'user-001',
    phieu_giu_cho_id: 'ct-004',
    ky_hieu: 'RG-0712',
    so_hdmb: 'HDMB/2024/087-PL01',
    fromOffset: -120,
    toOffset: -105,
    dien_tich_hd: 86,
    dien_tich_bg: 85.2,
    pt_tang_giam: -0.93,
    pt_tien_do: 100,
    pt_tien_do_pbt: 100,
    ghi_chu: null,
  },
];

export interface MockSchedule extends Omit<ScheduleRow, 'ngay_ban_giao'> {
  dayOffset: number;
}

export const mockSchedules: MockSchedule[] = [
  {
    id: 'lbg-001',
    so_hdmb: 'HDMB/2026/001',
    ma_sp: 'A-1203',
    du_an: 'Sunshine Residence',
    ten_kh: 'Nguyễn Văn An',
    dien_thoai: '0901234567',
    dayOffset: 7,
    khung_gio: '09:00 - 11:00',
    hinh_thuc: 'Bàn giao hoàn thiện',
    nhan_vien: 'Nguyễn Thu Hà',
    trang_thai: 'Đã xác nhận',
    ghi_chu: 'Có mặt tại sảnh tòa A trước 15 phút.',
  },
  {
    id: 'lbg-002',
    so_hdmb: 'HDMB/2026/001',
    ma_sp: 'A-1203',
    du_an: 'Sunshine Residence',
    ten_kh: 'Nguyễn Văn An',
    dien_thoai: '0901234567',
    dayOffset: -2,
    khung_gio: '14:00 - 16:00',
    hinh_thuc: 'Bàn giao hoàn thiện',
    nhan_vien: 'Nguyễn Thu Hà',
    trang_thai: 'Hoãn lịch',
    ghi_chu: 'Hoãn do hoàn thiện hạng mục sàn gỗ.',
  },
  {
    id: 'lbg-003',
    so_hdmb: 'HDMB/2024/087-PL01',
    ma_sp: 'RG-0712',
    du_an: 'BeeSky Riverside Garden – Khu căn hộ ven sông Sài Gòn',
    ten_kh: 'Nguyễn Văn An',
    dien_thoai: '0901234567',
    dayOffset: -110,
    khung_gio: '08:00 - 10:00',
    hinh_thuc: 'Bàn giao hoàn thiện',
    nhan_vien: 'Trần Minh Khoa',
    trang_thai: 'Đã bàn giao',
    ghi_chu: '—',
  },
  // Lịch của khách khác cùng mã căn khác SĐT — phải KHÔNG hiện.
  {
    id: 'lbg-x',
    so_hdmb: 'HDMB/2026/999',
    ma_sp: 'A-1203',
    du_an: 'Dự án khác',
    ten_kh: 'Khách khác',
    dien_thoai: '0911000000',
    dayOffset: 3,
    khung_gio: '10:00 - 12:00',
    hinh_thuc: 'Bàn giao thô',
    nhan_vien: '—',
    trang_thai: 'Chờ xác nhận',
    ghi_chu: null,
  },
];
