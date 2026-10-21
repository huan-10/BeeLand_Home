/** Hội thoại mẫu "Nhắn tin với chủ đầu tư" (dạng `_chat_v_msg_json` của máy chủ) — chỉ services/ được đọc. */
export const mockChatStaffName = 'Nguyễn Thu Hà';

export const mockChatRows: Record<string, unknown>[] = [
  {
    id: 'mock-chat-1',
    sender_type: 'contact',
    sender_ten: null,
    loai: 'text',
    noi_dung: 'Chào chủ đầu tư, cho tôi hỏi khi nào đến hạn đợt thanh toán tiếp theo?',
    attachments: [],
    created_at: '2026-10-11T02:15:00.000Z',
    client_msg_id: 'mock-client-1',
  },
  {
    id: 'mock-chat-2',
    sender_type: 'employee',
    sender_ten: mockChatStaffName,
    loai: 'text',
    noi_dung: 'Dạ chào anh/chị. Đợt 3 của căn hộ đến hạn ngày 25/10/2026, anh/chị xem chi tiết ở mục Thanh toán ạ.',
    attachments: [],
    reply_to: { id: 'mock-chat-1', sender_type: 'contact', sender_ten: null, noi_dung: 'Chào chủ đầu tư, cho tôi hỏi khi nào đến hạn đợt thanh toán tiếp theo?' },
    created_at: '2026-10-11T02:18:00.000Z',
  },
  {
    id: 'mock-chat-3',
    sender_type: 'employee',
    sender_ten: mockChatStaffName,
    loai: 'text',
    noi_dung: 'Anh/chị cần hỗ trợ thêm gì cứ nhắn tại đây nhé.',
    attachments: [],
    created_at: '2026-10-11T02:18:30.000Z',
  },
];

/** Câu trả lời tự động của bản xem thử sau khi khách gửi tin. */
export const mockChatAutoReply = 'Dạ, chúng tôi đã nhận được tin nhắn và sẽ phản hồi anh/chị trong thời gian sớm nhất ạ.';
