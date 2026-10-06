// Logic thuần Nhà ở xã hội (lib/noxh.ts): nhãn trạng thái, các bước hồ sơ, giấy tờ, thời gian bốc thăm, kiểm tệp. Chạy: npm test
const test = require('node:test');
const assert = require('node:assert/strict');
const { load, doc, submitted, detail, row, snapshot, addr } = require('./noxh-fixtures.cjs');

const m = load('lib/noxh.ts');
const states = (steps) => steps.map((s) => s.state);

/* ---------------- Task 2: nhãn, bước, giấy tờ ---------------- */

test('nhãn trạng thái cho khách đúng nguyên văn tài liệu web', () => {
  assert.equal(m.noxhStatusMeta.NHAP.label, 'Chưa nộp');
  assert.equal(m.noxhStatusMeta.DA_GUI_SXD.label, 'Đang chờ Sở Xây dựng');
  assert.equal(m.noxhStatusMeta.SXD_CHAP_THUAN.label, 'Đủ điều kiện tham gia bốc thăm');
  assert.equal(m.noxhStatusMeta.SXD_CHAP_THUAN.tone, 'success');
  assert.equal(m.noxhStatusMeta.CAN_BO_SUNG.tone, 'warning');
  assert.equal(m.docStatusMeta.CHUA_DAT.label, 'Chưa đạt yêu cầu');
  assert.equal(m.docStatusMeta.CHO_THAM_DINH.label, 'Đã nộp');
});

test('missingRequiredDocs bỏ qua giấy tờ không bắt buộc và giấy tờ đã có tệp', () => {
  const missing = doc({ ten: 'Giấy xác nhận thu nhập' });
  const docs = [submitted(), doc({ bat_buoc: false }), missing];
  assert.deepEqual(m.missingRequiredDocs(docs).map((d) => d.id), [missing.id]);
});

test('docProgress đếm trên giấy tờ bắt buộc', () => {
  assert.deepEqual(m.docProgress([submitted(), doc(), doc({ bat_buoc: false, tep_ten: 'x.pdf' })]), { submitted: 1, required: 2 });
});

test('docsNeedingSupplement: giấy tờ chưa đạt và giấy tờ bắt buộc chưa nộp', () => {
  const a = submitted({ trang_thai: 'CHUA_DAT', ly_do: 'Mờ' });
  const b = doc();
  const docs = [a, b, submitted({ trang_thai: 'DAT' }), doc({ bat_buoc: false })];
  assert.deepEqual(m.docsNeedingSupplement(docs).map((d) => d.id), [a.id, b.id]);
});

test('applicationSteps: nháp, thông tin đủ, thiếu 1 giấy tờ bắt buộc', () => {
  const d = detail({ giay_to: [submitted(), doc()] });
  assert.deepEqual(states(m.applicationSteps(d)), ['done', 'current', 'todo', 'todo']);
  assert.deepEqual(m.applicationSteps(d).map((s) => s.key), ['thong_tin', 'giay_to', 'xac_minh', 'du_dieu_kien']);
});

test('applicationSteps: thiếu thông tin cá nhân → giấy tờ chưa tới', () => {
  const d = detail({ kh_snapshot: snapshot({ ngay_sinh: null }), giay_to: [doc()] });
  assert.deepEqual(states(m.applicationSteps(d)), ['current', 'todo', 'todo', 'todo']);
});

test('applicationSteps: đang thẩm định → bước xác minh đang làm', () => {
  assert.deepEqual(states(m.applicationSteps(detail({ trang_thai: 'DANG_THAM_DINH' }))), ['done', 'done', 'current', 'todo']);
});

test('applicationSteps: Sở XD chấp thuận → xong cả 4 bước', () => {
  assert.deepEqual(states(m.applicationSteps(detail({ trang_thai: 'SXD_CHAP_THUAN' }))), ['done', 'done', 'done', 'done']);
});

