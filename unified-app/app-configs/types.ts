import type { ExpoConfig } from "expo/config";

export type WhiteLabelAppId =
  | "boundless-movement"
  | "sorella-online"
  | "sleeptime"
  | "cleer"
  | "20lifestyle";

export type WhiteLabelAppConfig = {
  id: WhiteLabelAppId;
  name: string;
  slug: string;
  webviewUrl: string;

  iosBundleIdentifier: string;
  androidPackage: string;

  /**
   * Optional path (relative to project root) to this app's
   * Android google-services.json (Firebase/Google Play config).
   * If omitted, a shared ./google-services.json will be used.
   */
  androidGoogleServicesFile?: string;

  icon: string;
  splashImage: string;
  splashBackgroundColor: string;

  associatedDomains?: string[];
  easProjectId: string;
  fitterApp: string;

  plugins?: ExpoConfig["plugins"];
  iosBuildNumber?: string;
  androidVersionCode?: number;
};
