// Nhánh API (không gọi server: thay client/serviceAuth/config bằng bản giả): đăng nhập dự phòng bằng fn_portal_site_login,
// chọn đúng website đã đăng ký, kết nối NOXH báo lỗi đúng công ty, phiên NOXH hết hạn. Chạy: npm test
const test = require('node:test');
const assert = require('node:assert/strict');
const { loadModule, stubModule } = require('./noxh-fixtures.cjs');

class FakeServiceError extends Error {}
const calls = [];
let handlers = {};
stubModule('services/config.ts', { AUTH_BACKEND: 'api', NOXH_BACKEND: 'api', SUPABASE_URL: 'https://api.test', SUPABASE_ANON_KEY: 'anon', SERVICE_ACCOUNT: {} });
stubModule('services/supabase/serviceAuth.ts', { getServiceJwt: async () => 'jwt' });
stubModule('services/supabase/client.ts', {
  rpc: async (fn, args) => {
    calls.push([fn, args]);
    const h = handlers[fn];
    if (!h) throw new Error(`rpc không mong đợi: ${fn}`);
    return h(args);
  },
  restGet: async (query) => {
    calls.push(['GET', query]);
    if (query.startsWith('cloud_customers')) return handlers.customers ?? [];
    if (query.startsWith('cloud_customer_web_configs')) return handlers.sites ?? [];
    if (query.startsWith('cloud_companies')) return [];
    throw new Error(`GET không mong đợi: ${query}`);
  },
  edge: async (fn, body) => {
    calls.push([`edge:${fn}`, body]);
    const h = handlers[`edge:${body.action}`];
    if (!h) throw new Error(`edge không mong đợi: ${body.action}`);
    return h(body);
  },
  str: (v) => (typeof v === 'string' ? v : v == null ? '' : String(v)),
  inList: (values) => `(${values.join(',')})`,
});

const errors = loadModule('services/errors.ts');
const session = loadModule('services/session.ts');
const auth = loadModule('services/authService.ts');
const noxh = loadModule('services/noxhService.ts');

const PHONE = '0938111222';
const customer = (id, company) => ({ id, ma_ctdk: company, ten_kh: 'Lê Thu Hà', ten_cong_ty: null, dien_thoai: PHONE, di_dong: null, email: null, dia_chi: null, cccd: '001099012345', so_cmnd: null, ma_so_kh: 'KH-1' });
const loginRow = (company, token) => ({ session_token: token, account_id: `acc-${company}`, khach_hang_id: `kh-${company}`, ma_ctdk: company, username: PHONE, email: null, ten_kh: 'Lê Thu Hà', di_dong: PHONE, ma_so_kh: 'KH-1' });

test('fn_portal_login từ chối tài khoản (máy chủ không trả nguon_web_config_id) → thử lại fn_portal_site_login', async () => {
  calls.length = 0;
  handlers = {
    customers: [customer('kh-c1', 'c1')],
    sites: [{ id: 'w1', company_id: 'c1', slug: 'c1-noxh', is_active: true }],
    fn_portal_account_get: () => ({ id: 'acc-c1', username: PHONE, email: null, is_active: true }),
    fn_portal_login: () => {
      throw new errors.ServiceError('Tài khoản không được dùng trên đường này', 'UNAUTHORIZED');
    },
    fn_portal_site_login: (a) => (a.p_slug === 'c1-noxh' ? loginRow('c1', 'noxh-c1') : { error: 'Sai' }),
  };
  const { session: s } = await auth.login(PHONE, 'pass1234');
  assert.equal(s.companies.length, 1);
  assert.equal(s.companies[0].token, undefined);
  assert.deepEqual(s.companies[0].noxh, { slug: 'c1-noxh', token: 'noxh-c1' });
});

