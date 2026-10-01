import { StyleSheet, View } from 'react-native';

import { colors, type IconName } from '@/theme';

import { Button } from './Button';
import { Icon } from './Icon';
import { Text } from './Text';

export interface EmptyStateProps {
  icon?: IconName;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({ icon = 'file-tray-outline', title, description, actionLabel, onAction }: EmptyStateProps) {
  return (
    <View style={styles.container}>
      <View style={styles.iconWrap}>
        <Icon name={icon} size={32} color={colors.primary[500]} />
      </View>
      <Text variant="h3" align="center">
        {title}
      </Text>
      {description ? (
        <Text variant="small" color={colors.gray[500]} align="center" style={styles.description}>
          {description}
        </Text>
      ) : null}
      {actionLabel && onAction ? (
        <Button title={actionLabel} variant="secondary" size="sm" onPress={onAction} style={styles.action} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', justifyContent: 'center', paddingVertical: 48, paddingHorizontal: 24, gap: 8 },
  iconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.primary[50],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  description: { maxWidth: 320 },
  action: { marginTop: 12 },
});
