import { Platform, StyleSheet, View } from 'react-native';

import { Button, Dialog, KeyValueRow, Text } from '@/components/ui';
import { formatDateTime } from '@/lib/format';
import { semantic, spacing } from '@/theme';
import type { NoxhLotteryItem, NoxhSpinResult } from '@/types';

export interface LotteryCertificateProps {
  visible: boolean;
  onClose: () => void;
  item: NoxhLotteryItem;
  result: NoxhSpinResult;
}

/** Giấy xác nhận kết quả bốc thăm (xem trong hộp thoại; web có nút In). */
export function LotteryCertificate({ visible, onClose, item, result }: LotteryCertificateProps) {
  const won = result.ket_qua === 'TRUNG';
  return (
    <Dialog
      visible={visible}
      title="Giấy xác nhận kết quả bốc thăm"
      onClose={onClose}
      actions={
        <>
          <Button title="Đóng" variant="ghost" onPress={onClose} />
          {Platform.OS === 'web' ? <Button title="In giấy xác nhận" leftIcon="printer" onPress={() => window.print()} /> : null}
        </>
      }>
      <View>
        <KeyValueRow label="Đợt bốc thăm" value={`${item.ma_dot} · ${item.ten}`} />
        <KeyValueRow label="Dự án" value={item.ten_du_an ?? '—'} />
        <KeyValueRow label="Số hồ sơ" value={item.so_ho_so} numeric />
        <KeyValueRow label="Phiên" value={[`Phiên ${item.thu_tu_phien}`, item.ten_loai_can].filter(Boolean).join(' · ')} />
        <KeyValueRow label="Kết quả" value={won ? `Trúng căn ${result.can?.ky_hieu ?? ''}` : `Chưa trúng · dự phòng số ${result.thu_tu_du_phong ?? '—'}`} />
        <KeyValueRow label="Thời điểm mở" value={formatDateTime(result.mo_luc)} numeric last={!item.hash_bi_mat} />
        {item.hash_bi_mat ? <KeyValueRow label="Mã kiểm chứng" value={`${item.hash_bi_mat.slice(0, 16)}…`} numeric last /> : null}
      </View>
      <Text variant="caption" color={semantic.textMuted} style={styles.note}>
        {Platform.OS === 'web'
          ? 'Bấm "In giấy xác nhận" để in hoặc lưu PDF.'
          : 'Chụp màn hình để lưu giấy xác nhận. Kết quả cũng được công bố tại mục Kết quả.'}
      </Text>
    </Dialog>
  );
}

const styles = StyleSheet.create({
  note: { marginTop: spacing.sm },
});
