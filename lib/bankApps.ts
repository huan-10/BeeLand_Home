/**
 * Mở app ngân hàng điền sẵn chuyển khoản (VietQR deeplink — https://www.vietqr.io/deeplink, miễn phí, 5 lượt tự điền / phút / IP).
 * Link `https://dl.vietqr.io/pay?...` mở trang VietQR (~1 giây) → app ngân hàng mở thẳng màn chuyển tiền đã điền
 * STK, ngân hàng nhận, số tiền, nội dung. Dữ liệu truyền vào phải trùng mã QR đang hiện để giao dịch được gạch nợ tự động.
 * Cách làm giống BeeHome Resident (22/10/2026). Logic thuần — test ở tests/bank-apps.test.cjs.
 */

export interface BankApp {
  /** Mã app của VietQR (`app=`), vd "mb". */
  appId: string;
  appName: string;
}

/**
 * App có `autofill = 1` (điền sẵn được) trong https://api.vietqr.io/v2/ios-app-deeplinks và `android-app-deeplinks`
 * (kiểm 22/10/2026 — cả hai nền tảng cùng 5 app). App chỉ mở được mà không điền (VPBank NEO…) không đưa vào.
 */
export const BANK_APPS: BankApp[] = [
  { appId: 'mb', appName: 'MB Bank' },
  { appId: 'icb', appName: 'VietinBank iPay' },
  { appId: 'bidv', appName: 'BIDV SmartBanking' },
  { appId: 'ocb', appName: 'OCB OMNI' },
  { appId: 'acb', appName: 'ACB ONE' },
];

/** Logo app trên CDN của VietQR. */
export function bankAppLogo(appId: string, platform: 'ios' | 'android'): string {
  return `https://cdn.vietqr.io/bank-app-icon/${appId}-${platform}.webp`;
}

/**
 * Trang quay về sau khi chuyển (app ngân hàng tự quyết có mở hay không). PHẢI là `https://` — scheme riêng
 * (`beelandappkh://`) thì VietQR không cấp ticket tự điền, app ngân hàng chỉ mở trang chủ.
 */
export const PAY_RETURN_URL = 'https://beesky.vn';

/** BIN · mã VietQR (viết thường) · tên ngắn — từ https://api.vietqr.io/v2/banks (đóng sẵn để không gọi API lúc mở màn). */
const BANKS: [bin: string, code: string, shortName: string][] = [
  ['970415', 'icb', 'VietinBank'],
  ['970436', 'vcb', 'Vietcombank'],
  ['970418', 'bidv', 'BIDV'],
  ['970405', 'vba', 'Agribank'],
  ['970448', 'ocb', 'OCB'],
  ['970422', 'mb', 'MBBank'],
  ['970407', 'tcb', 'Techcombank'],
  ['970416', 'acb', 'ACB'],
  ['970432', 'vpb', 'VPBank'],
  ['970423', 'tpb', 'TPBank'],
  ['970403', 'stb', 'Sacombank'],
  ['970437', 'hdb', 'HDBank'],
  ['970454', 'vccb', 'VietCapitalBank'],
  ['970429', 'scb', 'SCB'],
  ['970441', 'vib', 'VIB'],
  ['970443', 'shb', 'SHB'],
  ['970431', 'eib', 'Eximbank'],
  ['970426', 'msb', 'MSB'],
  ['546034', 'cake', 'CAKE'],
  ['546035', 'ubank', 'Ubank'],
  ['963388', 'timo', 'Timo'],
  ['971005', 'vtlmoney', 'ViettelMoney'],
  ['971011', 'vnptmoney', 'VNPTMoney'],
  ['970400', 'sgicb', 'SaigonBank'],
  ['970409', 'bab', 'BacABank'],
  ['971133', 'pvdb', 'PVcomBank Pay'],
  ['971025', 'momo', 'MoMo'],
  ['970412', 'pvcb', 'PVcomBank'],
  ['970414', 'mbv', 'MBV'],
  ['970419', 'ncb', 'NCB'],
  ['970424', 'shbvn', 'ShinhanBank'],
  ['970425', 'abb', 'ABBANK'],
  ['970427', 'vab', 'VietABank'],
  ['970428', 'nab', 'NamABank'],
  ['970430', 'pgb', 'PGBank'],
  ['970433', 'vietbank', 'VietBank'],
  ['970438', 'bvb', 'BaoVietBank'],
  ['970440', 'seab', 'SeABank'],
  ['970446', 'coopbank', 'COOPBANK'],
  ['970449', 'lpb', 'LPBank'],
  ['970452', 'klb', 'KienLongBank'],
  ['668888', 'kbank', 'KBank'],
  ['970466', 'kebhanahcm', 'KEBHanaHCM'],
  ['970467', 'kebhanahn', 'KEBHANAHN'],
  ['977777', 'mafc', 'MAFC'],
  ['999888', 'vbsp', 'VBSP'],
  ['555666', 'bidc', 'BIDC'],
  ['971101', 'zalopay', 'ZaloPay'],
  ['963688', 'bochk', 'BOCHK'],
  ['970465', 'bsp', 'BSP'],
  ['168999', 'cubhcm', 'CUBHCM'],
  ['963686', 'esun', 'ESUN'],
  ['963669', 'icbc', 'ICBC'],
  ['971032', 'mvas', 'MVAS'],
  ['963326', 'tnex', 'TNEX'],
  ['458761', 'hsbc', 'HSBC'],
  ['970442', 'hlbvn', 'HongLeong'],
  ['970434', 'ivb', 'IndovinaBank'],
  ['970406', 'vikki', 'Vikki'],
  ['796500', 'dbs', 'DBSBank'],
  ['970439', 'pbvn', 'PublicBank'],
  ['970410', 'scvn', 'StandardChartered'],
  ['533948', 'citibank', 'Citibank'],
  ['422589', 'cimb', 'CIMB'],
  ['970458', 'uob', 'UnitedOverseas'],
  ['970444', 'cbb', 'CBBank'],
  ['970408', 'gpb', 'GPBank'],
  ['970421', 'vrb', 'VRB'],
  ['970457', 'wvn', 'Woori'],
  ['970462', 'kbhn', 'KookminHN'],
  ['970463', 'kbhcm', 'KookminHCM'],
];

