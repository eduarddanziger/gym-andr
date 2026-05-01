// eslint.config.js
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');
const eslintPluginPrettierRecommended = require('eslint-plugin-prettier/recommended');

module.exports = defineConfig([
    expoConfig,
    eslintPluginPrettierRecommended,
    {
        ignores: [
            'dist/*',
            'node_modules/*',
            'android/*',
            '.expo/*',
            'assets/*',
        ],
    },
    {
        // gym-andr strict rules on top of expo base
        rules: {
            // TypeScript
            '@typescript-eslint/no-explicit-any': 'error',
            '@typescript-eslint/explicit-function-return-type': 'warn',
            '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],

            // React / React Native
            'react/self-closing-comp': 'warn',
            'no-console': ['warn', { allow: ['warn', 'error'] }],

            // Prettier violations as errors
            'prettier/prettier': 'error',
        },
    },
    {
        // metro.config.js needs Node globals
        files: ['metro.config.js'],
        languageOptions: {
            globals: { require: 'readonly', module: 'writable', __dirname: 'readonly' },
        },
    },
]);