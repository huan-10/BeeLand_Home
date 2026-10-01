import type Ionicons from '@expo/vector-icons/Ionicons';
import type { ComponentProps } from 'react';

/**
 * Bộ icon duy nhất của dự án: Ionicons (@expo/vector-icons).
 * Quy ước: icon outline cho trạng thái thường, bản filled cho trạng thái đang chọn. Không dùng emoji.
 */
export type IconName = ComponentProps<typeof Ionicons>['name'];