const key = (v: string) => v.toLowerCase().replace(/[^a-z0-9]/g, '');

const BANK_CODE_BY_KEY = new Map<string, string>();
for (const [bin, code, shortName] of BANKS) {
  BANK_CODE_BY_KEY.set(bin, code);
  BANK_CODE_BY_KEY.set(key(code), code);
  BANK_CODE_BY_KEY.set(key(shortName), code);
}

/**
 * Mã ngân hàng nhận cho `ba=STK@mã` (viết thường). Nhận BIN ("970418"), mã VietQR ("BIDV", "ICB") hoặc tên ngắn
 * ("MBBank", "VietinBank") — `bank_code` của tài khoản định danh do cổng VA trả về. Không nhận ra → null (ẩn hàng logo).
 */
export function bankCodeOf(bank: string | null | undefined): string | null {
  if (!bank) return null;
  return BANK_CODE_BY_KEY.get(key(bank)) ?? null;
}

/** Mã hoá query kiểu form: dấu cách = `+`. */
const formEncode = (v: string) => encodeURIComponent(v).replace(/%20/g, '+');

/** Bỏ dấu, viết hoa ("Nguyễn Văn Đức" → "NGUYEN VAN DUC") — tên chủ TK như ngân hàng hiển thị. */
export function plainName(name: string): string {
  return name
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .replace(/\s+/g, ' ')
    .trim()
    .toUpperCase();
}

export interface BankTransferInfo {
  accountNumber: string;
  /** `bank_code` của tài khoản nhận (mã / tên ngắn / BIN). */
  bankCode: string;
  accountName: string;
  amount: number;
  content: string;
}

/**
 * Link mở `appId` với chuyển khoản điền sẵn; ngân hàng nhận không nhận ra → null.
 * Giữ nguyên `@` trong `ba` (không `%40`) và `url` không mã hoá — sai một trong hai thì app ngân hàng không đọc được.
 */
export function bankDeeplink(appId: string, info: BankTransferInfo): string | null {
  const bank = bankCodeOf(info.bankCode);
  if (!bank || !info.accountNumber) return null;
  const q = [
    `app=${formEncode(appId)}`,
    `am=${Math.round(info.amount)}`,
    `tn=${formEncode(info.content)}`,
    `ba=${formEncode(info.accountNumber)}@${bank}`,
  ];
  const name = plainName(info.accountName);
  if (name) q.push(`bn=${formEncode(name)}`);
  q.push(`url=${PAY_RETURN_URL}`);
  return `https://dl.vietqr.io/pay?${q.join('&')}`;
}

/** Khoá AsyncStorage lưu app dùng lần trước — cùng dạng `{ appId, appName, appLogo }` như BeeHome. */
export const LAST_BANK_APP_KEY = '@bank_deeplink';

/** Đọc app đã lưu (JSON object hoặc chuỗi appId cũ); không hợp lệ / không còn trong danh sách → null. */
export function parseLastBankApp(raw: string | null | undefined): string | null {
  if (!raw) return null;
  let id: unknown = raw;
  try {
    const v: unknown = JSON.parse(raw);
    id = typeof v === 'object' && v !== null && 'appId' in v ? (v as { appId: unknown }).appId : v;
  } catch {
    // chuỗi appId trần
  }
  return typeof id === 'string' && BANK_APPS.some((a) => a.appId === id) ? id : null;
}

/** App dùng lần trước lên đầu, còn lại giữ thứ tự. */
export function orderBankApps(apps: BankApp[], lastAppId: string | null): BankApp[] {
  const last = apps.find((a) => a.appId === lastAppId);
  return last ? [last, ...apps.filter((a) => a !== last)] : apps;
}
