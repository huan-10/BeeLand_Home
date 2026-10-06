import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { ChoiceCard, UpdateCccdDialog } from '@/components/domain';
import { Screen, Section, StickyActionBar } from '@/components/layout';
import { Badge, Button, Card, ErrorState, Icon, ScreenHeader, SkeletonCard, Text, useToast } from '@/components/ui';
import { useAuth } from '@/contexts/AuthContext';
import { useNoxhLoaiCan, useNoxhRound } from '@/hooks/useNoxh';
import { formatDate } from '@/lib/format';
import { isMissingCccdError, isValidCccd, normalizeCccd, roundStatusMeta } from '@/lib/noxh';
import { NoxhConflictError, saveApplication } from '@/services';
import { getErrorMessage } from '@/services/errors';
import { colors, semantic, spacing } from '@/theme';

export default function NewApplicationScreen() {
  const { dot } = useLocalSearchParams<{ dot: string }>();
  const { user } = useAuth();
  const toast = useToast();
  const round = useNoxhRound(dot);
  const loaiCan = useNoxhLoaiCan(dot);
  const [groupId, setGroupId] = useState<string>();
  const [loaiCanId, setLoaiCanId] = useState<string>();
  const [error, setError] = useState<string>();
  const [submitting, setSubmitting] = useState(false);
  const [cccdOpen, setCccdOpen] = useState(false);
  const back = () => (router.canGoBack() ? router.back() : router.replace('/noxh'));

  const r = round.data;
  const create = async () => {
    if (!r || submitting) return;
    if (!groupId || !loaiCanId) {
      setError(!groupId ? 'Vui lòng chọn nhóm đối tượng' : 'Vui lòng chọn loại căn hộ');
      return;
    }
    setError(undefined);
    setSubmitting(true);
    try {
      const result = await saveApplication(
        { dot_id: r.id, nhom_doi_tuong_id: groupId, loai_can_id: loaiCanId, khach_hang: { ten_kh: user?.fullName, di_dong: user?.phone } },
        false,
      );
      toast.show(`Đã tạo hồ sơ ${result.so_ho_so}`, 'success');
      router.replace({ pathname: '/noxh/ho-so/[id]/thong-tin', params: { id: result.id } });
    } catch (e) {
      if (e instanceof NoxhConflictError) {
        // Đã có hồ sơ ở dự án này → mở hồ sơ đó.
        toast.show(e.message, 'info');
        router.replace({ pathname: '/noxh/ho-so/[id]', params: { id: e.hoSoId } });
        return;
      }
      const message = getErrorMessage(e);
      // Tài khoản chưa có CCCD → mời cập nhật, cập nhật xong tự tạo lại.
      if (isMissingCccdError(message)) setCccdOpen(true);
      else setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Screen
      footer={
        r ? (
          <StickyActionBar>
            <Button title="Tạo hồ sơ" rightIcon="arrowRight" fullWidth loading={submitting} onPress={() => void create()} />
          </StickyActionBar>
        ) : undefined
      }>
      <ScreenHeader title="Tạo hồ sơ" subtitle="Bước 1/3 · Chọn nhóm đối tượng và loại căn" onBack={back} />
      {round.loading ? (
        <SkeletonCard lines={4} />
      ) : round.error || !r ? (
        <Card>
          <ErrorState message={round.error ?? undefined} onRetry={() => void round.refetch()} />
        </Card>
      ) : (
        <View style={styles.content}>
          <Card variant="sunken" radius="xl">
            <View style={styles.roundRow}>
              <Icon name="building" size="md" color={semantic.textBrand} />
              <View style={styles.flex}>
                <Text variant="bodyStrong" weight="semibold">
                  {r.ten}
                </Text>
                <Text variant="caption" color={semantic.textMuted}>
                  {r.ten_chu_dau_tu} · nhận đến {formatDate(r.den_ngay)}
                </Text>
              </View>
              <Badge label={roundStatusMeta[r.tinh_trang].label} tone={roundStatusMeta[r.tinh_trang].tone} />
            </View>
          </Card>

          <Section title="Bạn thuộc nhóm đối tượng nào?">
            <View role="radiogroup" aria-label="Nhóm đối tượng" style={styles.choices}>
              {r.nhom.map((g) => (
                <ChoiceCard key={g.id} title={g.ten} description={g.mo_ta} selected={groupId === g.id} onPress={() => setGroupId(g.id)} />
              ))}
            </View>
          </Section>

          <Section title="Loại căn hộ muốn đăng ký">
            {loaiCan.loading ? (
              <SkeletonCard lines={2} />
            ) : loaiCan.error ? (
              <Card>
                <ErrorState message={loaiCan.error} onRetry={() => void loaiCan.refetch()} />
              </Card>
            ) : (
              <View role="radiogroup" aria-label="Loại căn hộ" style={styles.choices}>
                {(loaiCan.data ?? []).map((l) => (
                  <ChoiceCard key={l.id} title={l.ten} selected={loaiCanId === l.id} onPress={() => setLoaiCanId(l.id)} />
                ))}
              </View>
            )}
          </Section>

          {error ? (
            <View style={styles.error} role="alert">
              <Icon name="alertCircle" size="sm" color={colors.danger[700]} />
              <Text variant="captionStrong" color={colors.danger[700]} style={styles.flex}>
                {error}
              </Text>
            </View>
          ) : null}

          <Text variant="caption" color={semantic.textMuted}>
            Tiếp theo: khai thông tin cá nhân (bước 2) và tải giấy tờ (bước 3). Hồ sơ được lưu nháp, bạn có thể quay lại hoàn thiện trước khi đợt đóng.
          </Text>
        </View>
      )}
      <UpdateCccdDialog
        visible={cccdOpen}
        companyId={r?.company_id ?? null}
        defaultCccd={user?.idNumber && isValidCccd(user.idNumber) ? normalizeCccd(user.idNumber) : undefined}
        onClose={() => setCccdOpen(false)}
        onUpdated={() => {
          setCccdOpen(false);
          void create();
        }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { gap: spacing.ml },
  roundRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.ms },
  flex: { flex: 1, minWidth: 0, gap: spacing.xs },
  choices: { gap: spacing.ms },
  error: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
});
