import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { PickerDialog, SelectField } from '@/components/domain';
import { Screen } from '@/components/layout';
import {
  Badge,
  Button,
  Card,
  Chip,
  ChipBar,
  DataTable,
  EmptyState,
  ErrorState,
  Input,
  ScreenHeader,
  SkeletonList,
  Text,
  type DataTableColumn,
  type DataTableRow,
} from '@/components/ui';
import { useBreakpoint } from '@/hooks/useBreakpoint';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { usePublishedResult, usePublishedResults } from '@/hooks/useNoxh';
import { formatNumber } from '@/lib/format';
import { filterPublishedRows, paginate } from '@/lib/noxh';
import { semantic, spacing } from '@/theme';
import type { NoxhPublishedRow } from '@/types';

/** Nhiều hơn số này → chọn đợt bằng hộp thoại thay cho hàng chip. */
const MAX_CHIPS = 4;

type ColumnKey = 'so_ho_so' | 'phien' | 'ket_qua' | 'can';
const columns: DataTableColumn<ColumnKey>[] = [
  { key: 'so_ho_so', title: 'Số hồ sơ', flex: 3 },
  { key: 'phien', title: 'Phiên', flex: 1.2 },
  { key: 'ket_qua', title: 'Kết quả', flex: 2 },
  { key: 'can', title: 'Căn / dự phòng', flex: 2, align: 'right' },
];

const outcome = (r: NoxhPublishedRow) => (r.ket_qua === 'TRUNG' ? { label: 'Trúng', tone: 'success' as const } : { label: 'Chưa trúng', tone: 'neutral' as const });
const unitText = (r: NoxhPublishedRow) => (r.ket_qua === 'TRUNG' ? (r.ky_hieu ?? '—') : `Dự phòng số ${r.thu_tu_du_phong ?? '—'}`);

