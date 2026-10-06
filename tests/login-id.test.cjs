// Ô đăng nhập nhận SĐT hoặc CCCD (lib/validation.ts). Chạy: npm test
const test = require('node:test');
const assert = require('node:assert/strict');
const { load } = require('./noxh-fixtures.cjs');

const v = load('lib/validation.ts');

test('parseLoginId: CCCD 12 số (bỏ khoảng trắng), SĐT 10 số, sai dạng → null', () => {
  assert.deepEqual(v.parseLoginId('001 099 012 345'), { kind: 'cccd', value: '001099012345' });
  assert.deepEqual(v.parseLoginId('0938 111 222'), { kind: 'phone', value: '0938111222' });
  assert.deepEqual(v.parseLoginId('+84938111222'), { kind: 'phone', value: '0938111222' });
  assert.equal(v.parseLoginId('12345'), null);
});

test('validateLoginForm nhận CCCD; sai dạng báo lỗi chung', () => {
  assert.deepEqual(v.validateLoginForm('001099012345', 'x'), {});
  assert.equal(v.validateLoginForm('123', 'x').identifier, 'Nhập số điện thoại 10 số hoặc CCCD 12 số');
  assert.equal(v.validateLoginForm('', 'x').identifier, 'Vui lòng nhập số điện thoại hoặc CCCD');
});
