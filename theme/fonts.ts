import {
  BeVietnamPro_600SemiBold,
  BeVietnamPro_700Bold,
} from '@expo-google-fonts/be-vietnam-pro';
import {
  NotoSans_400Regular,
  NotoSans_500Medium,
  NotoSans_600SemiBold,
  NotoSans_700Bold,
} from '@expo-google-fonts/noto-sans';
import Ionicons from '@expo/vector-icons/Ionicons';

import { fontFamily } from './typography';

/** Danh sách font nạp qua `expo-font` khi khởi động ứng dụng. */
export const appFonts = {
  [fontFamily.heading.semibold]: BeVietnamPro_600SemiBold,
  [fontFamily.heading.bold]: BeVietnamPro_700Bold,
  [fontFamily.body.regular]: NotoSans_400Regular,
  [fontFamily.body.medium]: NotoSans_500Medium,
  [fontFamily.body.semibold]: NotoSans_600SemiBold,
  [fontFamily.body.bold]: NotoSans_700Bold,
  ...Ionicons.font,
};
