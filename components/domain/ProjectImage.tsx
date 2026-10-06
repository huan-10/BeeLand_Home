import { LinearGradient } from 'expo-linear-gradient';
import { useState, type ReactNode } from 'react';
import { Image, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { Icon } from '@/components/ui';
import { colors, sizes, spacing } from '@/theme';

export interface ProjectImageProps {
  /** Ảnh thật của dự án (`du_an_anh` / `da_projects.image_url`). */
  uri?: string;
  projectName: string;
  height: number;
  /** Nội dung đặt trên ảnh (tên dự án, trạng thái…); có thì phủ lớp tối dần xuống dưới để chữ trắng đọc được. */
  children?: ReactNode;
  style?: StyleProp<ViewStyle>;
}

/**
 * Ảnh dự án tràn khung, kích thước cố định để không nhảy bố cục.
 * Chưa có ảnh / tải lỗi → nền gradient xanh trời + biểu tượng toà nhà (không dùng ảnh minh hoạ giả).
 */
export function ProjectImage({ uri, projectName, height, children, style }: ProjectImageProps) {
  const [failed, setFailed] = useState(false);
  const hasImage = !!uri && !failed;
  return (
    <View style={[styles.frame, { height }, style]}>
      {hasImage ? (
        <Image
          source={{ uri }}
          resizeMode="cover"
          onError={() => setFailed(true)}
          accessibilityLabel={`Ảnh dự án ${projectName}`}
          style={StyleSheet.absoluteFill}
        />
      ) : (
        <LinearGradient
          colors={[colors.primary[100], colors.primary[300]]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[StyleSheet.absoluteFill, styles.fallback]}
          accessibilityLabel={`Dự án ${projectName} chưa có ảnh`}>
          <Icon name="building" size={sizes.icon.xl} color={colors.primary[700]} />
        </LinearGradient>
      )}
      {children ? (
        <>
          <LinearGradient
            colors={[colors.overlay.imageScrimTop, colors.overlay.imageScrimBottom]}
            start={{ x: 0, y: 0.25 }}
            end={{ x: 0, y: 1 }}
            style={StyleSheet.absoluteFill}
            pointerEvents="none"
          />
          <View style={styles.content}>{children}</View>
        </>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  frame: { width: '100%', backgroundColor: colors.primary[50], overflow: 'hidden' },
  fallback: { alignItems: 'center', justifyContent: 'center' },
  content: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, padding: spacing.md, justifyContent: 'space-between' },
});
