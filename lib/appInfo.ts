import Constants from 'expo-constants';
import * as Updates from 'expo-updates';
import { Platform } from 'react-native';

import { shortBundleId } from './otaUpdate';

const platformLabels: Record<string, string> = { ios: 'iOS', android: 'Android', web: 'Web' };

/**
 * "Phiên bản 1.1 · iOS · 0199f3a2" — lấy từ app.json (`expo.version`) + 8 ký tự mã bản OTA đang chạy
 * ("gốc" = bản đóng gói trong build, chưa nhận OTA). Web / dev không có OTA → bỏ phần mã bản.
 */
export function appVersionLabel(): string {
  const version = Constants.expoConfig?.version ?? '—';
  const base = `Phiên bản ${version} · ${platformLabels[Platform.OS] ?? Platform.OS}`;
  if (!Updates.isEnabled) return base;
  return `${base} · ${shortBundleId(Updates.updateId, Updates.isEmbeddedLaunch)}`;
}
