import { usePathname, useRouter } from 'expo-router';
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { AppState, Pressable, StyleSheet, View } from 'react-native';
import Animated, { FadeInUp, FadeOutUp, ReduceMotion } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon, IconCircle, Text, useToast } from '@/components/ui';
import { useAuth } from '@/contexts/AuthContext';
import { bannerFromMessage, bannerFromPush, chatPushTarget, createSeen, needsSwitch, type ChatBanner } from '@/lib/chatNotify';
import { getChatThread, subscribeChat } from '@/services/chatService';
import { notificationsModule, registerPush } from '@/services/pushService';
import { interactive, layout, motion, radius, semantic, shadows, sizes, spacing, zIndex } from '@/theme';

/** Banner hiện trong 4,5 s rồi tự ẩn. */
const SHOW_MS = 4500;
const CHAT_PATH = '/tin-nhan';

const seen = createSeen();

type Target = { companyId: string | null; customerId: string | null };

/**
 * Thông báo tin nhắn của chủ đầu tư (gắn ở app/_layout.tsx, chỉ khi đã đăng nhập):
 * - đang mở app: banner trên cùng khi nhân viên trả lời — từ realtime `chatv:` của công ty đang xem (tải tin cuối) và từ
 *   push nhận lúc đang mở (ẩn thông báo hệ thống, khử trùng theo id tin); không hiện khi đang ở màn Nhắn tin của công ty đó;
 * - bấm banner / bấm push (kể cả mở app từ push) → chuyển đúng công ty / hồ sơ nếu cần rồi mở màn Nhắn tin;
 * - đăng nhập / đổi công ty / quay lại app → đăng ký push cho mọi công ty trong phiên.
 */
