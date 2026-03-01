export default {
  owner: "uzayrgaffar",
  expo: {
    name: "iQadha",
    slug: "QadhaApp",
    icon: "./assets/icon.png",
    adaptiveIcon: {
      foregroundImage: "./assets/adaptive-icon.png",
      backgroundColor: "#5CB390"
    },
    version: "1.1.3",
    userInterfaceStyle: "light",
    ios: {
      jsEngine: "hermes",
      supportsTablet: true,
      bundleIdentifier: "com.uzayrgaffar.iqadha",
      buildNumber: "1",
      infoPlist: {
        ITSAppUsesNonExemptEncryption: false,
        UIBackgroundModes: ["remote-notification"],
        NSLocationWhenInUseUsageDescription:
          "Location is required to accurately determine the Qiblah direction and prayer times.",
        NSMotionUsageDescription:
          "Motion access improves compass accuracy for Qiblah direction."
      },
      googleServicesFile: "./GoogleService-Info.plist"
    },
    android: {
      jsEngine: "hermes",
      package: "com.uzayrgaffar.iqadha",
      versionCode: 9,
      googleServicesFile: "./google-services.json",
      config: {
        keepConsistentProguardFile: true
      },
      permissions: ["RECEIVE_BOOT_COMPLETED", "POST_NOTIFICATIONS", "ACCESS_FINE_LOCATION"]
    },
    splash: {
      image: "./assets/splash.png",
      backgroundColor: "#FFFFFF",
      resizeMode: "cover"
    },
    extra: {
      eas: {
        projectId: "7de41553-636c-42ad-b26d-7027d42cf51b"
      }
    },
    plugins: [
      "expo-asset",
      "expo-font",
      "expo-router",
      "@react-native-community/datetimepicker",
      [
        "expo-notifications",
        {
          "icon": "./assets/notification-icon.png",
          "color": "#5CB390"
        }
      ],
      "@react-native-firebase/app",
      "@react-native-firebase/messaging",
      [
        "expo-build-properties",
        {
          "ios": {
            "useFrameworks": "static",
            "buildReactNativeFromSource": true 
          },
          "android": {
            "enableMinifyInReleaseBuilds": false,
            "shrinkResources": false
          }
        }
      ],
      [
        "expo-location",
        {
          "locationWhenInUsePermission": "Allow location access to calculate prayer times and Qiblah direction."
        }
      ]
    ],
    assetBundlePatterns: [
      "**/*"
    ]
  }
};