// metro.config.js
const { getDefaultConfig } = require("expo/metro-config");

const defaultConfig = getDefaultConfig(__dirname);

// allow .cjs files
defaultConfig.resolver.sourceExts.push("cjs");
// ⚠️ this is the magic line that stops the “Component auth has not been registered yet” error
defaultConfig.resolver.unstable_enablePackageExports = false;

module.exports = defaultConfig;
