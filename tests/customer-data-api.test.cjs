// Dữ liệu khách đọc THEO PHIÊN (giai đoạn 2 bỏ tài khoản hệ thống, 2026-10-08): hợp đồng / lịch thanh toán / phiếu thu /
// công ty bán / bàn giao qua fn_portal_app_* bằng token phiên — không đọc bảng, không JWT tài khoản hệ thống. Chạy: npm test
const test = require('node:test');
const assert = require('node:assert/strict');
const { loadModule, stubModule } = require('./noxh-fixtures.cjs');

const calls = [];
let handlers = {};
stubModule('services/config.ts', { AUTH_BACKEND: 'api', NOXH_BACKEND: 'api', SUPABASE_URL: 'https://api.test', SUPABASE_ANON_KEY: 'anon' });
stubModule('services/supabase/client.ts', {
  rpc: async (fn, args, jwt) => {
    calls.push([fn, args, jwt]);
    const h = handlers[fn];
    if (!h) throw new Error(`rpc không mong đợi: ${fn}`);
    return h(args);
  },
  restGet: async (query) => {
    calls.push(['GET', query]);
    throw new Error(`GET không mong đợi: ${query}`);
  },
  edge: async () => {
    throw new Error('edge không mong đợi');
  },
  str: (v) => (typeof v === 'string' ? v : v == null ? '' : String(v)),
  inList: (values) => `(${values.join(',')})`,
});

const session = loadModule('services/session.ts');
const data = loadModule('services/supabase/customerData.ts');
const handover = loadModule('services/supabase/handover.ts');

const user = { id: 'u', customerCode: 'KH-1', fullName: 'A', email: '', phone: '0901234567', idNumber: '', address: '' };
session.setActiveSession({ token: 'tok-1', userId: 'acc-1', createdAt: '', companyId: 'c1', customerId: 'kh-1', user, companies: [{ companyId: 'c1', companyName: 'C1', token: 'tok-1', userId: 'acc-1', customerId: 'kh-1', user }] });

const pgc = (id, extra = {}) => ({
  id, so_phieu_gc: `PGC-${id}`, giai_doan: 'HDMB', gia_tri_hd: 100, gia_tri_hd_sau_ck: 90, tien_coc: 10, da_thu: 20, dien_tich: 70,
  san_pham_id: 'sp1', project_id: 'da1', trang_thai_id: 'st1', khach_hang_id: 'kh-1', ma_ctdk_uid: 'c1', ngay_giu_cho: null,
  created_at: '2026-10-01', tt_hop_dong: null, lich_thanh_toan: [], ...extra,
});
const noServiceJwt = () => assert.ok(!calls.some(([fn]) => fn === 'GET' || fn === 'SERVICE_JWT'), JSON.stringify(calls.map(([fn]) => fn)));

test('hợp đồng: fn_portal_app_hop_dong bằng token phiên → bản ghi có căn / dự án (ảnh tuyệt đối) / trạng thái / booking', async () => {
  calls.length = 0;
  handlers = {
    fn_portal_app_hop_dong: (a) =>
      a.p_token === 'tok-1'
        ? {
            data: [
              {
                pgc: pgc('p1', { giai_doan: 'GIUCHO' }),
                product: { id: 'sp1', ky_hieu: 'A-101', ma_sp: 'A101', so_tang: 1, dien_tich_thong_thuy: 65, dien_tich: 70 },
                project: { id: 'da1', ten_da: 'Dự án X', dia_chi: 'HN', ma_da_code: 'X', image_url: null, anh_background: 'upload/x.jpg', anh_icon: null },
                status: { id: 'st1', item_code: '1', item_name: 'Chờ duyệt' },
                booking: { ma_pgc_id: 'p1', tien_giu_cho: 50, het_han_luc: null, loai_ct: 'GIUCHO', created_at: '2026-10-01' },
              },
            ],
          }
        : { error: 'Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại' },
  };
  const records = await data.getCustomerRecords(true);
  assert.equal(records.length, 1);
  assert.equal(records[0].row.id, 'p1');
  assert.equal(records[0].product.ky_hieu, 'A-101');
  assert.equal(records[0].project.imageUrl, 'https://upload.beesky.vn/upload/x.jpg');
  assert.equal(records[0].status.item_code, '1');
  assert.equal(records[0].booking.tien_giu_cho, 50);
  noServiceJwt();
});

