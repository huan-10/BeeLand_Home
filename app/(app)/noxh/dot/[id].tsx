import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { ConnectNoxhDialog, Countdown, ProjectImage, UpdateCccdDialog } from '@/components/domain';
import { Col, Grid, Screen, Section, StickyActionBar } from '@/components/layout';
import { Badge, Button, Card, ErrorState, Icon, Pressable, ScreenHeader, Skeleton, SkeletonCard, Text, useToast } from '@/components/ui';
import { useAuth } from '@/contexts/AuthContext';
import { useBreakpoint } from '@/hooks/useBreakpoint';
import { useHover } from '@/hooks/useHover';
import { useNoxhApplications, useNoxhRound } from '@/hooks/useNoxh';
import { useServerClock } from '@/hooks/useServerClock';
import { formatDate, formatNumber } from '@/lib/format';
import { isActiveApplication, isValidCccd, normalizeCccd, roundStatusMeta } from '@/lib/noxh';
import { getErrorMessage, getNoxhAccount } from '@/services';
import { hasNoxhLink } from '@/services/session';
import { interactive, radius, semantic, sizes, spacing, type IconName } from '@/theme';
import type { NoxhRoundGroup } from '@/types';

export default function RoundDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { isDesktop } = useBreakpoint();
  const { user } = useAuth(); // vẽ lại sau khi kết nối NOXH (token nằm trong phiên)
  const toast = useToast();
  const [checking, setChecking] = useState(false);
  const [cccdOpen, setCccdOpen] = useState(false);
  const round = useNoxhRound(id);
  const apps = useNoxhApplications();
  const clock = useServerClock();
  const [connectOpen, setConnectOpen] = useState(false);
  const back = () => (router.canGoBack() ? router.back() : router.replace('/noxh'));

  const r = round.data;
  const existing = r ? (apps.data ?? []).find((a) => a.ten_du_an === r.ten_du_an && (isActiveApplication(a.trang_thai) || a.trang_thai === 'NHAP')) : undefined;
  const connected = r ? hasNoxhLink(r.company_id) : false;

  const goCreate = () => r && router.push({ pathname: '/noxh/ho-so/tao', params: { dot: r.id } });
  // Đăng ký nhà ở xã hội bắt buộc tài khoản có CCCD → chưa có thì mời cập nhật trước.
  const register = async () => {
    if (!r || checking) return;
    setChecking(true);
    try {
      const account = await getNoxhAccount(r.company_id);
      if (account.co_cccd) goCreate();
      else setCccdOpen(true);
    } catch (e) {
      toast.show(getErrorMessage(e), 'danger');
    } finally {
      setChecking(false);
    }
  };
  const suggestedCccd = user?.idNumber && isValidCccd(user.idNumber) ? normalizeCccd(user.idNumber) : undefined;

  const cta = (() => {
    if (!r) return null;
    if (existing) return <Button title="Mở hồ sơ của bạn" rightIcon="arrowRight" fullWidth onPress={() => router.push({ pathname: '/noxh/ho-so/[id]', params: { id: existing.id } })} />;
    if (r.tinh_trang === 'SAP_MO') return <Button title={`Mở nhận hồ sơ từ ${formatDate(r.tu_ngay)}`} fullWidth disabled />;
    if (r.tinh_trang !== 'DANG_MO') return <Button title="Đợt đã kết thúc nhận hồ sơ" fullWidth disabled />;
    if (!connected) return <Button title="Kết nối để đăng ký hồ sơ" leftIcon="key" fullWidth onPress={() => setConnectOpen(true)} />;
    return <Button title="Đăng ký hồ sơ" rightIcon="arrowRight" fullWidth loading={checking} onPress={() => void register()} />;
  })();

  return (
    <Screen onRefresh={() => void round.refetch()} refreshing={round.refreshing} footer={cta ? <StickyActionBar>{cta}</StickyActionBar> : undefined}>
      <ScreenHeader title="Chi tiết đợt" subtitle={r?.ten_chu_dau_tu} onBack={back} />
      {round.loading ? (
        <>
          <Skeleton height={sizes.projectImage} radius={radius['3xl']} />
          <SkeletonCard lines={4} />
        </>
      ) : round.error || !r ? (
        <Card>
          <ErrorState message={round.error ?? undefined} onRetry={() => void round.refetch()} />
        </Card>
      ) : (
        <Grid gutter={isDesktop ? 'lg' : 'md'}>
          <Col span={{ mobile: 12, desktop: 7 }}>
            <View style={styles.column}>
              <ProjectImage uri={r.anh_url ?? undefined} projectName={r.ten_du_an ?? r.ten} height={sizes.projectImage} style={styles.image} />
              <View style={styles.titleBlock}>
                <Badge label={roundStatusMeta[r.tinh_trang].label} tone={roundStatusMeta[r.tinh_trang].tone} dot size="md" />
                <Text variant="title" accessibilityRole="header">
                  {r.ten}
                </Text>
                <InfoLine icon="building" text={[r.ten_du_an, r.ten_chu_dau_tu].filter(Boolean).join(' · ')} />
                {r.dia_chi_du_an ? <InfoLine icon="mapPin" text={r.dia_chi_du_an} /> : null}
              </View>

              {r.mo_ta ? (
                <Section title="Giới thiệu đợt">
                  <Card>
                    {/* Văn bản cấu hình hiển thị dạng chữ thường, giữ xuống dòng (không HTML). */}
                    <Text variant="body" color={semantic.textSecondary}>
                      {r.mo_ta}
                    </Text>
                  </Card>
                </Section>
              ) : null}

              <Section title="Nhóm đối tượng được nộp">
                <Card padding="sm">
                  {r.nhom.map((g, i) => (
                    <GroupRow key={g.id} group={g} last={i === r.nhom.length - 1} />
                  ))}
                </Card>
              </Section>
            </View>
          </Col>

          <Col span={{ mobile: 12, desktop: 5 }}>
            <View style={styles.column}>
              <Card padding="ml" radius="3xl">
                <View style={styles.stats}>
                  <Stat label="Thời gian nhận" value={`${formatDate(r.tu_ngay)} – ${formatDate(r.den_ngay)}`} />
                  <Stat label="Số căn" value={r.so_can != null ? formatNumber(r.so_can) : '—'} />
                  <Stat label="Đã nộp" value={`${formatNumber(r.so_ho_so_da_nop)} hồ sơ`} />
                </View>
                {r.tinh_trang === 'DANG_MO' || r.tinh_trang === 'SAP_MO' ? (
                  <Card variant="sunken" radius="xl" style={styles.countdown}>
                    <Text variant="captionStrong" color={semantic.textMuted}>
                      {r.tinh_trang === 'DANG_MO' ? 'Thời gian còn lại để nộp hồ sơ' : 'Mở nhận hồ sơ sau'}
                    </Text>
                    <Countdown
                      targetMs={Date.parse(r.tinh_trang === 'DANG_MO' ? r.den_ngay : r.tu_ngay)}
                      now={clock.now}
                      onElapsed={() => void round.refetch()}
                      label={r.tinh_trang === 'DANG_MO' ? 'Còn lại để nộp hồ sơ' : 'Mở nhận hồ sơ sau'}
                      variant="title"
                    />
                  </Card>
                ) : null}
              </Card>
              <Card variant="sunken" radius="xl">
                <View style={styles.noteRow}>
                  <Icon name="info" size="md" color={semantic.textBrand} />
                  <Text variant="caption" color={semantic.textSecondary} style={styles.flex}>
                    Mỗi người chỉ được nộp một hồ sơ tại một dự án. Chuẩn bị bản chụp rõ nét các giấy tờ (PDF, JPG, PNG, tối đa 5 MB mỗi tệp) trước khi
                    đăng ký.
                  </Text>
                </View>
              </Card>
            </View>
          </Col>
        </Grid>
      )}
      <ConnectNoxhDialog visible={connectOpen} onClose={() => setConnectOpen(false)} />
      <UpdateCccdDialog
        visible={cccdOpen}
        companyId={r?.company_id ?? null}
        defaultCccd={suggestedCccd}
        onClose={() => setCccdOpen(false)}
        onUpdated={() => {
          setCccdOpen(false);
          goCreate();
        }}
      />
    </Screen>
  );
}

