module.exports = {
  presets: ["module:@react-native/babel-preset"],
  plugins: [
    [
      "module-resolver",
      {
        root: ["./src"],
        extensions: [".ios.js", ".android.js", ".js", ".ts", ".tsx", ".json"],
        alias: {
          "@store": "./src/store",
          "@services": "./src/services",
          "@components": "./src/components",
          "@screens": "./src/screens",
          "@navigation": "./src/navigation",
          "@hooks": "./src/hooks",
          "@theme": "./src/theme",
          "@types": "./src/types",
          "@utils": "./src/utils",
          "@constants": "./src/constants",
        },
      },
    ],
    "react-native-reanimated/plugin",
  ],
};