test('personalInfoMissing liệt kê nhãn ô còn thiếu theo thứ tự form', () => {
  const s = snapshot({ thuong_tru: addr({ ma_xa: '', ten_xa: '' }) });
  assert.deepEqual(m.personalInfoMissing(s, null), ['Phường/Xã', 'Loại căn hộ']);
  assert.deepEqual(m.personalInfoMissing(snapshot(), 'lc1'), []);
});

test('latestReason lấy lý do của lần đổi trạng thái mới nhất', () => {
  const d = detail({
    lich_su: [
      { thoi_diem: '2026-10-03T08:00:00Z', tu_trang_thai: 'DANG_THAM_DINH', den_trang_thai: 'CAN_BO_SUNG', ly_do: 'Ảnh CCCD mờ' },
      { thoi_diem: '2026-10-01T08:00:00Z', tu_trang_thai: null, den_trang_thai: 'MOI_TIEP_NHAN', ly_do: null },
    ],
  });
  assert.equal(m.latestReason(d), 'Ảnh CCCD mờ');
  assert.equal(m.latestReason(detail()), null);
});

test('isActiveApplication: nháp / không đạt / rút không còn hiệu lực', () => {
  assert.equal(m.isActiveApplication('DANG_THAM_DINH'), true);
  assert.equal(m.isActiveApplication('NHAP'), false);
  assert.equal(m.isActiveApplication('KHONG_DAT'), false);
  assert.equal(m.isActiveApplication('RUT_HO_SO'), false);
});

test('applicationFilter theo 4 nhóm lọc', () => {
  assert.equal(m.applicationFilter(row({ trang_thai: 'CAN_BO_SUNG' }), 'supplement'), true);
  assert.equal(m.applicationFilter(row({ trang_thai: 'KHONG_DAT' }), 'processing'), false);
  assert.equal(m.applicationFilter(row({ trang_thai: 'KHONG_DAT' }), 'done'), true);
  assert.equal(m.applicationFilter(row({ trang_thai: 'SXD_CHAP_THUAN' }), 'done'), true);
  assert.equal(m.applicationFilter(row({ trang_thai: 'NHAP' }), 'processing'), true);
  assert.equal(m.applicationFilter(row({ trang_thai: 'RUT_HO_SO' }), 'all'), true);
});

/* ---------------- Task 3: thời gian, tệp, liên kết ---------------- */

const T = (iso) => Date.parse(iso);
const lot = (o = {}) => ({
  bt_ho_so_id: 'bt1', bt_id: 'b1', company_id: 'c1', so_ho_so: 'NOXH-2026-000002', ma_dot: 'BT-2026-001', ten: 'Bốc thăm đợt 1',
  mo_ta: null, ten_du_an: 'Dự án E', tu_ngay: '2026-10-05T10:00:00+07:00', den_ngay: '2026-10-05T12:00:00+07:00',
  trang_thai: 'DANG_MO', thu_tu_phien: 1, ten_nhom: 'Công nhân', ten_loai_can: '2PN', hash_ho_so: null, hash_can: null,
  hash_bi_mat: null, da_quay: false, ...o,
});

test('roundStatus: biên đúng mili-giây mở / đóng; chưa công bố', () => {
  const r = { tu_ngay: '2026-10-05T08:00:00+07:00', den_ngay: '2026-10-20T17:00:00+07:00' };
  assert.equal(m.roundStatus(r, T(r.tu_ngay)), 'DANG_MO');
  assert.equal(m.roundStatus(r, T(r.tu_ngay) - 1), 'SAP_MO');
  assert.equal(m.roundStatus(r, T(r.den_ngay) + 1), 'DA_DONG');
  assert.equal(m.roundStatus({ ...r, cong_bo: false }, T(r.tu_ngay)), 'CHUA_CONG_BO');
});

test('roundDaysLeft làm tròn lên, không âm', () => {
  const r = { tu_ngay: '2026-10-01T00:00:00+07:00', den_ngay: '2026-10-05T12:00:00+07:00' };
  assert.equal(m.roundDaysLeft(r, T('2026-10-04T13:00:00+07:00')), 1);
  assert.equal(m.roundDaysLeft(r, T('2026-10-06T00:00:00+07:00')), 0);
});