test('tài khoản tự đăng ký → đăng nhập trên đúng website đã đăng ký (nguon_web_config_id)', async () => {
  calls.length = 0;
  handlers = {
    customers: [customer('kh-c1', 'c1')],
    sites: [
      { id: 'w1', company_id: 'c1', slug: 'site-a', is_active: true },
      { id: 'w2', company_id: 'c1', slug: 'site-b', is_active: true },
    ],
    fn_portal_account_get: () => ({ id: 'acc-c1', username: PHONE, email: null, is_active: true, nguon_web_config_id: 'w1', pham_vi: 'CHON' }),
    fn_portal_site_login: (a) => (a.p_slug === 'site-a' ? loginRow('c1', 'noxh-a') : { error: 'Tài khoản không được dùng trên website này' }),
  };
  const { session: s } = await auth.login(PHONE, 'pass1234');
  assert.deepEqual(s.companies[0].noxh, { slug: 'site-a', token: 'noxh-a' });
  assert.ok(!calls.some(([fn]) => fn === 'fn_portal_login'));
});

const user = { id: 'u', customerCode: '', fullName: '', email: '', phone: PHONE, idNumber: '', address: '' };
const cs = (companyId, extra) => ({ companyId, companyName: companyId, token: `t-${companyId}`, userId: 'u', customerId: `kh-${companyId}`, user, ...extra });

test('kết nối NOXH: sai mật khẩu ở công ty đang thiếu token → báo lỗi dù công ty khác đã kết nối', async () => {
  handlers = {
    sites: [{ id: 'wb', company_id: 'B', slug: 'b-noxh', is_active: true }],
    fn_portal_account_get: () => ({ id: 'acc-B', username: PHONE, email: null, is_active: true }),
    fn_portal_site_login: () => ({ error: 'Sai mật khẩu' }),
  };
  const s = { token: 't-A', userId: 'u', createdAt: '', companyId: 'A', customerId: 'kh-A', user, phone: PHONE, companies: [cs('A', { noxh: { slug: 'a', token: 'na' } }), cs('B')] };
  await assert.rejects(auth.connectNoxh(s, 'sai'), { message: 'Mật khẩu không đúng.' });
});

test('phiên NOXH hết hạn → phát sự kiện cho đúng công ty, báo UNAUTHORIZED', async () => {
  handlers = { fn_portal_noxh_ho_so_list: () => ({ error: 'PHIEN_HET_HAN' }) };
  session.setActiveSession({ token: 't-A', userId: 'u', createdAt: '', companyId: 'A', customerId: 'kh-A', user, companies: [cs('A', { noxh: { slug: 'a', token: 'na' } })] });
  const expired = [];
  const off = session.onNoxhSessionExpired((id) => expired.push(id));
  await assert.rejects(noxh.getMyApplications(), (e) => e.code === 'UNAUTHORIZED');
  off();
  assert.deepEqual(expired, ['A']);
});

/* ================= Nối dữ liệu thật NOXH (client giả — không gọi server) ================= */

const tok = (c) => `noxh-${c}`;
const twoCompanies = () =>
  session.setActiveSession({
    token: 't-A', userId: 'u', createdAt: '', companyId: 'A', customerId: 'kh-A', user,
    companies: [
      cs('A', { companyName: 'Sunshine', noxh: { slug: 'a-noxh', token: tok('A') }, noxhSite: 'a-noxh' }),
      cs('B', { companyName: 'BlueSky', noxh: { slug: 'b-noxh', token: tok('B') }, noxhSite: 'b-noxh' }),
      cs('C', { companyName: 'Chưa kết nối' }),
    ],
  });
const round = (id, tinh_trang) => ({ id, ten: `Đợt ${id}`, ten_du_an: 'DA', dia_chi_du_an: null, anh_url: null, tu_ngay: '2026-10-01', den_ngay: '2026-10-30', so_can: 10, so_ho_so_da_nop: 1, tinh_trang });

test('getRounds: đợt của MỌI công ty khách có tài khoản (kể cả chưa có token), gắn chủ đầu tư, Đang mở trước', async () => {
  twoCompanies();
  calls.length = 0;
  handlers = {
    sites: [
      { id: 'wa', company_id: 'A', slug: 'a-noxh', is_active: true },
      { id: 'wc', company_id: 'C', slug: 'c-noxh', is_active: true },
    ],
    fn_portal_noxh_dot_list: (a) => ({ data: { 'a-noxh': [round('r1', 'DA_DONG')], 'c-noxh': [round('r3', 'DANG_MO')] }[a.p_slug] ?? [] }),
  };
  const rounds = await noxh.getRounds();
  assert.deepEqual(rounds.map((r) => [r.id, r.company_id, r.slug, r.ten_chu_dau_tu]), [
    ['r3', 'C', 'c-noxh', 'Chưa kết nối'],
    ['r1', 'A', 'a-noxh', 'Sunshine'],
  ]);
  assert.ok(calls.some(([fn, q]) => fn === 'GET' && q.startsWith('cloud_customer_web_configs')));
});

