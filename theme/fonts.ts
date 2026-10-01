import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';
import Ionicons from '@expo/vector-icons/Ionicons';

import { fontFamily } from './typography';

/** Danh sách font nạp qua `expo-font` khi khởi động ứng dụng. */
export const appFonts = {
  [fontFamily.regular]: Inter_400Regular,
  [fontFamily.medium]: Inter_500Medium,
  [fontFamily.semibold]: Inter_600SemiBold,
  [fontFamily.bold]: Inter_700Bold,
  ...Ionicons.font,
};
