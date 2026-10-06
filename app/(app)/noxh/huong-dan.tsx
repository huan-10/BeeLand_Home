import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { Col, Grid, Screen, Section } from '@/components/layout';
import { Card, Icon, IconCircle, ScreenHeader, Text } from '@/components/ui';
import { useBreakpoint } from '@/hooks/useBreakpoint';
import { semantic, spacing, type IconName } from '@/theme';

const STEPS: { icon: IconName; title: string; text: string }[] = [
  { icon: 'user', title: 'Đăng nhập ứng dụng', text: 'Dùng tài khoản ứng dụng hiện có (số điện thoại hoặc CCCD). Lần đầu vào mục này, nhập lại mật khẩu để kết nối.' },
  { icon: 'document', title: 'Chọn đợt và nộp hồ sơ', text: 'Chọn đợt đang mở, nhóm đối tượng, loại căn hộ; khai thông tin cá nhân và tải đủ giấy tờ bắt buộc rồi bấm Nộp hồ sơ.' },
  { icon: 'shieldCheck', title: 'Xác minh', text: 'Chủ đầu tư kiểm tra hồ sơ, có thể yêu cầu bổ sung. Hồ sơ đủ điều kiện được gửi Sở Xây dựng chấp thuận.' },
  { icon: 'trophy', title: 'Bốc thăm online', text: 'Hồ sơ được chấp thuận được xếp lịch bốc thăm. Vào ứng dụng đúng khung giờ để tự bốc thăm và xem kết quả ngay.' },
];

/** 11 nhóm đối tượng mặc định theo Luật Nhà ở 2023 (danh sách nạp sẵn của hệ thống). */
const GROUPS = [
  'Người có công với cách mạng, thân nhân liệt sĩ',
  'Hộ nghèo, cận nghèo khu vực nông thôn',
  'Hộ nghèo, cận nghèo khu vực nông thôn thường xuyên bị thiên tai',
  'Hộ nghèo, cận nghèo khu vực đô thị',
  'Người thu nhập thấp khu vực đô thị',
  'Công nhân, người lao động trong doanh nghiệp, hợp tác xã',
  'Lực lượng vũ trang nhân dân',
  'Cán bộ, công chức, viên chức',
  'Đối tượng đã trả lại nhà ở công vụ',
  'Hộ gia đình, cá nhân bị thu hồi đất, giải toả nhà ở',
  'Học sinh, sinh viên (chỉ thuê)',
];

const DOCS = [
  'Đơn đăng ký mua nhà ở xã hội (theo mẫu, tải trong ứng dụng)',
  'Bản sao Căn cước công dân',
  'Giấy xác nhận thực trạng nhà ở',
  'Giấy xác nhận thu nhập',
  'Giấy tờ chứng minh đối tượng',
  'Giấy xác nhận đối tượng ưu tiên (nếu có)',
  'Giấy xác nhận cư trú',
  'Hồ sơ khác (nếu có)',
];

const TIPS = [
  'Chụp rõ nét, đủ 4 góc giấy tờ, không loá sáng.',
  'Định dạng PDF, JPG hoặc PNG; mỗi tệp tối đa 5 MB (theo cấu hình từng giấy tờ).',
  'iPhone: nếu ảnh ở định dạng HEIC, vào Cài đặt › Camera › Định dạng › chọn "Tương thích nhất".',
  'Mỗi người chỉ được có một hồ sơ còn hiệu lực tại một dự án.',
];

export default function NoxhGuideScreen() {
  const { isDesktop } = useBreakpoint();
  return (
    <Screen>
      <ScreenHeader title="Hướng dẫn" subtitle="Mua nhà ở xã hội trên ứng dụng" onBack={() => (router.canGoBack() ? router.back() : router.replace('/noxh'))} />
      <Grid gutter={isDesktop ? 'lg' : 'md'}>
        <Col span={{ mobile: 12, desktop: 6 }}>
          <View style={styles.column}>
            <Section title="Quy trình 4 bước">
              <Card padding="ml">
                <View style={styles.list} role="list">
                  {STEPS.map((s, i) => (
                    <View key={s.title} style={styles.stepRow} role="listitem">
                      <IconCircle name={s.icon} tone="primary" size="md" />
                      <View style={styles.flex}>
                        <Text variant="bodyStrong" weight="semibold">
                          {i + 1}. {s.title}
                        </Text>
                        <Text variant="caption" color={semantic.textSecondary}>
                          {s.text}
                        </Text>
                      </View>
                    </View>
                  ))}
                </View>
              </Card>
            </Section>
            <Section title="Lưu ý khi chụp giấy tờ">
              <BulletCard items={TIPS} icon="camera" />
            </Section>
          </View>
        </Col>
        <Col span={{ mobile: 12, desktop: 6 }}>
          <View style={styles.column}>
            <Section title="Giấy tờ cần chuẩn bị">
              <BulletCard items={DOCS} icon="document" />
            </Section>
            <Section title="Nhóm đối tượng">
              <BulletCard items={GROUPS} icon="users" />
            </Section>
          </View>
        </Col>
      </Grid>
    </Screen>
  );
}

function BulletCard({ items, icon }: { items: string[]; icon: IconName }) {
  return (
    <Card padding="ml">
      <View style={styles.list} role="list">
        {items.map((t) => (
          <View key={t} style={styles.bullet} role="listitem">
            <Icon name={icon} size="sm" color={semantic.textBrand} />
            <Text variant="body" color={semantic.textSecondary} style={styles.flex}>
              {t}
            </Text>
          </View>
        ))}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  column: { gap: spacing.ml },
  list: { gap: spacing.ms },
  stepRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.ms },
  bullet: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  flex: { flex: 1, minWidth: 0, gap: spacing.xs },
});
