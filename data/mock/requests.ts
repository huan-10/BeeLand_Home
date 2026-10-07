/** Yêu cầu khách hàng giả (chạy offline) — cùng dạng dòng `fn_portal_my_requests` để đi qua đúng hàm ánh xạ. */
export const mockRequestCategories = [
  { id: 'loai-consult', name: 'Tư vấn – hỏi đáp' },
  { id: 'loai-document', name: 'Hồ sơ – pháp lý' },
  { id: 'loai-finance', name: 'Thanh toán – công nợ' },
  { id: 'loai-handover', name: 'Bàn giao căn hộ' },
  { id: 'loai-warranty', name: 'Bảo hành – sửa chữa' },
  { id: 'loai-complaint', name: 'Khiếu nại' },
  { id: 'loai-feedback', name: 'Góp ý' },
  { id: 'loai-other', name: 'Khác' },
];

export const mockRequestRows: Record<string, unknown>[] = [
  {
    id: 'yc-002',
    so_phieu: 'YC260928-0002',
    tieu_de: 'Vòi nước nhà tắm bị rỉ',
    noi_dung: 'Vòi lavabo phòng tắm chính rỉ nước liên tục, nhờ kỹ thuật kiểm tra giúp.',
    loai: 'Bảo hành – sửa chữa',
    trang_thai: 'Đang xử lý',
    mau: 'orange',
    hop_dong: 'HDMB/2026/001',
    created_at: '2026-09-28T09:12:00+07:00',
    updated_at: '2026-09-29T14:30:00+07:00',
    dinh_kem: [],
    lich_su: [
      { noi_dung: 'Khách hàng gửi yêu cầu từ app', trang_thai: 'Mới tiếp nhận', ngay: '2026-09-28T09:12:00+07:00' },
      { noi_dung: 'Đã hẹn kỹ thuật đến kiểm tra sáng thứ Năm 02/10.', trang_thai: 'Đang xử lý', ngay: '2026-09-29T14:30:00+07:00' },
    ],
  },
  {
    id: 'yc-001',
    so_phieu: 'YC260910-0001',
    tieu_de: 'Xin bản sao hợp đồng mua bán',
    noi_dung: 'Tôi cần bản sao hợp đồng có đóng dấu để làm hồ sơ vay ngân hàng.',
    loai: 'Hồ sơ – pháp lý',
    trang_thai: 'Đã xử lý',
    mau: 'green',
    hop_dong: 'HDMB/2026/001',
    created_at: '2026-09-10T16:40:00+07:00',
    updated_at: '2026-09-12T10:00:00+07:00',
    dinh_kem: [],
    lich_su: [
      { noi_dung: 'Khách hàng gửi yêu cầu từ app', trang_thai: 'Mới tiếp nhận', ngay: '2026-09-10T16:40:00+07:00' },
      { noi_dung: 'Bản sao đã gửi qua email, bản giấy nhận tại văn phòng dự án.', trang_thai: 'Đã xử lý', ngay: '2026-09-12T10:00:00+07:00' },
    ],
  },
];
