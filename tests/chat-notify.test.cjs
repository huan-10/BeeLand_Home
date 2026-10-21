// Thông báo tin nhắn (lib/chatNotify.ts): banner từ tin cuối / push, đích khi bấm push, khử trùng. Chạy: npm test
const test = require('node:test');
const assert = require('node:assert/strict');
const { loadModule } = require('./noxh-fixtures.cjs');

const m = loadModule('lib/chatNotify.ts');
const plain = (v) => JSON.parse(JSON.stringify(v));

const msg = (o = {}) => ({
  id: 'm1', from: 'staff', senderName: 'Nguyễn Thu Hà', kind: 'text', text: 'Chào  anh\nchị', attachments: [], recalled: false, ...o,
});

test('chatPreview: chữ gộp khoảng trắng, ảnh, tệp, rỗng, cắt 180', () => {
  assert.equal(m.chatPreview(msg()), 'Chào anh chị');
  assert.equal(m.chatPreview(msg({ kind: 'image', text: null, attachments: [{ name: 'a.jpg' }] })), 'Đã gửi ảnh');
  assert.equal(m.chatPreview(msg({ kind: 'file', text: null, attachments: [{ name: 'HĐ.pdf' }] })), 'Đã gửi tệp: HĐ.pdf');
  assert.equal(m.chatPreview(msg({ kind: 'file', text: null })), 'Đã gửi tệp');
  assert.equal(m.chatPreview(msg({ text: ' ' })), 'Tin nhắn mới');
  assert.equal(m.chatPreview(msg({ text: 'x'.repeat(400) })).length, 180);
});

test('bannerFromMessage: chỉ tin nhân viên chưa thu hồi; tiêu đề = tên công ty', () => {
  assert.deepEqual(plain(m.bannerFromMessage(msg(), 'Công ty BRG')), {
    key: 'm1', title: 'Công ty BRG', body: 'Nguyễn Thu Hà: Chào anh chị', companyId: null, customerId: null,
  });
  assert.equal(m.bannerFromMessage(msg({ senderName: null }), '').title, 'Tin nhắn mới');
  assert.equal(m.bannerFromMessage(msg({ senderName: ' ' }), 'X').body, 'Chủ đầu tư: Chào anh chị');
  assert.equal(m.bannerFromMessage(msg({ from: 'me' }), 'X'), null);
  assert.equal(m.bannerFromMessage(msg({ recalled: true }), 'X'), null);
  assert.equal(m.bannerFromMessage(null, 'X'), null);
});

test('bannerFromPush / chatPushTarget: chỉ push chat', () => {
  const data = { type: 'chat', ma_ctdk: 'c1', customer_id: 'k1', message_id: 'm9' };
  assert.deepEqual(plain(m.bannerFromPush({ title: 'BRG', body: 'Hà: Chào', data })), {
    key: 'm9', title: 'BRG', body: 'Hà: Chào', companyId: 'c1', customerId: 'k1',
  });
  assert.equal(m.bannerFromPush({ title: 'x', data: { type: 'khac', message_id: 'm' } }), null);
  assert.equal(m.bannerFromPush({ title: 'x', data: { type: 'chat' } }), null);
  assert.equal(m.bannerFromPush(undefined), null);
  assert.deepEqual(plain(m.chatPushTarget(data)), { companyId: 'c1', customerId: 'k1' });
  assert.deepEqual(plain(m.chatPushTarget({ type: 'chat' })), { companyId: null, customerId: null });
  assert.equal(m.chatPushTarget({ type: 'x' }), null);
  assert.equal(m.chatPushTarget(null), null);
});

test('needsSwitch: khác công ty / khác hồ sơ mới phải chuyển', () => {
  const active = { companyId: 'c1', customerId: 'k1' };
  assert.equal(m.needsSwitch({ companyId: 'c1', customerId: 'k1' }, active), false);
  assert.equal(m.needsSwitch({ companyId: 'c1', customerId: null }, active), false);
  assert.equal(m.needsSwitch({ companyId: null, customerId: 'k2' }, active), false);
  assert.equal(m.needsSwitch({ companyId: 'c2', customerId: 'k9' }, active), true);
  assert.equal(m.needsSwitch({ companyId: 'c1', customerId: 'k2' }, active), true);
});

test('createSeen: khử trùng + giới hạn', () => {
  const s = m.createSeen(2);
  assert.equal(s.add('a'), true);
  assert.equal(s.add('a'), false);
  s.add('b');
  s.add('c');
  assert.equal(s.add('a'), true);
});
