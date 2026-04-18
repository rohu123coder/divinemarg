const { withAppBuildGradle } = require('expo/config-plugins');

/**
 * RN 0.77+ removed ReactExtension properties that Expo prebuild may still emit.
 * Strip them so Gradle can evaluate app/build.gradle on EAS and locally.
 */
function withFixReactNative77AppGradle(config) {
  return withAppBuildGradle(config, (config) => {
    const contents = config.modResults?.contents;
    if (typeof contents === 'string') {
      config.modResults.contents = contents
        .replace(/^\s*enableBundleCompression\s*=.*\r?\n?/m, '')
        .replace(/^\s*enableHermes\s*=.*\r?\n?/m, '');
    }
    return config;
  });
}

module.exports = withFixReactNative77AppGradle;
