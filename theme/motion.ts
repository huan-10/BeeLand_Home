import { Platform, type ViewStyle } from 'react-native';

import tokens from './tokens.json';

/** Thời lượng chuyển động dùng chung (ms). */
export const motion = tokens.motion;

/** Style cho phần tử tương tác: con trỏ tay trên web. */
export const interactive: ViewStyle = Platform.OS === 'web' ? { cursor: 'pointer' } : {};
