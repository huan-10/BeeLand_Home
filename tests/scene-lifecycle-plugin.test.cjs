// Plugin UIScene (plugins/withSceneLifecycle.js): sửa AppDelegate.swift của template SDK 57 cho iOS 27. Chạy: npm test
const test = require('node:test');
const assert = require('node:assert/strict');

const { patchAppDelegate, SCENE_MANIFEST } = require('../plugins/withSceneLifecycle.js');

// Phần liên quan của AppDelegate.swift do Expo SDK 57 sinh ra (expo-template-bare-minimum@57).
const SDK57 = `@main
class AppDelegate: ExpoAppDelegate {
  var window: UIWindow?

  public override func application(
    _ application: UIApplication,
    didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil
  ) -> Bool {
    reactNativeFactory = factory

#if os(iOS) || os(tvOS)
    window = UIWindow(frame: UIScreen.main.bounds)
    factory.startReactNative(
      withModuleName: "main",
      in: window,
      launchOptions: launchOptions)
#endif

    return super.application(application, didFinishLaunchingWithOptions: launchOptions)
  }
}
`;

test('AppDelegate: thêm ExpoReactNativeFactoryProvider, bỏ tạo window + startReactNative', () => {
  const out = patchAppDelegate(SDK57);
  assert.ok(out.includes('class AppDelegate: ExpoAppDelegate, ExpoReactNativeFactoryProvider {'));
  assert.ok(!out.includes('UIWindow(frame:'));
  assert.ok(!out.includes('startReactNative'));
  assert.ok(out.includes('return super.application(application, didFinishLaunchingWithOptions: launchOptions)'));
});

test('chạy lại lần hai không đổi gì', () => {
  const once = patchAppDelegate(SDK57);
  assert.equal(patchAppDelegate(once), once);
});

test('AppDelegate lạ (template đổi) → báo lỗi thay vì build ra app vẫn crash', () => {
  assert.throws(() => patchAppDelegate('class AppDelegate: ExpoAppDelegate {\n}\n'), /withSceneLifecycle/);
});

test('Info.plist: một scene, delegate là SceneDelegate của module app', () => {
  assert.equal(SCENE_MANIFEST.UIApplicationSupportsMultipleScenes, false);
  const [scene] = SCENE_MANIFEST.UISceneConfigurations.UIWindowSceneSessionRoleApplication;
  assert.equal(scene.UISceneDelegateClassName, '$(PRODUCT_MODULE_NAME).SceneDelegate');
});
