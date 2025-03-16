export default {
  owner: "uzayrgaffar",
  expo: {
    name: "QadhaApp",
    slug: "QadhaApp",
    version: "1.0.0",
    userInterfaceStyle: "light",
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.uzayrgaffar.qadhaapp",
      buildNumber: "1.0.0",
      "infoPlist": {
        "ITSAppUsesNonExemptEncryption": false
      }
    },
    android: {
      package: "com.uzayrgaffar.qadhaapp",
      versionCode: 1
    },
    extra: {
      eas: {
        projectId: "7de41553-636c-42ad-b26d-7027d42cf51b"
      }
    }
  }
};