test('lotteryPhase theo giờ máy chủ: máy nhanh 3 phút vẫn "Sắp diễn ra"', () => {
  const clientNow = T('2026-10-05T10:03:00+07:00');
  const off = m.serverClockOffset('2026-10-05T10:00:00+07:00', clientNow);
  assert.equal(off, -180000);
  assert.equal(m.lotteryPhase(lot({ tu_ngay: '2026-10-05T10:01:00+07:00', trang_thai: 'DA_KHOA' }), clientNow + off), 'upcoming');
});

test('lotteryPhase: trong khung giờ là "open" kể cả đợt còn DA_KHOA; đã quay; công bố; hết giờ', () => {
  const inWindow = T('2026-10-05T10:00:00+07:00');
  assert.equal(m.lotteryPhase(lot({ trang_thai: 'DA_KHOA' }), inWindow), 'open');
  assert.equal(m.lotteryPhase(lot({ da_quay: true }), inWindow), 'spun');
  assert.equal(m.lotteryPhase(lot({ trang_thai: 'DA_CONG_BO', da_quay: true }), inWindow), 'published');
  assert.equal(m.lotteryPhase(lot(), T('2026-10-05T12:00:00+07:00')), 'ended');
});

test('formatCountdown', () => {
  assert.equal(m.formatCountdown(90061000), '1 ngày 01:01:01');
  assert.equal(m.formatCountdown(3723000), '01:02:03');
  assert.equal(m.formatCountdown(-5), '00:00:00');
});

test('processTimeline: 5 chặng; chặng bốc thăm theo boc_tham', () => {
  const now = T('2026-10-05T10:30:00+07:00');
  const base = { bt_ho_so_id: 'bt1', ma_dot: 'BT-2026-001', ten: 'Đợt 1', tu_ngay: '2026-10-05T10:00:00+07:00', den_ngay: '2026-10-05T12:00:00+07:00', server_now: '2026-10-05T10:30:00+07:00' };
  const won = m.processTimeline(detail({ trang_thai: 'SXD_CHAP_THUAN', boc_tham: { ...base, trang_thai: 'DANG_MO', da_quay: true, ket_qua: 'TRUNG', can: { ky_hieu: 'A-1205' } } }), now);
  assert.deepEqual(won.map((s) => s.key), ['nop', 'kiem_tra', 'xac_minh', 'sxd', 'boc_tham']);
  assert.equal(won[4].detail, 'Trúng căn A-1205');
  assert.equal(won[4].state, 'done');
  const lost = m.processTimeline(detail({ trang_thai: 'SXD_CHAP_THUAN', boc_tham: { ...base, trang_thai: 'DA_CONG_BO', da_quay: true, ket_qua: 'CHUA_TRUNG', thu_tu_du_phong: 3 } }), now);
  assert.equal(lost[4].detail, 'Chưa trúng · dự phòng số 3');
  const open = m.processTimeline(detail({ trang_thai: 'SXD_CHAP_THUAN', boc_tham: { ...base, trang_thai: 'DANG_MO', da_quay: false } }), now);
  assert.equal(open[4].detail, 'Đang mở — vào bốc thăm ngay');
  assert.equal(open[4].state, 'current');
  const soon = m.processTimeline(detail({ trang_thai: 'SXD_CHAP_THUAN', boc_tham: { ...base, trang_thai: 'DA_KHOA', da_quay: false } }), T('2026-10-05T09:00:00+07:00'));
  assert.equal(soon[4].detail, 'Lịch bốc thăm: 10:00 05/10/2026');
  const waiting = m.processTimeline(detail({ trang_thai: 'SXD_CHAP_THUAN' }), now);
  assert.equal(waiting[4].detail, 'Chờ lịch bốc thăm');
  assert.equal(waiting[3].state, 'done');
  const checking = m.processTimeline(detail({ trang_thai: 'DANG_THAM_DINH' }), now);
  assert.deepEqual(checking.map((s) => s.state), ['done', 'current', 'todo', 'todo', 'todo']);
  assert.equal(checking[4].detail, 'Chưa cập nhật');
  const draft = m.processTimeline(detail({ trang_thai: 'NHAP' }), now);
  assert.equal(draft[0].state, 'current');
});

