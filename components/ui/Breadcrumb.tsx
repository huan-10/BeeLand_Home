import { Fragment } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { hitSlop, interactive, semantic, spacing } from '@/theme';

import { Icon } from './Icon';
import { Text } from './Text';

export interface BreadcrumbItem {
  label: string;
  /** Không có → mục hiện tại (`aria-current="page"`). */
  onPress?: () => void;
}

/** Đường dẫn phân cấp (web/desktop): "Hợp đồng › HDMB/2026/001". */
export function Breadcrumb({ items }: { items: BreadcrumbItem[] }) {
  return (
    <View style={styles.row} role="navigation" aria-label="Đường dẫn">
      {items.map((item, i) => (
        <Fragment key={`${item.label}-${i}`}>
          {i > 0 ? <Icon name="chevron-forward" size="xs" color={semantic.iconMuted} /> : null}
          {item.onPress ? (
            <Pressable onPress={item.onPress} accessibilityRole="link" hitSlop={hitSlop} style={interactive}>
              <Text variant="smallMedium" color={semantic.textBrand}>
                {item.label}
              </Text>
            </Pressable>
          ) : (
            <Text variant="smallMedium" color={semantic.textMuted} aria-current="page">
              {item.label}
            </Text>
          )}
        </Fragment>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: spacing.xs },
});
