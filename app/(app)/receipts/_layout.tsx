import { Stack } from 'expo-router';
import { useReducedMotion } from 'react-native-reanimated';

import { semantic } from '@/theme';

export default function NestedStackLayout() {
  // Tắt hiệu ứng chuyển màn khi người dùng bật giảm chuyển động.
  const reduceMotion = useReducedMotion();
  return (
    <Stack
      screenOptions={{ headerShown: false, contentStyle: { backgroundColor: semantic.bg }, animation: reduceMotion ? 'none' : 'default' }}
    />
  );
}
