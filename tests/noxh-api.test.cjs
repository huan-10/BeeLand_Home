// Nhánh API (không gọi server: thay client/config bằng bản giả): đăng nhập dự phòng bằng fn_portal_site_login,
// chọn đúng website đã đăng ký, kết nối NOXH báo lỗi đúng công ty, phiên NOXH hết hạn. Chạy: npm test
const test = require('node:test');
const assert = require('node:assert/strict');
const { loadModule, stubModule } = require('./noxh-fixtures.cjs');

class FakeServiceError extends Error {}
const calls = [];
let handlers = {};
stubModule('services/config.ts', { AUTH_BACKEND: 'api', NOXH_BACKEND: 'api', SUPABASE_URL: 'https://api.test', SUPABASE_ANON_KEY: 'anon' });
stubModule('services/supabase/client.ts', {
  rpc: async (fn, args) => {
    calls.push([fn, args]);
    if (fn === 'fn_portal_app_noxh_sites' && !handlers[fn]) {
      const data = {};
      for (const w of handlers.sites ?? []) if (w.slug && w.is_active !== false && args.p_company_ids.includes(w.company_id)) data[w.company_id] ??= w.slug;
      return { data };
    }
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

// Đăng nhập trên server (2026-10-08): app chỉ gọi fn_portal_app_dang_nhap — không tra cloud_customers / fn_portal_account_get /
// fn_portal_account_set_password bằng tài khoản hệ thống.
const company = (id, extra = {}) => ({
  company_id: id,
  ten_ct: `Công ty ${id}`,
  token: `hd-${id}`,
  account_id: `acc-${id}`,
  khach_hang_id: `kh-${id}`,
  username: PHONE,
  noxh_slug: null,
  noxh_token: null,
  khach_hang: customer(`kh-${id}`, id),
  ...extra,
});
const NO_SERVICE_JWT = ['GET', 'fn_portal_account_get', 'fn_portal_account_set_password', 'fn_portal_app_login', 'fn_portal_site_login'];

test('đăng nhập: một lần gọi fn_portal_app_dang_nhap → phiên mọi công ty, không dùng tài khoản hệ thống', async () => {
  calls.length = 0;
  handlers = {
    fn_portal_app_dang_nhap: (a) =>
      a.p_login === PHONE && a.p_password === 'pass1234'
        ? { data: { sdt: PHONE, cong_ty: [company('c1', { noxh_slug: 'c1-noxh', noxh_token: 'nx-c1' }), company('c2')] } }
        : { error: 'Sai' },
  };
  const { session: s } = await auth.login(PHONE, 'pass1234');
  assert.equal(s.phone, PHONE);
  assert.deepEqual(s.companies.map((c) => [c.companyId, c.companyName, c.token, c.customerId, c.loginName]), [
    ['c1', 'Công ty c1', 'hd-c1', 'kh-c1', PHONE],
    ['c2', 'Công ty c2', 'hd-c2', 'kh-c2', PHONE],
  ]);
  assert.deepEqual(s.companies[0].noxh, { slug: 'c1-noxh', token: 'nx-c1' });
  assert.equal(s.companies[0].noxhSite, 'c1-noxh');
  assert.equal(s.user.fullName, 'Lê Thu Hà');
  assert.ok(!calls.some(([fn]) => NO_SERVICE_JWT.includes(fn)), JSON.stringify(calls.map(([fn]) => fn)));
});

test('đăng nhập: chưa có tài khoản → lỗi ở ô SĐT/CCCD', async () => {
  handlers = { fn_portal_app_dang_nhap: () => ({ error: 'Số điện thoại / CCCD chưa có tài khoản. Vui lòng chọn "Đăng ký" để tạo tài khoản.', ma: 'KHONG_CO_TAI_KHOAN' }) };
  await assert.rejects(auth.login(PHONE, 'pass1234'), (e) => e.field === 'identifier' && e.code === 'NOT_FOUND' && /chưa có tài khoản/.test(e.message));
});

test('đăng nhập: sai mật khẩu → câu "Mật khẩu không đúng"; khoá tạm → giữ câu của máy chủ', async () => {
  handlers = { fn_portal_app_dang_nhap: () => ({ error: 'Tên đăng nhập hoặc mật khẩu không đúng', errors: ['Tên đăng nhập hoặc mật khẩu không đúng'], ma: 'SAI_MAT_KHAU' }) };
  await assert.rejects(auth.login(PHONE, 'sai12345'), (e) => e.field === 'password' && e.message.startsWith('Mật khẩu không đúng'));
  handlers = { fn_portal_app_dang_nhap: () => ({ error: 'x', errors: ['Tài khoản tạm khoá, thử lại sau 15 phút'], ma: 'SAI_MAT_KHAU' }) };
  await assert.rejects(auth.login(PHONE, 'sai12345'), { message: 'Tài khoản tạm khoá, thử lại sau 15 phút' });
});

test('đăng nhập: tài khoản tự đăng ký qua website → công ty chỉ có phiên NOXH; công ty có hợp đồng đứng trước', async () => {
  handlers = {
    fn_portal_app_dang_nhap: () => ({
      data: { sdt: PHONE, cong_ty: [company('c1', { token: null, noxh_slug: 'site-a', noxh_token: 'noxh-a' }), company('c2')] },
    }),
  };
  const { session: s } = await auth.login(PHONE, 'pass1234');
  assert.equal(s.companyId, 'c2');
  const c1 = s.companies.find((c) => c.companyId === 'c1');
  assert.equal(c1.token, undefined);
  assert.deepEqual(c1.noxh, { slug: 'site-a', token: 'noxh-a' });
});

const user = { id: 'u', customerCode: '', fullName: '', email: '', phone: PHONE, idNumber: '', address: '' };
const cs = (companyId, extra) => ({ companyId, companyName: companyId, token: `t-${companyId}`, userId: 'u', customerId: `kh-${companyId}`, user, ...extra });

test('kết nối NOXH: sai mật khẩu ở công ty đang thiếu token → báo lỗi dù công ty khác đã kết nối', async () => {
  handlers = { fn_portal_site_login: () => ({ error: 'Sai mật khẩu' }) };
  const s = { token: 't-A', userId: 'u', createdAt: '', companyId: 'A', customerId: 'kh-A', user, phone: PHONE, companies: [cs('A', { noxh: { slug: 'a', token: 'na' } }), cs('B', { noxhSite: 'b-noxh', loginName: PHONE })] };
  await assert.rejects(auth.connectNoxh(s, 'sai'), { message: 'Mật khẩu không đúng.' });
});

test('kết nối NOXH: dùng website + tên đăng nhập đã lưu trong phiên, không tra tài khoản bằng tài khoản hệ thống', async () => {
  calls.length = 0;
  handlers = { fn_portal_site_login: (a) => (a.p_slug === 'b-noxh' && a.p_login === 'nv-b' ? loginRow('B', 'nx-B') : { error: 'Sai' }) };
  const s = { token: 't-B', userId: 'u', createdAt: '', companyId: 'B', customerId: 'kh-B', user, phone: PHONE, companies: [cs('B', { noxhSite: 'b-noxh', loginName: 'nv-b' })] };
  const next = await auth.connectNoxh(s, 'pass1234');
  assert.deepEqual(next.companies[0].noxh, { slug: 'b-noxh', token: 'nx-B' });
  assert.ok(!calls.some(([fn]) => fn === 'GET' || fn === 'fn_portal_account_get'));
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
  assert.ok(calls.some(([fn]) => fn === 'fn_portal_app_noxh_sites'));
  assert.ok(!calls.some(([fn]) => fn === 'GET'));
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

// Chọn hồ sơ khách hàng (2026-10-08): một công ty nhiều hồ sơ cùng SĐT → 1 tài khoản, danh sách từ fn_portal_app_ho_so_list.
test('đăng nhập: công ty có 2 hồ sơ cùng SĐT → phiên có 2 hồ sơ, theo hồ sơ server đang xem; chọn hồ sơ gọi fn_portal_app_chon_ho_so', async () => {
  calls.length = 0;
  handlers = {
    fn_portal_app_dang_nhap: () => ({ data: { sdt: PHONE, cong_ty: [company('c1')] } }),
    fn_portal_app_ho_so_list: (a) =>
      a.p_token === 'hd-c1'
        ? { data: [{ ...customer('kh-c1', 'c1'), dang_xem: false }, { ...customer('kh-c1b', 'c1'), ma_so_kh: 'KH-2', dang_xem: true }] }
        : { error: 'Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại' },
    fn_portal_app_chon_ho_so: () => ({ data: { ok: true } }),
  };
  const { session: s } = await auth.login(PHONE, 'pass1234');
  assert.equal(s.companies[0].profiles.length, 2);
  assert.equal(s.customerId, 'kh-c1b');
  assert.equal(s.user.customerCode, 'KH-2');
  await auth.selectProfile(s, 'c1', 'kh-c1');
  assert.deepEqual(calls.find(([fn]) => fn === 'fn_portal_app_chon_ho_so')?.[1], { p_token: 'hd-c1', p_khach_hang_id: 'kh-c1' });
});

test('đăng nhập: server chưa có fn_portal_app_ho_so_list → vẫn vào được, chỉ hồ sơ của tài khoản', async () => {
  handlers = { fn_portal_app_dang_nhap: () => ({ data: { sdt: PHONE, cong_ty: [company('c1')] } }) };
  const { session: s } = await auth.login(PHONE, 'pass1234');
  assert.equal(s.customerId, 'kh-c1');
  assert.equal(s.companies[0].profiles, undefined);
});

test('liên kết công ty mới: kiểm mật khẩu ở công ty đang xem (tên đăng nhập đã lưu) rồi đăng nhập lại trên server, chỉ thêm công ty mới', async () => {
  calls.length = 0;
  handlers = {
    fn_portal_app_login: (a) => (a.p_company_id === 'c1' && a.p_login === 'nv-c1' && a.p_password === 'pass1234' ? loginRow('c1', 'kiem-tra') : { error: 'Tên đăng nhập hoặc mật khẩu không đúng' }),
    fn_portal_app_dang_nhap: () => ({ data: { sdt: PHONE, cong_ty: [company('c1', { token: 'hd-c1-moi' }), company('c2')] } }),
    fn_portal_logout: () => null,
  };
  const s = { token: 'hd-c1', userId: 'acc-c1', createdAt: '', companyId: 'c1', customerId: 'kh-c1', user, phone: PHONE, companies: [cs('c1', { loginName: 'nv-c1' })] };
  const { session: next, added } = await auth.linkNewCompanies(s, 'pass1234');
  assert.deepEqual(added.map((o) => o.companyId), ['c2']);
  assert.deepEqual(next.companies.map((c) => c.companyId), ['c1', 'c2']);
  assert.equal(next.companies[0].token, 't-c1');
  const loggedOut = calls.filter(([fn]) => fn === 'fn_portal_logout').map(([, a]) => a.p_token);
  assert.ok(loggedOut.includes('hd-c1-moi') && loggedOut.includes('kiem-tra'));
  assert.ok(!calls.some(([fn]) => ['GET', 'fn_portal_account_get', 'fn_portal_account_set_password'].includes(fn)));
});

test('liên kết công ty mới: gõ sai → chỉ thử 1 lần ở công ty đang xem, không đăng nhập lại mọi công ty; khoá tạm giữ câu máy chủ', async () => {
  calls.length = 0;
  handlers = { fn_portal_app_login: () => ({ error: 'Tên đăng nhập hoặc mật khẩu không đúng' }), fn_portal_app_dang_nhap: () => ({ data: { sdt: PHONE, cong_ty: [] } }) };
  const s = { token: 'hd-c1', userId: 'acc-c1', createdAt: '', companyId: 'c1', customerId: 'kh-c1', user, phone: PHONE, companies: [cs('c1', { loginName: 'nv-c1' })] };
  await assert.rejects(auth.linkNewCompanies(s, 'sai'), (e) => e.field === 'password' && e.message.startsWith('Mật khẩu không đúng'));
  assert.equal(calls.filter(([fn]) => fn === 'fn_portal_app_login').length, 1);
  assert.ok(!calls.some(([fn]) => fn === 'fn_portal_app_dang_nhap'));
  handlers = { fn_portal_app_login: () => ({ error: 'Tài khoản tạm khoá, thử lại sau 15 phút' }) };
  await assert.rejects(auth.linkNewCompanies(s, 'sai'), { message: 'Tài khoản tạm khoá, thử lại sau 15 phút' });
});

test('dò công ty mới: fn_portal_app_cong_ty_moi theo token phiên, gửi kèm công ty đã có', async () => {
  calls.length = 0;
  handlers = {
    fn_portal_app_cong_ty_moi: (a) =>
      a.p_token === 'hd-c1' && JSON.stringify(a.p_da_co) === '["c1"]'
        ? { data: [{ company_id: 'c2', ten_ct: 'MSR', khach_hang_id: 'kh-c2', ten_kh: 'Lê Thu Hà', ma_so_kh: 'KH-9' }] }
        : { error: 'Sai' },
  };
  const s = { token: 'hd-c1', userId: 'acc-c1', createdAt: '', companyId: 'c1', customerId: 'kh-c1', user, phone: PHONE, companies: [cs('c1', { token: 'hd-c1' })] };
  assert.deepEqual(await auth.findNewCompanies(s), [{ companyId: 'c2', companyName: 'MSR', customerId: 'kh-c2', customerName: 'Lê Thu Hà', customerCode: 'KH-9' }]);
  assert.ok(!calls.some(([fn]) => NO_SERVICE_JWT.includes(fn)));
});

test('kết nối NOXH: phiên cũ chưa lưu tên đăng nhập, sai mật khẩu → gợi ý đăng nhập lại', async () => {
  handlers = { fn_portal_site_login: () => ({ error: 'Sai' }) };
  const s = { token: 't-B', userId: 'u', createdAt: '', companyId: 'B', customerId: 'kh-B', user, phone: PHONE, companies: [cs('B', { noxhSite: 'b-noxh' })] };
  await assert.rejects(auth.connectNoxh(s, 'pass1234'), (e) => /đăng nhập lại/.test(e.message));
});
