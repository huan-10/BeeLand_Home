import * as SplashScreen from 'expo-splash-screen';
import * as Updates from 'expo-updates';
import { useEffect, useState } from 'react';

import { progressPercent, runOtaUpdate } from '@/lib/otaUpdate';

/**
 * Hỏi máy chủ EAS Update một lần khi mở app. Có bản mới → `updating` = true (hiện màn chờ), tải xong tự reload.
 * Dev / Expo Go / web (expo-updates tắt) → bỏ qua. Lỗi mạng / máy chủ → vào app bằng bản đang có.
 */
export function useOtaUpdate(): { updating: boolean; percent: number | null } {
  const [updating, setUpdating] = useState(false);
  const { downloadProgress } = Updates.useUpdates();

  useEffect(() => {
    if (__DEV__ || !Updates.isEnabled) return;
    void runOtaUpdate({
      check: Updates.checkForUpdateAsync,
      fetch: Updates.fetchUpdateAsync,
      reload: Updates.reloadAsync,
      onUpdating: () => {
        setUpdating(true);
        // Màn chờ phải hiện ngay, không nằm sau splash (splash chờ phiên đăng nhập).
        void SplashScreen.hideAsync();
      },
    }).then((result) => {
      if (result === 'error') setUpdating(false);
    });
  }, []);

  return { updating, percent: updating ? progressPercent(downloadProgress) : null };
}
