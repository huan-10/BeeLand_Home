import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { AppState, StyleSheet, View } from 'react-native';

import { Countdown, LotteryCertificate, LotteryDrum, LotteryResultCard, StepNode } from '@/components/domain';
import { Col, Grid, Screen } from '@/components/layout';
import { Badge, Button, Card, Checkbox, ErrorState, Icon, KeyValueRow, Pressable, ScreenHeader, SkeletonCard, Text } from '@/components/ui';
import { useBreakpoint } from '@/hooks/useBreakpoint';
import { useHover } from '@/hooks/useHover';
import { useLotterySpin } from '@/hooks/useLotterySpin';
import { useNoxhLotteries } from '@/hooks/useNoxh';
import { useBoundaryRerender, useJitteredRefetch, useServerClock } from '@/hooks/useServerClock';
import { formatDateTime } from '@/lib/format';
import { lotteryPhase, lotteryPhaseMeta, nextBoundaryMs, spinGuard, type StepState } from '@/lib/noxh';
import { borderWidth, colors, interactive, radius, semantic, sizes, spacing, toneColors } from '@/theme';
import type { NoxhLotteryItem, NoxhSpinResult } from '@/types';

const RULES = [
  'Mỗi hồ sơ bốc thăm một lần trong khung giờ của phiên.',
  'Kết quả được xác định khi mở đợt (có người giám sát) và không thay đổi — bấm lại chỉ hiện đúng kết quả đó.',
  'Hết khung giờ mà chưa bốc thăm, hệ thống tự mở kết quả cho bạn.',
  'Kết quả được công bố công khai theo số hồ sơ, không kèm họ tên hay CCCD.',
];

