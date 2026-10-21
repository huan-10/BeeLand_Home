import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Badge, Icon, Pressable, Text } from '@/components/ui';
import { installmentBreakdown, installmentDateText, installmentHeadline } from '@/lib/installmentText';
import { installmentStatusMeta } from '@/lib/labels';
import { borderWidth, colors, interactive, opacity, radius, semantic, sizes, spacing, toneColors } from '@/theme';
import type { PaymentInstallmentView } from '@/types';

export interface InstallmentTimelineProps {
  installments: PaymentInstallmentView[];
  /** Đợt mở sẵn bảng kê khi vào màn (đợt cần trả); các đợt khác ẩn. Khách bấm mở/đóng thì giữ theo khách tới khi rời màn. */
  defaultExpandedId?: string | null;
}

/**
 * Lịch thanh toán dạng timeline (theo mockup):
 * xanh lá + dấu tick = đã thanh toán · cam = đến hạn · xám = chưa đến hạn · đỏ = quá hạn.
 * Mỗi đợt có icon trong nút tròn + Badge có chữ và icon, nên không phụ thuộc màu.
 * Bấm số tiền / "Chi tiết" để ẩn hiện bảng kê (tiền căn hộ + phí bảo trì − đã trả = còn phải trả).
 */
export function InstallmentTimeline({ installments, defaultExpandedId }: InstallmentTimelineProps) {
  // Chỉ lưu đợt khách đã bấm; đợt chưa bấm theo mặc định (nên vẫn đúng khi dữ liệu tải xong sau).
  const [toggled, setToggled] = useState<Record<string, boolean>>({});
  return (
    <View role="list" aria-label="Lịch thanh toán">
      {installments.map((item, index) => {
        const meta = installmentStatusMeta[item.status];
        const tone = toneColors[meta.tone];
        const isLast = index === installments.length - 1;
        const isPaid = item.status === 'paid';
        const filled = item.status !== 'scheduled';
        const dateText = installmentDateText(item);
        const headline = installmentHeadline(item);
        const breakdown = installmentBreakdown(item);
        const overdue = item.status === 'overdue';
        const expanded = toggled[item.id] ?? item.id === defaultExpandedId;
        const amountColor = isPaid ? semantic.text : tone.fg;
        return (
          <View key={item.id} style={styles.item} role="listitem">
            <View style={styles.rail}>
              <View
                style={[
                  styles.node,
                  { backgroundColor: filled ? tone.solid : semantic.surface, borderColor: filled ? tone.solid : colors.gray[300] },
                ]}>
                <Icon name={meta.icon} size="sm" color={filled ? tone.onSolid : semantic.textMuted} />
              </View>
              {!isLast ? <View style={[styles.line, isPaid && { backgroundColor: tone.solid }]} /> : null}
            </View>
            <View style={[styles.content, !isLast && styles.contentGap]}>
              <View style={styles.titleRow}>
                <Text variant="bodyStrong" weight="semibold" style={styles.flex}>
                  {item.name}
                </Text>
                <Badge label={meta.label} tone={meta.tone} icon={meta.icon} />
              </View>
              <Pressable
                onPress={() => setToggled((prev) => ({ ...prev, [item.id]: !expanded }))}
                accessibilityRole="button"
                accessibilityState={{ expanded }}
                accessibilityLabel={[item.name, headline.label, headline.amountText, dateText, meta.label].filter(Boolean).join(', ')}
                accessibilityHint={expanded ? 'Ẩn chi tiết số tiền' : 'Xem chi tiết số tiền'}
                style={({ pressed }) => [styles.toggle, interactive, pressed && styles.pressed]}>
                <View style={styles.flex}>
                  {headline.label ? (
                    <Text variant="caption" color={tone.fg}>
                      {headline.label}
                    </Text>
                  ) : null}
                  <Text variant="heading" color={amountColor} numeric>
                    {headline.amountText}
                  </Text>
                </View>
                <View style={styles.toggleHint}>
                  <Text variant="caption" weight="semibold" color={semantic.textBrand}>
                    Chi tiết
                  </Text>
                  <Icon name={expanded ? 'chevronUp' : 'chevronDown'} size="sm" color={semantic.textBrand} />
                </View>
              </Pressable>
              {expanded ? (
                <View style={styles.breakdown}>
                  {breakdown.lines.map((line) => (
                    <BreakdownRow key={line.label} label={line.label} value={line.value} />
                  ))}
                  <View style={styles.divider} />
                  <BreakdownRow label="Tổng đợt" value={breakdown.totalText} strong />
                  {breakdown.paidText ? <BreakdownRow label="Đã trả" value={breakdown.paidText} color={toneColors.success.fg} /> : null}
                  <View style={styles.divider} />
                  <BreakdownRow label="Còn phải trả" value={breakdown.remainingText} color={overdue ? colors.danger[700] : semantic.text} strong />
                </View>
              ) : null}
              <Text variant="caption" color={overdue ? colors.danger[700] : semantic.textMuted}>
                {item.percentOfContract}% giá trị HĐ · {dateText}
              </Text>
              {item.description ? (
                <Text variant="caption" color={semantic.textMuted}>
                  {item.description}
                </Text>
              ) : null}
            </View>
          </View>
        );
      })}
    </View>
  );
}

function BreakdownRow({ label, value, color, strong }: { label: string; value: string; color?: string; strong?: boolean }) {
  return (
    <View style={styles.breakdownRow}>
      <Text variant="caption" weight={strong ? 'semibold' : undefined} color={color ?? (strong ? semantic.text : semantic.textMuted)} style={styles.flex}>
        {label}
      </Text>
      <Text variant="caption" weight={strong ? 'semibold' : undefined} color={color ?? semantic.text} numeric>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  item: { flexDirection: 'row', gap: spacing.ms },
  rail: { alignItems: 'center', width: sizes.timelineNode },
  node: {
    width: sizes.timelineNode,
    height: sizes.timelineNode,
    borderRadius: radius.full,
    borderWidth: borderWidth.strong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  line: { flex: 1, width: borderWidth.strong, backgroundColor: colors.gray[200], marginVertical: spacing.xs },
  content: { flex: 1, minWidth: 0, gap: spacing.xs, paddingTop: spacing.xs },
  contentGap: { paddingBottom: spacing.lg },
  titleRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  flex: { flex: 1, minWidth: 0 },
  toggle: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, minHeight: sizes.touchTarget, borderRadius: radius.md },
  pressed: { opacity: opacity.pressed },
  toggleHint: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  breakdown: { backgroundColor: semantic.surfaceMuted, borderRadius: radius.lg, paddingVertical: spacing.sm, paddingHorizontal: spacing.ms, gap: spacing.xs },
  breakdownRow: { flexDirection: 'row', alignItems: 'baseline', gap: spacing.sm },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: semantic.border },
});