test('pickFeaturedApplication: bỏ hồ sơ không đạt khi còn hồ sơ khác; cần bổ sung ưu tiên nhất', () => {
  const a = row({ id: 'a', trang_thai: 'KHONG_DAT', updated_at: '2026-10-05T00:00:00Z' });
  const b = row({ id: 'b', trang_thai: 'DANG_THAM_DINH', updated_at: '2026-09-01T00:00:00Z' });
  assert.equal(m.pickFeaturedApplication([a, b]).id, 'b');
  const c = row({ id: 'c', trang_thai: 'CAN_BO_SUNG', updated_at: '2026-08-01T00:00:00Z' });
  assert.equal(m.pickFeaturedApplication([a, b, c]).id, 'c');
  assert.equal(m.pickFeaturedApplication([a]).id, 'a');
  assert.equal(m.pickFeaturedApplication([]), null);
});

test('noxhAttention: lượt đang mở > sắp mở trong 24 giờ > hồ sơ cần bổ sung', () => {
  const now = T('2026-10-05T10:30:00+07:00');
  const sup = row({ id: 'hs1', so_ho_so: 'NOXH-2026-000001', trang_thai: 'CAN_BO_SUNG' });
  const att = m.noxhAttention([sup], [lot()], now);
  assert.equal(att.kind, 'lottery_open');
  assert.equal(att.href, '/noxh/boc-tham/bt1');
  const soon = lot({ trang_thai: 'DA_KHOA', tu_ngay: '2026-10-06T08:00:00+07:00', den_ngay: '2026-10-06T10:00:00+07:00' });
  assert.equal(m.noxhAttention([sup], [soon], now).kind, 'lottery_soon');
  const far = lot({ trang_thai: 'DA_KHOA', tu_ngay: '2026-10-08T08:00:00+07:00', den_ngay: '2026-10-08T10:00:00+07:00' });
  const s = m.noxhAttention([sup], [far], now);
  assert.equal(s.kind, 'supplement');
  assert.equal(s.href, '/noxh/ho-so/hs1');
  assert.equal(m.noxhAttention([], [far], now), null);
});

test('validateNoxhFile: .JPG/.jpeg nhận như jpg; MIME rỗng chỉ kiểm đuôi', () => {
  assert.deepEqual(m.validateNoxhFile({ name: 'a.JPG', size: 1e6, type: 'image/jpeg' }, ['jpg'], 5), { ok: true, ext: 'jpg' });
  assert.deepEqual(m.validateNoxhFile({ name: 'scan.jpeg', size: 1e6, type: '' }, ['jpg', 'pdf'], 5), { ok: true, ext: 'jpg' });
});

test('validateNoxhFile: chặn HEIC kèm hướng dẫn', () => {
  const r = m.validateNoxhFile({ name: 'IMG_1.heic', size: 1e6, type: 'image/heic' }, ['jpg', 'png'], 5);
  assert.equal(r.ok, false);
  assert.match(r.message, /^Ảnh HEIC chưa được hỗ trợ/);
});

test('validateNoxhFile: tên không đuôi, MIME lệch, quá dung lượng', () => {
  assert.deepEqual(m.validateNoxhFile({ name: 'scan', size: 10 }, ['pdf', 'jpg'], 5), { ok: false, message: 'Chỉ nhận tệp PDF, JPG' });
  assert.deepEqual(m.validateNoxhFile({ name: 'a.pdf', size: 10, type: 'image/png' }, ['pdf'], 5), { ok: false, message: 'Chỉ nhận tệp PDF' });
  assert.deepEqual(m.validateNoxhFile({ name: 'a.pdf', size: 6 * 1024 * 1024, type: 'application/pdf' }, ['pdf'], 5), { ok: false, message: 'Tệp vượt quá 5 MB' });
});

