const { withAppBuildGradle, withGradleProperties } = require('@expo/config-plugins');

/**
 * Expo Config Plugin that enables R8/ProGuard code shrinking, resource shrinking,
 * and embeds the R8 mapping.txt deobfuscation file + native debug symbols (FULL)
 * directly inside the Android App Bundle (.aab) for Google Play Console.
 */
module.exports = function withPlayStoreDeobfuscation(config) {
  // 1. Set gradle.properties flags for React Native / Expo release builds
  config = withGradleProperties(config, (config) => {
    const props = [
      { type: 'property', key: 'android.enableMinifyInReleaseBuilds', value: 'true' },
      { type: 'property', key: 'android.enableShrinkResourcesInReleaseBuilds', value: 'true' },
      { type: 'property', key: 'expo.useLegacyPackaging', value: 'false' },
    ];

    for (const prop of props) {
      const existingIndex = config.modResults.findIndex(
        (item) => item.type === 'property' && item.key === prop.key
      );
      if (existingIndex !== -1) {
        config.modResults[existingIndex] = prop;
      } else {
        config.modResults.push(prop);
      }
    }
    return config;
  });

  // 2. Inject ndk.debugSymbolLevel = 'FULL' into android/app/build.gradle release buildType
  config = withAppBuildGradle(config, (config) => {
    if (config.modResults.language === 'groovy') {
      let contents = config.modResults.contents;
      if (!contents.includes('debugSymbolLevel')) {
        contents = contents.replace(
          /buildTypes\s*\{\s*release\s*\{/,
          `buildTypes {\n        release {\n            ndk {\n                debugSymbolLevel 'FULL'\n            }`
        );
        config.modResults.contents = contents;
      }
    }
    return config;
  });

  return config;
};
