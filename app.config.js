export default {
  owner: "uzayrgaffar",
  expo: {
    name: "QadhaApp",
    slug: "QadhaApp",
    icon: "./assets/icon.png",
    version: "1.0.0",
    userInterfaceStyle: "light",
    ios: {
      jsEngine: "jsc",
      supportsTablet: true,
      bundleIdentifier: "com.uzayrgaffar.qadhaapp",
      buildNumber: "4",
      infoPlist: {
        ITSAppUsesNonExemptEncryption: false
      }
    },
    android: {
      jsEngine: "hermes",
      package: "com.uzayrgaffar.qadhaapp",
      versionCode: 7,
      buildGradle: {
        extraProguardOptions: [
          "-keep class com.uzayrgaffar.qadhaapp.** { *; }",
          "-dontwarn com.uzayrgaffar.qadhaapp.**"
        ]
      },
      config: {
        keepConsistentProguardFile: true,
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
            enableProguardInReleaseBuilds: true,
            minifyEnabled: false, 
            shrinkResources: false,  
          }
        }
      ]
    ]
  }
};