const { withAndroidManifest } = require('@expo/config-plugins');

module.exports = function withMlKitFaceModel(config) {
  return withAndroidManifest(config, (config) => {
    const application = config.modResults.manifest.application?.[0];
    if (!application) return config;

    application['meta-data'] = application['meta-data'] || [];
    const existing = application['meta-data'].find(
      (item) => item.$?.['android:name'] === 'com.google.mlkit.vision.DEPENDENCIES'
    );
    const metadata = {
      $: {
        'android:name': 'com.google.mlkit.vision.DEPENDENCIES',
        'android:value': 'face',
      },
    };

    if (existing) {
      existing.$['android:value'] = 'face';
    } else {
      application['meta-data'].push(metadata);
    }
    return config;
  });
};
