// Nhắn tin với chủ đầu tư (lib/chat.ts): đổi dữ liệu máy chủ, gộp tin, dòng hiển thị, trạng thái, kiểm nội dung. Chạy: npm test
const test = require('node:test');
const assert = require('node:assert/strict');
const { loadModule } = require('./noxh-fixtures.cjs');

const m = loadModule('lib/chat.ts');

const raw = (o = {}) => ({
  id: 'm1',
  sender_type: 'employee',
  sender_ten: 'Nguyễn Thu Hà',
  sender_anh: null,
  loai: 'text',
  noi_dung: 'Chào anh/chị',
  attachments: [],
  recalled_at: null,
  edited_at: null,
  created_at: '2026-10-12T03:00:00.000Z',
  ...o,
});
const msg = (o = {}) => ({ ...m.toChatMessage(raw()), ...o });

test('toChatMessage: khách / nhân viên, tệp, thu hồi, form_request', () => {
  const staff = m.toChatMessage(raw());
  assert.equal(staff.from, 'staff');
  assert.equal(staff.senderName, 'Nguyễn Thu Hà');
  assert.equal(staff.status, 'sent');
  const me = m.toChatMessage(raw({ sender_type: 'contact', sender_ten: 'x', client_msg_id: 'c1' }));
  assert.equal(me.from, 'me');
  assert.equal(me.senderName, null);
  assert.equal(me.clientId, 'c1');
  const img = m.toChatMessage(raw({ loai: 'image', attachments: [{ id: 'a1', ten_tep: 'a.png', mime: 'image/png', kich_thuoc: 10, rong: 400, cao: 300 }, { bad: 1 }] }));
  assert.equal(img.kind, 'image');
  assert.equal(img.attachments.length, 1);
  assert.equal(img.attachments[0].width, 400);
  assert.equal(m.toChatMessage(raw({ recalled_at: '2026-10-12T03:01:00Z', noi_dung: null })).recalled, true);
  assert.equal(m.toChatMessage(raw({ loai: 'form_request' })).kind, 'form_request');
  assert.equal(m.toChatMessage(raw({ loai: 'lạ' })).kind, 'text');
});

test('mergeMessages: thay tin tạm theo clientId, bỏ trùng id, sắp theo thời gian', () => {
  const local = msg({ id: 'local-c1', clientId: 'c1', from: 'me', status: 'sending', createdAt: '2026-10-12T03:05:00.000Z' });
  const older = msg({ id: 'm0', createdAt: '2026-10-12T02:00:00.000Z' });
  let list = m.mergeMessages([older], [local]);
  assert.deepEqual(list.map((x) => x.id), ['m0', 'local-c1']);
  const server = msg({ id: 'm9', clientId: 'c1', from: 'me', status: 'sent', createdAt: '2026-10-12T03:05:01.000Z' });
  list = m.mergeMessages(list, [server]);
  assert.deepEqual(list.map((x) => x.id), ['m0', 'm9']);
  list = m.mergeMessages(list, [msg({ id: 'm0', text: 'đã sửa', createdAt: '2026-10-12T02:00:00.000Z' })]);
  assert.equal(list.length, 2);
  assert.equal(list[0].text, 'đã sửa');
  assert.equal(m.latestServerTime([...list, local]), '2026-10-12T03:05:01.000Z');
  assert.equal(m.latestServerTime([local]), null);
});

test('chatDayLabel: hôm nay / hôm qua / thứ, ngày', () => {
  const now = new Date(2026, 9, 12, 15, 0);
  assert.equal(m.chatDayLabel(new Date(2026, 9, 12, 8, 0).toISOString(), now), 'Hôm nay');
  assert.equal(m.chatDayLabel(new Date(2026, 9, 11, 23, 0).toISOString(), now), 'Hôm qua');
  assert.equal(m.chatDayLabel(new Date(2026, 9, 5, 9, 0).toISOString(), now), 'Thứ Hai, 05/10/2026');
});

test('chatRows: vạch ngày, cụm tin, giờ cuối cụm, trạng thái tin cuối của khách', () => {
  const now = new Date(2026, 9, 12, 15, 0);
  const at = (h, min) => new Date(2026, 9, 12, h, min).toISOString();
  const list = [
    msg({ id: 's1', createdAt: at(9, 0) }),
    msg({ id: 's2', createdAt: at(9, 2) }),
    msg({ id: 'k1', from: 'me', senderName: null, createdAt: at(9, 3) }),
    msg({ id: 'k2', from: 'me', senderName: null, createdAt: at(9, 20) }),
  ];
  const rows = m.chatRows(list, at(9, 10), now);
  assert.equal(rows[0].type, 'day');
  assert.equal(rows[0].label, 'Hôm nay');
  const byId = Object.fromEntries(rows.filter((r) => r.type === 'message').map((r) => [r.message.id, r]));
  assert.equal(byId.s1.first, true);
  assert.equal(byId.s1.last, false);
  assert.equal(byId.s1.footer, null);
  assert.equal(byId.s2.last, true);
  assert.equal(byId.s2.footer, '09:02');
  // k1 → k2 cách 17 phút: hai cụm; chỉ tin cuối của khách có trạng thái; nhân viên đọc tới 9:10 → k2 chưa xem.
  assert.equal(byId.k1.footer, '09:03');
  assert.equal(byId.k2.first, true);
  assert.equal(byId.k2.footer, '09:20 · Đã gửi');
  const seen = m.chatRows(list, at(9, 30), now).find((r) => r.type === 'message' && r.message.id === 'k2');
  assert.equal(seen.footer, '09:20 · Đã xem');
  const failed = m.chatRows([...list, msg({ id: 'local-x', from: 'me', senderName: null, status: 'failed', createdAt: at(9, 21) })], null, now);
  assert.equal(failed.at(-1).footer, 'Chưa gửi được');
});

test('chatTextError / chatUnreadLabel / newClientId', () => {
  assert.equal(m.chatTextError('   ', 0), 'Nhập nội dung tin nhắn');
  assert.equal(m.chatTextError('', 1), null);
  assert.equal(m.chatTextError('x'.repeat(4001), 0), 'Tin nhắn tối đa 4000 ký tự');
  assert.equal(m.chatTextError('ok', 6), 'Tối đa 5 tệp mỗi lần gửi');
  assert.equal(m.chatUnreadLabel(0), 'Nhắn tin với chủ đầu tư');
  assert.equal(m.chatUnreadLabel(3), 'Nhắn tin với chủ đầu tư, 3 tin nhắn chưa đọc');
  assert.equal(m.chatUnreadLabel(99), 'Nhắn tin với chủ đầu tư, hơn 99 tin nhắn chưa đọc');
  const id = m.newClientId();
  assert.match(id, /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
  assert.notEqual(id, m.newClientId());
});

test('toChatMessage: trích dẫn tin được trả lời (nhân viên trả lời tin của khách / của nhân viên)', () => {
  const q = m.toChatMessage(raw({ reply_to: { id: 'r1', sender_type: 'contact', sender_ten: null, noi_dung: 'Cho hỏi giá' } }));
  assert.deepEqual(q.replyTo, { senderName: 'Bạn', text: 'Cho hỏi giá' });
  const q2 = m.toChatMessage(raw({ reply_to: { id: 'r2', sender_type: 'employee', sender_ten: 'Lan', noi_dung: null } }));
  assert.deepEqual(q2.replyTo, { senderName: 'Lan', text: null });
  assert.equal(m.toChatMessage(raw()).replyTo, null);
});
