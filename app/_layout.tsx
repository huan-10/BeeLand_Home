import '../global.css';

import { useFonts } from 'expo-font';
import { DefaultTheme, Stack, ThemeProvider, type Theme } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useReducedMotion } from 'react-native-reanimated';

import { Logo } from '@/components/layout';
import { ToastProvider } from '@/components/ui';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { appFonts, colors, semantic, spacing } from '@/theme';

export {
  // Bắt lỗi render của toàn bộ cây điều hướng.
  ErrorBoundary,
} from 'expo-router';

SplashScreen.preventAutoHideAsync();

const navigationTheme: Theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: semantic.brand,
    background: semantic.bg,
    card: semantic.surface,
    text: semantic.text,
    border: semantic.borderSubtle,
    notification: colors.danger[600],
  },
};

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts(appFonts);

  useEffect(() => {
    if (fontError) throw fontError;
  }, [fontError]);

  if (!fontsLoaded) return null;

  return (
    <SafeAreaProvider>
      <ThemeProvider value={navigationTheme}>
        <ToastProvider>
          <AuthProvider>
            <StatusBar style="dark" />
            <RootNavigator />
          </AuthProvider>
        </ToastProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

function RootNavigator() {
  const { status } = useAuth();
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (status !== 'loading') void SplashScreen.hideAsync();
  }, [status]);

  if (status === 'loading') {
    return (
      <View style={styles.loading}>
        <Logo size="xl" />
        <ActivityIndicator color={semantic.brand} accessibilityLabel="Đang tải" />
      </View>
    );
  }

  const isAuthenticated = status === 'authenticated';

  return (
    <Stack
      screenOptions={{ headerShown: false, contentStyle: { backgroundColor: semantic.bg }, animation: reduceMotion ? 'none' : 'default' }}>
      <Stack.Protected guard={isAuthenticated}>
        <Stack.Screen name="(app)" />
      </Stack.Protected>
      <Stack.Protected guard={!isAuthenticated}>
        <Stack.Screen name="login" options={{ title: 'Đăng nhập' }} />
        <Stack.Screen name="register" options={{ title: 'Đăng ký' }} />
        <Stack.Screen name="forgot-password" options={{ title: 'Quên mật khẩu' }} />
      </Stack.Protected>
    </Stack>
  );
}

const styles = StyleSheet.create({
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.lg, backgroundColor: semantic.bg },
});
