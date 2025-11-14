import type { ExpoConfig } from "expo/config";
import baseConfig from "./app.config.base";
import { getAppConfig } from "./app-configs";

export default ({ config }: { config: ExpoConfig }): ExpoConfig => {
  const appId = process.env.APP_ID || process.env.APP_VARIANT;

  if (!appId) {
    throw new Error("APP_ID (or APP_VARIANT) must be set to a valid app id");
  }

  const app = getAppConfig(appId);

  return {
    ...baseConfig,
    ...config,
    name: app.name,
    slug: app.slug,
    icon: app.icon,
    splash: {
      image: app.splashImage,
      backgroundColor: app.splashBackgroundColor,
    },
    plugins: app.plugins ?? baseConfig.plugins,
    ios: {
      ...baseConfig.ios,
      ...config.ios,
      bundleIdentifier: app.iosBundleIdentifier,
      buildNumber: app.iosBuildNumber ?? config.ios?.buildNumber,
      associatedDomains: app.associatedDomains,
    },
    android: {
      ...baseConfig.android,
      ...config.android,
      package: app.androidPackage,
      versionCode: app.androidVersionCode ?? config.android?.versionCode,
      googleServicesFile:
        app.androidGoogleServicesFile ?? "./google-services/google-services.json",
    },
    extra: {
      ...config.extra,
      fitterApp: app.fitterApp,
      eas: {
        projectId: app.easProjectId,
      },
      appId,
    },
  };
};
