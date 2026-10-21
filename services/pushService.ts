import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

import { registerChatPush, unregisterChatPush } from './chatService';
import { getCompanyPortalTokens } from './session';

/**
 * Push tin nhắn của chủ đầu tư (docs/chat.md mục Thông báo). Máy chủ: `fn_portal_app_push_dang_ky` / `_huy`
 * (beeland migration 20261013150000_chat_push) + edge `chat-push` gửi qua Expo. Mọi lỗi nuốt im — push là phụ.
 */

type Notif = typeof import('expo-notifications');

const TOKEN_KEY = 'beesky.chatPushToken';
export const CHAT_CHANNEL = 'chat';

let mod: Notif | null | undefined;
/** Module thông báo (null trên web / bản build cũ chưa có native module → chỉ còn banner realtime). */
export function notificationsModule(): Notif | null {
  if (mod !== undefined) return mod;
  if (Platform.OS === 'web') return (mod = null);
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports -- nạp có điều kiện: web / bản build cũ không có native module
    mod = require('expo-notifications') as Notif;
  } catch {
    mod = null;
  }
  return mod;
}

let channelReady = false;
async function ensureChannel(n: Notif) {
  if (channelReady || Platform.OS !== 'android') return;
  await n.setNotificationChannelAsync(CHAT_CHANNEL, {
    name: 'Tin nhắn',
    importance: n.AndroidImportance.HIGH,
    sound: 'default',
    vibrationPattern: [0, 200, 120, 200],
    lockscreenVisibility: n.AndroidNotificationVisibility.PRIVATE,
  });
  channelReady = true;
}

let running: Promise<void> | null = null;
let rerun = false;

async function doRegister(ask: boolean): Promise<void> {
  const n = notificationsModule();
  const tokens = getCompanyPortalTokens();
  if (!n || tokens.length === 0) return;
  let perm = await n.getPermissionsAsync();
  if (!perm.granted && ask && perm.canAskAgain) perm = await n.requestPermissionsAsync();
  if (!perm.granted) return;
  await ensureChannel(n);
  const projectId: string | undefined = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
  const pushToken = (await n.getExpoPushTokenAsync(projectId ? { projectId } : undefined)).data;
  if (!pushToken || getCompanyPortalTokens().length === 0) return;
  await registerChatPush(pushToken, Platform.OS === 'ios' ? 'ios' : 'android', getCompanyPortalTokens());
  await AsyncStorage.setItem(TOKEN_KEY, pushToken);
}

/** Đăng ký máy này cho khách đang đăng nhập (mọi công ty). `ask`: được hỏi quyền nếu khách chưa từng từ chối. */
export function registerPush(ask = true): Promise<void> {
  if (running) {
    // đang đăng ký dở (có thể bằng phiên cũ) → chạy lại một lượt sau khi xong
    rerun = true;
    return running;
  }
  running = doRegister(ask)
    .catch(() => undefined)
    .finally(() => {
      running = null;
      if (rerun) {
        rerun = false;
        void registerPush(false);
      }
    });
  return running;
}

/** Đăng xuất: gỡ máy khỏi push (gọi trước khi xoá phiên). */
export async function unregisterPush(): Promise<void> {
  try {
    const pushToken = await AsyncStorage.getItem(TOKEN_KEY);
    if (!pushToken) return;
    await AsyncStorage.removeItem(TOKEN_KEY);
    await unregisterChatPush(pushToken);
  } catch {
    // bỏ qua: máy chủ tự dọn thiết bị khi phiên hết hạn
  }
}
