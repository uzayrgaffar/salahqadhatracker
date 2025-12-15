export default {
  owner: "uzayrgaffar",
  expo: {
    name: "iQadha",
    slug: "QadhaApp",
    icon: "./assets/icon.png",
    adaptiveIcon: {
      foregroundImage: "./assets/adaptive-icon.png",
      backgroundColor: "#ffffff"
    },
    version: "1.0.3",
    userInterfaceStyle: "light",
    ios: {
      jsEngine: "jsc",
      supportsTablet: true,
      bundleIdentifier: "com.uzayrgaffar.iqadha",
      buildNumber: "11", // Do not increment next time, and delete this comment
      infoPlist: {
        ITSAppUsesNonExemptEncryption: false
      }
    },
    android: {
      jsEngine: "hermes",
      package: "com.uzayrgaffar.iqadha",
      versionCode: 5,
      config: {
        keepConsistentProguardFile: true
      },
      permissions: []
    },
    splash: {
      image: "./assets/splash.png",
      backgroundColor: "#ffffff",
      resizeMode: "cover"
    },
    extra: {
      eas: {
        projectId: "7de41553-636c-42ad-b26d-7027d42cf51b"
      }
    },
    plugins: [
      "expo-asset",
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