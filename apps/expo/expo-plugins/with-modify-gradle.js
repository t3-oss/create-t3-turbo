//@ts-check

// This plugin is required for fixing `.apk` build issue
// It appends Expo and RN versions into the `build.gradle` file
// References:
// https://github.com/t3-oss/create-t3-turbo/issues/120
// https://github.com/expo/expo/issues/18129

const { withProjectBuildGradle } = require("@expo/config-plugins");

module.exports = (config) => {
  return withProjectBuildGradle(config, (config) => {
    config.modResults.contents = config.modResults.contents.replace(
      "buildscript {",
      `buildscript {
    ext.getPackageJsonVersion = { packageName ->
        new File(['node', '--print', "JSON.parse(require('fs').readFileSync(require.resolve('\${packageName}/package.json'), 'utf-8')).version"].execute(null, rootDir).text.trim())
    }`,
    );

    config.modResults.contents = config.modResults.contents.replace(
      "ext {",
      `ext {
        reactNativeVersion = "\${ext.getPackageJsonVersion('react-native')}"
        expoPackageVersion = "\${ext.getPackageJsonVersion('expo')}"`,
    );

    return config;
  });
};
