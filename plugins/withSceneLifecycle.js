/**
 * Bật UIScene life cycle cho iOS — bắt buộc khi build bằng Xcode 27 (SDK iOS 27): thiếu nó, iOS 27 tắt app ngay lúc mở
 * (`___UIApplicationEvaluateRuntimeIssueForNoSceneLifecycleAdoption`, bản 1.1 (15) ngày 2026-10-31).
 *
 * Expo SDK 57 sinh thư mục ios/ chưa có scene; plugin này làm giống template SDK 58 (expo-template-bare-minimum@58):
 * - AppDelegate thêm `ExpoReactNativeFactoryProvider`, bỏ tạo window + startReactNative (SceneDelegate làm việc này);
 * - thêm SceneDelegate.swift (`ExpoAppSceneDelegate` — có sẵn trong expo 57) vào project;
 * - Info.plist thêm UIApplicationSceneManifest.
 * Lên SDK 58 thì gỡ plugin này khỏi app.json (template đã có sẵn).
 */
const fs = require('fs');
const path = require('path');
const { IOSConfig, withAppDelegate, withInfoPlist, withXcodeProject } = require('expo/config-plugins');

const SCENE_DELEGATE_FILE = 'SceneDelegate.swift';
const SCENE_DELEGATE_SOURCE = `internal import Expo

@objc(SceneDelegate)
class SceneDelegate: ExpoAppSceneDelegate {
  // Extension point for config plugins.
}
`;

const CLASS_DECL = 'class AppDelegate: ExpoAppDelegate {';
const CLASS_DECL_SCENE = 'class AppDelegate: ExpoAppDelegate, ExpoReactNativeFactoryProvider {';
const START_RN_BLOCK =
  /\n#if os\(iOS\) \|\| os\(tvOS\)\n\s*window = UIWindow\(frame: UIScreen\.main\.bounds\)\n\s*factory\.startReactNative\([\s\S]*?\)\n#endif\n/;
const START_RN_REPLACEMENT = `
    // The window is created and React Native is started by \`SceneDelegate\` under the
    // scene-based life cycle (required by the iOS 27 SDK).
`;

/** AppDelegate.swift của SDK 57 → bản dùng scene. Không khớp mẫu → báo lỗi (tránh build ra app vẫn crash). */
function patchAppDelegate(contents) {
  if (contents.includes(CLASS_DECL_SCENE)) return contents;
  if (!contents.includes(CLASS_DECL) || !START_RN_BLOCK.test(contents)) {
    throw new Error(
      '[withSceneLifecycle] AppDelegate.swift không giống template Expo SDK 57 — kiểm tra lại plugin (lên SDK 58 thì gỡ plugin).',
    );
  }
  return contents.replace(CLASS_DECL, CLASS_DECL_SCENE).replace(START_RN_BLOCK, START_RN_REPLACEMENT);
}

const SCENE_MANIFEST = {
  UIApplicationSupportsMultipleScenes: false,
  UISceneConfigurations: {
    UIWindowSceneSessionRoleApplication: [
      {
        UISceneConfigurationName: 'Default Configuration',
        UISceneDelegateClassName: '$(PRODUCT_MODULE_NAME).SceneDelegate',
      },
    ],
  },
};

function withSceneLifecycle(config) {
  config = withAppDelegate(config, (cfg) => {
    if (cfg.modResults.language !== 'swift') {
      throw new Error('[withSceneLifecycle] chỉ hỗ trợ AppDelegate.swift');
    }
    cfg.modResults.contents = patchAppDelegate(cfg.modResults.contents);
    return cfg;
  });

  config = withInfoPlist(config, (cfg) => {
    cfg.modResults.UIApplicationSceneManifest = SCENE_MANIFEST;
    return cfg;
  });

  config = withXcodeProject(config, (cfg) => {
    const projectName = IOSConfig.XcodeUtils.getProjectName(cfg.modRequest.projectRoot);
    const filePath = path.join(cfg.modRequest.platformProjectRoot, projectName, SCENE_DELEGATE_FILE);
    fs.writeFileSync(filePath, SCENE_DELEGATE_SOURCE);
    const groupFile = `${projectName}/${SCENE_DELEGATE_FILE}`;
    if (!cfg.modResults.hasFile(groupFile)) {
      IOSConfig.XcodeUtils.addBuildSourceFileToGroup({
        filepath: groupFile,
        groupName: projectName,
        project: cfg.modResults,
      });
    }
    return cfg;
  });

  return config;
}

module.exports = withSceneLifecycle;
module.exports.patchAppDelegate = patchAppDelegate;
module.exports.SCENE_MANIFEST = SCENE_MANIFEST;