test('lịch thanh toán / phiếu thu / công ty bán: hàm theo phiên, không JWT hệ thống', async () => {
  calls.length = 0;
  handlers.fn_portal_app_lich_tt = (a) => (a.p_pgc_id === 'p1' ? { data: [{ dot_tt: 1, dot_tt_text: 'Đợt 1', phai_thu: 10, da_thu: 5 }] } : { error: 'Không tìm thấy hợp đồng.' });
  handlers.fn_portal_app_phieu_thu = (a) => (a.p_pgc_id === 'p1' ? { data: [{ id: 'v1', so_phieu: 'PT-1', so_tien_pgc: 5 }] } : { error: 'Không tìm thấy hợp đồng.' });
  handlers.fn_portal_app_cong_ty = () => ({ data: { ten_ct: 'BRG', dia_chi: 'HN', dien_thoai: '1', email: 'a@b.c' } });
  assert.equal((await data.getPgcSchedule('p1', true))[0].dot_tt_text, 'Đợt 1');
  assert.equal((await data.getPgcVouchers('p1', true))[0].so_phieu, 'PT-1');
  assert.equal((await data.getSellerCompany()).ten_ct, 'BRG');
  assert.ok(calls.filter(([fn]) => fn.startsWith('fn_portal_app_')).every(([, a]) => a.p_token === 'tok-1'));
  noServiceJwt();
});

test('phiếu thu: phiếu không thuộc khách → lỗi, không gọi server', async () => {
  calls.length = 0;
  await assert.rejects(data.getPgcVouchers('p-khac', true), { message: 'Không tìm thấy hợp đồng.' });
  assert.ok(!calls.some(([fn]) => fn === 'fn_portal_app_phieu_thu'));
});

test('bàn giao: fn_portal_app_ban_giao → quỹ của khách + lịch hẹn bg_lich_hen (không lọc lại theo công ty / SĐT)', async () => {
  calls.length = 0;
  handlers.fn_portal_app_ban_giao = () => ({
    data: {
      quy: [{ id: 'f1', so_qbg: 'QBG-1', state: 'NOTIFIED', khach_hang_id: 'kh-1', phieu_giu_cho_id: 'p1', ky_hieu: 'A-101', so_hdmb: null, tu_ngay: '2026-10-10', den_ngay: '2026-10-30', dien_tich_hd: 70, dien_tich_bg: 70, pt_tang_giam: 0, pt_tien_do: 50, pt_tien_do_pbt: 0, ghi_chu: null }],
      lich: [{ id: 'l1', ban_giao_id: 'f1', so_qbg: 'QBG-1', ky_hieu: 'A-101', lan: 1, ngay: '2026-10-20', ca: '08:00–10:00', tu_gio: '08:00', den_gio: '10:00', ca_id: 'ca1', dia_diem: null, trang_thai: 'CHO_XAC_NHAN', trang_thai_ten: 'Chờ xác nhận', khach_dang_ky: true, nhan_vien: null, lien_he: '1900', so_tien_can_nop: 0, bien_ban: null }],
      sdt: ['0901234567'],
    },
  });
  const { handovers, schedules } = await handover.fetchHandoverData();
  assert.deepEqual(handovers.map((x) => x.id), ['f1']);
  assert.equal(schedules.length, 1);
  assert.equal(schedules[0].fundId, 'f1');
  assert.equal(schedules[0].selfBooked, true);
  assert.equal(calls.filter(([fn]) => fn === 'fn_portal_app_ban_giao').length, 1);
  noServiceJwt();
});

test('bàn giao: ca còn chỗ theo ngày (fn_portal_app_bg_ca) → HandoverSlots', async () => {
  calls.length = 0;
  handlers.fn_portal_app_bg_ca = () => ({
    data: { tu: '2026-10-16', den: '2026-10-17', ngay: [
      { ngay: '2026-10-16', ca: [{ ca_id: 'ca1', ten: 'Ca sáng', tu_gio: '08:00', den_gio: '10:00', so_khach: 5, con: 2 }] },
      { ngay: '2026-10-17', ca: [] },
    ] },
  });
  const slots = await handover.fetchHandoverSlots('f1');
  assert.deepEqual(slots, { from: '2026-10-16', to: '2026-10-17', days: [
    { date: '2026-10-16', shifts: [{ id: 'ca1', name: 'Ca sáng', from: '08:00', to: '10:00', capacity: 5, remaining: 2 }] },
    { date: '2026-10-17', shifts: [] },
  ] });
  assert.deepEqual(calls.find(([fn]) => fn === 'fn_portal_app_bg_ca')[1], { p_token: 'tok-1', p_ban_giao_id: 'f1' });
  noServiceJwt();
});

