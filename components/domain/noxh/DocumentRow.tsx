import { StyleSheet, View } from 'react-native';

import { Badge, Button, Card, Icon, IconButton, IconCircle, Text } from '@/components/ui';
import { formatDate } from '@/lib/format';
import { docStatusMeta, formatFileHint, formatFileSize, isDocOverdue } from '@/lib/noxh';
import { colors, radius, semantic, spacing, toneColors } from '@/theme';
import type { NoxhDoc } from '@/types';

export interface DocumentRowProps {
  doc: NoxhDoc;
  /** Khách được tải / bỏ tệp (theo `quyen.sua_giay_to`). */
  editable: boolean;
  uploading: boolean;
  /** Lỗi kiểm tệp / tải lên của riêng dòng này. */
  error?: string;
  /** Tô viền nhắc khi máy chủ báo thiếu giấy tờ này. */
  highlight?: boolean;
  now: number;
  onUpload: () => void;
  onView: () => void;
  onRemove: () => void;
  onTemplate?: () => void;
}

/** Một giấy tờ: tên, bắt buộc, định dạng, trạng thái, hạn nộp, lý do chưa đạt, tệp đã nộp và thao tác. */
export function DocumentRow({ doc, editable, uploading, error, highlight, now, onUpload, onView, onRemove, onTemplate }: DocumentRowProps) {
  const meta = docStatusMeta[doc.trang_thai];
  const overdue = isDocOverdue(doc, now);
  const hasFile = !!doc.tep_ten;
  const isImage = /\.(jpe?g|png)$/i.test(doc.tep_ten ?? '');
  return (
    <Card variant={highlight ? 'outlined' : 'elevated'} style={highlight && styles.highlight}>
      <View style={styles.head}>
        <IconCircle name={doc.trang_thai === 'DAT' ? 'checkCircle' : doc.trang_thai === 'CHUA_DAT' ? 'warning' : 'document'} tone={meta.tone} size="md" />
        <View style={styles.flex}>
          <Text variant="bodyStrong" weight="semibold">
            {doc.ten}
          </Text>
          <View style={styles.badges}>
            <Badge label={meta.label} tone={meta.tone} />
            {doc.bat_buoc ? <Badge label="Bắt buộc" tone="info" /> : <Badge label="Không bắt buộc" tone="neutral" />}
          </View>
          <Text variant="caption" color={semantic.textMuted}>
            {formatFileHint(doc.dinh_dang, doc.dung_luong_mb)}
            {doc.han_nop ? ` · Hạn ${formatDate(doc.han_nop)}` : ''}
          </Text>
          {overdue ? (
            <Text variant="captionStrong" color={colors.danger[700]}>
              Đã quá hạn nộp
            </Text>
          ) : null}
        </View>
      </View>

      {doc.trang_thai === 'CHUA_DAT' && doc.ly_do ? (
        <View style={styles.reason}>
          <Icon name="info" size="sm" color={toneColors.danger.fg} />
          <Text variant="caption" color={toneColors.danger.fg} style={styles.flex}>
            {doc.ly_do}
          </Text>
        </View>
      ) : null}

      {hasFile ? (
        <View style={styles.file}>
          <Icon name={isImage ? 'image' : 'filePdf'} size="md" color={semantic.textBrand} />
          <View style={styles.flex}>
            <Text variant="captionStrong">
              {doc.tep_ten}
            </Text>
            <Text variant="caption" color={semantic.textMuted}>
              {[formatFileSize(doc.tep_kich_thuoc), doc.ngay_nop ? `nộp ${formatDate(doc.ngay_nop)}` : null].filter(Boolean).join(' · ')}
            </Text>
          </View>
          <IconButton icon="eye" variant="plain" accessibilityLabel={`Xem tệp ${doc.ten}`} onPress={onView} />
          {editable ? <IconButton icon="trash" variant="plain" accessibilityLabel={`Bỏ tệp ${doc.ten}`} onPress={onRemove} /> : null}
        </View>
      ) : null}

      {error ? (
        <View style={styles.error} role="alert">
          <Icon name="alertCircle" size="sm" color={colors.danger[700]} />
          <Text variant="caption" color={colors.danger[700]} style={styles.flex}>
            {error}
          </Text>
        </View>
      ) : null}

      {editable || onTemplate ? (
        <View style={styles.actions}>
          {editable ? (
            <Button
              title={uploading ? 'Đang tải lên…' : hasFile ? 'Thay tệp' : 'Tải lên'}
              size="sm"
              variant={hasFile ? 'outline' : 'secondary'}
              leftIcon="upload"
              loading={uploading}
              onPress={onUpload}
              accessibilityLabel={`${hasFile ? 'Thay tệp' : 'Tải lên'} ${doc.ten}`}
            />
          ) : null}
          {onTemplate ? <Button title="Tải mẫu" size="sm" variant="ghost" leftIcon="download" onPress={onTemplate} accessibilityLabel={`Tải mẫu ${doc.ten}`} /> : null}
        </View>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  highlight: { borderColor: colors.danger[600] },
  head: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.ms },
  flex: { flex: 1, minWidth: 0, gap: spacing.xs },
  badges: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  reason: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.ms, padding: spacing.ms, borderRadius: radius.xl, backgroundColor: toneColors.danger.bg },
  file: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.ms,
    paddingLeft: spacing.ms,
    borderRadius: radius.xl,
    backgroundColor: semantic.surfaceMuted,
  },
  error: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginTop: spacing.sm },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.ms },
});