export default function PublishedResultsScreen() {
  const { isDesktop } = useBreakpoint();
  const { data, loading, refreshing, error, refetch } = usePublishedResults();
  const [selected, setSelected] = useState<string>();
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [pickerOpen, setPickerOpen] = useState(false);
  const debounced = useDebouncedValue(query);
  const back = () => (router.canGoBack() ? router.back() : router.replace('/noxh'));

  const lotteries = data ?? [];
  const current = lotteries.find((l) => l.bt_id === selected) ?? lotteries[0];
  // Danh sách đợt không kèm kết quả → tải kết quả của đợt đang chọn.
  const result = usePublishedResult(current?.bt_id);
  const rows = result.data?.rows ?? [];
  const filtered = filterPublishedRows(rows, debounced);
  const paged = paginate(filtered, page);

  const choose = (id: string) => {
    setSelected(id);
    setPage(1);
  };

  return (
    <Screen
      onRefresh={() => void refetch()}
      refreshing={refreshing}
      top={<ScreenHeader title="Kết quả bốc thăm" subtitle="Kết quả đã công bố — tra theo số hồ sơ" onBack={back} />}
      sticky={() =>
        lotteries.length > 0 ? (
          <View style={styles.sticky}>
            {lotteries.length <= MAX_CHIPS ? (
              <ChipBar accessibilityLabel="Chọn đợt bốc thăm">
                {lotteries.map((l) => (
                  <Chip key={l.bt_id} role="tab" label={l.ma_dot} selected={current?.bt_id === l.bt_id} accessibilityLabel={`${l.ma_dot}, ${l.ten}`} onPress={() => choose(l.bt_id)} />
                ))}
              </ChipBar>
            ) : (
              <SelectField label="Đợt bốc thăm" value={current ? `${current.ma_dot} · ${current.ten}` : undefined} placeholder="Chọn đợt" onPress={() => setPickerOpen(true)} />
            )}
            <Input
              icon="search"
              placeholder="Nhập số hồ sơ"
              accessibilityLabel="Tra theo số hồ sơ"
              value={query}
              onChangeText={(t) => {
                setQuery(t);
                setPage(1);
              }}
              autoCapitalize="characters"
              autoCorrect={false}
            />
          </View>
        ) : null
      }>
      {loading ? (
        <SkeletonList count={3} />
      ) : error ? (
        <Card>
          <ErrorState message={error} onRetry={() => void refetch()} />
        </Card>
      ) : !current ? (
        <Card>
          <EmptyState icon="listChecks" title="Chưa có kết quả công bố" description="Kết quả các đợt bốc thăm đã kết thúc sẽ hiển thị tại đây." />
        </Card>
      ) : (
        <View style={styles.content}>
          <Card padding="ml">
            <Text variant="heading" accessibilityRole="header">
              {current.ten}
            </Text>
            <Text variant="caption" color={semantic.textMuted}>
              {current.ma_dot} · {current.ten_du_an}
            </Text>
            <View style={styles.stats}>
              <Stat label="Hồ sơ tham gia" value={formatNumber(current.tong_ho_so)} />
              <Stat label="Hồ sơ trúng" value={formatNumber(current.so_trung)} accent />
              <Stat label="Số phiên" value={formatNumber(current.so_phien)} />
            </View>
          </Card>

          {result.loading ? (
            <SkeletonList count={4} />
          ) : result.error ? (
            <Card>
              <ErrorState message={result.error} onRetry={() => void result.refetch()} />
            </Card>
          ) : filtered.length === 0 ? (
            <Card>
              <EmptyState icon="search" title="Không tìm thấy hồ sơ" description="Kiểm tra lại số hồ sơ (ví dụ NOXH-2026-000207)." />
            </Card>
          ) : isDesktop ? (
            <DataTable accessibilityLabel={`Kết quả ${current.ma_dot}`} columns={columns} rows={paged.items.map(toRow)} />
          ) : (
            <View style={styles.list}>
              {paged.items.map((r) => (
                <Card key={r.so_ho_so} padding="md" accessible accessibilityLabel={`${r.so_ho_so}, phiên ${r.thu_tu_phien}, ${outcome(r).label}, ${unitText(r)}`}>
                  <View style={styles.rowTop}>
                    <Text variant="subhead" numeric>
                      {r.so_ho_so}
                    </Text>
                    <Badge label={outcome(r).label} tone={outcome(r).tone} />
                  </View>
                  <Text variant="caption" color={semantic.textMuted}>
                    Phiên {r.thu_tu_phien} · {unitText(r)}
                  </Text>
                </Card>
              ))}
            </View>
          )}

          {paged.pages > 1 ? (
            <View style={styles.pager} role="navigation" aria-label="Phân trang">
              <Button title="Trang trước" variant="outline" size="sm" leftIcon="chevronLeft" disabled={paged.page <= 1} onPress={() => setPage(paged.page - 1)} />
              <Text variant="captionStrong" numeric>
                {paged.page}/{paged.pages}
              </Text>
              <Button title="Trang sau" variant="outline" size="sm" rightIcon="chevronRight" disabled={paged.page >= paged.pages} onPress={() => setPage(paged.page + 1)} />
            </View>
          ) : null}
        </View>
      )}
      <PickerDialog
        visible={pickerOpen}
        title="Chọn đợt bốc thăm"
        items={lotteries.map((l) => ({ value: l.bt_id, label: `${l.ma_dot} · ${l.ten}` }))}
        value={current?.bt_id}
        onClose={() => setPickerOpen(false)}
        onSelect={(i) => {
          setPickerOpen(false);
          choose(i.value);
        }}
      />
    </Screen>
  );
}

function toRow(r: NoxhPublishedRow): DataTableRow<ColumnKey> {
  const o = outcome(r);
  return {
    key: r.so_ho_so,
    cells: {
      so_ho_so: (
        <Text variant="captionStrong" numeric>
          {r.so_ho_so}
        </Text>
      ),
      phien: <Text variant="caption">{r.thu_tu_phien}</Text>,
      ket_qua: <Badge label={o.label} tone={o.tone} />,
      can: (
        <Text variant="captionStrong" numeric align="right">
          {unitText(r)}
        </Text>
      ),
    },
  };
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <View style={styles.stat}>
      <Text variant="caption" color={semantic.textMuted}>
        {label}
      </Text>
      <Text variant="title" numeric color={accent ? semantic.textSuccess : semantic.text}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  sticky: { gap: spacing.sm },
  content: { gap: spacing.ml },
  stats: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md, marginTop: spacing.md },
  stat: { flexGrow: 1, gap: spacing.xs },
  list: { gap: spacing.ms },
  rowTop: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm },
  pager: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.md },
});
