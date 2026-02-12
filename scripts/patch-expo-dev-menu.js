const fs = require('fs');
const path = require('path');

function patchFile(root) {
  const file = path.join(root, 'node_modules', 'expo-dev-menu', 'ios', 'DevMenuViewController.swift');
  if (!fs.existsSync(file)) return false;
  const src = fs.readFileSync(file, 'utf8');
  if (src.includes('#if targetEnvironment(simulator)')) return true;
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
    console.log('[patch-expo-dev-menu:root] patched DevMenuViewController.swift');
    return true;
  }
  return false;
}

try {
  const root = process.cwd();
  if (!patchFile(root)) {
    console.log('[patch-expo-dev-menu:root] expo-dev-menu not found or already patched');
  }
} catch (e) {
  console.warn('[patch-expo-dev-menu:root] failed:', e && e.message ? e.message : e);
  process.exit(0);
}

