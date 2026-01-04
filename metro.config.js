const path = require('path');
const { getDefaultConfig } = require('@expo/metro-config');

// Treat the mobile app as the Metro project root when starting from the repo root
const projectRoot = path.resolve(__dirname, 'apps/mobile');
const workspaceRoot = __dirname;

/** @type {import('metro-config').MetroConfig} */
const config = getDefaultConfig(projectRoot);

// Watch the whole workspace so symlinked deps resolve correctly
config.watchFolders = [workspaceRoot];

// Resolve modules from the app and the workspace root only
config.resolver = config.resolver || {};
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules')
];
config.resolver.disableHierarchicalLookup = true;

// Force a single copy of React/React-DOM/React-Native from the workspace root (npm workspaces)
config.resolver.extraNodeModules = {
  ...(config.resolver.extraNodeModules || {}),
  react: path.resolve(workspaceRoot, 'node_modules/react'),
  'react-dom': path.resolve(workspaceRoot, 'node_modules/react-dom'),
  'react-native': path.resolve(workspaceRoot, 'node_modules/react-native')
};

module.exports = config;
