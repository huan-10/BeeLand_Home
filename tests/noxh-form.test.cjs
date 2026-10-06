// Form Thông tin cá nhân NOXH (lib/noxhForm.ts): kiểm lỗi từng ô, ngày dd/MM/yyyy, sao chép địa chỉ. Chạy: npm test
const test = require('node:test');
const assert = require('node:assert/strict');
const { load, snapshot, addr } = require('./noxh-fixtures.cjs');

const f = load('lib/noxhForm.ts');
const TODAY = new Date('2026-10-05T03:00:00Z');

test('thông tin đủ → không lỗi', () => {
  assert.deepEqual(f.validatePersonalInfo(snapshot(), 'lc1', TODAY), {});
});

test('thiếu họ tên, giới tính, loại căn → lỗi đúng ô', () => {
  const errs = f.validatePersonalInfo(snapshot({ ten_kh: '  ', gioi_tinh: '' }), null, TODAY);
  assert.equal(errs.ten_kh, 'Vui lòng nhập họ tên');
  assert.equal(errs.gioi_tinh, 'Vui lòng chọn giới tính');
  assert.equal(errs.loai_can, 'Vui lòng chọn loại căn hộ');
});

test('chưa đủ 18 tuổi / ngày sinh ở tương lai', () => {
  assert.equal(f.validatePersonalInfo(snapshot({ ngay_sinh: '2015-01-01' }), 'lc1', TODAY).ngay_sinh, 'Người đăng ký phải đủ 18 tuổi');
  assert.equal(f.validatePersonalInfo(snapshot({ ngay_sinh: '2008-10-06' }), 'lc1', TODAY).ngay_sinh, 'Người đăng ký phải đủ 18 tuổi');
  assert.equal(f.validatePersonalInfo(snapshot({ ngay_sinh: '2008-10-05' }), 'lc1', TODAY).ngay_sinh, undefined);
  assert.equal(f.validatePersonalInfo(snapshot({ ngay_sinh: null }), 'lc1', TODAY).ngay_sinh, 'Vui lòng nhập ngày sinh');
});

test('email sai dạng; email trống được phép', () => {
  assert.equal(f.validatePersonalInfo(snapshot({ email: 'abc' }), 'lc1', TODAY).email, 'Email không hợp lệ');
  assert.equal(f.validatePersonalInfo(snapshot({ email: '' }), 'lc1', TODAY).email, undefined);
});

test('địa chỉ thường trú thiếu tỉnh / xã / số nhà', () => {
  const errs = f.validatePersonalInfo(snapshot({ thuong_tru: addr({ ma_tinh: '', ten_tinh: '', ma_xa: '', ten_xa: '', dia_chi: '' }) }), 'lc1', TODAY);
  assert.equal(errs.tt_tinh, 'Vui lòng chọn tỉnh/thành phố');
  assert.equal(errs.tt_xa, 'Vui lòng chọn phường/xã');
  assert.equal(errs.tt_dia_chi, 'Vui lòng nhập địa chỉ thường trú');
});

test('địa chỉ hiện tại chỉ bắt buộc khi khác thường trú', () => {
  const s = snapshot({ hien_tai_giong_thuong_tru: false, hien_tai: addr({ ma_xa: '', ten_xa: '' }) });
  assert.equal(f.validatePersonalInfo(s, 'lc1', TODAY).ht_xa, 'Vui lòng chọn phường/xã');
  assert.equal(f.validatePersonalInfo({ ...s, hien_tai_giong_thuong_tru: true }, 'lc1', TODAY).ht_xa, undefined);
});

test('ngày dd/MM/yyyy ↔ yyyy-MM-dd', () => {
  assert.equal(f.toDisplayDate('1990-05-12'), '12/05/1990');
  assert.equal(f.toDisplayDate(null), '');
  assert.equal(f.parseDisplayDate('12/05/1990'), '1990-05-12');
  assert.equal(f.parseDisplayDate('31/02/1990'), null);
  assert.equal(f.parseDisplayDate('12/5/90'), null);
  assert.equal(f.maskDate('12051990'), '12/05/1990');
  assert.equal(f.maskDate('1205'), '12/05');
  assert.equal(f.maskDate('12/05/1990abc'), '12/05/1990');
});

test('copyAddress trả bản sao độc lập', () => {
  const a = addr();
  const b = f.copyAddress(a);
  assert.deepEqual(b, a);
  b.dia_chi = 'khác';
  assert.equal(a.dia_chi, '12 Lê Lợi');
});

// Dữ liệu gửi lên khi lưu / nộp (giống toKhachHangPayload của portal web): máy chủ dựng lại kh_snapshot từ đây,
// nên thiếu khoá nào là mất trường đó (lỗi cũ: lưu bước 2 xoá SĐT, nộp gửi {} → "Thiếu Họ tên").
test('khachHangPayload: đủ trường, bỏ mã KH / CCCD / ảnh, địa chỉ hiện tại rỗng khi giống thường trú', () => {
  const p = f.khachHangPayload(snapshot(), '0900000000');
  assert.equal(p.ten_kh, snapshot().ten_kh);
  assert.equal(p.di_dong, snapshot().di_dong);
  assert.deepEqual(p.thuong_tru, snapshot().thuong_tru);
  assert.equal(p.hien_tai_giong_thuong_tru, true);
  assert.deepEqual(p.hien_tai, { dia_chi: '', ma_xa: '', ten_xa: '', ma_tinh: '', ten_tinh: '' });
  assert.equal('ma_so_kh' in p, false);
  assert.equal('cccd' in p, false);
  assert.equal('anh_url' in p, false);
});

test('khachHangPayload: hồ sơ chưa có SĐT (hoặc SĐT bị che) → lấy SĐT của khách đang đăng nhập', () => {
  assert.equal(f.khachHangPayload(snapshot({ di_dong: '' }), '0859021385').di_dong, '0859021385');
  assert.equal(f.khachHangPayload(snapshot({ di_dong: '0859***385' }), '0859021385').di_dong, '0859021385');
  assert.equal(f.khachHangPayload(snapshot({ di_dong: '' }), undefined).di_dong, undefined);
});

test('khachHangPayload: ngày trống không gửi; địa chỉ hiện tại riêng thì gửi nguyên', () => {
  const ht = addr({ dia_chi: '12 Lê Lợi' });
  const p = f.khachHangPayload(snapshot({ ngay_cap: null, hien_tai_giong_thuong_tru: false, hien_tai: ht }), undefined);
  assert.equal('ngay_cap' in p, false);
  assert.deepEqual(p.hien_tai, ht);
});

test('withAccountPhone: điền SĐT dự phòng để kiểm "còn thiếu" khớp đúng thứ sẽ gửi', () => {
  assert.equal(f.withAccountPhone(snapshot({ di_dong: '' }), '0859021385').di_dong, '0859021385');
  assert.equal(f.withAccountPhone(snapshot(), '0859021385').di_dong, snapshot().di_dong);
});
