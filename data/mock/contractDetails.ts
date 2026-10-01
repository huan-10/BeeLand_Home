import type { ContractParty, ContractTerm } from '@/types';

export const mockSeller: ContractParty = {
  companyName: 'Công ty Cổ phần Đầu tư Bất động sản BeeSky',
  representative: 'Ông Lê Quang Minh',
  position: 'Tổng Giám đốc',
  taxCode: '0312 345 678',
  address: '25 Nguyễn Văn Linh, Phường Tân Phong, Quận 7, TP. Hồ Chí Minh',
  hotline: '1900 6868',
  email: 'cskh@beesky.vn',
};

const purchaseTerms: ContractTerm[] = [
  { title: 'Bàn giao căn hộ', content: 'Dự kiến trong Quý II/2027, kèm hồ sơ pháp lý và biên bản bàn giao.' },
  { title: 'Chậm thanh toán', content: 'Lãi chậm trả 0,05%/ngày trên số tiền chậm, tối đa 90 ngày.' },
  { title: 'Bảo hành', content: '60 tháng kể từ ngày bàn giao theo quy định của pháp luật.' },
  { title: 'Giấy chứng nhận', content: 'Bên bán làm thủ tục cấp sổ hồng trong 50 ngày kể từ ngày bàn giao.' },
];

const depositTerms: ContractTerm[] = [
  { title: 'Mục đích đặt cọc', content: 'Đảm bảo việc ký Hợp đồng mua bán căn hộ trong vòng 60 ngày.' },
  { title: 'Hoàn cọc', content: 'Hoàn 100% tiền cọc nếu bên bán không ký được Hợp đồng mua bán đúng hạn.' },
];

const reservationTerms: ContractTerm[] = [
  { title: 'Thời hạn giữ chỗ', content: '30 ngày kể từ ngày ký phiếu giữ chỗ.' },
  { title: 'Chuyển đổi', content: 'Tiền giữ chỗ được chuyển thành tiền cọc khi ký Hợp đồng đặt cọc.' },
];

/** Điều khoản theo loại hợp đồng. */
export const mockTermsByType: Record<'purchase' | 'deposit' | 'reservation', ContractTerm[]> = {
  purchase: purchaseTerms,
  deposit: depositTerms,
  reservation: reservationTerms,
};
