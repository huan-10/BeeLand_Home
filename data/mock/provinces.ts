/**
 * Danh mục tỉnh / phường-xã GIẢ (rút gọn) cho form Thông tin cá nhân NOXH — CHỈ `services/` được đọc.
 * TODO: nguồn danh mục tỉnh/xã thật (bản đồ hành chính sau sáp nhập 2025) khi nối API.
 */
export interface MockPlace {
  code: string;
  name: string;
}

export const mockProvinces: MockPlace[] = [
  { code: '01', name: 'Hà Nội' },
  { code: '79', name: 'TP. Hồ Chí Minh' },
  { code: '22', name: 'Quảng Ninh' },
  { code: '48', name: 'Đà Nẵng' },
  { code: '74', name: 'Bình Dương' },
];

export const mockWards: Record<string, MockPlace[]> = {
  '01': [
    { code: '01-00352', name: 'Phường Phương Mai' },
    { code: '01-00004', name: 'Phường Phúc Xá' },
    { code: '01-00610', name: 'Phường Long Biên' },
    { code: '01-00331', name: 'Phường Định Công' },
  ],
  '79': [
    { code: '79-27094', name: 'Phường Tân Hưng' },
    { code: '79-26737', name: 'Phường Thạnh Mỹ Lợi' },
    { code: '79-27259', name: 'Xã Tân Thạnh Tây' },
  ],
  '22': [
    { code: '22-06664', name: 'Phường Hà Khánh' },
    { code: '22-06673', name: 'Phường Hồng Gai' },
    { code: '22-06700', name: 'Phường Bãi Cháy' },
  ],
  '48': [
    { code: '48-20194', name: 'Phường Hải Châu' },
    { code: '48-20230', name: 'Phường Thanh Khê' },
    { code: '48-20263', name: 'Phường Sơn Trà' },
  ],
  '74': [
    { code: '74-25747', name: 'Phường Thủ Dầu Một' },
    { code: '74-25846', name: 'Phường Dĩ An' },
    { code: '74-25921', name: 'Phường Thuận An' },
  ],
};
