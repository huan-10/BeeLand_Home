import { Linking, StyleSheet, View } from 'react-native';

import { Badge, Button, Icon, IconCircle, Text } from '@/components/ui';
import { formatCurrency, formatDate } from '@/lib/format';
import { dayMonth, scheduleDateParts, scheduleStatusMeta } from '@/lib/handover';
import type { AppointmentView, HandoverSchedule } from '@/types';
import { radius, semantic, sizes, spacing, toneColors, type IconName } from '@/theme';

import { NoxhAlert } from '../noxh/NoxhAlert';

export interface HandoverAppointmentProps {
  view: AppointmentView;
  /** Hotline chủ đầu tư (có thể trống). */
  hotline: string;
  onBook: () => void;
  onReschedule: (s: HandoverSchedule) => void;
  onCancel: (s: HandoverSchedule) => void;
}

const call = (phone: string) => void Linking.openURL(`tel:${phone.replace(/[^\d+]/g, '')}`);

/**
 * Khối "Lịch nhận nhà" trên thẻ căn (dưới 4 bước) — `appointmentState` quyết định tình huống:
 * chưa có khoảng · được chọn lịch · chờ xác nhận · đã xác nhận · đã nhận nhà · quá hạn đăng ký (tạm dừng: thẻ đã có cảnh báo riêng).
 */
export function HandoverAppointment({ view, hotline, onBook, onReschedule, onCancel }: HandoverAppointmentProps) {
  const { kind, active, window } = view;
  const prev = view.previous[0];
  if (kind === 'paused') return null;

  return (
    <View style={styles.wrap}>
      {kind === 'no_window' ? (
        <View style={[styles.box, styles.muted]}>
          <Icon name="calendar" size="md" color={semantic.iconMuted} />
          <Text variant="caption" color={semantic.textSecondary} style={styles.flex}>
            Chủ đầu tư sẽ thông báo thời gian bàn giao cho căn hộ của bạn.
          </Text>
        </View>
      ) : null}

      {kind === 'can_book' && window ? (
        <View style={[styles.box, styles.invite]}>
          <View style={styles.inviteHead}>
            <IconCircle name="calendarCheck" tone="primary" size="md" />
            <View style={styles.flex}>
              <Text variant="bodyStrong" weight="semibold" numeric>
                Nhận nhà từ {dayMonth(window.from)} – {dayMonth(window.to)}
              </Text>
              <Text variant="caption" color={semantic.textSecondary}>
                Còn {window.daysLeft} ngày để chọn lịch nhận nhà
              </Text>
            </View>
          </View>
          <Button title="Chọn lịch nhận nhà" leftIcon="calendarCheck" fullWidth onPress={onBook} />
        </View>
      ) : null}

      {(kind === 'pending' || kind === 'confirmed') && active ? (
        <ActiveSchedule schedule={active} hotline={hotline} onReschedule={onReschedule} onCancel={onCancel} />
      ) : null}

      {kind === 'handed_over' ? (
        <View style={[styles.box, { backgroundColor: toneColors.success.bg }]}>
          <Icon name="checkCircle" size="md" color={toneColors.success.fg} />
          <Text variant="captionStrong" weight="semibold" color={toneColors.success.fg} style={styles.flex}>
            {active?.record
              ? `Đã ký biên bản ${active.record.code}${active.record.date ? ` ngày ${formatDate(active.record.date)}` : ''}`
              : 'Bạn đã nhận nhà'}
          </Text>
        </View>
      ) : null}

      {kind === 'expired' ? (
        <NoxhAlert tone="warning" icon="warning" title="Đã qua thời gian đăng ký" message="Vui lòng liên hệ chủ đầu tư để được sắp xếp lịch nhận nhà.">
          {hotline ? <Button title={`Gọi ${hotline}`} variant="secondary" size="sm" leftIcon="phone" onPress={() => call(hotline)} /> : null}
        </NoxhAlert>
      ) : null}

      {prev ? (
        <Text variant="caption" color={semantic.textMuted} numeric>
          Lịch trước: {dayMonth(prev.date)} · {prev.statusLabel}
        </Text>
      ) : null}
    </View>
  );
}

