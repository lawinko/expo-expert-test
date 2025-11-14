import type { WhiteLabelAppConfig } from "./types";

export const boundlessMovementConfig: WhiteLabelAppConfig = {
  id: "boundless-movement",
  name: "Boundless Movement",
  slug: "boundless-movement",
  webviewUrl: "https://boundless-movement.mvt.so/",

  iosBundleIdentifier: "art.boundless-movement.app",
  androidPackage: "so.movement.boundlessmovement",

  androidGoogleServicesFile:
    "./google-services/google-services.boundless-movement.json",

  icon: "./assets/boundless-movement/icon.png",
  splashImage: "./assets/boundless-movement/splash.png",
  splashBackgroundColor: "#000",

  associatedDomains: [
    "applinks:boundless-movement.fitterapp.app",
    "applinks:boundless-movement.mvt.so",
  ],

  easProjectId: "7c3a5cf2-b16d-4d21-a250-245c3a1c9e86",
  fitterApp: "boundless-movement",

  plugins: ["react-native-iap"],

  iosBuildNumber: "1.0.1",
  androidVersionCode: 2,
};
