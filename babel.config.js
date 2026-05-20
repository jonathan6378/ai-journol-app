module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    // Path aliases (@/* and @app/*) are resolved by Metro via the
    // `tsconfigPaths` experiment in app.json + the paths block in tsconfig.json.
    // Reanimated MUST be the last plugin.
    plugins: ['react-native-reanimated/plugin'],
  };
};
