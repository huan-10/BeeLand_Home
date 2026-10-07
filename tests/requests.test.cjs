// Yêu cầu khách hàng (lib/requests.ts): ánh xạ dữ liệu máy chủ, màu trạng thái, kiểm form, lỗi hàm chưa triển khai. Chạy: npm test
const test = require('node:test');
const assert = require('node:assert/strict');
const { loadModule } = require('./noxh-fixtures.cjs');

const r = loadModule('lib/requests.ts');

test('dòng fn_portal_my_requests → kiểu app (lịch sử mới nhất trước, thiếu trường thì mặc định)', () => {
  const x = r.toCustomerRequest({
    id: 'a', so_phieu: 'YC261006-0001', tieu_de: 'Thấm trần', noi_dung: null, loai: 'Bảo trì', trang_thai: 'Mới', mau: 'green',
    hop_dong: 'HD-A1-1103', created_at: '2026-10-06T08:00:00+07:00', updated_at: null, dinh_kem: ['brg/yeu-cau/kh/1.jpg'],
    lich_su: [{ noi_dung: 'Khách hàng gửi yêu cầu từ web/app', trang_thai: 'Mới', ngay: '2026-10-06T08:00:00+07:00' }, { noi_dung: 'Đang xử lý', trang_thai: 'Đang xử lý', ngay: '2026-10-06T09:00:00+07:00' }],
  });
  assert.equal(x.code, 'YC261006-0001');
  assert.equal(x.content, '');
  assert.equal(x.status, 'Mới');
  assert.deepEqual(x.attachments, ['brg/yeu-cau/kh/1.jpg']);
  assert.deepEqual(x.history.map((h) => h.content), ['Đang xử lý', 'Khách hàng gửi yêu cầu từ web/app']);
  const y = r.toCustomerRequest({ id: 'b', tieu_de: 'X', created_at: '2026-10-06' });
  assert.equal(y.code, '');
  assert.equal(y.status, 'Mới tiếp nhận');
  assert.deepEqual(y.attachments, []);
  assert.deepEqual(y.history, []);
});

test('màu trạng thái web → tone app (theo màu, không có thì theo tên)', () => {
  assert.equal(r.requestStatusTone('Mới', 'green'), 'success');
  assert.equal(r.requestStatusTone('Đang xử lý', 'orange'), 'warning');
  assert.equal(r.requestStatusTone('Khẩn', 'magenta'), 'danger');
  assert.equal(r.requestStatusTone('Mới', 'blue'), 'primary');
  assert.equal(r.requestStatusTone('Đã hoàn thành', null), 'success');
  assert.equal(r.requestStatusTone('Đang xử lý', null), 'warning');
  assert.equal(r.requestStatusTone('Đã huỷ', null), 'neutral');
  assert.equal(r.requestStatusTone('Mới', null), 'primary');
});

test('kiểm form: tiêu đề ≥ 3 ký tự (bỏ khoảng trắng), giới hạn độ dài, tối đa 5 tệp', () => {
  assert.equal(r.validateRequestForm({ title: '  ab ', content: '', files: 0 }).title, 'Vui lòng nhập tiêu đề (ít nhất 3 ký tự)');
  assert.deepEqual(r.validateRequestForm({ title: 'Thấm trần', content: 'x', files: 5 }), {});
  assert.ok(r.validateRequestForm({ title: 'x'.repeat(r.REQUEST_TITLE_MAX + 1), content: '', files: 0 }).title);
  assert.ok(r.validateRequestForm({ title: 'abc', content: 'x'.repeat(r.REQUEST_CONTENT_MAX + 1), files: 0 }).content);
  assert.ok(r.validateRequestForm({ title: 'abc', content: '', files: 6 }).files);
});

test('lỗi hàm / edge chưa triển khai → câu dễ hiểu; lỗi khác giữ nguyên', () => {
  assert.equal(r.requestErrorMessage('Could not find the function public.fn_portal_my_requests(p_token) in the schema cache'), r.REQUEST_NOT_ENABLED);
  assert.equal(r.requestErrorMessage('InvalidWorkerCreation: worker boot error'), r.REQUEST_NOT_ENABLED);
  assert.equal(r.requestErrorMessage('Bạn đã gửi quá nhiều yêu cầu trong hôm nay, vui lòng thử lại sau'), 'Bạn đã gửi quá nhiều yêu cầu trong hôm nay, vui lòng thử lại sau');
});

test('tên tệp đính kèm từ đường dẫn: bỏ thư mục; ảnh hay tài liệu', () => {
  assert.equal(r.attachmentName('brg/yeu-cau/kh/3f2a.jpg'), '3f2a.jpg');
  assert.equal(r.isImagePath('a/b.PNG'), true);
  assert.equal(r.isImagePath('a/b.pdf'), false);
});

test('tên hợp đồng "Số phiếu · Mã căn · Dự án" → mã căn làm tiêu đề, "Dự án · Số phiếu" làm phụ đề', () => {
  assert.deepEqual(r.contractOptionParts('BK-BRGTOWER-2026-0006 · A1-1110 · BRG TOWER'), { title: 'A1-1110', subtitle: 'BRG TOWER · BK-BRGTOWER-2026-0006' });
  // concat_ws bỏ phần trống → 2 phần / 1 phần: giữ thứ tự, không đoán.
  assert.deepEqual(r.contractOptionParts('BK-MUNMJBEN · A1-1608'), { title: 'BK-MUNMJBEN', subtitle: 'A1-1608' });
  assert.deepEqual(r.contractOptionParts('BK-0001'), { title: 'BK-0001', subtitle: '' });
  assert.deepEqual(r.contractOptionParts('  '), { title: 'Hợp đồng', subtitle: '' });
});
