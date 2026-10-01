import {
  BeVietnamPro_400Regular,
  BeVietnamPro_500Medium,
  BeVietnamPro_600SemiBold,
  BeVietnamPro_700Bold,
} from '@expo-google-fonts/be-vietnam-pro';

import { fontFamily } from './typography';

/** Font nạp qua `expo-font` khi khởi động ứng dụng: Be Vietnam Pro 400 / 500 / 600 / 700. */
export const appFonts = {
  [fontFamily.regular]: BeVietnamPro_400Regular,
  [fontFamily.medium]: BeVietnamPro_500Medium,
  [fontFamily.semibold]: BeVietnamPro_600SemiBold,
  [fontFamily.bold]: BeVietnamPro_700Bold,
};
