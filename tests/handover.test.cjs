// Bàn giao căn hộ + lịch nhận nhà (lib/handover.ts): trạng thái, lịch hẹn bg_lich_hen, khoảng đăng ký, chọn ngày / ca. Chạy: npm test
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

test('ngày bàn giao timestamptz → ngày giờ Việt Nam', () => {
  assert.equal(h.vnDate('2026-08-30T06:50:09.864+07:00'), '2026-08-30');
  assert.equal(h.vnDate('2026-08-29T23:30:00Z'), '2026-08-30');
  assert.equal(h.vnDate('2026-10-05'), '2026-10-05');
  assert.equal(h.vnDate(null), '');
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

/* ---------------- Lịch nhận nhà (bg_lich_hen qua _bg_lich_khach) ---------------- */

const TODAY = '2026-10-16';
const lich = (o) => ({ id: 'l1', ban_giao_id: 'f1', so_qbg: 'QBG-2026-0001', ky_hieu: 'A1-1103', lan: 1, ngay: '2026-10-20', ca: '08:00–10:00', tu_gio: '08:00', den_gio: '10:00', ca_id: 'ca1', dia_diem: 'Sảnh A1', trang_thai: 'DA_XAC_NHAN', trang_thai_ten: 'Đã xác nhận', khach_dang_ky: false, nhan_vien: 'Lan', lien_he: '0901234567', so_tien_can_nop: '12500000', bien_ban: null, ...o });

test('dòng _bg_lich_khach → lịch app: ca, số tiền, biên bản, khách tự đặt', () => {
  const s = h.toSchedule(lich());
  assert.equal(s.id, 'l1');
  assert.equal(s.fundId, 'f1');
  assert.equal(s.unitCode, 'A1-1103');
  assert.equal(s.attempt, 1);
  assert.equal(s.date, '2026-10-20');
  assert.equal(s.shiftId, 'ca1');
  assert.equal(s.timeSlot, '08:00–10:00');
  assert.equal(s.place, 'Sảnh A1');
  assert.equal(s.status, 'DA_XAC_NHAN');
  assert.equal(s.statusLabel, 'Đã xác nhận');
  assert.equal(s.staff, 'Lan');
  assert.equal(s.contact, '0901234567');
  assert.equal(s.amountDue, 12500000);
  assert.equal(s.selfBooked, false);
  assert.equal(s.record, null);
  const done = h.toSchedule(lich({ trang_thai: 'DA_BAN_GIAO', trang_thai_ten: 'Đã bàn giao', so_tien_can_nop: null, khach_dang_ky: true, ca: null, dia_diem: null, ca_id: null, bien_ban: { so_bb: 'BB-0007', ngay_ban_giao: '2026-10-20T09:15:00+07:00' } }));
  assert.equal(done.amountDue, null);
  assert.equal(done.selfBooked, true);
  assert.equal(done.timeSlot, '');
  assert.equal(done.place, '');
  assert.equal(done.shiftId, null);
  assert.deepEqual(done.record, { code: 'BB-0007', date: '2026-10-20' });
});

test('nhãn trạng thái lịch: chờ vàng, xác nhận / đang xanh, đã bàn giao xanh lá, vắng / hoãn đỏ', () => {
  const tone = (k) => h.scheduleStatusMeta[k].tone;
  assert.equal(tone('CHO_XAC_NHAN'), 'warning');
  assert.equal(tone('DA_XAC_NHAN'), 'primary');
  assert.equal(tone('DANG_BAN_GIAO'), 'primary');
  assert.equal(tone('DA_BAN_GIAO'), 'success');
  assert.equal(tone('VANG_MAT'), 'danger');
  assert.equal(tone('HOAN'), 'danger');
  assert.equal(h.scheduleStatusMeta.CHO_XAC_NHAN.label, 'Chờ xác nhận');
});

test('khoảng đăng ký: từ max(hôm nay, từ ngày) đến đến ngày; hết hạn / thiếu ngày → null', () => {
  assert.deepEqual(h.bookingWindow({ fromDate: '2026-10-10', toDate: '2026-10-20' }, TODAY), { from: '2026-10-16', to: '2026-10-20', daysLeft: 5 });
  assert.deepEqual(h.bookingWindow({ fromDate: '2026-11-01', toDate: '2026-11-10' }, TODAY), { from: '2026-11-01', to: '2026-11-10', daysLeft: 26 });
  assert.deepEqual(h.bookingWindow({ fromDate: '2026-10-10', toDate: TODAY }, TODAY), { from: TODAY, to: TODAY, daysLeft: 1 });
  assert.equal(h.bookingWindow({ fromDate: '2026-10-01', toDate: '2026-10-15' }, TODAY), null);
  assert.equal(h.bookingWindow({ fromDate: null, toDate: '2026-10-20' }, TODAY), null);
  assert.equal(h.bookingWindow({ fromDate: '2026-10-10', toDate: null }, TODAY), null);
});

const can = (o) => ({ id: 'f1', code: 'QBG-1', status: 'notified', contractId: 'pgc1', contractCode: 'HD-1', unitCode: 'A1-1103', projectName: 'BRG', fromDate: '2026-10-10', toDate: '2026-10-30', areaContract: null, areaHandover: null, areaDiffPercent: null, paymentPercent: null, maintenancePercent: null, note: '', ...o });
const sch = (o) => h.toSchedule(lich(o));

test('lịch nhận nhà của căn: 7 tình huống', () => {
  const st = (hv, ss) => h.appointmentState(hv, ss, TODAY);
  // Tạm dừng ưu tiên, kể cả còn khoảng / có lịch chờ.
  assert.equal(st(can({ status: 'paused' }), [sch({ trang_thai: 'CHO_XAC_NHAN' })]).kind, 'paused');
  // Đã bàn giao + biên bản.
  const ho = st(can({ status: 'handed_over' }), [sch({ trang_thai: 'DA_BAN_GIAO', bien_ban: { so_bb: 'BB-1', ngay_ban_giao: '2026-10-12' } })]);
  assert.equal(ho.kind, 'handed_over');
  assert.equal(ho.active.record.code, 'BB-1');
  // Lịch hoãn cũ → "lịch trước"; quỹ còn khoảng → được đặt lại.
  const again = st(can({ status: 'pending' }), [sch({ id: 'old', trang_thai: 'HOAN', trang_thai_ten: 'Hoãn', ngay: '2026-10-12' })]);
  assert.equal(again.kind, 'can_book');
  assert.equal(again.active, null);
  assert.deepEqual(again.previous.map((x) => x.id), ['old']);
  assert.deepEqual(again.window, { from: TODAY, to: '2026-10-30', daysLeft: 15 });
  // Chờ xác nhận.
  const p = st(can(), [sch({ id: 'old', trang_thai: 'VANG_MAT', ngay: '2026-10-11', lan: 1 }), sch({ id: 'new', trang_thai: 'CHO_XAC_NHAN', lan: 2, khach_dang_ky: true })]);
  assert.equal(p.kind, 'pending');
  assert.equal(p.active.id, 'new');
  assert.deepEqual(p.previous.map((x) => x.id), ['old']);
  // Đã xác nhận / đang bàn giao.
  assert.equal(st(can(), [sch({ trang_thai: 'DA_XAC_NHAN' })]).kind, 'confirmed');
  assert.equal(st(can({ status: 'handing_over' }), [sch({ trang_thai: 'DANG_BAN_GIAO' })]).kind, 'confirmed');
  // Hết khoảng, chưa có lịch hiệu lực.
  const ex = st(can({ toDate: '2026-10-15' }), [sch({ trang_thai: 'HOAN' })]);
  assert.equal(ex.kind, 'expired');
  assert.equal(ex.window, null);
  // Thiếu khoảng ngày.
  assert.equal(st(can({ fromDate: null, toDate: null }), []).kind, 'no_window');
});

test('danh sách căn: căn đang được chọn lịch lên đầu, còn lại theo thứ tự bàn giao', () => {
  const item = (id, status, kind) => ({ ...can({ id, status, unitCode: id }), appointment: { kind, active: null, window: null, previous: [] } });
  const out = h.sortOverview([item('A', 'handing_over', 'confirmed'), item('B', 'handed_over', 'handed_over'), item('C', 'pending', 'can_book'), item('D', 'notified', 'pending')]);
  assert.deepEqual(out.map((x) => x.id), ['C', 'A', 'D', 'B']);
});

const ca = (id, remaining, o) => ({ id, name: id === 'ca1' ? 'Ca sáng' : 'Ca chiều', from: id === 'ca1' ? '08:00' : '14:00', to: id === 'ca1' ? '10:00' : '16:00', capacity: 5, remaining, ...o });
const slots = { from: TODAY, to: '2026-10-18', days: [
  { date: TODAY, shifts: [ca('ca1', 0), ca('ca2', 0)] },
  { date: '2026-10-17', shifts: [ca('ca1', 0), ca('ca2', 3)] },
  { date: '2026-10-18', shifts: [] },
] };

test('dải ngày: thứ / ngày / tháng, ngày kín không chọn được; ngày đang giữ vẫn chọn được', () => {
  const strip = h.dateStrip(slots);
  assert.deepEqual(strip[0], { date: TODAY, weekday: 'Thứ Sáu', day: '16', month: 'Th10', available: false });
  assert.deepEqual(strip.map((d) => d.available), [false, true, false]);
  assert.deepEqual(h.dateStrip(slots, { date: TODAY, shiftId: 'ca1' }).map((d) => d.available), [true, true, false]);
});

test('ca trong ngày: lịch đang đổi giữ chỗ của chính mình (+1 đúng ca)', () => {
  assert.deepEqual(h.shiftsForDay(slots, TODAY).map((s) => s.remaining), [0, 0]);
  assert.deepEqual(h.shiftsForDay(slots, TODAY, { date: TODAY, shiftId: 'ca1' }).map((s) => s.remaining), [1, 0]);
  assert.deepEqual(h.shiftsForDay(slots, '2026-10-17', { date: TODAY, shiftId: 'ca1' }).map((s) => s.remaining), [0, 3]);
  assert.deepEqual(h.shiftsForDay(slots, '2026-12-01'), []);
});

test('ngày chọn sẵn: ngày còn chỗ gần nhất; đổi lịch → ngày đang giữ; hết chỗ → null', () => {
  assert.equal(h.firstAvailableDate(slots), '2026-10-17');
  assert.equal(h.firstAvailableDate(slots, { date: TODAY, shiftId: 'ca1' }), TODAY);
  assert.equal(h.firstAvailableDate(slots, { date: '2026-09-01', shiftId: 'ca1' }), '2026-10-17');
  assert.equal(h.firstAvailableDate({ from: TODAY, to: TODAY, days: [{ date: TODAY, shifts: [ca('ca1', 0)] }] }), null);
});
