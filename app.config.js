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
      jsEngine: "jsc",
      supportsTablet: true,
      bundleIdentifier: "com.uzayrgaffar.iqadha",
      buildNumber: "11",
      infoPlist: {
        ITSAppUsesNonExemptEncryption: false
      },
      googleServicesFile: "./GoogleService-Info.plist"
    },
    android: {
      jsEngine: "hermes",
      package: "com.uzayrgaffar.iqadha",
      versionCode: 5,
      googleServicesFile: "./google-services.json",
      config: {
        keepConsistentProguardFile: true
      },
      permissions: []
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
      "@react-native-firebase/app",
      [
        "expo-build-properties",
        {
          ios: {
            useFrameworks: "static"
          },
          android: {
            enableProguardInReleaseBuilds: false,
            minifyEnabled: false, 
            shrinkResources: false
          }
        }
      ]
    ]
  }
};