import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useMemo, useState } from 'react';
import { Image, Linking, Platform, StyleSheet, View } from 'react-native';

import { Icon, Pressable, Text, useToast } from '@/components/ui';
import {
  BANK_APPS,
  LAST_BANK_APP_KEY,
  bankAppLogo,
  bankCodeOf,
  bankDeeplink,
  orderBankApps,
  parseLastBankApp,
  type BankApp,
  type BankTransferInfo,
} from '@/lib/bankApps';
import { borderWidth, opacity, radius, semantic, sizes, spacing } from '@/theme';

interface BankAppsProps {
  /** Y như dữ liệu của mã QR đang hiện (cùng STK định danh, số tiền, nội dung máy chủ sinh) để được gạch nợ tự động. */
  info: BankTransferInfo;
  /** Mã QR hết hạn → hàng logo mờ, không bấm được. */
  disabled?: boolean;
}

/**
 * Hàng logo app ngân hàng dưới mã QR: bấm 1 chạm → mở app đã điền sẵn chuyển khoản (VietQR deeplink, `lib/bankApps.ts`).
 * App dùng lần trước lên đầu (viền màu nút + dấu tick). Chỉ iOS / Android; ngân hàng nhận không nhận ra → ẩn cả hàng.
 */
export function BankApps({ info, disabled = false }: BankAppsProps) {
  const toast = useToast();
  const [lastId, setLastId] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    AsyncStorage.getItem(LAST_BANK_APP_KEY)
      .then((raw) => alive && setLastId(parseLastBankApp(raw)))
      .catch(() => undefined);
    return () => {
      alive = false;
    };
  }, []);

  const apps = useMemo(() => orderBankApps(BANK_APPS, lastId), [lastId]);

  if (Platform.OS === 'web' || !bankCodeOf(info.bankCode)) return null;
  const platform = Platform.OS === 'ios' ? 'ios' : 'android';

  const open = async (app: BankApp) => {
    const link = bankDeeplink(app.appId, info);
    if (!link) return;
    try {
      await Linking.openURL(link);
      setLastId(app.appId);
      const saved = { appId: app.appId, appName: app.appName, appLogo: bankAppLogo(app.appId, platform) };
      void AsyncStorage.setItem(LAST_BANK_APP_KEY, JSON.stringify(saved)).catch(() => undefined);
    } catch {
      toast.show('Không mở được app ngân hàng', 'danger');
    }
  };

  return (
    <View style={[styles.wrap, disabled && styles.disabled]}>
      <Text variant="captionStrong" color={semantic.textSecondary} align="center">
        Mở app ngân hàng để thanh toán
      </Text>
      <View style={styles.row}>
        {apps.map((app) => {
          const last = app.appId === lastId;
          return (
            <Pressable
              key={app.appId}
              disabled={disabled}
              onPress={() => void open(app)}
              accessibilityRole="button"
              accessibilityLabel={`Mở ${app.appName}${last ? ', dùng lần trước' : ''}`}
              accessibilityHint="Mở app ngân hàng với số tài khoản, số tiền và nội dung đã điền sẵn"
              accessibilityState={{ disabled }}
              style={({ pressed }) => [styles.logoBox, last && styles.logoLast, pressed && styles.pressed]}
            >
              <Image source={{ uri: bankAppLogo(app.appId, platform) }} style={styles.logo} resizeMode="cover" />
              {last ? (
                <View style={styles.tick}>
                  <Icon name="check" size="xs" color={semantic.textOnAction} strong />
                </View>
              ) : null}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignSelf: 'stretch', alignItems: 'center', gap: spacing.sm },
  disabled: { opacity: opacity.disabled },
  row: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: spacing.ms },
  logoBox: {
    width: sizes.bankAppLogo,
    height: sizes.bankAppLogo,
    borderRadius: radius.md,
    borderWidth: borderWidth.hairline,
    borderColor: semantic.border,
    backgroundColor: semantic.surface,
  },
  logoLast: { borderWidth: borderWidth.strong, borderColor: semantic.action },
  pressed: { opacity: opacity.pressed },
  logo: { width: '100%', height: '100%', borderRadius: radius.md },
  tick: {
    position: 'absolute',
    top: -spacing.xs,
    right: -spacing.xs,
    width: sizes.icon.sm,
    height: sizes.icon.sm,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: semantic.action,
  },
});
