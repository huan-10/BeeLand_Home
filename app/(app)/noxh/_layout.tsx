import { Stack } from 'expo-router';
import { useReducedMotion } from 'react-native-reanimated';

import { semantic } from '@/theme';

/**
 * Màn gốc của nhánh luôn nằm dưới màn con khi mở thẳng màn con (deep link, hoặc `router.push(…, { withAnchor: true })`
 * từ tab khác) → bấm quay lại về màn gốc của nhánh thay vì thoát ra Trang chủ.
 */
export const unstable_settings = { anchor: 'index' };

export default function NestedStackLayout() {
  // Tắt hiệu ứng chuyển màn khi người dùng bật giảm chuyển động.
  const reduceMotion = useReducedMotion();
  return (
    <Stack
      screenOptions={{ headerShown: false, contentStyle: { backgroundColor: semantic.bg }, animation: reduceMotion ? 'none' : 'default' }}
    />
  );
}
