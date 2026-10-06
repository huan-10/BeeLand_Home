import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { useHover } from '@/hooks/useHover';
import { colors, interactive, radius, semantic, shadows, sizes, spacing, type IconName, type Tone } from '@/theme';

import { Icon } from './Icon';
import { IconCircle } from './IconCircle';
import { Pressable } from './Pressable';
import { Text } from './Text';

export interface ListRowProps {
  icon: IconName;
  tone: Tone;
  title: string;
  subtitle?: string;
  /** Mặc định 1 dòng (cắt bớt); nội dung dài như thông báo dùng 2. */
  subtitleLines?: number;
  subtitleColor?: string;
  /** Dòng nhỏ cuối (thời gian…), không chiếm bề ngang của tiêu đề như khối phải. */
  footnote?: string;
  /** Giá trị ngắn cùng hàng tiêu đề, căn phải (số tiền) — dòng phụ bên dưới dùng hết bề ngang. */
  value?: ReactNode;
  /** Khối bên phải chiếm một cột riêng (ít dùng). */
  aside?: ReactNode;
  /** Chưa đọc: chấm xanh cạnh tiêu đề + nền xanh rất nhạt. */
  unread?: boolean;
  /** Kẻ mảnh phía dưới (mọi dòng trừ dòng cuối của thẻ). */
  divider?: boolean;
  /**
   * Mỗi dòng là một thẻ trắng riêng (bo 24, bóng nhẹ) — kiểu "Booking gần đây" (RecentSection) của beeland-app_2026;
   * đặt các dòng trong một `View` có khoảng cách thay vì một `Card`.
   */
  card?: boolean;
  /** Mũi tên phải; mặc định có khi bấm được và không phải kiểu `card`. */
  chevron?: boolean;
  onPress?: () => void;
  accessibilityLabel: string;
}

/**
 * Một dòng trong thẻ danh sách ở Trang chủ (thanh toán, thông báo): icon tròn nhỏ · tiêu đề 1 dòng + dòng phụ ·
 * khối phải · mũi tên. Cả dòng là nút ≥ 44; nhấn / hover nền nhạt. Cùng một kiểu cho mọi danh sách gọn để màn đồng bộ.
 */
export function ListRow({ icon, tone, title, subtitle, subtitleLines = 1, subtitleColor, footnote, value, aside, unread, divider, card, chevron, onPress, accessibilityLabel }: ListRowProps) {
  const showChevron = chevron ?? (!!onPress && !card);
  const { hovered, hoverProps } = useHover();
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityLabel={accessibilityLabel}
      {...hoverProps}
      style={({ pressed }) => [styles.row, card && styles.card, unread && styles.unread, divider && !card && styles.divider, interactive, (pressed || hovered) && !!onPress && styles.active]}>
      <IconCircle name={icon} tone={tone} size={card ? 'lg' : 'sm'} />
      <View style={styles.main}>
        <View style={styles.titleRow}>
          <Text variant="captionStrong" weight="semibold" numberOfLines={1} style={styles.flex}>
            {title}
          </Text>
          {unread ? <View style={styles.dot} /> : null}
          {value}
        </View>
        {subtitle ? (
          <Text variant="caption" color={subtitleColor ?? semantic.textMuted} numberOfLines={subtitleLines}>
            {subtitle}
          </Text>
        ) : null}
        {footnote ? (
          <Text variant="caption" color={semantic.textMuted} numberOfLines={1}>
            {footnote}
          </Text>
        ) : null}
      </View>
      {aside ? <View style={styles.aside}>{aside}</View> : null}
      {showChevron ? <Icon name="chevronRight" size="sm" color={semantic.iconMuted} /> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.ms,
    minHeight: sizes.touchTarget,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.ms,
  },
  card: { borderRadius: radius['2xl'], backgroundColor: semantic.surface, paddingVertical: spacing.md, ...shadows.soft },
  unread: { backgroundColor: colors.primary[50] },
  divider: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: semantic.border },
  active: { backgroundColor: semantic.surfaceSunken },
  main: { flex: 1, minWidth: 0, gap: spacing.xs / 2 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  flex: { flex: 1, minWidth: 0 },
  dot: { width: sizes.dot.md, height: sizes.dot.md, borderRadius: radius.full, backgroundColor: semantic.brand },
  aside: { alignItems: 'flex-end', gap: spacing.xs / 2 },
});