export function ChatNotifier() {
  const { status, activeCompanyId, activeCustomerId, companies, selectCompany } = useAuth();
  const authed = status === 'authenticated';
  const router = useRouter();
  const pathname = usePathname();
  const toast = useToast();
  const insets = useSafeAreaInsets();
  const [banner, setBanner] = useState<ChatBanner | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pending = useRef<Target | null>(null);

  const companyName = companies.find((c) => c.companyId === activeCompanyId)?.companyName ?? null;
  // Trạng thái mới nhất cho callback realtime / push (đăng ký một lần).
  const state = useRef({ authed, pathname, companyName, active: { companyId: activeCompanyId, customerId: activeCustomerId } as Target });
  useLayoutEffect(() => {
    state.current = { authed, pathname, companyName, active: { companyId: activeCompanyId, customerId: activeCustomerId } };
  }, [authed, pathname, companyName, activeCompanyId, activeCustomerId]);

  const hide = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
    setBanner(null);
  }, []);

  const show = useCallback(
    (b: ChatBanner | null) => {
      const st = state.current;
      if (!b || !st.authed || !seen.add(b.key) || AppState.currentState !== 'active') return;
      const forActive = !needsSwitch(b, st.active);
      if (forActive && st.pathname === CHAT_PATH) return;
      if (timer.current) clearTimeout(timer.current);
      setBanner(b);
      timer.current = setTimeout(hide, SHOW_MS);
    },
    [hide],
  );

  const open = useCallback(
    async (target: Target | null) => {
      if (!state.current.authed) {
        // mở app từ push khi phiên chưa khôi phục xong → mở sau khi đăng nhập
        pending.current = target ?? { companyId: null, customerId: null };
        return;
      }
      if (target && needsSwitch(target, state.current.active) && target.companyId) {
        try {
          await selectCompany(target.companyId, target.customerId ?? undefined);
        } catch (e) {
          toast.show(e instanceof Error ? e.message : 'Không chuyển được công ty', 'danger');
          return;
        }
      }
      router.push(CHAT_PATH);
    },
    [router, selectCompany, toast],
  );

  // Phiên sẵn sàng → mở hội thoại đang chờ (bấm push lúc app tắt hẳn).
  useEffect(() => {
    if (!authed || !pending.current) return;
    const t = pending.current;
    pending.current = null;
    void open(t.companyId ? t : null);
  }, [authed, open]);

  // Đăng ký push khi đăng nhập / đổi công ty / thêm công ty; quay lại app → làm mới (không hỏi quyền lại).
  useEffect(() => {
    if (authed) void registerPush();
  }, [authed, activeCompanyId, activeCustomerId, companies.length]);
  useEffect(() => {
    const sub = AppState.addEventListener('change', (s) => {
      if (s === 'active' && state.current.authed) void registerPush(false);
    });
    return () => sub.remove();
  }, []);

  // Push: đang mở app → banner của app; bấm push → mở màn Nhắn tin.
  useEffect(() => {
    const n = notificationsModule();
    if (!n) return;
    try {
      n.setNotificationHandler({
        handleNotification: async (notif) => {
          const b = bannerFromPush(notif.request.content);
          if (b) {
            show(b);
            return { shouldShowBanner: false, shouldShowList: false, shouldPlaySound: false, shouldSetBadge: false };
          }
          return { shouldShowBanner: true, shouldShowList: true, shouldPlaySound: true, shouldSetBadge: false };
        },
      });
      const sub = n.addNotificationResponseReceivedListener((r) => {
        const t = chatPushTarget(r.notification.request.content.data);
        if (t) void open(t);
      });
      const last = n.getLastNotificationResponse();
      if (last) {
        n.clearLastNotificationResponse();
        const t = chatPushTarget(last.notification.request.content.data);
        if (t) void open(t);
      }
      return () => sub.remove();
    } catch {
      // module thông báo không dùng được → chỉ còn banner realtime
    }
  }, [open, show]);

  // Realtime của công ty đang xem: nhân viên trả lời → tải tin cuối → banner.
  useEffect(() => {
    if (!authed) return;
    let closed = false;
    let ch: { close: () => void } | null = null;
    getChatThread({ limit: 1 })
      .then((t) => {
        const last = t.messages[t.messages.length - 1];
        if (last) seen.add(last.id); // tin đã có trước lúc mở app không báo
        if (closed || !t.channelKey) return;
        ch = subscribeChat(
          t.channelKey,
          (sig) => {
            if (sig !== 'new') return;
            getChatThread({ limit: 1 })
              .then((x) => show(bannerFromMessage(x.messages[x.messages.length - 1], state.current.companyName)))
              .catch(() => undefined);
          },
          () => undefined,
        );
      })
      .catch(() => undefined);
    return () => {
      closed = true;
      ch?.close();
    };
  }, [authed, activeCompanyId, activeCustomerId, show]);

  if (!banner) return null;
  const target: Target = { companyId: banner.companyId, customerId: banner.customerId };
  return (
    <View pointerEvents="box-none" style={[styles.host, { top: insets.top + spacing.sm }]}>
      <Animated.View
        key={banner.key}
        entering={FadeInUp.duration(motion.base).reduceMotion(ReduceMotion.System)}
        exiting={FadeOutUp.duration(motion.fast).reduceMotion(ReduceMotion.System)}
        style={[styles.card, shadows.overlay]}
        accessibilityLiveRegion="polite">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Tin nhắn mới: ${banner.title}. ${banner.body}. Mở màn Nhắn tin`}
          onPress={() => {
            hide();
            void open(target.companyId ? target : null);
          }}
          style={[styles.main, interactive]}>
          <IconCircle name="chat" size="md" />
          <View style={styles.text}>
            <Text variant="subhead" numberOfLines={1}>
              {banner.title}
            </Text>
            <Text variant="caption" color={semantic.textSecondary} numberOfLines={2}>
              {banner.body}
            </Text>
          </View>
        </Pressable>
        <Pressable accessibilityRole="button" accessibilityLabel="Đóng thông báo" hitSlop={spacing.ms} onPress={hide} style={interactive}>
          <Icon name="close" size="sm" color={semantic.iconMuted} />
        </Pressable>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  host: { position: 'absolute', left: layout.gutterMobile, right: layout.gutterMobile, alignItems: 'center', zIndex: zIndex.toast },
  card: {
    width: '100%',
    maxWidth: sizes.toastMaxWidth,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.ms,
    paddingVertical: spacing.ms,
    paddingHorizontal: spacing.md,
    borderRadius: radius.xl,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: semantic.borderSubtle,
    backgroundColor: semantic.surface,
  },
  main: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: spacing.ms },
  text: { flex: 1, gap: spacing.xs },
});
