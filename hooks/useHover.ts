import { useState } from 'react';

/**
 * Trạng thái hover cho Pressable (chỉ phát sinh trên web / con trỏ chuột).
 * Dùng: `const { hovered, hoverProps } = useHover(); <Pressable {...hoverProps} />`.
 */
export function useHover() {
  const [hovered, setHovered] = useState(false);
  return {
    hovered,
    hoverProps: { onHoverIn: () => setHovered(true), onHoverOut: () => setHovered(false) },
  };
}