test('getRound / getLoaiCan gọi đúng slug của công ty sở hữu đợt', async () => {
  calls.length = 0;
  handlers = {
    fn_portal_noxh_dot_get: (a) => ({ data: { ...round(a.p_dot_id, 'DANG_MO'), mo_ta: null, nhom: [] } }),
    fn_portal_noxh_loai_can: () => ({ data: [{ id: 'l1', ten: '1PN' }] }),
  };
  const r = await noxh.getRound('r3');
  assert.equal(r.company_id, 'C');
  assert.deepEqual(await noxh.getLoaiCan('r3'), [{ id: 'l1', ten: '1PN' }]);
  assert.deepEqual(calls.filter(([fn]) => fn.startsWith('fn_')).map(([fn, a]) => [fn, a.p_slug]), [
    ['fn_portal_noxh_dot_get', 'c-noxh'],
    ['fn_portal_noxh_loai_can', 'c-noxh'],
  ]);
});

test('saveApplication tạo mới dùng token của công ty sở hữu đợt', async () => {
  twoCompanies();
  handlers = { sites: [], fn_portal_noxh_dot_list: (a) => ({ data: a.p_slug === 'b-noxh' ? [round('rb', 'DANG_MO')] : [] }) };
  await noxh.getRounds();
  calls.length = 0;
  handlers = { fn_portal_noxh_ho_so_save: () => ({ data: { id: 'h9', so_ho_so: 'NOXH-1', trang_thai: 'NHAP' } }) };
  const payload = { dot_id: 'rb', nhom_doi_tuong_id: 'g', loai_can_id: 'l', khach_hang: { ten_kh: 'Hà' } };
  assert.deepEqual(await noxh.saveApplication(payload, false), { id: 'h9', so_ho_so: 'NOXH-1', trang_thai: 'NHAP' });
  assert.deepEqual(calls[0], ['fn_portal_noxh_ho_so_save', { p_token: tok('B'), p_payload: payload, p_submit: false }]);
});

test('hồ sơ đã biết công ty → get / nộp / xoá / gửi bổ sung chỉ gọi token của công ty đó', async () => {
  twoCompanies();
  handlers = { fn_portal_noxh_ho_so_list: (a) => ({ data: a.p_token === tok('B') ? [{ id: 'hb', so_ho_so: 'X', trang_thai: 'NHAP' }] : [] }) };
  const rows = await noxh.getMyApplications();
  assert.deepEqual(rows.map((r) => [r.id, r.company_id]), [['hb', 'B']]);
  calls.length = 0;
  handlers = {
    fn_portal_noxh_ho_so_get: () => ({ data: { id: 'hb', trang_thai: 'NHAP', giay_to: [], lich_su: [] } }),
    fn_portal_noxh_ho_so_save: () => ({ data: { id: 'hb', so_ho_so: 'X', trang_thai: 'MOI_TIEP_NHAN' } }),
    fn_portal_noxh_ho_so_delete: () => ({ data: { id: 'hb' } }),
    fn_portal_noxh_ho_so_gui_bo_sung: () => ({ data: { id: 'hb', trang_thai: 'DANG_THAM_DINH' } }),
  };
  assert.equal((await noxh.getApplication('hb')).company_id, 'B');
  await noxh.saveApplication({ id: 'hb', dot_id: 'rb', nhom_doi_tuong_id: 'g', khach_hang: {} }, true);
  await noxh.sendSupplement('hb');
  await noxh.deleteApplication('hb');
  assert.deepEqual(calls.map(([fn, a]) => [fn, a.p_token]), [
    ['fn_portal_noxh_ho_so_get', tok('B')],
    ['fn_portal_noxh_ho_so_save', tok('B')],
    ['fn_portal_noxh_ho_so_gui_bo_sung', tok('B')],
    ['fn_portal_noxh_ho_so_delete', tok('B')],
  ]);
});

