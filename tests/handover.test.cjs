// Bàn giao căn hộ + lịch bàn giao (lib/handover.ts): trạng thái, ghép lịch đúng khách, chia sắp tới / đã qua. Chạy: npm test
const test = require('node:test');
const assert = require('node:assert/strict');
const { loadModule } = require('./noxh-fixtures.cjs');

const h = loadModule('lib/handover.ts');

test('state quỹ bàn giao → trạng thái app; lạ → chờ bàn giao', () => {
  assert.equal(h.handoverStatusFromState('PENDING'), 'pending');
  assert.equal(h.handoverStatusFromState('NOTIFIED'), 'notified');
  assert.equal(h.handoverStatusFromState('HANDING_OVER'), 'handing_over');
  assert.equal(h.handoverStatusFromState('HANDED_OVER'), 'handed_over');
  assert.equal(h.handoverStatusFromState('PAUSED'), 'paused');
  assert.equal(h.handoverStatusFromState('APPROVED'), 'pending');
  assert.equal(h.handoverStatusFromState(null), 'pending');
});

test('các bước bàn giao: đã xong / đang / chưa; tạm dừng giữ bước đang làm', () => {
  const st = (s) => h.handoverSteps(s).map((x) => x.state).join(',');
  assert.equal(st('pending'), 'current,todo,todo,todo');
  assert.equal(st('notified'), 'done,current,todo,todo');
  assert.equal(st('handing_over'), 'done,done,current,todo');
  assert.equal(st('handed_over'), 'done,done,done,done');
  assert.equal(st('paused'), 'done,done,current,todo');
  assert.deepEqual(h.handoverSteps('pending').map((x) => x.label), ['Chuẩn bị bàn giao', 'Đã thông báo', 'Đang bàn giao', 'Đã nhận nhà']);
});

test('trạng thái lịch theo chữ trên server (bỏ dấu cách / hoa thường)', () => {
  assert.equal(h.scheduleStatusFromText('Đã xác nhận'), 'confirmed');
  assert.equal(h.scheduleStatusFromText(' chờ xác nhận '), 'pending');
  assert.equal(h.scheduleStatusFromText('Đã bàn giao'), 'done');
  assert.equal(h.scheduleStatusFromText('Hoãn lịch'), 'postponed');
  assert.equal(h.scheduleStatusFromText(''), 'pending');
});

test('ngày bàn giao timestamptz → ngày giờ Việt Nam', () => {
  assert.equal(h.vnDate('2026-08-30T06:50:09.864+07:00'), '2026-08-30');
  assert.equal(h.vnDate('2026-08-29T23:30:00Z'), '2026-08-30');
  assert.equal(h.vnDate('2026-10-05'), '2026-10-05');
  assert.equal(h.vnDate(null), '');
});

const row = (o) => ({ id: 'x', so_hdmb: null, ma_sp: null, du_an: null, ten_kh: null, dien_thoai: null, ngay_ban_giao: '2026-10-20T09:00:00+07:00', khung_gio: '08:00 - 10:00', hinh_thuc: 'Bàn giao thô', nhan_vien: 'Lan', trang_thai: 'Đã xác nhận', ghi_chu: '—', ...o });
const owned = { contractCodes: ['HD-A1-1103-2026-0001'], unitCodes: ['A1-1103'], phones: ['0859021385'] };

test('ghép lịch đúng khách: trùng số HĐMB, hoặc trùng mã căn + SĐT; trùng mỗi mã căn thì KHÔNG nhận', () => {
  const rows = [
    row({ id: 'a', so_hdmb: ' hd-a1-1103-2026-0001 ' }),
    row({ id: 'b', ma_sp: 'A1-1103', dien_thoai: '0859 021 385' }),
    row({ id: 'c', ma_sp: 'A1-1103', dien_thoai: '0911111111' }),
    row({ id: 'd', so_hdmb: 'HDMB-2026-1000', dien_thoai: '0859021385' }),
  ];
  assert.deepEqual(h.matchSchedules(rows, owned).map((r) => r.id), ['a', 'b']);
});

test('dòng lịch → kiểu app: ngày VN, ghi chú "—" thành trống, giữ nhãn gốc', () => {
  const s = h.toSchedule(row({ id: 'a', so_hdmb: 'HD-1', ma_sp: 'A1-1103', du_an: 'BRG Smart City', trang_thai: 'Hoãn lịch', ghi_chu: '—' }));
  assert.equal(s.date, '2026-10-20');
  assert.equal(s.status, 'postponed');
  assert.equal(s.statusLabel, 'Hoãn lịch');
  assert.equal(s.note, '');
  assert.equal(s.unitCode, 'A1-1103');
});

