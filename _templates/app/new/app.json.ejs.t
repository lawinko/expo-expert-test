---
to: ./apps/<%= slug %>/app.json
---
{
  "expo": {
    "owner": "movementso",
    "name": "<%= name %>",
    "slug": "<%= slug %>",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "userInterfaceStyle": "automatic",
    "version": "1.0.0",
    "splash": {
      "image": "./assets/splash.png",
      "backgroundColor": "#000"
    },
    "updates": {
      "enabled": false
    },
    "assetBundlePatterns": [
      "**/*"
    ],
    "plugins": [
      "react-native-iap",
      [
        "expo-build-properties",
        {
          "android": {
            "compileSdkVersion": 35,
            "targetSdkVersion": 35,
            "buildToolsVersion": "35.0.0"
          }
        }
      ]
    ],
    "ios": {
      "buildNumber": "1.0.0",
      "supportsTablet": true,
      "bundleIdentifier": "so.movement.<%= slug %>",
      "associatedDomains": [
        "applinks:<%= slug %>.fitterapp.app",
        "applinks:<%= slug %>.mvt.so"
      ],
      "infoPlist": {
        "NSCameraUsageDescription": "This app uses the camera to take photos for your profile.",
        "NSMicrophoneUsageDescription": "This app uses the microphone to record video to share in your messages.",
        "UIBackgroundModes": ["audio"]
      }
    },
    "android": {
      "package": "so.movement.<%= slug %>",
      "versionCode": 1,
      "googleServicesFile": "./google-services.json"
    },
    "extra": {
      "fitterApp": "<%= slug %>"
    }
  }
}
