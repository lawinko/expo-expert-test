import type { WhiteLabelAppConfig } from "./types";

export const sorellaOnlineConfig: WhiteLabelAppConfig = {
  id: "sorella-online",
  name: "SORELLA",
  slug: "sorella-online",
  webviewUrl: "https://sorella-online.mvt.so/",

  iosBundleIdentifier: "so.movement.sorellaonline",
  androidPackage: "so.movement.sorellaonline",

  androidGoogleServicesFile:
    "./google-services/google-services.sorella-online.json",

  icon: "./assets/sorella-online/icon.png",
  splashImage: "./assets/sorella-online/splash.png",
  splashBackgroundColor: "#000",

  associatedDomains: [
    "applinks:app.sorellaonline.com",
    "applinks:sorella-online.fitterapp.app",
    "applinks:sorella-online.mvt.so",
  ],

  easProjectId: "4771d7c6-4826-4f31-9ed0-b50de823dd72",
  fitterApp: "sorella-online",

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

  iosBuildNumber: "1.0.0",
  androidVersionCode: 1,
};
