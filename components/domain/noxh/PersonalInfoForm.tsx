import { forwardRef, useEffect, useImperativeHandle, useRef, useState, type ReactNode } from 'react';
import { StyleSheet, View, type TextInput } from 'react-native';

import { Card, Checkbox, Chip, Icon, Input, Text } from '@/components/ui';
import { maskDate, parseDisplayDate, toDisplayDate, type PersonalInfoErrors, type PersonalInfoField } from '@/lib/noxhForm';
import { getProvinces, getWards, type Place } from '@/services';
import { colors, semantic, sizes, spacing } from '@/theme';
import type { NoxhAddress, NoxhCustomerSnapshot, NoxhGender, NoxhLoaiCan } from '@/types';

import { PickerDialog } from './PickerDialog';
import { SelectField } from './SelectField';

export interface PersonalInfoFormHandle {
  /** Đưa focus tới ô (từ `FormErrorSummary`). */
  focusField: (field: string) => void;
}

export interface PersonalInfoFormProps {
  value: NoxhCustomerSnapshot;
  loaiCanId: string | null;
  loaiCan: NoxhLoaiCan[];
  errors: PersonalInfoErrors;
  onChange: (value: NoxhCustomerSnapshot, loaiCanId: string | null) => void;
}

const GENDERS: Exclude<NoxhGender, ''>[] = ['Nam', 'Nữ', 'Khác'];

/** Form Thông tin cá nhân NOXH — CCCD và SĐT khoá theo tài khoản (máy chủ ép). */
export const PersonalInfoForm = forwardRef<PersonalInfoFormHandle, PersonalInfoFormProps>(function PersonalInfoForm(
  { value, loaiCanId, loaiCan, errors, onChange },
  ref,
) {
  const inputs = useRef<Partial<Record<PersonalInfoField | 'ngay_cap', TextInput | null>>>({});
  useImperativeHandle(ref, () => ({ focusField: (f) => inputs.current[f as PersonalInfoField]?.focus() }), []);

  const set = (patch: Partial<NoxhCustomerSnapshot>) => onChange({ ...value, ...patch }, loaiCanId);

  return (
    <View style={styles.form}>
      <FormCard title="Thông tin người đăng ký" icon="idCard">
        <Input
          ref={(r) => {
            inputs.current.ten_kh = r;
          }}
          label="Họ và tên *"
          value={value.ten_kh}
          onChangeText={(t) => set({ ten_kh: t })}
          error={errors.ten_kh}
          autoComplete="name"
          autoCapitalize="words"
        />
        <View style={styles.row2}>
          <View style={styles.cell}>
            <DateInput
              ref={(r) => {
                inputs.current.ngay_sinh = r;
              }}
              label="Ngày sinh *"
              iso={value.ngay_sinh}
              onChange={(iso) => set({ ngay_sinh: iso })}
              error={errors.ngay_sinh}
            />
          </View>
          <View style={styles.cell}>
            <Text variant="captionStrong" weight="semibold" color={semantic.textSecondary}>
              Giới tính *
            </Text>
            <View style={styles.chips} role="radiogroup" aria-label="Giới tính">
              {GENDERS.map((g) => (
                <Chip key={g} label={g} selected={value.gioi_tinh === g} accessibilityLabel={`Giới tính ${g}${value.gioi_tinh === g ? ', đang chọn' : ''}`} onPress={() => set({ gioi_tinh: g })} />
              ))}
            </View>
            {errors.gioi_tinh ? <FieldError message={errors.gioi_tinh} /> : null}
          </View>
        </View>
        <View style={styles.row2}>
          <View style={styles.cell}>
            <Input label="Số CCCD" value={value.cccd} editable={false} hint="Theo tài khoản đăng nhập" icon="lock" />
          </View>
          <View style={styles.cell}>
            <DateInput
              ref={(r) => {
                inputs.current.ngay_cap = r;
              }}
              label="Ngày cấp"
              iso={value.ngay_cap}
              onChange={(iso) => set({ ngay_cap: iso })}
            />
          </View>
        </View>
        <Input label="Nơi cấp" value={value.noi_cap} onChangeText={(t) => set({ noi_cap: t })} />
        <View style={styles.row2}>
          <View style={styles.cell}>
            <Input label="Số điện thoại" value={value.di_dong} editable={false} hint="Theo tài khoản đăng nhập" icon="lock" />
          </View>
          <View style={styles.cell}>
            <Input
              ref={(r) => {
                inputs.current.email = r;
              }}
              label="Email"
              value={value.email}
              onChangeText={(t) => set({ email: t })}
              error={errors.email}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
            />
          </View>
        </View>
      </FormCard>

      <FormCard title="Địa chỉ thường trú *" icon="mapPin">
        <AddressFields
          prefix="tt"
          label="địa chỉ thường trú"
          value={value.thuong_tru}
          errors={errors}
          inputRef={(r) => {
            inputs.current.tt_dia_chi = r;
          }}
          onChange={(a) => set({ thuong_tru: a, ...(value.hien_tai_giong_thuong_tru ? { hien_tai: { ...a } } : {}) })}
        />
      </FormCard>

      <FormCard title="Địa chỉ hiện tại" icon="home">
        <Checkbox
          label="Giống địa chỉ thường trú"
          checked={value.hien_tai_giong_thuong_tru}
          onChange={(checked) => set({ hien_tai_giong_thuong_tru: checked, ...(checked ? { hien_tai: { ...value.thuong_tru } } : {}) })}
        />
        {!value.hien_tai_giong_thuong_tru ? (
          <AddressFields
            prefix="ht"
            label="địa chỉ hiện tại"
            value={value.hien_tai}
            errors={errors}
            inputRef={(r) => {
              inputs.current.ht_dia_chi = r;
            }}
            onChange={(a) => set({ hien_tai: a })}
          />
        ) : null}
      </FormCard>

      <FormCard title="Loại căn hộ đăng ký *" icon="building">
        <View style={styles.chips} role="radiogroup" aria-label="Loại căn hộ">
          {loaiCan.map((l) => (
            <Chip
              key={l.id}
              label={l.ten}
              selected={loaiCanId === l.id}
              accessibilityLabel={`${l.ten}${loaiCanId === l.id ? ', đang chọn' : ''}`}
              onPress={() => onChange(value, l.id)}
            />
          ))}
        </View>
        {errors.loai_can ? <FieldError message={errors.loai_can} /> : null}
      </FormCard>
    </View>
  );
});

