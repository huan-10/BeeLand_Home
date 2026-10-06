/**
 * Chọn tệp giấy tờ: chụp ảnh / thư viện ảnh (`expo-image-picker`) hoặc tệp (`expo-document-picker`).
 * Web chỉ dùng "Chọn tệp" (trình duyệt tự mở hộp chọn, phải gọi ngay trong thao tác bấm).
 */
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { Platform } from 'react-native';

import { NOXH_MIME, normalizePickedName } from '@/lib/noxh';
import type { NoxhFormat } from '@/types';

import { ServiceError } from './errors';
import type { PickedFile } from './noxhService';

export type PickSource = 'camera' | 'library' | 'document';

/** Nguồn chọn tệp có trên nền tảng hiện tại. */
export const pickSources: PickSource[] = Platform.OS === 'web' ? ['document'] : ['camera', 'library', 'document'];

const NO_PERMISSION = 'Ứng dụng chưa được cấp quyền dùng camera/ảnh. Vui lòng bật trong Cài đặt.';
/** Nén nhẹ ảnh chụp để vừa giới hạn dung lượng giấy tờ (thường 5 MB). */
const PHOTO_QUALITY = 0.7;

function fromImage(asset: ImagePicker.ImagePickerAsset): PickedFile {
  const type = asset.mimeType ?? 'image/jpeg';
  return {
    name: normalizePickedName(asset.fileName ?? `anh-${Date.now()}.jpg`, type),
    size: asset.fileSize ?? asset.file?.size ?? 0,
    type,
    uri: asset.uri,
    // Web: gửi thẳng File khi tải lên; native gửi `{ uri, name, type }`.
    ...(asset.file ? { blob: asset.file } : {}),
  };
}

/** Mở nguồn chọn (lọc theo định dạng của giấy tờ); người dùng huỷ → `null`. */
export async function pickFile(source: PickSource, formats: NoxhFormat[]): Promise<PickedFile | null> {
  if (source === 'camera') {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) throw new ServiceError(NO_PERMISSION);
    const res = await ImagePicker.launchCameraAsync({ mediaTypes: 'images', quality: PHOTO_QUALITY });
    return res.canceled || !res.assets[0] ? null : fromImage(res.assets[0]);
  }
  if (source === 'library') {
    if (Platform.OS !== 'web') {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) throw new ServiceError(NO_PERMISSION);
    }
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: 'images', quality: PHOTO_QUALITY });
    return res.canceled || !res.assets[0] ? null : fromImage(res.assets[0]);
  }
  const res = await DocumentPicker.getDocumentAsync({ type: formats.map((f) => NOXH_MIME[f]), copyToCacheDirectory: true, base64: false });
  const asset = res.canceled ? null : res.assets[0];
  if (!asset) return null;
  return {
    name: asset.name,
    size: asset.size ?? asset.file?.size ?? 0,
    type: asset.mimeType ?? asset.file?.type ?? null,
    uri: asset.uri,
    ...(asset.file ? { blob: asset.file } : {}),
  };
}
