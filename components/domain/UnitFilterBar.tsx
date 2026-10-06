import { Chip, ChipBar } from '@/components/ui';

export interface UnitFilterBarProps {
  /** Mã căn có trong dữ liệu (`unitCodesOf`). */
  units: string[];
  /** `null` = Tất cả. */
  value: string | null;
  onChange: (unit: string | null) => void;
  /** Ví dụ "Lọc hợp đồng theo căn". */
  accessibilityLabel: string;
}

/**
 * Hàng chip gọn "Tất cả · <mã căn>…" vuốt ngang. Khách chỉ có một căn → ẩn hẳn (lọc không có tác dụng).
 */
export function UnitFilterBar({ units, value, onChange, accessibilityLabel }: UnitFilterBarProps) {
  if (units.length < 2) return null;
  return (
    <ChipBar accessibilityLabel={accessibilityLabel}>
      <Chip size="sm" role="tab" label="Tất cả" accessibilityLabel="Tất cả các căn" selected={value === null} onPress={() => onChange(null)} />
      {units.map((u) => (
        <Chip key={u} size="sm" role="tab" label={u} accessibilityLabel={`Căn ${u}`} selected={value === u} onPress={() => onChange(u)} />
      ))}
    </ChipBar>
  );
}