function ActiveSchedule({
  schedule: s,
  hotline,
  onReschedule,
  onCancel,
}: {
  schedule: HandoverSchedule;
  hotline: string;
  onReschedule: (s: HandoverSchedule) => void;
  onCancel: (s: HandoverSchedule) => void;
}) {
  const meta = scheduleStatusMeta[s.status];
  const parts = scheduleDateParts(s.date);
  const pending = s.status === 'CHO_XAC_NHAN';
  const phone = s.contact || hotline;
  return (
    <View style={[styles.box, styles.card]} accessible={false}>
      <View style={styles.row}>
        <View style={[styles.date, pending ? styles.dateIdle : styles.dateOn]} accessible accessibilityLabel={`${parts.weekday} ${formatDate(s.date)}`}>
          <Text variant="label" color={pending ? semantic.textMuted : semantic.textOnAction}>
            {parts.month}
          </Text>
          <Text variant="title" numeric color={pending ? semantic.text : semantic.textOnAction}>
            {parts.day}
          </Text>
          <Text variant="label" color={pending ? semantic.textMuted : semantic.textOnAction} numberOfLines={1}>
            {parts.weekday}
          </Text>
        </View>
        <View style={styles.main}>
          <View style={styles.badge}>
            <Badge label={s.statusLabel || meta.label} tone={meta.tone} icon={meta.icon} />
          </View>
          <Text variant="subhead" weight="bold" numeric>
            {s.timeSlot ? s.timeSlot.replace('–', ' – ') : 'Chưa có khung giờ'}
          </Text>
          {pending ? (
            <Text variant="caption" color={semantic.textSecondary}>
              Chủ đầu tư sẽ xác nhận và báo địa điểm nhận nhà.
            </Text>
          ) : null}
          {s.place ? <Line icon="mapPin" text={s.place} /> : null}
          {s.staff ? <Line icon="user" text={`Phụ trách: ${s.staff}`} /> : null}
        </View>
      </View>

      {s.amountDue !== null && s.amountDue > 0 ? (
        <View style={[styles.due, { backgroundColor: toneColors.warning.bg }]}>
          <Icon name="cash" size="sm" color={toneColors.warning.fg} />
          <Text variant="caption" color={toneColors.warning.fg} style={styles.flex} numeric>
            Cần thanh toán trước buổi nhận: <Text variant="captionStrong" weight="bold" color={toneColors.warning.fg} numeric>{formatCurrency(s.amountDue)}</Text>
          </Text>
        </View>
      ) : null}

      {pending && s.selfBooked ? (
        <View style={styles.actions}>
          <View style={styles.flex}>
            <Button title="Đổi lịch" variant="secondary" leftIcon="calendar" fullWidth onPress={() => onReschedule(s)} />
          </View>
          <View style={styles.flex}>
            <Button title="Huỷ lịch" variant="danger" leftIcon="closeCircle" fullWidth onPress={() => onCancel(s)} />
          </View>
        </View>
      ) : phone ? (
        <Button title={`Cần đổi lịch? Gọi ${phone}`} variant="outline" leftIcon="phone" fullWidth onPress={() => call(phone)} />
      ) : null}
    </View>
  );
}

function Line({ icon, text }: { icon: IconName; text: string }) {
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
  wrap: { gap: spacing.sm },
  box: { flexDirection: 'row', alignItems: 'center', gap: spacing.ms, padding: spacing.md, borderRadius: radius.xl },
  muted: { backgroundColor: semantic.surfaceMuted },
  invite: { flexDirection: 'column', alignItems: 'stretch', backgroundColor: toneColors.primary.bg },
  inviteHead: { flexDirection: 'row', alignItems: 'center', gap: spacing.ms },
  card: { flexDirection: 'column', alignItems: 'stretch', backgroundColor: semantic.surfaceMuted },
  row: { flexDirection: 'row', gap: spacing.ms },
  date: { width: sizes.scheduleDate, alignSelf: 'flex-start', alignItems: 'center', justifyContent: 'center', paddingVertical: spacing.sm, borderRadius: radius.xl, gap: spacing.xs / 2 },
  dateOn: { backgroundColor: semantic.action },
  dateIdle: { backgroundColor: semantic.surface },
  main: { flex: 1, minWidth: 0, gap: spacing.xs },
  badge: { flexDirection: 'row' },
  flex: { flex: 1, minWidth: 0 },
  line: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  due: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, padding: spacing.sm, borderRadius: radius.lg },
  actions: { flexDirection: 'row', gap: spacing.sm },
});
