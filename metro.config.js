const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const config = getDefaultConfig(projectRoot);

// Block Firebase Cloud Functions (Node.js server code) from being bundled.
function escapeForRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
const functionsDir = path.resolve(projectRoot, 'functions');
config.resolver.blockList = [
  ...(Array.isArray(config.resolver.blockList)
    ? config.resolver.blockList
    : [config.resolver.blockList].filter(Boolean)),
  new RegExp(`^${escapeForRegex(functionsDir)}(/.*)?$`),
];

module.exports = config;
