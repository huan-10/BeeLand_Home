import type { FundRow, PortalScheduleRow } from '@/lib/handover';

/**
 * Dữ liệu giả bàn giao (chạy offline `EXPO_PUBLIC_AUTH_BACKEND=mock`) — cùng dạng dòng database để đi qua đúng hàm ghép của bản thật.
 * Ngày tính lệch theo hôm nay (`…Offset`) để luôn có căn đang chọn lịch / lịch sắp tới.
 * Bốn căn: A-1203 chưa có lịch (được chọn lịch, có lịch hoãn cũ) · B-0805 khách tự đặt, chờ xác nhận ·
 * C-1507 đã xác nhận · RG-0712 đã nhận nhà.
 */
export interface MockFund extends Omit<FundRow, 'tu_ngay' | 'den_ngay'> {
  fromOffset: number | null;
  toOffset: number | null;
}

const fund = (o: Partial<MockFund> & Pick<MockFund, 'id' | 'so_qbg' | 'state' | 'phieu_giu_cho_id' | 'ky_hieu'>): MockFund => ({
  khach_hang_id: 'user-001',
  so_hdmb: null,
  fromOffset: -3,
  toOffset: 20,
  dien_tich_hd: null,
  dien_tich_bg: null,
  pt_tang_giam: null,
  pt_tien_do: null,
  pt_tien_do_pbt: null,
  ghi_chu: null,
  ...o,
});

export const mockFunds: MockFund[] = [
  fund({
    id: 'qbg-001',
    so_qbg: 'QBG-2026-0007',
    state: 'NOTIFIED',
    phieu_giu_cho_id: 'ct-001',
    ky_hieu: 'A-1203',
    so_hdmb: 'HDMB/2026/001',
    toOffset: 12,
    dien_tich_hd: 72.5,
    dien_tich_bg: 73.1,
    pt_tang_giam: 0.83,
    ghi_chu: 'Mang theo CCCD bản gốc và hợp đồng mua bán khi nhận nhà.',
  }),
  fund({ id: 'qbg-003', so_qbg: 'QBG-2026-0011', state: 'NOTIFIED', phieu_giu_cho_id: 'ct-002', ky_hieu: 'B-0805', dien_tich_hd: 65, dien_tich_bg: 65 }),
  fund({ id: 'qbg-004', so_qbg: 'QBG-2026-0015', state: 'NOTIFIED', phieu_giu_cho_id: 'ct-003', ky_hieu: 'C-1507', dien_tich_hd: 91.2, dien_tich_bg: 90.4, pt_tang_giam: -0.88 }),
  fund({
    id: 'qbg-002',
    so_qbg: 'QBG-2025-0112',
    state: 'HANDED_OVER',
    phieu_giu_cho_id: 'ct-004',
    ky_hieu: 'RG-0712',
    so_hdmb: 'HDMB/2024/087-PL01',
    fromOffset: -120,
    toOffset: -105,
    dien_tich_hd: 86,
    dien_tich_bg: 85.2,
    pt_tang_giam: -0.93,
  }),
];

/** Ca nhận nhà giả (cùng dạng `cloud_signing_shifts`). */
export const mockShifts = [
  { id: 'ca-1', name: 'Ca sáng 1', from: '08:00', to: '10:00', capacity: 4 },
  { id: 'ca-2', name: 'Ca sáng 2', from: '10:00', to: '12:00', capacity: 4 },
  { id: 'ca-3', name: 'Ca chiều 1', from: '13:30', to: '15:30', capacity: 4 },
  { id: 'ca-4', name: 'Ca chiều 2', from: '15:30', to: '17:30', capacity: 4 },
];

export interface MockSchedule extends Omit<PortalScheduleRow, 'ngay'> {
  dayOffset: number;
}

const lich = (o: Partial<MockSchedule> & Pick<MockSchedule, 'id' | 'ban_giao_id' | 'ky_hieu' | 'dayOffset' | 'trang_thai'>): MockSchedule => ({
  so_qbg: null,
  lan: 1,
  ca: '08:00–10:00',
  tu_gio: '08:00',
  den_gio: '10:00',
  ca_id: 'ca-1',
  dia_diem: null,
  trang_thai_ten: null,
  khach_dang_ky: false,
  nhan_vien: null,
  lien_he: '1900 6868',
  so_tien_can_nop: null,
  bien_ban: null,
  ...o,
});

export const mockSchedules: MockSchedule[] = [
  lich({ id: 'lbg-001', ban_giao_id: 'qbg-001', ky_hieu: 'A-1203', dayOffset: -2, trang_thai: 'HOAN', trang_thai_ten: 'Hoãn', ca: '13:30–15:30', ca_id: 'ca-3' }),
  lich({ id: 'lbg-002', ban_giao_id: 'qbg-003', ky_hieu: 'B-0805', dayOffset: 5, trang_thai: 'CHO_XAC_NHAN', trang_thai_ten: 'Chờ xác nhận', khach_dang_ky: true, ca: '10:00–12:00', ca_id: 'ca-2' }),
  lich({
    id: 'lbg-003',
    ban_giao_id: 'qbg-004',
    ky_hieu: 'C-1507',
    dayOffset: 3,
    trang_thai: 'DA_XAC_NHAN',
    trang_thai_ten: 'Đã xác nhận',
    dia_diem: 'Sảnh tòa C, tầng 1',
    nhan_vien: 'Nguyễn Thu Hà',
    lien_he: '0912 345 678',
    so_tien_can_nop: 35_400_000,
  }),
  lich({
    id: 'lbg-004',
    ban_giao_id: 'qbg-002',
    ky_hieu: 'RG-0712',
    dayOffset: -110,
    trang_thai: 'DA_BAN_GIAO',
    trang_thai_ten: 'Đã bàn giao',
    dia_diem: 'Văn phòng BQL Riverside',
    nhan_vien: 'Trần Minh Khoa',
    bien_ban: { so_bb: 'BBBG-2025-0112', ngay_ban_giao: null },
  }),
];