test('uploadDoc: xin URL ký (edge portal-noxh) → PUT tệp lên drive-files → fn_portal_noxh_file_attach', async () => {
  calls.length = 0;
  const puts = [];
  global.XMLHttpRequest = class {
    constructor() { this.headers = {}; }
    open(method, url) { this.method = method; this.url = url; }
    setRequestHeader(k, v) { this.headers[k] = v; }
    send(body) { puts.push([this.url, this.method, this.headers['x-upsert'], body instanceof FormData]); this.status = 200; setTimeout(() => this.onload(), 0); }
  };
  const doc = { id: 'd1', ten: 'CCCD', trang_thai: 'CHO_THAM_DINH', tep_ten: 'cccd.pdf' };
  handlers = {
    // Hồ sơ chưa có trong bộ nhớ tạm → hỏi lần lượt từng công ty; công ty A báo không tìm thấy.
    fn_portal_noxh_ho_so_get: (a) => (a.p_token === tok('B') ? { data: { id: 'hb', trang_thai: 'NHAP', giay_to: [], lich_su: [] } } : { error: 'Không tìm thấy hồ sơ' }),
    'edge:upload-url': () => ({ data: { path: 'noxh/t/ho-so/hb/u.pdf', token: 'tk', signed_url: '/storage/v1/object/upload/sign/drive-files/noxh/t/ho-so/hb/u.pdf?token=tk' } }),
    fn_portal_noxh_file_attach: () => ({ data: { giay_to: doc } }),
  };
  const file = { name: 'cccd.pdf', size: 1200, type: 'application/pdf', uri: 'blob:x', blob: new Blob(['%PDF']) };
  assert.deepEqual(await noxh.uploadDoc('hb', 'd1', file), doc);
  const steps = calls.filter(([fn]) => fn !== 'fn_portal_noxh_ho_so_get');
  assert.deepEqual(steps[0], ['edge:portal-noxh', { action: 'upload-url', token: tok('B'), ho_so_id: 'hb', giay_to_id: 'd1', ten: 'cccd.pdf', size: 1200, type: 'application/pdf' }]);
  assert.deepEqual(puts, [['https://api.test/storage/v1/object/upload/sign/drive-files/noxh/t/ho-so/hb/u.pdf?token=tk', 'PUT', 'false', true]]);
  assert.deepEqual(steps[1], ['fn_portal_noxh_file_attach', { p_token: tok('B'), p_ho_so_id: 'hb', p_giay_to_id: 'd1', p_path: 'noxh/t/ho-so/hb/u.pdf', p_ten: 'cccd.pdf', p_size: 1200 }]);
});

test('uploadDoc: tệp sai định dạng bị chặn trước khi gọi máy chủ', async () => {
  calls.length = 0;
  await assert.rejects(noxh.uploadDoc('hb', 'd1', { name: 'IMG.heic', size: 10, type: 'image/heic', uri: 'x' }), /HEIC/);
  assert.equal(calls.length, 0);
});

test('removeDoc: attach với path null; openDoc: URL ký nội bộ đổi sang host công khai, không phải http(s) → lỗi', async () => {
  calls.length = 0;
  handlers = {
    fn_portal_noxh_file_attach: (a) => ({ data: { giay_to: { id: a.p_giay_to_id, trang_thai: 'CHUA_CUNG_CAP', tep_ten: null } } }),
    'edge:download-url': (b) => ({ data: { url: b.loai === 'tep' ? 'http://kong:8000/storage/v1/object/sign/drive-files/a.pdf?token=z' : 'javascript:alert(1)' } }),
  };
  assert.equal((await noxh.removeDoc('hb', 'd1')).trang_thai, 'CHUA_CUNG_CAP');
  assert.equal(calls[0][1].p_path, null);
  assert.equal(await noxh.openDoc('hb', 'd1', 'tep'), 'https://api.test/storage/v1/object/sign/drive-files/a.pdf?token=z');
  await assert.rejects(noxh.openDoc('hb', 'd1', 'mau'), /Không mở được tệp/);
});

