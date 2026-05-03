#!/usr/bin/env node
/**
 * Postinstall script that fixes three iOS build issues for taximeter-pro:
 *
 * 1. expo/config-plugins Maps.js: patches addMapsCocoaPods() so it does NOT
 *    inject `pod 'react-native-google-maps'` into the Podfile. React Native
 *    auto-linking (use_native_modules!) already handles react-native-maps.
 *    react-native-maps >=1.14 dropped react-native-google-maps.podspec, so the
 *    duplicate pod causes 339 linker duplicate-symbol errors.
 *
 * 2. react-native-maps: deletes any stale react-native-google-maps.podspec that
 *    was created by a previous postinstall run, so use_native_modules! cannot
 *    pick it up as a second pod.
 *
 * 3. expo-file-system: patches FileSystemModule.swift to use the renamed
 *    ExpoAppDelegateSubscriberRepository instead of ExpoAppDelegate, which was
 *    removed in expo-modules-core@3.x (shipped with expo@54.0.34+).
 */
const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');

// ─── Fix 1: Patch @expo/config-plugins Maps.js ───────────────────────────────

function patchMapsJs() {
  const configPluginsStore = path.join(rootDir, 'node_modules', '.pnpm');
  const dirs = [];

  if (fs.existsSync(configPluginsStore)) {
    for (const entry of fs.readdirSync(configPluginsStore)) {
      if (entry.startsWith('@expo+config-plugins@')) {
        const p = path.join(
          configPluginsStore, entry, 'node_modules', '@expo', 'config-plugins', 'build', 'ios', 'Maps.js'
        );
        if (fs.existsSync(p)) dirs.push(p);
      }
    }
  }

  // Direct node_modules fallback
  const direct = path.join(rootDir, 'node_modules', '@expo', 'config-plugins', 'build', 'ios', 'Maps.js');
  if (fs.existsSync(direct) && !dirs.includes(direct)) dirs.push(direct);

  let patched = 0;
  for (const mapsJsPath of dirs) {
    let content = fs.readFileSync(mapsJsPath, 'utf8');

    // Check if already patched
    if (content.includes('// [patched: skip react-native-google-maps pod]')) {
      console.log('[fix-maps-js] Already patched:', path.relative(rootDir, mapsJsPath));
      continue;
    }

    const original = content;
    // Make addMapsCocoaPods return src unchanged (skip pod injection)
    content = content.replace(
      /function addMapsCocoaPods\(src\)\s*\{[\s\S]*?^}/m,
      `function addMapsCocoaPods(src) {\n  // [patched: skip react-native-google-maps pod]\n  // use_native_modules! already handles react-native-maps via auto-linking\n  return { contents: src, didMerge: false, didClear: false };\n}`
    );

    if (content !== original) {
      fs.writeFileSync(mapsJsPath, content);
      console.log('[fix-maps-js] Patched:', path.relative(rootDir, mapsJsPath));
      patched++;
    } else {
      console.log('[fix-maps-js] Regex did not match in:', path.relative(rootDir, mapsJsPath));
    }
  }
  if (dirs.length === 0) {
    console.log('[fix-maps-js] @expo/config-plugins not found, skipping.');
  } else if (patched === 0 && dirs.length > 0) {
    console.log('[fix-maps-js] No new patching needed.');
  }
}

patchMapsJs();

// ─── Fix 2: Remove stale react-native-google-maps.podspec ────────────────────

function removeGoogleMapsPodspec() {
  const pnpmStore = path.join(rootDir, 'node_modules', '.pnpm');
  let removed = 0;

  if (fs.existsSync(pnpmStore)) {
    for (const entry of fs.readdirSync(pnpmStore)) {
      if (entry.startsWith('react-native-maps@')) {
        const dst = path.join(pnpmStore, entry, 'node_modules', 'react-native-maps', 'react-native-google-maps.podspec');
        if (fs.existsSync(dst)) {
          fs.unlinkSync(dst);
          console.log('[fix-maps-podspec] Removed stale podspec:', path.relative(rootDir, dst));
          removed++;
        }
      }
    }
  }
  if (removed === 0) {
    console.log('[fix-maps-podspec] No stale react-native-google-maps.podspec found.');
  }
}

removeGoogleMapsPodspec();

// ─── Fix 3: expo-file-system ExpoAppDelegate → ExpoAppDelegateSubscriberRepository ──

function patchExpoFileSystem() {
  const pnpmStore = path.join(rootDir, 'node_modules', '.pnpm');
  const dirs = [];

  if (fs.existsSync(pnpmStore)) {
    for (const entry of fs.readdirSync(pnpmStore)) {
      if (entry.startsWith('expo-file-system@')) {
        const p = path.join(pnpmStore, entry, 'node_modules', 'expo-file-system', 'ios');
        if (fs.existsSync(p)) dirs.push(p);
      }
    }
  }
  const direct = path.join(rootDir, 'node_modules', 'expo-file-system', 'ios');
  if (fs.existsSync(direct)) dirs.push(direct);

  const filesToPatch = ['FileSystemModule.swift', 'FileSystemBackgroundSessionHandler.swift'];
  let patched = 0;

  for (const dir of dirs) {
    for (const filename of filesToPatch) {
      const filePath = path.join(dir, filename);
      if (!fs.existsSync(filePath)) continue;

      let content = fs.readFileSync(filePath, 'utf8');
      if (!content.includes('ExpoAppDelegate')) continue;

      const original = content;
      content = content.replace(
        /\bExpoAppDelegate\.getSubscriberOfType\b/g,
        'ExpoAppDelegateSubscriberRepository.getSubscriberOfType'
      );
      content = content.replace(
        /\bExpoAppDelegate\b(?!Subscriber)/g,
        'ExpoAppDelegateSubscriberRepository'
      );

      if (content !== original) {
        fs.writeFileSync(filePath, content);
        console.log('[fix-expo-fs] Patched:', path.relative(rootDir, filePath));
        patched++;
      }
    }
  }

  if (patched === 0) {
    console.log('[fix-expo-fs] No patching needed for expo-file-system.');
  } else {
    console.log(`[fix-expo-fs] Patched ${patched} file(s).`);
  }
}

patchExpoFileSystem();
