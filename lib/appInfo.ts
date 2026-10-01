import Constants from 'expo-constants';
import { Platform } from 'react-native';

const platformLabels: Record<string, string> = { ios: 'iOS', android: 'Android', web: 'Web' };

/** "Phiên bản 1.0.0 · Web" — lấy từ app.json (`expo.version`). */
export function appVersionLabel(): string {
  const version = Constants.expoConfig?.version ?? '—';
  return `Phiên bản ${version} · ${platformLabels[Platform.OS] ?? Platform.OS}`;
}
