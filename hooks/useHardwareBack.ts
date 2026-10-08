import { useFocusEffect } from 'expo-router';
import { useCallback, useRef } from 'react';
import { BackHandler, Platform } from 'react-native';

/**
 * Nút Back vật lý (Android) khi màn đang hiển thị: gọi `onBack` thay cho mặc định của thanh tab
 * (mặc định lùi về tab đầu — Trang chủ — khi màn là tab ẩn hoặc nhánh không còn màn dưới).
 * `onBack` trả `false` → để hệ thống xử lý như cũ.
 */
export function useHardwareBack(onBack: () => boolean): void {
  const ref = useRef(onBack);
  ref.current = onBack;
  useFocusEffect(
    useCallback(() => {
      if (Platform.OS !== 'android') return undefined;
      const sub = BackHandler.addEventListener('hardwareBackPress', () => ref.current());
      return () => sub.remove();
    }, []),
  );
}