function FormCard({ title, icon, children }: { title: string; icon: 'idCard' | 'mapPin' | 'home' | 'building'; children: ReactNode }) {
  return (
    <Card padding="ml">
      <View style={styles.cardHead}>
        <Icon name={icon} size="md" color={semantic.textBrand} />
        <Text variant="heading" accessibilityRole="header">
          {title}
        </Text>
      </View>
      <View style={styles.fields}>{children}</View>
    </Card>
  );
}

function FieldError({ message }: { message: string }) {
  return (
    <View style={styles.error} role="alert">
      <Icon name="alertCircle" size="sm" color={colors.danger[700]} />
      <Text variant="caption" color={colors.danger[700]}>
        {message}
      </Text>
    </View>
  );
}

/** Ô ngày dd/MM/yyyy có tự chèn "/", lưu dạng yyyy-MM-dd. */
const DateInput = forwardRef<TextInput, { label: string; iso: string | null; onChange: (iso: string | null) => void; error?: string }>(function DateInput(
  { label, iso, onChange, error },
  ref,
) {
  const [text, setText] = useState(toDisplayDate(iso));
  const [prevIso, setPrevIso] = useState(iso);
  // Giá trị đổi từ ngoài (tải hồ sơ / khôi phục nháp) → cập nhật chữ đang hiển thị (state suy ra trong lúc render).
  if (iso !== prevIso) {
    setPrevIso(iso);
    if (parseDisplayDate(text) !== iso) setText(toDisplayDate(iso));
  }
  const complete = text.length === 10;
  const invalid = complete && !parseDisplayDate(text);
  return (
    <Input
      ref={ref}
      label={label}
      value={text}
      placeholder="dd/mm/yyyy"
      keyboardType="number-pad"
      maxLength={10}
      icon="calendar"
      error={invalid ? 'Ngày không hợp lệ' : error}
      onChangeText={(t) => {
        const masked = maskDate(t);
        setText(masked);
        onChange(masked.length === 10 ? parseDisplayDate(masked) : null);
      }}
    />
  );
});

