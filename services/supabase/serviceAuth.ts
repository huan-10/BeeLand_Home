import AsyncStorage from '@react-native-async-storage/async-storage';

import { serializeServiceJwt, serviceAccountKey, usableServiceJwt, type ServiceJwtCache } from '@/lib/serviceJwtCache';

import { SERVICE_ACCOUNT } from '../config';
import { ServiceError } from '../errors';
import { edge, str } from './client';

const JWT_KEY = 'beesky.serviceJwt';

let cached: ServiceJwtCache | null = null;

function parse(raw: string | null): unknown {
  try {
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null; // Bộ nhớ hỏng → đăng nhập lại.
  }
}

/**
 * JWT của tài khoản hệ thống (đăng nhập `cloud-auth` như app 2026), dùng để tra `cloud_customers`
 * và tạo tài khoản cổng khách hàng. Lưu lại tới khi gần hết hạn — mỗi lần đăng nhập server ghi thêm một phiên.
 * JWT lưu đệm gắn với tài khoản đã cấp nó: đổi tài khoản trong `.env.local` → bỏ JWT cũ (`lib/serviceJwtCache.ts`).
 */
export async function getServiceJwt(forceRefresh = false): Promise<string> {
  const { company, email, password } = SERVICE_ACCOUNT;
  const account = serviceAccountKey({ company, email });
  if (!forceRefresh) {
    if (!cached) {
      const stored = parse(await AsyncStorage.getItem(JWT_KEY).catch(() => null));
      if (usableServiceJwt(stored, account, Date.now())) cached = stored as ServiceJwtCache;
    }
    const jwt = usableServiceJwt(cached, account, Date.now());
    if (jwt) return jwt;
  }
  if (!company || !email || !password) {
    throw new ServiceError('Ứng dụng chưa được cấu hình kết nối hệ thống. Vui lòng liên hệ chủ đầu tư.', 'UNKNOWN');
  }
  const res = await edge<Record<string, unknown>>('cloud-auth', {
    action: 'login',
    maCTDK: company,
    email,
    password,
    typeAccount: 'SYSTEM',
  });
  const jwt = str(res?.jwt);
  if (Number(res?.status) !== 200 || !jwt) {
    if (__DEV__) console.log('[serviceAuth] cloud-auth lỗi:', res?.status, res?.message);
    throw new ServiceError('Không kết nối được hệ thống khách hàng. Vui lòng thử lại sau.', 'UNKNOWN');
  }
  const expiresAt = Date.parse(str(res.jwtExpiresAt)) || Date.now() + 60 * 60 * 1000;
  cached = { jwt, expiresAt, account };
  await AsyncStorage.setItem(JWT_KEY, serializeServiceJwt(cached)).catch(() => undefined);
  return jwt;
}
