import type { WhiteLabelAppConfig } from "./types";

export const lifestyle20Config: WhiteLabelAppConfig = {
  id: "20lifestyle",
  name: "2.0FIT",
  slug: "20lifestyle",
  webviewUrl: "https://20lifestyle.mvt.so/",

  iosBundleIdentifier: "so.movement.20lifestyle",
  androidPackage: "so.movement.m20lifestyle",

  androidGoogleServicesFile:
    "./google-services/google-services.20lifestyle.json",

  icon: "./assets/20lifestyle/icon.png",
  splashImage: "./assets/20lifestyle/splash.png",
  splashBackgroundColor: "#000",

  associatedDomains: [
    "applinks:20lifestyle.fitterapp.app",
    "applinks:20lifestyle.mvt.so",
  ],

  easProjectId: "8f558b10-fcfc-4673-97a0-1cdc440f1508",
  fitterApp: "20lifestyle",

  plugins: ["react-native-iap"],

  iosBuildNumber: "1.0.2",
  androidVersionCode: 3,
};