test('chia lịch: sắp tới (từ hôm nay, chưa bàn giao, gần trước) / đã qua (mới trước)', () => {
  const mk = (id, date, status) => ({ id, date, status, contractCode: '', unitCode: '', projectName: '', timeSlot: '', method: '', staff: '', statusLabel: '', note: '' });
  const items = [mk('p1', '2026-09-01', 'done'), mk('u2', '2026-10-20', 'confirmed'), mk('u1', '2026-10-05', 'pending'), mk('d1', '2026-10-10', 'done'), mk('p2', '2026-09-20', 'confirmed')];
  const { upcoming, past } = h.splitSchedules(items, '2026-10-05');
  assert.deepEqual(upcoming.map((x) => x.id), ['u1', 'u2']);
  assert.deepEqual(past.map((x) => x.id), ['d1', 'p2', 'p1']);
});

const fund = (o) => ({ id: 'f1', so_qbg: 'QBG-2026-0001', state: 'HANDED_OVER', khach_hang_id: 'kh1', phieu_giu_cho_id: 'pgc1', ky_hieu: 'A1-1103', so_hdmb: 'HD-A1-1103-2026-0001', tu_ngay: '2026-09-28T14:25:05.726+07:00', den_ngay: '2026-10-05T14:25:05.726+07:00', dien_tich_hd: 98.6, dien_tich_bg: 100, pt_tang_giam: 1.4199, pt_tien_do: 100, pt_tien_do_pbt: 100, ghi_chu: null, ...o });
const contract = { id: 'pgc1', code: 'HD-A1-1103-2026-0001', unitCode: 'A1-1103', projectName: 'BRG Smart City', projectImageUrl: 'https://x/y.jpg' };

test('quỹ bàn giao → kiểu app: chỉ nhận dòng của đúng khách + đúng hợp đồng của khách', () => {
  const owned = new Map([['pgc1', contract]]);
  const rows = [fund(), fund({ id: 'f2', khach_hang_id: 'kh2' }), fund({ id: 'f3', phieu_giu_cho_id: 'pgc-khac' })];
  const list = h.ownedHandovers(rows, 'kh1', owned);
  assert.deepEqual(list.map((x) => x.id), ['f1']);
  const x = list[0];
  assert.equal(x.code, 'QBG-2026-0001');
  assert.equal(x.status, 'handed_over');
  assert.equal(x.contractId, 'pgc1');
  assert.equal(x.projectName, 'BRG Smart City');
  assert.equal(x.fromDate, '2026-09-28');
  assert.equal(x.toDate, '2026-10-05');
  assert.equal(x.areaContract, 98.6);
  assert.equal(x.areaDiffPercent, 1.4199);
  assert.equal(x.note, '');
  // % tiến độ trên quỹ là số nhân viên gõ tay (web "% Tiến độ") → KHÔNG dùng; app tính từ lịch thanh toán thật.
  assert.equal(x.paymentPercent, null);
  assert.equal(x.maintenancePercent, null);
});

test('khối ngày của thẻ lịch: ngày, tháng, thứ (không lệch múi giờ)', () => {
  assert.deepEqual(h.scheduleDateParts('2026-10-20'), { day: '20', month: 'Th10', weekday: 'Thứ Ba' });
  assert.deepEqual(h.scheduleDateParts('2026-10-04'), { day: '04', month: 'Th10', weekday: 'Chủ nhật' });
  assert.deepEqual(h.scheduleDateParts(''), { day: '--', month: '', weekday: '' });
});

test('chênh lệch diện tích: dấu + / − và 2 chữ số thập phân kiểu Việt', () => {
  assert.equal(h.formatAreaDiff(1.4199), '+1,42%');
  assert.equal(h.formatAreaDiff(-0.93), '−0,93%');
  assert.equal(h.formatAreaDiff(0), '0%');
  assert.equal(h.formatArea(98.6), '98,6 m²');
});

test('tiến độ thật từ lịch thanh toán: gốc = đã thu / phải thu, PBT riêng; không có PBT → null', () => {
  // Số thật của HD-A1-1103-2026-0001 (fn_contract_payment_schedule 2026-10-05): trả 4.000 đ.
  const rows = [
    { phai_thu: 2561540945.25, da_thu: 4000, phai_thu_pbt: 0, da_thu_pbt: 0 },
    { phai_thu: 3415387927.0, da_thu: 0, phai_thu_pbt: 0, da_thu_pbt: 0 },
    { phai_thu: 1438116129.11, da_thu: 0, phai_thu_pbt: 157345656.48, da_thu_pbt: 0 },
    { phai_thu: 1280770472.63, da_thu: 0, phai_thu_pbt: null, da_thu_pbt: null },
  ];
  const p = h.scheduleProgress(rows);
  assert.ok(p.paymentPercent > 0 && p.paymentPercent < 0.001);
  assert.equal(p.maintenancePercent, 0);
  assert.deepEqual(h.scheduleProgress([{ phai_thu: 100, da_thu: 150, phai_thu_pbt: 0, da_thu_pbt: 0 }]), { paymentPercent: 100, maintenancePercent: null });
  assert.deepEqual(h.scheduleProgress([]), { paymentPercent: null, maintenancePercent: null });
});
