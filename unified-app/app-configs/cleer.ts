import type { WhiteLabelAppConfig } from "./types";

export const cleerConfig: WhiteLabelAppConfig = {
  id: "cleer",
  name: "Cleer App",
  slug: "cleer",
  webviewUrl: "https://cleer.mvt.so/",

  iosBundleIdentifier: "so.movement.cleer",
  androidPackage: "so.movement.cleer",

  androidGoogleServicesFile: "./google-services/google-services.cleer.json",

  icon: "./assets/cleer/icon.png",
  splashImage: "./assets/cleer/splash.png",
  splashBackgroundColor: "#000",

  associatedDomains: [
    "applinks:cleer.fitterapp.app",
    "applinks:cleer.mvt.so",
  ],

  easProjectId: "6cfc6442-146b-4af7-a93f-75b4273e4284",
  fitterApp: "cleer",

  plugins: ["react-native-iap"],

  iosBuildNumber: "1.0.0",
  androidVersionCode: 1,
};
