import type { ExpoConfig } from "expo/config";

const baseConfig: ExpoConfig = {
  orientation: "portrait",
  userInterfaceStyle: "automatic",
  updates: {
    enabled: false,
  },
  assetBundlePatterns: ["**/*"],
  ios: {
    supportsTablet: true,
    infoPlist: {
      NSCameraUsageDescription:
        "This app uses the camera to take photos for your profile.",
      NSMicrophoneUsageDescription:
        "This app uses the microphone to record video to share in your messages.",
      UIBackgroundModes: ["audio"],
    },
  },
  android: {},
};

export default baseConfig;

