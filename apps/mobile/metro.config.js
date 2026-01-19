const path = require('path');
const { getDefaultConfig } = require('@expo/metro-config');
const symlinkResolver = require('@rnx-kit/metro-resolver-symlinks');
const fs = require('fs');
const exclusionList = require('metro-config/src/defaults/exclusionList');

function escapeRegExp(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '..', '..');

/** @type {import('metro-config').MetroConfig} */
const config = getDefaultConfig(projectRoot);

// Ensure Metro watches files from the monorepo root and pnpm stores (so symlinked deps resolve)
const pnpmMobileStore = path.resolve(projectRoot, 'node_modules', '.pnpm');
const pnpmRootStore = path.resolve(workspaceRoot, 'node_modules', '.pnpm');
config.watchFolders = [workspaceRoot]
  .concat(fs.existsSync(pnpmMobileStore) ? [pnpmMobileStore] : [])
  .concat(fs.existsSync(pnpmRootStore) ? [pnpmRootStore] : []);

// Resolve modules only from the app and the workspace root to avoid duplicate React copies
config.resolver = config.resolver || {};
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules')
];
config.resolver.disableHierarchicalLookup = true;
// Enable symlink resolution for pnpm/.pnpm paths (fixes SHA-1 not computed errors)
config.resolver.unstable_enableSymlinks = true;
// Use a symlink-aware resolver so pnpm links resolve correctly on Windows
config.resolver.resolveRequest = symlinkResolver({
  projectRoot,
  resolveNodeModulesAtRoot: true
});

// Force a single copy of React/React-DOM/React-Native from the workspace root (npm workspaces)
config.resolver.extraNodeModules = {
  ...(config.resolver.extraNodeModules || {}),
  react: path.resolve(workspaceRoot, 'node_modules/react'),
  'react-dom': path.resolve(workspaceRoot, 'node_modules/react-dom'),
  'react-native': path.resolve(workspaceRoot, 'node_modules/react-native')
};

// Exclude server/node_modules and supabase from Metro (Windows path quirks can break lstat)
const apiNodeModules = path.resolve(workspaceRoot, 'apps', 'api', 'node_modules');
const supabaseDir = path.resolve(workspaceRoot, 'supabase');
config.resolver.blockList = exclusionList([
  new RegExp(`${escapeRegExp(apiNodeModules)}[\\/].*`),
  new RegExp(`${escapeRegExp(supabaseDir)}[\\/].*`)
]);

module.exports = config;
