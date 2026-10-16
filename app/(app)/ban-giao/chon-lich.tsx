import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useRef, useState } from 'react';
import { Linking, StyleSheet, View } from 'react-native';

import { DateStrip, ShiftOption } from '@/components/domain';
import { NoxhAlert } from '@/components/domain/noxh/NoxhAlert';
import { Screen, Section, StickyActionBar } from '@/components/layout';
import { Button, Card, EmptyState, ErrorState, ScreenHeader, Skeleton, SkeletonList, Text, useToast } from '@/components/ui';
import { useHandoverOverview, useHandoverSlots } from '@/hooks/useHandover';
import { dateStrip, dayMonth, firstAvailableDate, scheduleDateParts, shiftsForDay, type HeldSlot } from '@/lib/handover';
import { bookHandover, rescheduleHandover } from '@/services';
import { getErrorMessage } from '@/services/errors';
import { semantic, sizes, spacing } from '@/theme';

const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) || undefined;

/**
 * Chọn lịch nhận nhà (spec 2026-10-16 §6.3): dải ngày trong khoảng bàn giao → ca còn chỗ → xác nhận.
 * `?id=<quỹ>` đăng ký mới; thêm `&lich=<lịch>&ngay=&ca=` là đổi lịch khách đã đặt (chỗ đang giữ được tính là còn).
 */
export default function HandoverBookingScreen() {
  const params = useLocalSearchParams<{ id?: string; lich?: string; ngay?: string; ca?: string }>();
  const fundId = one(params.id);
  const scheduleId = one(params.lich);
  const keep: HeldSlot | undefined = useMemo(() => {
    const date = one(params.ngay);
    const shiftId = one(params.ca);
    return scheduleId && date && shiftId ? { date, shiftId } : undefined;
  }, [scheduleId, params.ngay, params.ca]);

  const toast = useToast();
  const overview = useHandoverOverview();
  const slots = useHandoverSlots(fundId);
  const unit = overview.data?.items.find((x) => x.id === fundId);
  const hotline = overview.data?.hotline ?? '';

  // Lựa chọn của khách; chưa chọn → mặc định (đổi lịch: ngày + ca đang giữ; mới: ngày còn chỗ gần nhất). Tải lại vẫn giữ lựa chọn.
  const [picked, setPicked] = useState<{ date: string; shiftId: string | null } | null>(null);
  const [sending, setSending] = useState(false);
  const sendingRef = useRef(false);
  const defaultDate = slots.data ? firstAvailableDate(slots.data, keep) : null;
  const date = picked?.date ?? defaultDate;
  const shiftId = picked ? picked.shiftId : keep && defaultDate === keep.date ? keep.shiftId : null;

  const back = () => (router.canGoBack() ? router.back() : router.replace('/ban-giao'));
  const strip = slots.data ? dateStrip(slots.data, keep) : [];
  const shifts = slots.data && date ? shiftsForDay(slots.data, date, keep) : [];
  const shift = shifts.find((s) => s.id === shiftId && s.remaining > 0);
  const unchanged = !!keep && keep.date === date && keep.shiftId === shiftId;
  const noRoom = !!slots.data && !strip.some((d) => d.available);

  const pickDate = (d: string) => {
    if (d !== date) setPicked({ date: d, shiftId: keep && keep.date === d ? keep.shiftId : null });
  };

  const submit = async () => {
    if (!fundId || !date || !shift || unchanged || sendingRef.current) return;
    sendingRef.current = true;
    setSending(true);
    try {
      if (scheduleId) await rescheduleHandover(scheduleId, date, shift.id);
      else await bookHandover(fundId, date, shift.id);
      toast.show(scheduleId ? 'Đã đổi lịch nhận nhà' : 'Đã gửi đăng ký — chủ đầu tư sẽ xác nhận', 'success');
      back();
    } catch (e) {
      const msg = getErrorMessage(e);
      toast.show(msg, 'danger');
      // Căn vừa có lịch (đặt ở máy khác / nhân viên vừa xếp) → về màn Bàn giao để thấy lịch đó; còn lại tải lại chỗ, giữ ngày đã chọn.
      if (/đã có lịch hẹn hiệu lực/i.test(msg)) back();
      else void slots.refetch();
    } finally {
      sendingRef.current = false;
      setSending(false);
    }
  };

  const parts = date ? scheduleDateParts(date) : null;
  const summary = parts && shift ? `${parts.weekday}, ${dayMonth(date ?? '')} · ${shift.from}${shift.to ? ` – ${shift.to}` : ''}` : null;
  const subtitle = unit ? `Căn ${unit.unitCode} · ${unit.projectName}` : 'Chọn ngày và ca bạn đến nhận nhà';

  return (
    <Screen
      onRefresh={() => void slots.refetch()}
      refreshing={slots.refreshing}
      footer={
        slots.data && !noRoom ? (
          <StickyActionBar>
            <View style={styles.bar}>
              <Text variant="captionStrong" weight="semibold" numeric color={summary ? semantic.text : semantic.textMuted} accessibilityLiveRegion="polite">
                {summary ?? 'Chọn ngày và ca nhận nhà'}
              </Text>
              <Button
                title={scheduleId ? 'Đổi sang lịch này' : 'Xác nhận đăng ký'}
                leftIcon="calendarCheck"
                fullWidth
                loading={sending}
                disabled={!shift || unchanged}
                onPress={() => void submit()}
              />
            </View>
          </StickyActionBar>
        ) : undefined
      }>
      <ScreenHeader title={scheduleId ? 'Đổi lịch nhận nhà' : 'Chọn lịch nhận nhà'} subtitle={subtitle} onBack={back} />

      {slots.loading ? (
        <View style={styles.gap}>
          <Skeleton height={sizes.skeleton.row} />
          <SkeletonList count={3} />
        </View>
      ) : slots.error ? (
        <Card>
          <ErrorState message={slots.error} onRetry={() => void slots.refetch()} />
        </Card>
      ) : noRoom ? (
        <Card>
          <EmptyState
            icon="calendar"
            title="Các ngày đều đã kín"
            description="Hiện không còn ca trống trong thời gian bàn giao. Vui lòng liên hệ chủ đầu tư để được sắp xếp."
            actionLabel={hotline ? `Gọi ${hotline}` : undefined}
            onAction={hotline ? () => void Linking.openURL(`tel:${hotline.replace(/[^\d+]/g, '')}`) : undefined}
          />
        </Card>
      ) : slots.data ? (
        <View style={styles.gap}>
          <NoxhAlert
            tone="primary"
            icon="calendar"
            title={`Thời gian bàn giao: ${dayMonth(slots.data.from)} – ${dayMonth(slots.data.to)}`}
            message="Chủ đầu tư sẽ xác nhận lịch và báo địa điểm nhận nhà cho bạn."
          />
          <Section title="Chọn ngày">
            <DateStrip days={strip} selected={date} onSelect={pickDate} />
          </Section>
          <Section title="Chọn ca">
            {shifts.length ? (
              <View style={styles.shifts} accessibilityRole="radiogroup" accessibilityLabel="Chọn ca nhận nhà">
                {shifts.map((s) => (
                  <ShiftOption key={s.id} shift={s} selected={s.id === shiftId} onPress={() => date && setPicked({ date, shiftId: s.id })} />
                ))}
              </View>
            ) : (
              <Text variant="caption" color={semantic.textMuted}>
                Ngày này không còn ca nhận nhà — vui lòng chọn ngày khác.
              </Text>
            )}
          </Section>
        </View>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  gap: { gap: spacing.lg },
  shifts: { gap: spacing.sm },
  bar: { gap: spacing.sm },
});
