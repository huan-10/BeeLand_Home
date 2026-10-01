import { useState } from 'react';
import { Image, StyleSheet, type StyleProp, type ImageStyle } from 'react-native';

import { colors } from '@/theme';

const placeholder = require('@/assets/images/project-placeholder.jpg');

export interface ProjectImageProps {
  uri?: string;
  projectName: string;
  height: number;
  style?: StyleProp<ImageStyle>;
}

/** Ảnh dự án; không có URL hoặc tải lỗi → ảnh minh họa mặc định. Kích thước cố định để không nhảy bố cục. */
export function ProjectImage({ uri, projectName, height, style }: ProjectImageProps) {
  const [failed, setFailed] = useState(false);
  const source = uri && !failed ? { uri } : placeholder;
  return (
    <Image
      source={source}
      resizeMode="cover"
      onError={() => setFailed(true)}
      accessibilityLabel={`Ảnh dự án ${projectName}`}
      style={[styles.image, { height }, style]}
    />
  );
}

const styles = StyleSheet.create({
  image: { width: '100%', backgroundColor: colors.primary[50] },
});