function AddressFields({
  prefix,
  label,
  value,
  errors,
  onChange,
  inputRef,
}: {
  prefix: 'tt' | 'ht';
  label: string;
  value: NoxhAddress;
  errors: PersonalInfoErrors;
  onChange: (a: NoxhAddress) => void;
  inputRef: (r: TextInput | null) => void;
}) {
  const [provinces, setProvinces] = useState<Place[]>([]);
  const [wards, setWards] = useState<{ province: string; list: Place[] }>({ province: '', list: [] });
  const [picker, setPicker] = useState<'tinh' | 'xa' | null>(null);

  useEffect(() => {
    getProvinces().then(setProvinces).catch(() => setProvinces([]));
  }, []);
  useEffect(() => {
    const province = value.ma_tinh;
    if (!province) return;
    getWards(province)
      .then((list) => setWards({ province, list }))
      .catch(() => setWards({ province, list: [] }));
  }, [value.ma_tinh]);
  // Chỉ dùng danh sách xã của đúng tỉnh đang chọn (tránh hiện xã tỉnh cũ khi đang tải).
  const wardItems = value.ma_tinh && wards.province === value.ma_tinh ? wards.list.map((w) => ({ value: w.code, label: w.name })) : [];

  return (
    <>
      <View style={styles.row2}>
        <View style={styles.cell}>
          <SelectField label="Tỉnh/Thành phố" value={value.ten_tinh} placeholder="Chọn tỉnh/thành phố" error={errors[`${prefix}_tinh`]} onPress={() => setPicker('tinh')} />
        </View>
        <View style={styles.cell}>
          <SelectField
            label="Phường/Xã"
            value={value.ten_xa}
            placeholder={value.ma_tinh ? 'Chọn phường/xã' : 'Chọn tỉnh trước'}
            disabled={!value.ma_tinh}
            error={errors[`${prefix}_xa`]}
            onPress={() => setPicker('xa')}
          />
        </View>
      </View>
      <Input
        ref={inputRef}
        label="Số nhà, đường, thôn/xóm"
        value={value.dia_chi}
        onChangeText={(t) => onChange({ ...value, dia_chi: t })}
        error={errors[`${prefix}_dia_chi`]}
        accessibilityLabel={`Số nhà, đường của ${label}`}
      />
      <PickerDialog
        visible={picker === 'tinh'}
        title="Chọn tỉnh/thành phố"
        items={provinces.map((p) => ({ value: p.code, label: p.name }))}
        value={value.ma_tinh}
        onClose={() => setPicker(null)}
        onSelect={(i) => {
          setPicker(null);
          if (i.value !== value.ma_tinh) onChange({ ...value, ma_tinh: i.value, ten_tinh: i.label, ma_xa: '', ten_xa: '' });
        }}
      />
      <PickerDialog
        visible={picker === 'xa'}
        title="Chọn phường/xã"
        items={wardItems}
        value={value.ma_xa}
        onClose={() => setPicker(null)}
        onSelect={(i) => {
          setPicker(null);
          onChange({ ...value, ma_xa: i.value, ten_xa: i.label });
        }}
      />
    </>
  );
}

const styles = StyleSheet.create({
  form: { gap: spacing.ml },
  cardHead: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.md },
  fields: { gap: spacing.md },
  row2: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  cell: { flexGrow: 1, flexBasis: sizes.formColumnMin, gap: spacing.sm },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  error: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
});