test('bàn giao: đăng ký / đổi / huỷ lịch gọi đúng hàm với token phiên; lỗi máy chủ → ServiceError giữ thông điệp', async () => {
  calls.length = 0;
  handlers.fn_portal_app_bg_dang_ky = () => ({ data: { id: 'l9' } });
  handlers.fn_portal_app_bg_doi = () => ({ data: { id: 'l9' } });
  handlers.fn_portal_app_bg_huy = () => ({ data: { id: 'l9' } });
  await handover.submitHandoverBooking('f1', '2026-10-20', 'ca1');
  await handover.submitHandoverReschedule('l9', '2026-10-21', 'ca2');
  await handover.submitHandoverCancel('l9');
  const args = (fn) => calls.find(([f]) => f === fn)[1];
  assert.deepEqual(args('fn_portal_app_bg_dang_ky'), { p_token: 'tok-1', p_ban_giao_id: 'f1', p_ngay: '2026-10-20', p_ca_id: 'ca1' });
  assert.deepEqual(args('fn_portal_app_bg_doi'), { p_token: 'tok-1', p_lich_id: 'l9', p_ngay: '2026-10-21', p_ca_id: 'ca2' });
  assert.deepEqual(args('fn_portal_app_bg_huy'), { p_token: 'tok-1', p_lich_id: 'l9' });
  handlers.fn_portal_app_bg_dang_ky = () => ({ error: 'Ca "Ca sáng" ngày 20/10/2026 đã kín' });
  await assert.rejects(handover.submitHandoverBooking('f1', '2026-10-20', 'ca1'), { name: 'ServiceError', message: 'Ca "Ca sáng" ngày 20/10/2026 đã kín' });
  handlers.fn_portal_app_bg_huy = () => ({ error: 'Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại' });
  await assert.rejects(handover.submitHandoverCancel('l9'), { code: 'UNAUTHORIZED' });
  noServiceJwt();
});

test('website NOXH theo công ty: fn_portal_app_noxh_sites (anon), không JWT hệ thống', async () => {
  calls.length = 0;
  const portal = loadModule('services/supabase/portal.ts');
  handlers.fn_portal_app_noxh_sites = (a) => ({ data: Object.fromEntries(a.p_company_ids.map((id) => [id, `${id}-noxh`])) });
  const sites = await portal.getNoxhSites(['c1', 'c2']);
  assert.deepEqual(sites.byCompany, { c1: 'c1-noxh', c2: 'c2-noxh' });
  assert.equal(calls.find(([fn]) => fn === 'fn_portal_app_noxh_sites')[2], undefined);
  noServiceJwt();
});

test('hợp đồng: server đang dùng hồ sơ khác hồ sơ của app (đổi hồ sơ dở dang) → đặt lại hồ sơ cho phiên rồi tải lại', async () => {
  calls.length = 0;
  let serverProfile = 'kh-khac';
  handlers.fn_portal_app_chon_ho_so = (a) => {
    serverProfile = a.p_khach_hang_id;
    return { data: { ok: true } };
  };
  handlers.fn_portal_app_hop_dong = () => ({ khach_hang_id: serverProfile, data: serverProfile === 'kh-1' ? [{ pgc: pgc('p1'), product: null, project: null, status: null, booking: null }] : [] });
  const records = await data.getCustomerRecords(true);
  assert.deepEqual(records.map((r) => r.row.id), ['p1']);
  assert.deepEqual(calls.find(([fn]) => fn === 'fn_portal_app_chon_ho_so')?.[1], { p_token: 'tok-1', p_khach_hang_id: 'kh-1' });
});

test('lịch thanh toán: phiên hết hạn → báo đăng nhập lại (UNAUTHORIZED), không lặng lẽ trả rỗng', async () => {
  handlers.fn_portal_app_hop_dong = () => ({ khach_hang_id: 'kh-1', data: [{ pgc: pgc('p1'), product: null, project: null, status: null, booking: null }] });
  await data.getCustomerRecords(true);
  handlers.fn_portal_app_lich_tt = () => ({ error: 'Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại' });
  await assert.rejects(data.getPgcSchedule('p1', true), (e) => e.code === 'UNAUTHORIZED');
});