export default function LotteryRoundScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { isDesktop } = useBreakpoint();
  const { data, loading, error, refetch, refreshing } = useNoxhLotteries();
  const clock = useServerClock(data?.server_now);
  const item = data?.items.find((i) => i.bt_ho_so_id === id);
  const spin = useLotterySpin(id);
  const [agreed, setAgreed] = useState(false);
  const [certOpen, setCertOpen] = useState(false);
  const jitteredRefetch = useJitteredRefetch(refetch);
  const back = () => (router.canGoBack() ? router.back() : router.replace('/noxh/boc-tham'));

  // Quay lại app (có thể đã qua giờ mở / có kết quả) → tải lại lượt một lần; không thăm dò liên tục.
  useEffect(() => {
    const sub = AppState.addEventListener('change', (s) => {
      if (s === 'active' && !spin.spinning) void refetch();
    });
    return () => sub.remove();
  }, [refetch, spin.spinning]);

  // Tới giờ mở / đóng: giai đoạn được tính lại NGAY (nút bật đúng giây); dữ liệu tải lại sau độ trễ ngẫu nhiên.
  const reloadAtBoundary = () => {
    if (!spin.spinning && !spin.result) jitteredRefetch();
  };

  const result: NoxhSpinResult | null =
    spin.result ?? (item?.da_quay && item.ket_qua && item.mo_luc ? { ket_qua: item.ket_qua, can: item.can ?? null, thu_tu_du_phong: item.thu_tu_du_phong ?? null, mo_luc: item.mo_luc } : null);
  const phase = item ? (result ? 'spun' : lotteryPhase(item, clock.now())) : 'upcoming';
  useBoundaryRerender(item && !result ? nextBoundaryMs(item, clock.now()) : null);
  const canSpin = spinGuard(phase, agreed, spin.spinning) && spin.cooldown === 0;
  const stepStates: StepState[] = result ? ['done', 'done', 'done'] : spin.spinning ? ['done', 'current', 'todo'] : agreed ? ['done', 'current', 'todo'] : ['current', 'todo', 'todo'];

  const status = spin.spinning
    ? 'Đang bốc thăm…'
    : result
      ? result.ket_qua === 'TRUNG'
        ? `Kết quả: trúng căn ${result.can?.ky_hieu ?? ''}`
        : `Kết quả: chưa trúng, dự phòng số ${result.thu_tu_du_phong ?? '—'}`
      : '';

  const stage = item ? (
    <Card padding="lg" radius="3xl">
      <SpinSteps states={stepStates} />
      {/* Vùng đọc trạng thái cho trình đọc màn hình (không di chuyển focus). */}
      <View accessibilityLiveRegion="polite" aria-live="polite" role="status" style={styles.live}>
        <Text variant="caption" color={semantic.textMuted}>
          {status}
        </Text>
      </View>
      {result ? (
        <LotteryResultCard result={result} onCertificate={() => setCertOpen(true)} />
      ) : (
        <View style={styles.stageBody}>
          <LotteryDrum spinning={spin.spinning} />
          {phase === 'upcoming' ? (
            <View style={styles.center}>
              <Text variant="captionStrong" color={semantic.textMuted}>
                Bắt đầu sau
              </Text>
              <Countdown targetMs={Date.parse(item.tu_ngay)} now={clock.now} onElapsed={reloadAtBoundary} label="Bắt đầu sau" variant="display" />
              <Text variant="caption" color={semantic.textMuted} align="center">
                Nút bốc thăm mở lúc {formatDateTime(item.tu_ngay)}
              </Text>
            </View>
          ) : phase === 'open' ? (
            <View style={styles.center}>
              <Text variant="captionStrong" color={semantic.textMuted}>
                Kết thúc sau
              </Text>
              <Countdown targetMs={Date.parse(item.den_ngay)} now={clock.now} onElapsed={reloadAtBoundary} label="Kết thúc sau" variant="title" />
            </View>
          ) : (
            <Text variant="body" color={semantic.textSecondary} align="center">
              Đã hết giờ bốc thăm. Hệ thống sẽ mở kết quả và công bố sau khi kết thúc đợt.
            </Text>
          )}
          {phase === 'open' || phase === 'upcoming' ? (
            <>
              <Checkbox label="Tôi đã đọc và đồng ý quy định bốc thăm" checked={agreed} onChange={setAgreed} disabled={spin.spinning} />
              {spin.error ? (
                <View style={styles.error} role="alert">
                  <Icon name="alertCircle" size="sm" color={colors.danger[700]} />
                  <Text variant="caption" color={colors.danger[700]} style={styles.flex}>
                    {spin.error}
                    {spin.cooldown > 0 ? ` (${spin.cooldown} giây)` : ''}
                  </Text>
                </View>
              ) : null}
              <Button
                title={spin.spinning ? 'Đang bốc thăm…' : spin.error === 'Mất kết nối — Thử lại' ? 'Thử lại' : 'Bốc thăm'}
                size="lg"
                leftIcon="trophy"
                fullWidth
                loading={spin.spinning}
                disabled={!canSpin}
                onPress={() => void spin.spin()}
              />
            </>
          ) : null}
        </View>
      )}
    </Card>
  ) : null;

  return (
    <Screen onRefresh={() => void refetch()} refreshing={refreshing}>
      <ScreenHeader title="Phòng bốc thăm" subtitle={item?.ma_dot} onBack={back} />
      {loading ? (
        <SkeletonCard lines={6} />
      ) : !data || !item ? (
        // Chỉ thay cả màn bằng lỗi khi chưa có dữ liệu; tải lại lỗi giữa chừng giữ nguyên phòng bốc thăm.
        <Card>
          <ErrorState message={error ?? 'Không tìm thấy lượt bốc thăm'} onRetry={() => void refetch()} />
        </Card>
      ) : (
        <Grid gutter={isDesktop ? 'lg' : 'md'}>
          {error && !refreshing ? (
            <Col span={{ mobile: 12 }}>
              <View style={styles.error} role="alert">
                <Icon name="offline" size="sm" color={colors.warning[700]} />
                <Text variant="caption" color={colors.warning[700]} style={styles.flex}>
                  Không tải lại được dữ liệu mới nhất — đang hiển thị thông tin trước đó. Kéo xuống để thử lại.
                </Text>
              </View>
            </Col>
          ) : null}
          {/* Điện thoại: khu bốc thăm lên đầu. Màn rộng: thông tin bên trái, bốc thăm bên phải. */}
          {!isDesktop ? <Col span={{ mobile: 12 }}>{stage}</Col> : null}
          <Col span={{ mobile: 12, desktop: 5 }}>
            <View style={styles.column}>
              <InfoCard item={item} phase={lotteryPhaseMeta[phase]} />
              <Rules />
            </View>
          </Col>
          {isDesktop ? <Col span={{ mobile: 12, desktop: 7 }}>{stage}</Col> : null}
        </Grid>
      )}
      {item && result ? <LotteryCertificate visible={certOpen} onClose={() => setCertOpen(false)} item={item} result={result} /> : null}
    </Screen>
  );
}

const STEP_LABELS = ['Xác nhận', 'Bốc thăm', 'Kết quả'];

