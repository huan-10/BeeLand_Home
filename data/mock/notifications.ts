import type { AppNotification } from '@/types';

export const mockNotifications: AppNotification[] = [
  {
    id: 'nt-004',
    type: 'payment_overdue',
    title: 'Phiếu giữ chỗ quá hạn thanh toán',
    message: 'Tiền giữ chỗ 50.000.000 đ của PGC/2026/032 (căn C-1507) đã quá hạn ngày 25/09/2026.',
    createdAt: '2026-09-26T08:00:00+07:00',
    read: false,
    link: '/contracts/ct-003',
  },
  {
    id: 'nt-003',
    type: 'payment_reminder',
    title: 'Nhắc lịch thanh toán Đợt 4',
    message: 'Đợt 4 – Hoàn thiện của HDMB/2026/001 (500.000.000 đ) đến hạn ngày 15/10/2026.',
    createdAt: '2026-09-25T09:30:00+07:00',
    read: false,
    link: '/contracts/ct-001',
  },
  {
    id: 'nt-002',
    type: 'project',
    title: 'Sunshine Residence cất nóc Tháp A',
    message: 'Chủ đầu tư thông báo Tháp A đã cất nóc đúng tiến độ. Cảm ơn Quý khách đã đồng hành.',
    createdAt: '2026-08-20T14:00:00+07:00',
    read: true,
  },
  {
    id: 'nt-001',
    type: 'receipt',
    title: 'Đã xác nhận phiếu thu PT2026-0015',
    message: 'Khoản thanh toán 375.000.000 đ cho Đợt 3 – Cất nóc đã được ghi nhận.',
    createdAt: '2026-08-14T16:45:00+07:00',
    read: true,
    link: '/receipts/rc-015',
  },
];
