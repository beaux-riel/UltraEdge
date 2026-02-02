// metro.config.js
const {
  wrapWithReanimatedMetroConfig,
} = require("react-native-reanimated/metro-config");

// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require("expo/metro-config");

// /** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Polyfills and stubs for Node.js modules
const emptyModule = require.resolve('./src/lib/empty-module.js');
config.resolver.extraNodeModules = {
  ...config.resolver.extraNodeModules,
  // Real polyfills
  stream: require.resolve('stream-browserify'),
  crypto: require.resolve('crypto-browserify'),
  url: require.resolve('url/'),
  events: require.resolve('events/'),
  // Empty stubs for server-only modules
  http: emptyModule,
  https: emptyModule,
  net: emptyModule,
  tls: emptyModule,
  fs: emptyModule,
  zlib: emptyModule,
  // Block ws entirely - React Native has native WebSocket
  ws: emptyModule,
};

module.exports = wrapWithReanimatedMetroConfig(config);
