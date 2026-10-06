// Service NOXH chạy mock: luật giống máy chủ (quay lại cùng kết quả, thiếu giấy tờ không nộp được, trùng dự án). Chạy: npm test
const test = require('node:test');
const assert = require('node:assert/strict');
const { loadModule, stubModule } = require('./noxh-fixtures.cjs');

// Test luật của dữ liệu giả → cố định chế độ mock (mặc định app theo AUTH_BACKEND = 'api').
stubModule('services/config.ts', { AUTH_BACKEND: 'mock', NOXH_BACKEND: 'mock', SUPABASE_URL: 'https://api.test', SUPABASE_ANON_KEY: 'anon', SERVICE_ACCOUNT: {} });

const session = loadModule('services/session.ts');
const svc = loadModule('services/noxhService.ts');
const form = loadModule('lib/noxhForm.ts');

const SUNSHINE = 'company-sunshine';
const BLUESKY = 'company-bluesky';
const PHONE = '0901234567';
const user = { id: 'user-001', customerCode: 'KH-000128', fullName: 'Nguyễn Văn An', email: '', phone: PHONE, idNumber: '', address: '' };
const company = (companyId, noxh) => ({ companyId, companyName: companyId, token: `t-${companyId}`, userId: 'user-001', customerId: 'user-001', user, ...(noxh ? { noxh: { slug: 's', token: svc.mockNoxhToken(companyId, PHONE) } } : {}) });
const connect = (both = true) =>
  session.setActiveSession({ token: 't', userId: 'user-001', createdAt: '', companyId: SUNSHINE, customerId: 'user-001', user, companies: [company(SUNSHINE, true), company(BLUESKY, both)] });

test('chưa kết nối NOXH → không có hồ sơ; đợt vẫn hiện theo công ty có tài khoản', async () => {
  session.setActiveSession({ token: 't', userId: 'user-001', createdAt: '', companyId: SUNSHINE, customerId: 'user-001', user, companies: [company(SUNSHINE, false)] });
  assert.deepEqual(await svc.getMyApplications(), []);
  const rounds = await svc.getRounds();
  assert.ok(rounds.length > 0);
  assert.ok(rounds.every((r) => r.company_id === SUNSHINE));
  assert.equal(rounds[0].tinh_trang, 'DANG_MO');
});

test('quay bốc thăm 2 lần (bấm đúp / thử lại sau mất mạng) → cùng một kết quả và thời điểm mở', async () => {
  connect();
  const [a, b] = await Promise.all([svc.spinLottery('bt-hs002'), svc.spinLottery('bt-hs002')]);
  const c = await svc.spinLottery('bt-hs002');
  assert.equal(a.ket_qua, 'TRUNG');
  assert.equal(a.can.ky_hieu, 'A-1205');
  assert.equal(b.mo_luc, a.mo_luc);
  assert.equal(c.mo_luc, a.mo_luc);
  const mine = await svc.getMyLotteries();
  assert.equal(mine.items.find((i) => i.bt_ho_so_id === 'bt-hs002').da_quay, true);
});

test('lượt chưa tới giờ → "Chưa đến giờ bốc thăm"', async () => {
  connect();
  await assert.rejects(svc.spinLottery('bt-hs004'), { message: 'Chưa đến giờ bốc thăm' });
});

