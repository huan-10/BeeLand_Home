import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { Screen, Section } from '@/components/layout';
import { Button, Card, Icon, IconCircle, Pressable, QuickActions, ScreenHeader, Text, useToast } from '@/components/ui';
import { useHomeModules } from '@/hooks/useHomeModules';
import {
  APP_MODULE_GROUPS,
  APP_MODULES,
  DEFAULT_HOME_MODULES,
  HOME_MODULE_MAX,
  addHomeModule,
  appModule,
  moveHomeModule,
  removeHomeModule,
  type AppModule,
} from '@/lib/appModules';
import { interactive, opacity, radius, semantic, sizes, spacing, toneColors, type IconName } from '@/theme';

/**
 * Tuỳ chỉnh Trang chủ: chọn chức năng hiện trong lưới (1–8) và thứ tự. Lưu ngay mỗi lần đổi, theo tài khoản đăng nhập
 * (trên máy). Đổi thứ tự bằng nút ↑ ↓ (dễ bấm, có tên cho trình đọc màn hình) thay cho kéo thả.
 */
export default function HomeModulesScreen() {
  const toast = useToast();
  const { ids, ready, save } = useHomeModules();
  const back = () => (router.canGoBack() ? router.back() : router.replace('/profile'));
  const selected = ids.map(appModule).filter((m): m is AppModule => !!m);
  const full = ids.length >= HOME_MODULE_MAX;
  const isDefault = ids.join() === DEFAULT_HOME_MODULES.join();

  const reset = () => {
    void save([...DEFAULT_HOME_MODULES]);
    toast.show('Đã khôi phục Trang chủ mặc định', 'success');
  };

  return (
    <Screen>
      <ScreenHeader title="Tuỳ chỉnh Trang chủ" subtitle="Chọn và sắp xếp chức năng hiển thị" onBack={back} />

      <Section title="Xem trước">
        <QuickActions items={selected.map((m) => ({ label: m.short, icon: m.icon, onPress: () => undefined }))} accessibilityLabel="Xem trước lưới chức năng Trang chủ" />
      </Section>

      <Card padding="sm">
        <View style={styles.head}>
          <Text variant="label" color={semantic.textMuted} accessibilityRole="header" style={styles.flex}>
            Đang hiển thị
          </Text>
          <Text variant="captionStrong" color={full ? toneColors.warning.fg : semantic.textSecondary} numeric>
            {ids.length}/{HOME_MODULE_MAX}
          </Text>
        </View>
        {selected.map((m, i) => (
          <View key={m.id} style={[styles.row, i < selected.length - 1 && styles.divider]}>
            <IconCircle name={m.icon} tone="primary" size="sm" />
            <Text variant="bodyStrong" numberOfLines={2} style={styles.flex}>
              {m.label}
            </Text>
            <RowButton icon="arrowUp" label={`Đưa ${m.label} lên`} disabled={!ready || i === 0} onPress={() => void save(moveHomeModule(ids, m.id, -1))} />
            <RowButton icon="arrowDown" label={`Đưa ${m.label} xuống`} disabled={!ready || i === selected.length - 1} onPress={() => void save(moveHomeModule(ids, m.id, 1))} />
            <RowButton icon="minusCircle" danger label={`Bỏ ${m.label} khỏi Trang chủ`} disabled={!ready || ids.length <= 1} onPress={() => void save(removeHomeModule(ids, m.id))} />
          </View>
        ))}
      </Card>

      {APP_MODULE_GROUPS.map((g) => {
        const rest = APP_MODULES.filter((m) => m.group === g.id && !ids.includes(m.id));
        if (rest.length === 0) return null;
        return (
          <Card key={g.id} padding="sm">
            <Text variant="label" color={semantic.textMuted} accessibilityRole="header" style={styles.head}>
              Thêm · {g.title}
            </Text>
            {rest.map((m, i) => (
              <View key={m.id} style={[styles.row, i < rest.length - 1 && styles.divider]}>
                <IconCircle name={m.icon} tone="neutral" size="sm" />
                <Text variant="bodyStrong" numberOfLines={2} style={styles.flex}>
                  {m.label}
                </Text>
                <RowButton icon="plusCircle" label={`Thêm ${m.label} vào Trang chủ`} disabled={!ready || full} onPress={() => void save(addHomeModule(ids, m.id))} />
              </View>
            ))}
          </Card>
        );
      })}

      <Text variant="caption" color={semantic.textMuted} align="center">
        {full ? `Trang chủ hiển thị tối đa ${HOME_MODULE_MAX} chức năng — bỏ bớt để thêm mục khác. ` : ''}
        Thiết lập được lưu trên máy này theo tài khoản đăng nhập.
      </Text>
      {!isDefault ? <Button title="Khôi phục mặc định" variant="ghost" leftIcon="refresh" onPress={reset} /> : null}
    </Screen>
  );
}

function RowButton({ icon, label, disabled, danger, onPress }: { icon: IconName; label: string; disabled?: boolean; danger?: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: !!disabled }}
      style={({ pressed }) => [styles.btn, interactive, pressed && styles.btnPressed, disabled && styles.btnDisabled]}>
      <Icon name={icon} size="md" color={danger ? toneColors.danger.fg : semantic.textBrand} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  head: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingHorizontal: spacing.sm, paddingTop: spacing.xs, paddingBottom: spacing.xs },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingHorizontal: spacing.sm, paddingVertical: spacing.xs, minHeight: sizes.touchTarget },
  divider: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: semantic.border },
  flex: { flex: 1, minWidth: 0 },
  btn: { width: sizes.touchTarget, height: sizes.touchTarget, alignItems: 'center', justifyContent: 'center', borderRadius: radius.full },
  btnPressed: { backgroundColor: semantic.surfaceSunken },
  btnDisabled: { opacity: opacity.disabled },
});
