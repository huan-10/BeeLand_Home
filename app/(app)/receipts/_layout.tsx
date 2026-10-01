import { Stack } from 'expo-router';

import { semantic } from '@/theme';

export default function NestedStackLayout() {
  return <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: semantic.bg } }} />;
}
