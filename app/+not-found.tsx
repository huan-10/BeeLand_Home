import { router, Stack } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { EmptyState } from '@/components/ui';
import { semantic } from '@/theme';

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'Không tìm thấy trang' }} />
      <View style={styles.container}>
        <EmptyState
          icon="compass"
          title="Không tìm thấy trang"
          description="Đường dẫn bạn truy cập không tồn tại hoặc đã bị thay đổi."
          actionLabel="Về trang chủ"
          onAction={() => router.replace('/')}
        />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: semantic.bg },
});