test('formatFileHint', () => {
  assert.equal(m.formatFileHint(['pdf', 'jpg', 'png'], 5), 'PDF, JPG, PNG · tối đa 5 MB');
});

test('noxhLinkToHref chỉ dẫn vào trong /noxh', () => {
  assert.equal(m.noxhLinkToHref('boc-tham/abc-123'), '/noxh/boc-tham/abc-123');
  assert.equal(m.noxhLinkToHref('boc-tham'), '/noxh/boc-tham');
  assert.equal(m.noxhLinkToHref('ho-so/hs-9'), '/noxh/ho-so/hs-9');
  assert.equal(m.noxhLinkToHref('../x'), '/noxh');
  assert.equal(m.noxhLinkToHref('boc-tham/'), '/noxh');
  assert.equal(m.noxhLinkToHref('https://evil.example/boc-tham/1'), '/noxh');
  assert.equal(m.noxhLinkToHref(null), '/noxh');
});

test('CCCD: chuẩn hoá và kiểm 12 số', () => {
  assert.equal(m.normalizeCccd('001 099.012-345'), '001099012345');
  assert.equal(m.isValidCccd('001099012345'), true);
  assert.equal(m.isValidCccd('00109901234'), false);
});

test('isNoxhSessionExpired nhận cả phong bì { error } và Error', () => {
  assert.equal(m.isNoxhSessionExpired({ error: 'PHIEN_HET_HAN' }), true);
  assert.equal(m.isNoxhSessionExpired(new Error('PHIEN_HET_HAN')), true);
  assert.equal(m.isNoxhSessionExpired({ error: 'Không tìm thấy hồ sơ' }), false);
  assert.equal(m.isNoxhSessionExpired(null), false);
});


/* ---------------- Task 5: chặng hiện tại cho thẻ trạng thái ---------------- */

test('stageProgress: chặng đang ở trong 5 chặng Nộp · Kiểm tra · Xác minh · Sở XD · Bốc thăm', () => {
  assert.deepEqual(m.stageProgress('NHAP', false), { done: 0, current: 'Nộp hồ sơ', step: 1, total: 5 });
  assert.deepEqual(m.stageProgress('CAN_BO_SUNG', false), { done: 1, current: 'Chủ đầu tư kiểm tra', step: 2, total: 5 });
  assert.deepEqual(m.stageProgress('DA_GUI_SXD', false), { done: 3, current: 'Sở Xây dựng chấp thuận', step: 4, total: 5 });
  assert.deepEqual(m.stageProgress('SXD_CHAP_THUAN', false), { done: 4, current: 'Tham gia bốc thăm', step: 5, total: 5 });
  assert.deepEqual(m.stageProgress('SXD_CHAP_THUAN', true), { done: 5, current: 'Hoàn tất bốc thăm', step: 5, total: 5 });
  assert.equal(m.stageProgress('KHONG_DAT', false), null);
});

/* ---------------- Task 6: trang NOXH ---------------- */

test('pickLotteryHighlight: lượt đang mở chưa quay, sau đó lượt sắp diễn ra gần nhất; đã quay/công bố thì bỏ', () => {
  const now = T('2026-10-05T10:30:00+07:00');
  const open = lot({ bt_ho_so_id: 'open' });
  const soon = lot({ bt_ho_so_id: 'soon', trang_thai: 'DA_KHOA', tu_ngay: '2026-10-06T08:00:00+07:00', den_ngay: '2026-10-06T10:00:00+07:00' });
  const later = lot({ bt_ho_so_id: 'later', trang_thai: 'DA_KHOA', tu_ngay: '2026-10-09T08:00:00+07:00', den_ngay: '2026-10-09T10:00:00+07:00' });
  assert.equal(m.pickLotteryHighlight([later, soon, open], now).bt_ho_so_id, 'open');
  assert.equal(m.pickLotteryHighlight([later, soon, lot({ da_quay: true })], now).bt_ho_so_id, 'soon');
  assert.equal(m.pickLotteryHighlight([lot({ trang_thai: 'DA_CONG_BO', da_quay: true })], now), null);
});

