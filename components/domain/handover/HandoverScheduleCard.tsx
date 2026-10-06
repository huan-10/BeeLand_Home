import { StyleSheet, View } from 'react-native';

import { Badge, Card, Icon, Text } from '@/components/ui';
import { formatDate } from '@/lib/format';
import { scheduleDateParts, scheduleStatusMeta } from '@/lib/handover';
import type { HandoverSchedule } from '@/types';
import { radius, semantic, sizes, spacing, toneColors } from '@/theme';

/**
 * Một buổi bàn giao: khối ngày (ngày lớn · tháng · thứ) bên trái, bên phải khung giờ, căn · dự án, hình thức, nhân viên phụ trách,
 * nhãn trạng thái (nhãn gốc của server) và ghi chú. `highlight`: buổi sắp tới gần nhất (khối ngày nền đậm).
 */
export function HandoverScheduleCard({ schedule: s, highlight, onPress }: { schedule: HandoverSchedule; highlight?: boolean; onPress?: () => void }) {
  const meta = scheduleStatusMeta[s.status];
  const parts = scheduleDateParts(s.date);
  const label = s.statusLabel || meta.label;
  const dim = s.status === 'postponed' || s.status === 'done';
  return (
    <Card
      onPress={onPress}
      accessibilityLabel={`${parts.weekday} ${s.date ? formatDate(s.date) : ''}, ${s.timeSlot}, căn ${s.unitCode}, ${s.method}, ${label}`}>
      <View style={styles.row}>
        <View style={[styles.date, highlight ? styles.dateOn : dim ? styles.dateDim : styles.dateIdle]}>
          <Text variant="label" color={highlight ? semantic.textOnAction : semantic.textMuted} style={styles.caps}>
            {parts.month}
          </Text>
          <Text variant="title" numeric color={highlight ? semantic.textOnAction : semantic.text}>
            {parts.day}
          </Text>
          <Text variant="label" color={highlight ? semantic.textOnAction : semantic.textMuted} style={styles.caps} numberOfLines={1}>
            {parts.weekday}
          </Text>
        </View>
        <View style={styles.main}>
          <View style={styles.head}>
            <Text variant="subhead" weight="bold" numeric style={[styles.flex, s.status === 'postponed' && styles.strike]}>
              {s.timeSlot || 'Chưa có khung giờ'}
            </Text>
            <Badge label={label} tone={meta.tone} icon={meta.icon} />
          </View>
          <Line icon="home" text={[`Căn ${s.unitCode}`, s.projectName].filter(Boolean).join(' · ')} />
          {s.method ? <Line icon="key" text={s.method} /> : null}
          {s.staff && s.staff !== '—' ? <Line icon="user" text={`Phụ trách: ${s.staff}`} /> : null}
          {s.note ? (
            <View style={[styles.note, s.status === 'postponed' && styles.noteWarn]}>
              <Text variant="caption" color={s.status === 'postponed' ? toneColors.danger.fg : semantic.textSecondary}>
                {s.note}
              </Text>
            </View>
          ) : null}
        </View>
      </View>
    </Card>
  );
}

function Line({ icon, text }: { icon: 'home' | 'key' | 'user'; text: string }) {
  return (
    <View style={styles.line}>
      <Icon name={icon} size="sm" color={semantic.iconMuted} />
      <Text variant="caption" color={semantic.textSecondary} style={styles.flex}>
        {text}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: spacing.ms },
  date: { width: sizes.scheduleDate, alignSelf: 'flex-start', alignItems: 'center', justifyContent: 'center', paddingVertical: spacing.sm, borderRadius: radius.xl, gap: spacing.xs / 2 },
  dateOn: { backgroundColor: semantic.action },
  dateIdle: { backgroundColor: toneColors.primary.bg },
  dateDim: { backgroundColor: semantic.surfaceMuted },
  caps: { letterSpacing: 0 },
  main: { flex: 1, minWidth: 0, gap: spacing.xs },
  head: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  flex: { flex: 1, minWidth: 0 },
  strike: { textDecorationLine: 'line-through' },
  line: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  note: { marginTop: spacing.xs, padding: spacing.sm, borderRadius: radius.lg, backgroundColor: semantic.surfaceMuted },
  noteWarn: { backgroundColor: toneColors.danger.bg },
});
