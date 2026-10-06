import { StyleSheet, View } from 'react-native';

import { Badge, Button, Card, Icon, ProgressBar, Text } from '@/components/ui';
import { formatDate, formatPercent } from '@/lib/format';
import { formatArea, formatAreaDiff, handoverStatusMeta } from '@/lib/handover';
import type { Handover } from '@/types';
import { colors, radius, semantic, sizes, spacing, toneColors } from '@/theme';

import { NoxhAlert } from '../noxh/NoxhAlert';
import { ProjectImage } from '../ProjectImage';
import { HandoverStepper } from './HandoverStepper';

export interface HandoverCardProps {
  handover: Handover;
  /** Có lịch bàn giao của căn này → hiện nút "Xem lịch bàn giao". */
  onOpenSchedule?: () => void;
  onOpenContract: () => void;
}

/**
 * Thẻ bàn giao một căn: ảnh dự án (mã căn + trạng thái) → 4 bước → thời gian bàn giao, diện tích HĐ / thực tế,
 * tiến độ thanh toán & phí bảo trì → ghi chú của chủ đầu tư → nút lịch / hợp đồng.
 */
export function HandoverCard({ handover: h, onOpenSchedule, onOpenContract }: HandoverCardProps) {
  const meta = handoverStatusMeta[h.status];
  const period = h.fromDate && h.toDate ? `${formatDate(h.fromDate)} – ${formatDate(h.toDate)}` : h.fromDate ? `Từ ${formatDate(h.fromDate)}` : null;
  const diff = h.areaDiffPercent;
  return (
    <Card padding="none" accessibilityLabel={`Bàn giao căn ${h.unitCode}, ${h.projectName}, ${meta.label}`}>
      <View style={styles.imageWrap}>
        <ProjectImage uri={h.projectImageUrl} projectName={h.projectName} height={sizes.roundImage}>
          <View style={styles.imageTop}>
            <View />
            <Badge label={meta.label} tone={meta.tone} icon={meta.icon} />
          </View>
          <View style={styles.imageBottom}>
            <Text variant="heading" color={colors.white}>
              Căn {h.unitCode}
            </Text>
            <Text variant="caption" color={colors.white}>
              {h.projectName}
            </Text>
          </View>
        </ProjectImage>
      </View>

      <View style={styles.body}>
        <HandoverStepper status={h.status} />

        {h.status === 'paused' ? (
          <NoxhAlert tone="danger" icon="warning" title="Bàn giao đang tạm dừng" message="Chủ đầu tư sẽ thông báo khi tiếp tục bàn giao căn hộ của bạn." />
        ) : null}

        <View style={styles.facts}>
          {period ? <Fact icon="calendar" label="Thời gian bàn giao" value={period} /> : null}
          {h.areaContract !== null || h.areaHandover !== null ? (
            <Fact
              icon="home"
              label="Diện tích HĐ → thực tế"
              value={`${h.areaContract !== null ? formatArea(h.areaContract) : '—'} → ${h.areaHandover !== null ? formatArea(h.areaHandover) : '—'}`}
              aside={
                diff !== null && h.areaHandover !== null ? (
                  <Text variant="captionStrong" weight="semibold" numeric color={diff === 0 ? semantic.textMuted : diff > 0 ? semantic.textBrand : toneColors.warning.fg}>
                    {formatAreaDiff(diff)}
                  </Text>
                ) : undefined
              }
            />
          ) : null}
          <Fact icon="document" label="Số hợp đồng" value={h.contractCode} />
          {h.code ? <Fact icon="receipt" label="Số phiếu bàn giao" value={h.code} /> : null}
        </View>

        {h.paymentPercent !== null || h.maintenancePercent !== null ? (
          <View style={styles.progress}>
            {h.paymentPercent !== null ? <Progress label="Đã thanh toán" value={h.paymentPercent} /> : null}
            {h.maintenancePercent !== null ? <Progress label="Phí bảo trì đã đóng" value={h.maintenancePercent} /> : null}
          </View>
        ) : null}

        {h.note ? <NoxhAlert tone="primary" icon="info" title="Lưu ý từ chủ đầu tư" message={h.note} /> : null}

        <View style={styles.actions}>
          {onOpenSchedule ? <Button title="Xem lịch bàn giao" leftIcon="calendarCheck" fullWidth onPress={onOpenSchedule} /> : null}
          <Button title="Xem hợp đồng" variant="secondary" leftIcon="document" fullWidth onPress={onOpenContract} />
        </View>
      </View>
    </Card>
  );
}

function Fact({ icon, label, value, aside }: { icon: 'calendar' | 'home' | 'document' | 'receipt'; label: string; value: string; aside?: React.ReactNode }) {
  return (
    <View style={styles.fact} accessible accessibilityLabel={`${label}: ${value}`}>
      <Icon name={icon} size="sm" color={semantic.iconMuted} />
      <View style={styles.flex}>
        <Text variant="caption" color={semantic.textMuted}>
          {label}
        </Text>
        <Text variant="captionStrong" weight="semibold" numeric>
          {value}
        </Text>
      </View>
      {aside}
    </View>
  );
}

function Progress({ label, value }: { label: string; value: number }) {
  const done = value >= 100;
  return (
    <View style={styles.progressItem}>
      <View style={styles.progressHead}>
        <Text variant="caption" color={semantic.textSecondary}>
          {label}
        </Text>
        <Text variant="captionStrong" weight="bold" numeric color={done ? semantic.textSuccess : semantic.textBrand}>
          {formatPercent(value)}
        </Text>
      </View>
      <ProgressBar value={value} size="sm" tone={done ? 'success' : 'primary'} accessibilityLabel={`${label} ${formatPercent(value)}`} />
    </View>
  );
}

const styles = StyleSheet.create({
  imageWrap: { borderTopLeftRadius: radius['2xl'], borderTopRightRadius: radius['2xl'], overflow: 'hidden' },
  imageTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  imageBottom: { gap: spacing.xs / 2 },
  body: { padding: spacing.md, gap: spacing.md },
  facts: { gap: spacing.ms },
  fact: { flexDirection: 'row', alignItems: 'center', gap: spacing.ms },
  flex: { flex: 1, minWidth: 0 },
  progress: { gap: spacing.ms, padding: spacing.md, borderRadius: radius.xl, backgroundColor: semantic.surfaceMuted },
  progressItem: { gap: spacing.xs },
  progressHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  actions: { gap: spacing.sm },
});
