export default {
  owner: "uzayrgaffar",
  expo: {
    name: "iQadha",
    slug: "QadhaApp",
    icon: "./assets/icon.png",
    version: "1.0.0",
    userInterfaceStyle: "light",
    ios: {
      jsEngine: "jsc",
      supportsTablet: true,
      bundleIdentifier: "com.uzayrgaffar.iqadha",
      buildNumber: "6",
      infoPlist: {
        ITSAppUsesNonExemptEncryption: false
      }
    },
    android: {
      jsEngine: "hermes",
      package: "com.uzayrgaffar.iqadha",
      versionCode: 9,
      config: {
        keepConsistentProguardFile: true
      },
      permissions: []
    },
    splash: {
      image: "./assets/splash.png",
      backgroundColor: "#ffffff",
      resizeMode: "contain",
      alignItems: "center"
    },
    extra: {
      eas: {
        projectId: "7de41553-636c-42ad-b26d-7027d42cf51b"
      }
    },
    plugins: [
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