test('applicationNote: dòng việc cần làm trên thẻ trạng thái', () => {
  assert.equal(m.applicationNote(row({ trang_thai: 'CAN_BO_SUNG', so_can_bo_sung: 2 })), 'Cần bổ sung 2 giấy tờ');
  assert.equal(m.applicationNote(row({ trang_thai: 'NHAP', so_da_nop: 3, so_giay_to: 8 })), 'Hồ sơ chưa nộp · đã tải 3/8 giấy tờ');
  assert.equal(m.applicationNote(row({ trang_thai: 'DANG_THAM_DINH' })), null);
});

test('upcomingRounds: chỉ đợt Đang mở và Sắp mở', () => {
  const rs = [{ id: 'a', tinh_trang: 'DA_DONG' }, { id: 'b', tinh_trang: 'DANG_MO' }, { id: 'c', tinh_trang: 'SAP_MO' }];
  assert.deepEqual(m.upcomingRounds(rs).map((r) => r.id), ['b', 'c']);
});

test('nhãn tình trạng đợt và giai đoạn bốc thăm', () => {
  assert.deepEqual(m.roundStatusMeta.DANG_MO, { label: 'Đang mở', tone: 'success' });
  assert.deepEqual(m.roundStatusMeta.SAP_MO, { label: 'Sắp mở', tone: 'primary' });
  assert.equal(m.lotteryPhaseMeta.upcoming.label, 'Sắp diễn ra');
  assert.equal(m.lotteryPhaseMeta.ended.label, 'Đã hết giờ, chờ công bố');
  assert.equal(m.lotteryPhaseMeta.published.label, 'Đã công bố');
});

/* ---------------- Task 10: tên tệp ảnh sau khi chọn ---------------- */

test('normalizePickedName: ảnh iPhone đã chuyển JPEG nhưng tên còn .HEIC → đổi đuôi .jpg', () => {
  assert.equal(m.normalizePickedName('IMG_0001.HEIC', 'image/jpeg'), 'IMG_0001.jpg');
  assert.equal(m.normalizePickedName('scan.png', 'image/png'), 'scan.png');
  assert.equal(m.normalizePickedName('a.JPEG', 'image/jpeg'), 'a.JPEG');
  assert.equal(m.normalizePickedName('noext', 'image/png'), 'noext.png');
  assert.equal(m.normalizePickedName('doc.pdf', null), 'doc.pdf');
  assert.equal(m.normalizePickedName('IMG_2.heic', 'image/heic'), 'IMG_2.heic');
});

test('formatFileSize', () => {
  assert.equal(m.formatFileSize(820000), '801 KB');
  assert.equal(m.formatFileSize(2.5 * 1024 * 1024), '2,5 MB');
  assert.equal(m.formatFileSize(500), '1 KB');
  assert.equal(m.formatFileSize(null), '');
});

test('isDocOverdue: hạn đã qua (giờ VN) và chưa hợp lệ', () => {
  const now = T('2026-10-05T10:00:00+07:00');
  assert.equal(m.isDocOverdue(doc({ han_nop: '2026-10-04' }), now), true);
  assert.equal(m.isDocOverdue(doc({ han_nop: '2026-10-05' }), now), false);
  assert.equal(m.isDocOverdue(doc({ han_nop: '2026-10-04', trang_thai: 'DAT' }), now), false);
  assert.equal(m.isDocOverdue(doc({ han_nop: null }), now), false);
});

test('nearestDueDate: hạn gần nhất trong các giấy tờ cần bổ sung', () => {
  const docs = [submitted({ trang_thai: 'CHUA_DAT', han_nop: '2026-10-12' }), doc({ han_nop: '2026-10-09' }), submitted({ trang_thai: 'DAT', han_nop: '2026-10-01' })];
  assert.equal(m.nearestDueDate(docs), '2026-10-09');
  assert.equal(m.nearestDueDate([submitted({ trang_thai: 'DAT' })]), null);
});

/* ---------------- Task 12: kết quả công bố ---------------- */