test('tạo hồ sơ ở đợt đang mở → nộp khi thiếu giấy tờ bị chặn, đủ thì "Đã nộp hồ sơ"', async () => {
  connect();
  const created = await svc.saveApplication({ dot_id: 'dot-a', nhom_doi_tuong_id: 'g-cong-nhan', loai_can_id: 'lc-2pn', khach_hang: {} }, false);
  assert.equal(created.trang_thai, 'NHAP');
  // Gửi giống app: đủ thông tin khách từ bản chụp + SĐT dự phòng (lib/noxhForm khachHangPayload).
  const payload = async () => ({ id: created.id, dot_id: 'dot-a', nhom_doi_tuong_id: 'g-cong-nhan', khach_hang: form.khachHangPayload((await svc.getApplication(created.id)).kh_snapshot, PHONE) });
  await assert.rejects(svc.saveApplication(await payload(), true), /^ServiceError: Chưa nộp giấy tờ bắt buộc: /);
  const detail = await svc.getApplication(created.id);
  for (const d of detail.giay_to.filter((x) => x.bat_buoc)) {
    await svc.uploadDoc(created.id, d.id, { name: 'scan.pdf', size: 1000, type: 'application/pdf', uri: 'file://scan.pdf' });
  }
  // Máy chủ dựng lại bản chụp từ payload (lỗi cũ của app): lưu bước 2 bỏ SĐT → nộp bị chặn; nộp với khach_hang rỗng → mất họ tên.
  const base = { id: created.id, dot_id: 'dot-a', nhom_doi_tuong_id: 'g-cong-nhan' };
  const full = form.khachHangPayload(detail.kh_snapshot, PHONE);
  const { di_dong: _dd, ...noPhone } = full;
  await svc.saveApplication({ ...base, khach_hang: noPhone }, false);
  await assert.rejects(svc.saveApplication({ ...base, khach_hang: noPhone }, true), /Chưa đủ thông tin: Số điện thoại/);
  await assert.rejects(svc.saveApplication({ ...base, khach_hang: {} }, true), /Chưa đủ thông tin: Họ tên/);
  // Hồ sơ đã mất SĐT → app điền SĐT khách đang đăng nhập rồi nộp được.
  const lost = (await svc.getApplication(created.id)).kh_snapshot;
  assert.equal(lost.di_dong, '');
  assert.equal(form.withAccountPhone(lost, PHONE).di_dong, PHONE);
  const submitted = await svc.saveApplication({ ...base, khach_hang: full }, true);
  assert.equal(submitted.trang_thai, 'MOI_TIEP_NHAN');
  await assert.rejects(svc.saveApplication({ dot_id: 'dot-a', nhom_doi_tuong_id: 'g-cong-nhan', khach_hang: {} }, false), (e) => e.hoSoId === created.id);
});

test('tải tệp HEIC bị từ chối với hướng dẫn', async () => {
  connect();
  await assert.rejects(svc.uploadDoc('hs-001', 'hs-001-cccd', { name: 'IMG.heic', size: 1000, type: 'image/heic', uri: 'x' }), /HEIC/);
});

test('bổ sung: còn giấy tờ chưa đạt thì chặn; tải lại đủ → Đang kiểm tra', async () => {
  connect();
  await assert.rejects(svc.sendSupplement('hs-001'), /^ServiceError: Chưa bổ sung giấy tờ: /);
  await assert.rejects(svc.uploadDoc('hs-001', 'hs-001-don', { name: 'a.pdf', size: 10, type: 'application/pdf', uri: 'x' }), /không thay đổi được/);
  await svc.uploadDoc('hs-001', 'hs-001-cccd', { name: 'cccd.jpg', size: 10, type: 'image/jpeg', uri: 'x' });
  await svc.uploadDoc('hs-001', 'hs-001-thu-nhap', { name: 'tn.pdf', size: 10, type: 'application/pdf', uri: 'x' });
  assert.equal((await svc.sendSupplement('hs-001')).trang_thai, 'DANG_THAM_DINH');
});

test('kết quả công bố (mock) chỉ của công ty khách có tài khoản', async () => {
  session.setActiveSession({ token: 't', userId: 'x', createdAt: '', companyId: 'company-x', customerId: 'kh', user, companies: [{ companyId: 'company-x', companyName: 'X', token: 't', userId: 'x', customerId: 'kh', user }] });
  assert.deepEqual(await svc.getPublishedResults(), []);
  connect();
  assert.equal((await svc.getPublishedResults()).length, 1);
});

test('mock: tài khoản chưa có CCCD (BlueSky) → lưu hồ sơ bị chặn đúng thông điệp máy chủ; khai CCCD xong thì tạo được', async () => {
  connect();
  assert.equal((await svc.getNoxhAccount('company-bluesky')).co_cccd, false);
  await assert.rejects(
    svc.saveApplication({ dot_id: 'dot-c', nhom_doi_tuong_id: 'g-thu-nhap-thap', loai_can_id: 'lc-2pn', khach_hang: {} }, false),
    /^ServiceError: Tài khoản chưa có CCCD/,
  );
  await assert.rejects(svc.updateCccd('company-bluesky', '0123'), /12 chữ số/);
  await assert.rejects(svc.updateCccd('company-bluesky', '079 190 004 567'), /CCCD đã được dùng cho khách hàng khác/); // CCCD của khách khác cùng BlueSky
  assert.equal((await svc.updateCccd('company-bluesky', '079 090 001 234')).cccd, '0790****1234');
  assert.equal((await svc.getNoxhAccount('company-bluesky')).co_cccd, true);
  const created = await svc.saveApplication({ dot_id: 'dot-c', nhom_doi_tuong_id: 'g-thu-nhap-thap', loai_can_id: 'lc-2pn', khach_hang: {} }, false);
  assert.equal(created.trang_thai, 'NHAP');
});
