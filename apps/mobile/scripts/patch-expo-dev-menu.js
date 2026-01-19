const fs = require('fs');
const path = require('path');

try {
  const file = path.join(__dirname, '..', 'node_modules', 'expo-dev-menu', 'ios', 'DevMenuViewController.swift');
  if (!fs.existsSync(file)) {
    console.log('[patch-expo-dev-menu] file not found, skipping');
    process.exit(0);
  }
  const src = fs.readFileSync(file, 'utf8');
  if (src.includes('#if targetEnvironment(simulator)')) {
    console.log('[patch-expo-dev-menu] already patched');
    process.exit(0);
  }
  const updated = src.replace(
    /let\s+isSimulator\s*=\s*TARGET_IPHONE_SIMULATOR\s*>\s*0/g,
    [
      '#if targetEnvironment(simulator)',
      '    let isSimulator = true',
      '#else',
      '    let isSimulator = false',
      '#endif',
    ].join('\n')
  );
  if (updated !== src) {
    fs.writeFileSync(file, updated);
    console.log('[patch-expo-dev-menu] patched DevMenuViewController.swift');
  } else {
    console.log('[patch-expo-dev-menu] pattern not found, no changes');
  }
} catch (e) {
  console.warn('[patch-expo-dev-menu] failed:', e && e.message ? e.message : e);
  process.exit(0);
}

