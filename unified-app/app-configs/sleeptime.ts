import type { WhiteLabelAppConfig } from "./types";

export const sleeptimeConfig: WhiteLabelAppConfig = {
  id: "sleeptime",
  name: "Sleep Time with Nicky Sutton",
  slug: "sleeptime",
  webviewUrl: "https://sleeptime.fitterapp.app/",

  iosBundleIdentifier: "so.movement.sleeptime",
  androidPackage: "app.fitterapp.sleeptime",

  androidGoogleServicesFile:
    "./google-services/google-services.sleeptime.json",

  icon: "./assets/sleeptime/icon.png",
  splashImage: "./assets/sleeptime/splash.png",
  splashBackgroundColor: "#000",

  associatedDomains: [
    "applinks:sleeptime.fitterapp.app",
    "applinks:sleeptime.mvt.so",
  ],

  easProjectId: "342903df-114a-48b4-b00c-edd155a7490b",
  fitterApp: "sleeptime",

  plugins: [
    "react-native-iap",
    [
      "expo-build-properties",
      {
        android: {
          compileSdkVersion: 35,
          targetSdkVersion: 35,
          buildToolsVersion: "35.0.0",
        },
      },
    ],
  ],

  iosBuildNumber: "1.0.5",
  androidVersionCode: 10,
};
