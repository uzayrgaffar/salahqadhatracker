export default {
  owner: "uzayrgaffar",
  expo: {
    name: "QadhaApp",
    slug: "QadhaApp",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "light",
    splash: {
      image: "./assets/splash.png",
      resizeMode: "contain",
      backgroundColor: "#ffffff"
    },
    // plugins: [
    //   "@react-native-google-signin/google-signin",
    //   "expo-build-properties"
    // ],
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.uzayrgaffar.qadhaapp"
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#ffffff"
      },
      package: "com.uzayrgaffar.qadhaapp"
    },
    web: {
      favicon: "./assets/favicon.png"
    },
    extra: {
      eas: {
        projectId: "7de41553-636c-42ad-b26d-7027d42cf51b"
      }
    }
  }
};