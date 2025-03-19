export default {
  owner: "uzayrgaffar",
  expo: {
    name: "QadhaApp",
    slug: "QadhaApp",
    icon: "./assets/icon.png",
    version: "1.0.0",
    userInterfaceStyle: "light",
    jsEngine: "jsc",
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.uzayrgaffar.qadhaapp",
      buildNumber: "3",
      infoPlist: {
        ITSAppUsesNonExemptEncryption: false
      }
    },
    android: {
      package: "com.uzayrgaffar.qadhaapp",
      versionCode: 2
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
          }
        }
      ]
    ]
  }
};