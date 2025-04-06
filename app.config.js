module.exports = {
  name: "Ultra Endurance Planner",
  slug: "ultra-endurance-planner",
  version: "1.0.0",
  orientation: "portrait",
  icon: "./assets/icon.png",
  userInterfaceStyle: "light",
  splash: {
    image: "./assets/splash-icon.png",
    resizeMode: "contain",
    backgroundColor: "#ffffff"
  },
  ios: {
    supportsTablet: true
  },
  android: {
    adaptiveIcon: {
      foregroundImage: "./assets/adaptive-icon.png",
      backgroundColor: "#ffffff"
    }
  },
  web: {
    favicon: "./assets/favicon.png"
  },
  extra: {
    // Add any extra configuration here
  },
  // This will be used when running the app with Expo
  packagerOpts: {
    host: "0.0.0.0",
    port: 12000
  }
};