function InfoLine({ icon, text }: { icon: IconName; text: string }) {
  return (
    <View style={styles.infoLine}>
      <Icon name={icon} size="sm" color={semantic.icon} />
      <Text variant="caption" color={semantic.textSecondary} style={styles.flex}>
        {text}
      </Text>
    </View>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.stat}>
      <Text variant="caption" color={semantic.textMuted}>
        {label}
      </Text>
      <Text variant="subhead" numeric>
        {value}
      </Text>
    </View>
  );
}

/** Nhóm đối tượng: bấm để mở/gấp mô tả. */
function GroupRow({ group, last }: { group: NoxhRoundGroup; last: boolean }) {
  const [open, setOpen] = useState(false);
  const { hovered, hoverProps } = useHover();
  const expandable = !!group.mo_ta;
  return (
    <View style={[styles.group, !last && styles.groupDivider]}>
      <Pressable
        {...hoverProps}
        disabled={!expandable}
        onPress={() => setOpen((v) => !v)}
        accessibilityRole={expandable ? 'button' : undefined}
        aria-expanded={expandable ? open : undefined}
        accessibilityLabel={group.ten}
        style={({ pressed }) => [styles.groupHead, expandable && interactive, expandable && (pressed || hovered) && styles.groupHover]}>
        <Icon name="users" size="md" color={semantic.textBrand} />
        <Text variant="bodyStrong" style={styles.flex}>
          {group.ten}
        </Text>
        {expandable ? <Icon name={open ? 'chevronUp' : 'chevronDown'} size="sm" variant="bold" color={semantic.iconMuted} /> : null}
      </Pressable>
      {open && group.mo_ta ? (
        <Text variant="caption" color={semantic.textSecondary} style={styles.groupBody}>
          {group.mo_ta}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  column: { gap: spacing.ml },
  image: { borderRadius: radius['3xl'], overflow: 'hidden' },
  titleBlock: { gap: spacing.sm, alignItems: 'flex-start' },
  infoLine: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm, alignSelf: 'stretch' },
  flex: { flex: 1, minWidth: 0 },
  stats: { gap: spacing.ms },
  stat: { gap: spacing.xs },
  countdown: { marginTop: spacing.md, gap: spacing.xs },
  noteRow: { flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-start' },
  group: { paddingHorizontal: spacing.xs },
  groupDivider: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: semantic.border },
  groupHead: { flexDirection: 'row', alignItems: 'center', gap: spacing.ms, minHeight: sizes.control.lg, paddingHorizontal: spacing.sm, borderRadius: radius.xl },
  groupHover: { backgroundColor: semantic.surfaceMuted },
  groupBody: { paddingHorizontal: spacing.sm, paddingBottom: spacing.ms, paddingLeft: spacing.sm + sizes.icon.md + spacing.ms },
});