function SpinSteps({ states }: { states: StepState[] }) {
  const current = states.findIndex((s) => s === 'current');
  return (
    <View style={styles.steps} accessible accessibilityLabel={`Bước ${current < 0 ? 3 : current + 1}/3: ${STEP_LABELS[current < 0 ? 2 : current]}`}>
      {STEP_LABELS.map((label, i) => (
        <View key={label} style={styles.step}>
          <StepNode state={states[i]} index={i} />
          <Text variant="captionStrong" color={states[i] === 'todo' ? semantic.textMuted : semantic.text}>
            {label}
          </Text>
          {i < STEP_LABELS.length - 1 ? <View style={[styles.stepLine, states[i] === 'done' && styles.stepLineDone]} /> : null}
        </View>
      ))}
    </View>
  );
}

function InfoCard({ item, phase }: { item: NoxhLotteryItem; phase: { label: string; tone: 'primary' | 'success' | 'warning' | 'neutral' | 'danger' | 'info' } }) {
  return (
    <Card padding="sm">
      <View style={styles.infoHead}>
        <Badge label={phase.label} tone={phase.tone} dot />
        <Text variant="heading" accessibilityRole="header">
          {item.ten}
        </Text>
        {item.mo_ta ? (
          <Text variant="caption" color={semantic.textMuted}>
            {item.mo_ta}
          </Text>
        ) : null}
      </View>
      <KeyValueRow label="Dự án" value={item.ten_du_an ?? '—'} />
      <KeyValueRow label="Số hồ sơ" value={item.so_ho_so} numeric />
      <KeyValueRow label="Phiên" value={`Phiên ${item.thu_tu_phien}`} />
      <KeyValueRow label="Nhóm đối tượng" value={item.ten_nhom ?? '—'} />
      <KeyValueRow label="Loại căn" value={item.ten_loai_can ?? '—'} />
      <KeyValueRow label="Khung giờ" value={`${formatDateTime(item.tu_ngay)} – ${formatDateTime(item.den_ngay)}`} numeric last />
    </Card>
  );
}

function Rules() {
  const [open, setOpen] = useState(false);
  const { hovered, hoverProps } = useHover();
  return (
    <Card padding="sm">
      <Pressable
        {...hoverProps}
        onPress={() => setOpen((v) => !v)}
        accessibilityRole="button"
        aria-expanded={open}
        accessibilityLabel="Quy định bốc thăm"
        style={({ pressed }) => [styles.rulesHead, interactive, (pressed || hovered) && styles.hover]}>
        <Icon name="shieldCheck" size="md" color={semantic.textBrand} />
        <Text variant="bodyStrong" weight="semibold" style={styles.flex}>
          Quy định bốc thăm
        </Text>
        <Icon name={open ? 'chevronUp' : 'chevronDown'} size="sm" variant="bold" color={semantic.iconMuted} />
      </Pressable>
      {open ? (
        <View style={styles.rules} role="list">
          {RULES.map((r, i) => (
            <View key={r} style={styles.rule} role="listitem">
              <Text variant="captionStrong" color={semantic.textBrand}>
                {i + 1}.
              </Text>
              <Text variant="caption" color={semantic.textSecondary} style={styles.flex}>
                {r}
              </Text>
            </View>
          ))}
        </View>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  column: { gap: spacing.ml },
  live: { minHeight: spacing.ml, alignItems: 'center' },
  stageBody: { gap: spacing.md },
  center: { alignItems: 'center', gap: spacing.xs },
  error: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  flex: { flex: 1, minWidth: 0 },
  steps: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.sm },
  step: { flex: 1, alignItems: 'center', gap: spacing.xs },
  stepLine: { position: 'absolute', top: spacing.ms, left: '62%', right: '-38%', height: borderWidth.strong, backgroundColor: colors.gray[200] },
  stepLineDone: { backgroundColor: toneColors.success.solid },
  infoHead: { gap: spacing.xs, padding: spacing.sm, alignItems: 'flex-start' },
  rulesHead: { flexDirection: 'row', alignItems: 'center', gap: spacing.ms, minHeight: sizes.touchTarget, paddingHorizontal: spacing.sm, borderRadius: radius.xl },
  hover: { backgroundColor: semantic.surfaceMuted },
  rules: { gap: spacing.sm, padding: spacing.sm },
  rule: { flexDirection: 'row', gap: spacing.sm },
});
