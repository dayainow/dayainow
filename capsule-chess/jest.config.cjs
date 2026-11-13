const { dirname } = require('node:path');
const { createRequire } = require('node:module');
const fromExpo = createRequire(require.resolve('expo/package.json'));

module.exports = {
  preset: 'jest-expo',
  // jest-expo uses Expo's copy even when npm installs it under Expo's node_modules.
  moduleNameMapper: {
    '^expo-modules-core/(.*)$': dirname(fromExpo.resolve('expo-modules-core/package.json')) + '/$1',
    '^expo-modules-core$': fromExpo.resolve('expo-modules-core'),
  },
};
