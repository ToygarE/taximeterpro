const fs = require('fs');
const path = require('path');

function resolveConfigPlugins() {
  try {
    return require('@expo/config-plugins');
  } catch (e) {}
  try {
    const expoRoot = path.dirname(require.resolve('expo/package.json'));
    return require(path.join(expoRoot, 'node_modules', '@expo', 'config-plugins'));
  } catch (e) {}
  try {
    const expoRoot = path.dirname(require.resolve('expo/package.json'));
    return require(path.join(expoRoot, '..', '..', '@expo', 'config-plugins'));
  } catch (e) {}
  throw new Error('Cannot resolve @expo/config-plugins');
}

module.exports = function withFixMapsPodfile(config) {
  const { withDangerousMod } = resolveConfigPlugins();

  return withDangerousMod(config, [
    'ios',
    async (config) => {
      const podfilePath = path.join(config.modRequest.platformProjectRoot, 'Podfile');
      if (!fs.existsSync(podfilePath)) return config;

      let podfile = fs.readFileSync(podfilePath, 'utf8');

      // Expo's Maps plugin adds 'pod react-native-google-maps' when googleMapsApiKey
      // is set, but react-native-maps >=1.14 only has react-native-maps.podspec.
      // Auto-linking (use_native_modules!) already adds 'react-native-maps', so we
      // remove the duplicate 'react-native-google-maps' entry to avoid linker errors.
      podfile = podfile.replace(/^\s*pod\s+'react-native-google-maps'[^\n]*\n?/gm, '');

      fs.writeFileSync(podfilePath, podfile);
      return config;
    },
  ]);
};
