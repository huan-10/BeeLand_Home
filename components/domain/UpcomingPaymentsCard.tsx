import { StyleSheet, View } from 'react-native';

import { Badge, Card, EmptyState, Icon, ListRow, Pressable, Text } from '@/components/ui';
import { formatCurrency, formatDate, formatDaysLeft } from '@/lib/format';
import { overdueInstallments, overdueSummary } from '@/lib/payment';
import { interactive, opacity, radius, semantic, sizes, spacing, toneColors } from '@/theme';
import type { PaymentInstallmentView } from '@/types';

export interface UpcomingPaymentsCardProps {
  overdue: PaymentInstallmentView[];
  next: PaymentInstallmentView | null;
  /** Số đợt quá hạn hiện (quá hạn lâu nhất trước). */
  limit?: number;
  onOpenItem: (item: PaymentInstallmentView) => void;
  onViewAll: () => void;
}

/**
 * "Thanh toán sắp tới" ở Trang chủ — kiểu "Booking gần đây" của beeland-app_2026: mỗi đợt một thẻ trắng riêng
 * (`ListRow card`): icon tròn · tên đợt · "Căn · HĐ" · "Hạn …" | số tiền + nhãn "Quá hạn n ngày" / "Còn n ngày".
 * Trên cùng: thẻ đỏ nhạt "n đợt quá hạn · tổng" bấm mở Thanh toán. "Xem tất cả" nằm ở tiêu đề khối.
 */
export function UpcomingPaymentsCard({ overdue, next, limit = 3, onOpenItem, onViewAll }: UpcomingPaymentsCardProps) {
  const summary = overdueSummary(overdue);
  const shown = overdueInstallments(overdue).slice(0, limit);

  if (!summary && !next) {
    return (
      <Card>
        <EmptyState icon="checkDouble" title="Không có khoản sắp đến hạn" description="Bạn đã thanh toán đầy đủ các đợt hiện tại." />
      </Card>
    );
  }

  const rows = [...shown.map((i) => ({ item: i, late: true })), ...(next ? [{ item: next, late: false }] : [])];
  return (
    <View style={styles.list}>
      {summary ? (
        <Pressable
          onPress={onViewAll}
          accessibilityRole="button"
          accessibilityLabel={`${summary.count} đợt quá hạn, tổng ${formatCurrency(summary.amount)}. Xem tất cả`}
          style={({ pressed }) => [styles.banner, interactive, pressed && styles.pressed]}>
          <Icon name="warning" size="md" color={toneColors.danger.fg} />
          <Text variant="captionStrong" weight="bold" color={toneColors.danger.fg} style={styles.flex}>
            {summary.count} đợt quá hạn
          </Text>
          <Text variant="captionStrong" weight="bold" color={toneColors.danger.fg} numeric>
            {formatCurrency(summary.amount)}
          </Text>
          <Icon name="chevronRight" size="sm" color={toneColors.danger.fg} />
        </Pressable>
      ) : null}
      {rows.map(({ item, late }) => {
        const days = formatDaysLeft(item.daysUntilDue);
        return (
          <ListRow
            key={item.id}
            card
            icon={late ? 'warning' : 'alarm'}
            tone={late ? 'danger' : 'primary'}
            title={item.name}
            subtitle={`Căn ${item.unitCode} · ${item.contractCode}`}
            footnote={`Hạn ${formatDate(item.dueDate)}`}
            onPress={() => onOpenItem(item)}
            accessibilityLabel={`${late ? '' : 'Đợt tiếp theo, '}${item.name}, căn ${item.unitCode}, ${formatCurrency(item.remainingAmount)}, hạn ${formatDate(item.dueDate)}, ${days}. Mở hợp đồng`}
            aside={
              <>
                <Text variant="captionStrong" weight="bold" numeric color={late ? semantic.text : semantic.textBrand}>
                  {formatCurrency(item.remainingAmount)}
                </Text>
                <Badge label={days} tone={late ? 'danger' : 'primary'} />
              </>
            }
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  list: { gap: spacing.ms },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: sizes.touchTarget,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.ms,
    borderRadius: radius['2xl'],
    backgroundColor: toneColors.danger.bg,
  },
  flex: { flex: 1, minWidth: 0 },
  pressed: { opacity: opacity.pressed },
});
