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
    version: "1.0.3",
    userInterfaceStyle: "light",
    ios: {
      jsEngine: "hermes",
      supportsTablet: false,
      bundleIdentifier: "com.uzayrgaffar.iqadha",
      buildNumber: "11",
      infoPlist: {
        ITSAppUsesNonExemptEncryption: false,
        UIBackgroundModes: ["remote-notification"]
      },
      googleServicesFile: "./GoogleService-Info.plist"
    },
    android: {
      jsEngine: "hermes",
      package: "com.uzayrgaffar.iqadha",
      versionCode: 6,
      googleServicesFile: "./google-services.json",
      config: {
        keepConsistentProguardFile: true
      },
      permissions: ["RECEIVE_BOOT_COMPLETED", "POST_NOTIFICATIONS"]
    },
    splash: {
      image: "./assets/splash.png",
      backgroundColor: "#5CB390",
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
          "locationWhenInUsePermission": "Allow location access to calculate prayer times."
        }
      ]
    ],
    assetBundlePatterns: [
      "**/*"
    ]
  }
};