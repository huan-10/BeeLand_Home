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

test('bàn giao: fn_portal_app_ban_giao → quỹ của khách; lịch rỗng không lỗi', async () => {
  calls.length = 0;
  handlers.fn_portal_app_ban_giao = () => ({
    data: {
      quy: [{ id: 'f1', so_qbg: 'QBG-1', state: 'DANG_BAN_GIAO', khach_hang_id: 'kh-1', phieu_giu_cho_id: 'p1', ky_hieu: 'A-101', so_hdmb: null, tu_ngay: null, den_ngay: null, dien_tich_hd: 70, dien_tich_bg: 70, pt_tang_giam: 0, pt_tien_do: 50, pt_tien_do_pbt: 0, ghi_chu: null }],
      lich: [],
      sdt: ['0901234567'],
    },
  });
  const items = await handover.fetchHandovers();
  assert.equal(items.length, 1);
  assert.deepEqual(await handover.fetchHandoverSchedules(), []);
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