test('spinLottery gọi fn_portal_noxh_boc_tham_quay bằng token công ty của lượt', async () => {
  twoCompanies();
  handlers = {
    fn_portal_noxh_boc_tham_cua_toi: (a) => ({ data: { server_now: '2026-10-05T03:00:00Z', items: a.p_token === tok('A') ? [{ bt_ho_so_id: 'bt1', tu_ngay: 'x' }] : [] } }),
  };
  const mine = await noxh.getMyLotteries();
  assert.deepEqual(mine.items.map((i) => [i.bt_ho_so_id, i.company_id]), [['bt1', 'A']]);
  calls.length = 0;
  handlers = { fn_portal_noxh_boc_tham_quay: () => ({ data: { ket_qua: 'TRUNG', can: { ky_hieu: 'A-1' }, thu_tu_du_phong: null, mo_luc: 'm' } }) };
  assert.equal((await noxh.spinLottery('bt1')).can.ky_hieu, 'A-1');
  assert.deepEqual(calls[0], ['fn_portal_noxh_boc_tham_quay', { p_token: tok('A'), p_bt_ho_so_id: 'bt1' }]);
});

test('kết quả công bố: danh sách theo slug (không kết quả) → mở một đợt mới tải kết quả theo dự án', async () => {
  twoCompanies();
  calls.length = 0;
  const pub = { id: 'bt9', ma_dot: 'BT-1', ten: 'Đợt 1', da_project_id: 'p1', ten_du_an: 'DA', tong_ho_so: 3, so_trung: 2, phien: [{ thu_tu: 1 }, { thu_tu: 2 }] };
  handlers = {
    sites: [{ id: 'wa', company_id: 'A', slug: 'a-noxh', is_active: true }],
    fn_portal_noxh_boc_tham_cong_bo: (a) =>
      a.p_slug !== 'a-noxh'
        ? { data: [] }
        : { data: a.p_da_project_id ? [{ ...pub, ket_qua: [{ so_ho_so: 'H1', thu_tu_phien: 1, ket_qua: 'TRUNG', ky_hieu: 'A-1', thu_tu_du_phong: null }] }] : [pub] },
  };
  const list = await noxh.getPublishedResults();
  assert.deepEqual(list.map((l) => [l.bt_id, l.company_id, l.so_trung, l.so_phien, l.rows]), [['bt9', 'A', 2, 2, undefined]]);
  const one = await noxh.getPublishedResult('bt9');
  assert.equal(one.rows.length, 1);
  const cb = calls.filter(([fn]) => fn === 'fn_portal_noxh_boc_tham_cong_bo').map(([, a]) => [a.p_slug, a.p_da_project_id]);
  assert.deepEqual(cb.filter(([slug]) => slug === 'a-noxh'), [
    ['a-noxh', null],
    ['a-noxh', 'p1'],
  ]);
  assert.deepEqual(cb.filter(([slug]) => slug !== 'a-noxh'), [['b-noxh', null]]);
});

test('đánh dấu đã đọc: theo công ty của từng thông báo; null → mọi công ty', async () => {
  twoCompanies();
  handlers = { fn_portal_noxh_thong_bao: (a) => ({ data: { so_chua_doc: 1, items: a.p_token === tok('B') ? [{ id: 'n1', loai: 'LICH_BOC_THAM' }] : [] } }) };
  await noxh.getNoxhNotifications();
  calls.length = 0;
  handlers = { fn_portal_noxh_thong_bao_da_doc: () => ({ data: { so_da_doc: 1, so_chua_doc: 0 } }) };
  await noxh.markNoxhNotificationsRead(['n1']);
  await noxh.markNoxhNotificationsRead(null);
  assert.deepEqual(calls.map(([, a]) => [a.p_token, a.p_ids]), [
    [tok('B'), ['n1']],
    [tok('A'), null],
    [tok('B'), null],
  ]);
});

/* ================= CCCD trên tài khoản NOXH ================= */