test('filterPublishedRows: khớp một phần số hồ sơ, không phân biệt hoa thường / khoảng trắng', () => {
  const rows = ['NOXH-2026-000207', 'NOXH-2026-000214', 'NOXH-2025-000388'].map((so_ho_so) => ({ so_ho_so, thu_tu_phien: 1, ket_qua: 'TRUNG', ky_hieu: 'B-0301', thu_tu_du_phong: null }));
  assert.deepEqual(m.filterPublishedRows(rows, ' noxh-2026 ').map((r) => r.so_ho_so), ['NOXH-2026-000207', 'NOXH-2026-000214']);
  assert.deepEqual(m.filterPublishedRows(rows, '214').map((r) => r.so_ho_so), ['NOXH-2026-000214']);
  assert.equal(m.filterPublishedRows(rows, '').length, 3);
});

test('paginate: 20 dòng mỗi trang, trang vượt quá thì về trang cuối', () => {
  const rows = Array.from({ length: 45 }, (_, i) => i);
  assert.equal(m.paginate(rows, 3).items.length, 5);
  assert.equal(m.paginate(rows, 3).pages, 3);
  assert.deepEqual(m.paginate(rows, 1).items.slice(0, 2), [0, 1]);
  assert.equal(m.paginate(rows, 9).page, 3);
  assert.deepEqual(m.paginate([], 1), { items: [], pages: 1, page: 1 });
});

/* ---------------- Task 13: thông báo NOXH ---------------- */

test('noxhToAppNotification: id có tiền tố, loại, link trong app, đã đọc', () => {
  const n = m.noxhToAppNotification({
    id: 'tb-1', company_id: 'c', loai: 'LICH_BOC_THAM', tieu_de: 'Lịch bốc thăm', noi_dung: null, link: 'boc-tham/bt-1', da_doc_luc: null, created_at: '2026-10-04T00:00:00Z',
  });
  assert.deepEqual(n, { id: 'noxh:tb-1', type: 'noxh_lottery', title: 'Lịch bốc thăm', message: '', createdAt: '2026-10-04T00:00:00Z', read: false, link: '/noxh/boc-tham/bt-1' });
  assert.equal(m.noxhToAppNotification({ id: 'x', company_id: 'c', loai: 'KET_QUA_BOC_THAM', tieu_de: '', noi_dung: 'a', link: null, da_doc_luc: '2026-10-04', created_at: '' }).type, 'noxh_result');
  assert.equal(m.noxhToAppNotification({ id: 'x', company_id: 'c', loai: 'HUY_BOC_THAM', tieu_de: '', noi_dung: 'a', link: '../x', da_doc_luc: '2026-10-04', created_at: '' }).link, '/noxh');
  assert.equal(m.noxhNotificationId('noxh:tb-1'), 'tb-1');
  assert.equal(m.noxhNotificationId('pay-1'), null);
});

/* ---------------- Final review: đổi giai đoạn đúng giây ---------------- */

test('nextBoundaryMs: số ms tới mốc đổi giai đoạn kế tiếp (mở / đóng), đã quay hoặc hết giờ → null', () => {
  const before = T('2026-10-05T09:59:58+07:00');
  assert.equal(m.nextBoundaryMs(lot({ trang_thai: 'DA_KHOA' }), before), 2000);
  assert.equal(m.nextBoundaryMs(lot(), T('2026-10-05T11:59:59+07:00')), 1000);
  assert.equal(m.nextBoundaryMs(lot({ da_quay: true }), before), null);
  assert.equal(m.nextBoundaryMs(lot(), T('2026-10-05T12:00:00+07:00')), null);
});

test('isMissingCccdError nhận thông điệp máy chủ khi tài khoản chưa có CCCD', () => {
  assert.equal(m.isMissingCccdError('Tài khoản chưa có CCCD, vui lòng liên hệ chủ đầu tư để cập nhật trước khi nộp hồ sơ online'), true);
  assert.equal(m.isMissingCccdError('Chưa nộp giấy tờ bắt buộc: Đơn'), false);
});
