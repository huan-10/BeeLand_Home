// Một SĐT ở nhiều công ty: chọn hồ sơ để đăng nhập / tự liên kết, đổi công ty đang xem (lib/companySession.ts). Chạy: npm test
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');

const src = ts.transpileModule(fs.readFileSync(path.join(__dirname, '../lib/companySession.ts'), 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;
const mod = { exports: {} };
new Function('module', 'exports', 'require', src)(mod, mod.exports, require);
const m = mod.exports;

const PHONE = '0859021385';
const acc = (username, is_active = true) => ({ id: `acc-${username}`, username, email: null, is_active });

test('công ty đã có tài khoản → đăng nhập; công ty chưa có → tự liên kết', () => {
  const plan = m.planCompanyLogins(
    [
      { id: 'kh-msr', ma_ctdk: 'msr' },
      { id: 'kh-brg', ma_ctdk: 'brg' },
    ],
    [null, acc(PHONE)],
    PHONE,
  );
  assert.deepEqual(plan.login, [{ companyId: 'brg', customerId: 'kh-brg', username: PHONE }]);
  assert.deepEqual(plan.link, [{ companyId: 'msr', customerId: 'kh-msr' }]);
});

test('tài khoản thiếu username → đăng nhập bằng SĐT', () => {
  const plan = m.planCompanyLogins([{ id: 'kh-1', ma_ctdk: 'brg' }], [acc(null)], PHONE);
  assert.equal(plan.login[0].username, PHONE);
});

test('tài khoản bị khoá → không đăng nhập, không tự liên kết lại công ty đó', () => {
  const plan = m.planCompanyLogins(
    [
      { id: 'kh-a', ma_ctdk: 'brg' },
      { id: 'kh-b', ma_ctdk: 'brg' },
    ],
    [acc(PHONE, false), null],
    PHONE,
  );
  assert.deepEqual(plan.login, []);
  assert.deepEqual(plan.link, []);
});

test('mỗi công ty chỉ một hồ sơ: không tạo tài khoản thứ hai trùng SĐT trong cùng công ty', () => {
  const plan = m.planCompanyLogins(
    [
      { id: 'kh-a', ma_ctdk: 'brg' },
      { id: 'kh-b', ma_ctdk: 'brg' },
      { id: 'kh-c', ma_ctdk: 'msr' },
      { id: 'kh-d', ma_ctdk: 'msr' },
    ],
    [null, acc(PHONE), null, null],
    PHONE,
  );
  assert.deepEqual(plan.login, [{ companyId: 'brg', customerId: 'kh-b', username: PHONE }]);
  assert.deepEqual(plan.link, [{ companyId: 'msr', customerId: 'kh-c' }]);
});

const user = (name) => ({ id: name, customerCode: name, fullName: name, email: '', phone: PHONE, idNumber: '', address: '' });
const entry = (companyId) => ({
  companyId,
  companyName: companyId.toUpperCase(),
  token: `tok-${companyId}`,
  userId: `acc-${companyId}`,
  customerId: `kh-${companyId}`,
  user: user(`KH-${companyId}`),
});
const session = {
  token: 'tok-brg',
  userId: 'acc-brg',
  createdAt: '2026-10-05T00:00:00.000Z',
  companyId: 'brg',
  customerId: 'kh-brg',
  user: user('KH-brg'),
  companies: [entry('brg'), entry('msr')],
};

test('đổi công ty → token, khách, hồ sơ của công ty mới; giữ danh sách công ty', () => {
  const next = m.withActiveCompany(session, 'msr');
  assert.equal(next.token, 'tok-msr');
  assert.equal(next.userId, 'acc-msr');
  assert.equal(next.companyId, 'msr');
  assert.equal(next.customerId, 'kh-msr');
  assert.equal(next.user.customerCode, 'KH-msr');
  assert.equal(next.createdAt, session.createdAt);
  assert.equal(next.companies.length, 2);
});

test('công ty không có trong phiên → giữ nguyên phiên', () => {
  assert.equal(m.withActiveCompany(session, 'khac'), session);
});

test('danh sách công ty để chọn lấy từ phiên; phiên cũ (một công ty) → rỗng', () => {
  assert.deepEqual(m.companyOptions(session), [
    { companyId: 'brg', companyName: 'BRG', customerName: 'KH-brg', customerCode: 'KH-brg' },
    { companyId: 'msr', companyName: 'MSR', customerName: 'KH-msr', customerCode: 'KH-msr' },
  ]);
  assert.deepEqual(m.companyOptions({ ...session, companies: undefined }), []);
});

test('token của mọi công ty (để đăng xuất hết), không trùng', () => {
  assert.deepEqual(m.sessionTokens(session), ['tok-brg', 'tok-msr']);
  assert.deepEqual(m.sessionTokens({ ...session, companies: undefined }), ['tok-brg']);
});

/* ---------- Hồ sơ phát sinh ở công ty mới khi khách đang đăng nhập ---------- */

test('phiên cũ (chưa có companies) → suy ra một công ty từ phiên đang xem', () => {
  const old = { ...session, companies: undefined, user: { ...user('KH-brg'), companyName: 'BRG' } };
  assert.deepEqual(m.sessionCompanies(old), [
    { companyId: 'brg', companyName: 'BRG', token: 'tok-brg', userId: 'acc-brg', customerId: 'kh-brg', user: old.user },
  ]);
  assert.deepEqual(m.sessionCompanies({ token: 't', userId: 'u', createdAt: '' }), []);
});

test('chỉ giữ công ty chưa có trong phiên (cả đăng nhập lẫn tự liên kết)', () => {
  const plan = {
    login: [
      { companyId: 'brg', customerId: 'kh-brg', username: PHONE },
      { companyId: 'nv', customerId: 'kh-nv', username: PHONE },
    ],
    link: [
      { companyId: 'msr', customerId: 'kh-msr2' },
      { companyId: 'moi', customerId: 'kh-moi' },
    ],
    siteLogin: [
      { companyId: 'brg', customerId: 'kh-brg2', slug: 'brg-noxh', login: PHONE },
      { companyId: 'noxh', customerId: 'kh-noxh', slug: 'noxh-site', login: PHONE },
    ],
  };
  assert.deepEqual(m.missingFromSession(plan, ['brg', 'msr']), {
    login: [{ companyId: 'nv', customerId: 'kh-nv', username: PHONE }],
    link: [{ companyId: 'moi', customerId: 'kh-moi' }],
    siteLogin: [{ companyId: 'noxh', customerId: 'kh-noxh', slug: 'noxh-site', login: PHONE }],
  });
});

test('thêm công ty vào phiên: giữ công ty đang xem, không trùng công ty', () => {
  const next = m.addCompanies(session, [entry('moi'), entry('msr')]);
  assert.equal(next.companyId, 'brg');
  assert.equal(next.token, 'tok-brg');
  assert.deepEqual(
    next.companies.map((c) => c.companyId),
    ['brg', 'msr', 'moi'],
  );
});

/* ---------------- NOXH: tài khoản tự đăng ký qua website, token NOXH ---------------- */

test('tài khoản tự đăng ký qua website NOXH → đăng nhập bằng fn_portal_site_login trên slug website đó', () => {
  const plan = m.planCompanyLogins(
    [
      { id: 'kh-ha', ma_ctdk: 'sunshine' },
      { id: 'kh-old', ma_ctdk: 'brg' },
    ],
    [
      { id: 'acc-ha', username: '0938111222', email: null, is_active: true, nguon_web_config_id: 'web-1', pham_vi: 'CHON' },
      acc('0938111222'),
    ],
    '0938111222',
    { sunshine: 'sunshine-noxh', brg: 'brg-noxh' },
  );
  assert.deepEqual(plan.siteLogin, [{ companyId: 'sunshine', customerId: 'kh-ha', slug: 'sunshine-noxh', login: '0938111222' }]);
  assert.deepEqual(plan.login, [{ companyId: 'brg', customerId: 'kh-old', username: '0938111222' }]);
});

test('tài khoản tự đăng ký nhưng công ty không còn website NOXH → bỏ qua công ty đó', () => {
  const plan = m.planCompanyLogins([{ id: 'kh', ma_ctdk: 'x' }], [{ id: 'a', username: 'u', email: null, is_active: true, nguon_web_config_id: 'w', pham_vi: 'CHON' }], '0938111222', {});
  assert.deepEqual(plan.siteLogin, []);
  assert.deepEqual(plan.login, []);
  assert.deepEqual(plan.link, []);
});

test('sessionTokens gồm cả token NOXH, bỏ token trống', () => {
  const user = { id: 'u', customerCode: '', fullName: '', email: '', phone: '', idNumber: '', address: '' };
  const tokens = m.sessionTokens({
    userId: 'u',
    createdAt: '',
    companies: [
      { companyId: 'a', companyName: 'A', token: 't-a', userId: 'u', customerId: 'c', user, noxh: { slug: 's', token: 'n-a' } },
      { companyId: 'b', companyName: 'B', userId: 'u', customerId: 'c', user, noxh: { slug: 's2', token: 'n-b' } },
    ],
  });
  assert.deepEqual(tokens.sort(), ['n-a', 'n-b', 't-a']);
});

test('noxhMissing: công ty có website NOXH nhưng chưa có / mất token NOXH', () => {
  const user = { id: 'u', customerCode: '', fullName: '', email: '', phone: '', idNumber: '', address: '' };
  const s = {
    userId: 'u',
    createdAt: '',
    companies: [
      { companyId: 'a', companyName: 'A', token: 't', userId: 'u', customerId: 'c', user, noxhSite: 'a-noxh', noxh: { slug: 'a-noxh', token: 'n' } },
      { companyId: 'b', companyName: 'B', token: 't', userId: 'u', customerId: 'c', user, noxhSite: 'b-noxh' },
      { companyId: 'c', companyName: 'C', token: 't', userId: 'u', customerId: 'c', user },
    ],
  };
  assert.deepEqual(m.noxhMissing(s).map((c) => c.companyId), ['b']);
});

test('planCompanyLogins: tài khoản tự đăng ký dùng slug của chính website đã đăng ký', () => {
  const plan = m.planCompanyLogins(
    [{ id: 'kh', ma_ctdk: 'c1' }],
    [{ id: 'a', username: 'u', email: null, is_active: true, nguon_web_config_id: 'w2', pham_vi: 'CHON' }],
    '0938111222',
    { c1: 'site-a' },
    { w1: 'site-a', w2: 'site-b' },
  );
  assert.equal(plan.siteLogin[0].slug, 'site-b');
});
