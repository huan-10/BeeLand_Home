import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Screen, Section } from '@/components/layout';
import { Badge, Card, ErrorState, Icon, KeyValueRow, ListRow, ScreenHeader, Skeleton, Text, useToast } from '@/components/ui';
import { useMyRequest } from '@/hooks/useRequests';
import { formatDate, formatDateTime } from '@/lib/format';
import { openDocument } from '@/lib/openDocument';
import { attachmentName, isImagePath, requestStatusTone } from '@/lib/requests';
import { getErrorMessage, openRequestFile } from '@/services';
import { borderWidth, colors, radius, semantic, sizes, spacing, toneColors } from '@/theme';

/**
 * Chi tiết yêu cầu: trạng thái + tiêu đề + nội dung; Loại · Căn hộ / hợp đồng · Ngày gửi; tệp đính kèm (mở link ký 10 phút);
 * "Phản hồi từ chủ đầu tư" = lịch sử xử lý (mới nhất trên cùng, không có ghi chú nội bộ). Chỉ xem.
 */
export default function RequestDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const toast = useToast();
  const { data: r, loading, refreshing, error, refetch } = useMyRequest(id);
  const [opening, setOpening] = useState<string | null>(null);
  const back = () => (router.canGoBack() ? router.back() : router.replace('/yeu-cau'));

  const open = async (path: string) => {
    if (opening) return;
    setOpening(path);
    try {
      const url = await openRequestFile(path);
      if (url) await openDocument(url, attachmentName(path));
      else toast.show('Bản xem thử chưa có tệp thật để mở', 'info');
    } catch (e) {
      toast.show(getErrorMessage(e), 'danger');
    } finally {
      setOpening(null);
    }
  };

  const tone = r ? requestStatusTone(r.status, r.statusColor) : 'primary';

  return (
    <Screen onRefresh={() => void refetch()} refreshing={refreshing}>
      <ScreenHeader title={r?.code || 'Yêu cầu'} subtitle="Chi tiết yêu cầu" onBack={back} />
      {loading ? (
        <Skeleton height={sizes.skeleton.block} radius={radius['2xl']} />
      ) : error || !r ? (
        <Card>
          <ErrorState message={error ?? undefined} onRetry={() => void refetch()} />
        </Card>
      ) : (
        <>
          <Card style={styles.card}>
            <View style={styles.badges}>
              <Badge label={r.status} tone={tone} dot size="md" />
              {r.category ? <Badge label={r.category} tone="neutral" /> : null}
            </View>
            <Text variant="heading" accessibilityRole="header">
              {r.title}
            </Text>
            {r.content ? (
              <Text variant="body" color={semantic.textSecondary} selectable>
                {r.content}
              </Text>
            ) : null}
            <View>
              <KeyValueRow label="Số phiếu" value={r.code || '—'} copyable={!!r.code} numeric />
              {r.contract ? <KeyValueRow label="Căn hộ / hợp đồng" value={r.contract} /> : null}
              <KeyValueRow label="Ngày gửi" value={formatDateTime(r.createdAt)} numeric last={!r.updatedAt} />
              {r.updatedAt ? <KeyValueRow label="Cập nhật" value={formatDateTime(r.updatedAt)} numeric last /> : null}
            </View>
          </Card>

          {r.attachments.length ? (
            <Section title={`Tệp đính kèm (${r.attachments.length})`}>
              <View style={styles.list}>
                {r.attachments.map((p) => (
                  <ListRow
                    key={p}
                    card
                    icon={isImagePath(p) ? 'image' : 'document'}
                    tone="primary"
                    title={attachmentName(p)}
                    subtitle={opening === p ? 'Đang mở…' : 'Bấm để xem'}
                    onPress={() => void open(p)}
                    accessibilityLabel={`Mở tệp ${attachmentName(p)}`}
                  />
                ))}
              </View>
            </Section>
          ) : null}

          <Section title="Phản hồi từ chủ đầu tư">
            <Card>
              {r.history.length === 0 ? (
                <Text variant="caption" color={semantic.textMuted}>
                  Chưa có phản hồi. Chủ đầu tư sẽ cập nhật tiến độ xử lý tại đây.
                </Text>
              ) : (
                <View role="list">
                  {r.history.map((h, i) => {
                    const last = i === r.history.length - 1;
                    return (
                      <View key={`${h.date}-${i}`} style={styles.logRow} role="listitem" accessible accessibilityLabel={`${h.status ?? ''}. ${h.content}. ${formatDateTime(h.date)}`}>
                        <View style={styles.rail}>
                          <View style={[styles.dot, i === 0 && styles.dotLatest]}>
                            {i === 0 ? <Icon name="check" size="xs" color={colors.white} strong /> : null}
                          </View>
                          {!last ? <View style={styles.line} /> : null}
                        </View>
                        <View style={[styles.logBody, !last && styles.logGap]}>
                          <View style={styles.logHead}>
                            {h.status ? <Badge label={h.status} tone={requestStatusTone(h.status, null)} /> : null}
                            <Text variant="caption" color={semantic.textMuted} numeric>
                              {formatDate(h.date)} · {formatDateTime(h.date).slice(-5)}
                            </Text>
                          </View>
                          <Text variant="body" color={semantic.text}>
                            {h.content}
                          </Text>
                        </View>
                      </View>
                    );
                  })}
                </View>
              )}
            </Card>
          </Section>
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: { gap: spacing.ms },
  badges: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  list: { gap: spacing.ms },
  logRow: { flexDirection: 'row', gap: spacing.ms },
  rail: { alignItems: 'center', width: sizes.icon.lg },
  dot: {
    width: sizes.icon.md,
    height: sizes.icon.md,
    marginTop: spacing.xs / 2,
    borderRadius: radius.full,
    borderWidth: borderWidth.strong,
    borderColor: colors.gray[300],
    backgroundColor: semantic.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotLatest: { borderColor: toneColors.primary.solid, backgroundColor: toneColors.primary.solid },
  line: { flex: 1, width: borderWidth.strong, backgroundColor: colors.gray[200], marginVertical: spacing.xs },
  logBody: { flex: 1, minWidth: 0, gap: spacing.xs },
  logGap: { paddingBottom: spacing.md },
  logHead: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: spacing.sm },
});
