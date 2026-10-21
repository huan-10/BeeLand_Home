# Cập nhật OTA khi mở app (EAS Update)

App dùng **EAS Update** (`expo-updates`, `app.json` › `updates.url`, `runtimeVersion.policy = appVersion`).
Không dùng hot-updater như BeePoker: hai cơ chế cùng thay chỗ nạp bundle native nên không chạy song song được.
App admin `beeland-app_2026` làm cùng cách (`beeland-app_2026/docs/ota-update.md`).

## Luồng khi mở app (`hooks/useOtaUpdate.ts`, gọi ở `app/_layout.tsx`)

1. Ngay khi mở app (song song với tải font và phiên đăng nhập), hỏi máy chủ EAS có bản JS mới cho đúng
   `runtimeVersion` (= version app native) không. Tối đa 8 giây.
2. Không có bản mới → vào app bình thường.
3. Có bản mới → ẩn splash, phủ màn **"Beeland Plus đang cập nhật dữ liệu mới. Xin vui lòng chờ ..."**
   (`components/layout/OtaUpdateScreen.tsx`: giống phương án D "Navy cao cấp" của app admin, chỉ khác tên + logo). Bắt buộc, không bỏ qua được.
   Tải xong app tự reload sang bản mới.
4. Offline, máy chủ lỗi, hỏi quá 8 giây hoặc tải quá 90 giây → bỏ màn chờ, vào app bằng bản đang có.

Logic thuần (test được) ở `lib/otaUpdate.ts`, test: `tests/ota-update.test.cjs`.
Dev (`__DEV__`), Expo Go và web: `expo-updates` tắt nên bỏ qua.

Lệnh JS của expo-updates xếp hàng sau quy trình khởi động native. Nếu lúc khởi động native đang tải ngầm bản mới
lâu hơn 8 giây thì app vào luôn, và bản mới áp dụng ở lần mở sau (hành vi mặc định của expo-updates).

## Đẩy bản

```bash
npm run update   # = eas update --branch production --environment production --message 'update new'
```

Chỉ người dùng tự chạy. Bản đẩy lên chỉ tới máy có **cùng version native**:

| Version native (`app.json` › `version`) | Nhận bản OTA |
|---|---|
| 1.1 (hiện tại) | `npm run update` khi `app.json` đang là 1.1 |
| Bản cũ hơn trên máy khách | Phải đổi `version` về đúng số đó rồi đẩy riêng, hoặc chờ khách lên Store |

Build native mới với version mới → OTA sau đó chỉ tới máy có version mới.

**Lần đầu đưa màn chờ này ra:** máy đang chạy JS cũ tải bản mới ngầm và áp dụng ở lần mở sau, như trước đây.
Từ lần đẩy kế tiếp, máy đã có JS mới sẽ hiện màn chờ. Không cần build Store vì `expo-updates` đã có sẵn trong bản native.

## Kiểm tra máy đã nhận bản nào

Màn **Cá nhân**, dòng cuối: `Beeland Plus · Phiên bản <version> · <iOS|Android> · <8 ký tự mã bản>` (`lib/appInfo.ts`).
`gốc` = đang chạy bản đóng gói trong build (chưa nhận OTA nào). So 8 ký tự với cột ID ở `eas update:list`
hoặc trang Updates trên expo.dev.

## Rollback

```bash
npx eas-cli@latest update:list --branch production          # xem các bản, lấy group ID
npx eas-cli@latest update:republish --group <group-id-cũ>   # đẩy lại bản cũ làm bản mới nhất
npx eas-cli@latest update:rollback                          # hoặc: quay về bản trước / bản gốc trong build (hỏi tương tác)
```

## Giới hạn

- OTA chỉ cập nhật JS và ảnh. Thêm thư viện native, đổi quyền, icon, splash hay version → build Store.
- Không chạy trong Expo Go; thử bằng bản release / TestFlight.