test('getNoxhAccount: fn_portal_noxh_tai_khoan bằng token của công ty → co_cccd; updateCccd: fn_portal_noxh_cap_nhat_cccd', async () => {
  twoCompanies();
  calls.length = 0;
  handlers = {
    fn_portal_noxh_tai_khoan: (a) => ({ data: { cccd: a.p_token === tok('B') ? null : '0123****8905', di_dong: '0938***222', co_cccd: a.p_token !== tok('B') } }),
    fn_portal_noxh_cap_nhat_cccd: (a) => (a.p_cccd === '001099012345' ? { data: { cccd: '0010****2345' } } : { error: 'Số CCCD phải gồm 12 chữ số' }),
  };
  assert.equal((await noxh.getNoxhAccount('A')).co_cccd, true);
  assert.equal((await noxh.getNoxhAccount('B')).co_cccd, false);
  assert.deepEqual(await noxh.updateCccd('B', '001 099 012 345'), { cccd: '0010****2345' });
  await assert.rejects(noxh.updateCccd('B', '123'), { message: 'Số CCCD phải gồm 12 chữ số' });
  assert.deepEqual(calls.map(([fn, a]) => [fn, a.p_token, a.p_cccd]), [
    ['fn_portal_noxh_tai_khoan', tok('A'), undefined],
    ['fn_portal_noxh_tai_khoan', tok('B'), undefined],
    ['fn_portal_noxh_cap_nhat_cccd', tok('B'), '001099012345'],
    ['fn_portal_noxh_cap_nhat_cccd', tok('B'), '123'],
  ]);
});

/* ================= Tải tệp: không dùng fetch của Expo cho multipart (Expo fetch không nhận phần tệp {uri} của RN) ================= */

class FakeXhr {
  static last = null;
  constructor() { this.headers = {}; FakeXhr.last = this; }
  open(method, url) { this.method = method; this.url = url; }
  setRequestHeader(k, v) { this.headers[k] = v; }
  send(body) { this.body = body; this.status = 200; this.responseText = '{"Key":"ok"}'; setTimeout(() => this.onload && this.onload(), 0); }
}
class RecordingFormData {
  constructor() { this.parts = []; }
  append(name, value, filename) { this.parts.push([name, value, filename]); }
}

test('iOS/Android: tệp {uri} gửi qua XMLHttpRequest (multipart RN), không qua fetch', async () => {
  const storage = loadModule('services/supabase/storage.ts');
  const realFetch = global.fetch;
  const realFD = global.FormData;
  global.fetch = async () => { throw new Error('Unsupported FormDataPart implementation'); };
  global.XMLHttpRequest = FakeXhr;
  global.FormData = RecordingFormData;
  try {
    await storage.uploadToSignedUrl('drive-files', 'noxh/t/ho-so/h/u.docx', 'tk', { name: 'bai tap.docx', size: 37697, type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', uri: 'file:///cache/x.docx' });
  } finally {
    global.fetch = realFetch;
    global.FormData = realFD;
  }
  const x = FakeXhr.last;
  assert.equal(x.method, 'PUT');
  assert.equal(x.url, 'https://api.test/storage/v1/object/upload/sign/drive-files/noxh/t/ho-so/h/u.docx?token=tk');
  assert.equal(x.headers['x-upsert'], 'false');
  assert.deepEqual(x.body.parts[0], ['cacheControl', '3600', undefined]);
  assert.deepEqual(x.body.parts[1][1], { uri: 'file:///cache/x.docx', name: 'bai tap.docx', type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
});

test('máy chủ lưu trữ trả lỗi → "Tải tệp lên thất bại"; mất mạng thật → lỗi mạng', async () => {
  const storage = loadModule('services/supabase/storage.ts');
  class Xhr400 extends FakeXhr { send() { this.status = 400; this.responseText = 'invalid'; setTimeout(() => this.onload(), 0); } }
  class XhrDown extends FakeXhr { send() { setTimeout(() => this.onerror(), 0); } }
  const file = { name: 'a.pdf', size: 1, type: 'application/pdf', uri: 'file:///a.pdf' };
  global.XMLHttpRequest = Xhr400;
  await assert.rejects(storage.uploadToSignedUrl('drive-files', 'p.pdf', 'tk', file), { message: 'Tải tệp lên thất bại, vui lòng thử lại.' });
  global.XMLHttpRequest = XhrDown;
  await assert.rejects(storage.uploadToSignedUrl('drive-files', 'p.pdf', 'tk', file), (e) => e.code === 'NETWORK');
});
