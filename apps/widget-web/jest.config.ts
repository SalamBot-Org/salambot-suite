/**
 * @file        Configuration Jest pour widget-web
 * @author      SalamBot Team (contact: info@salambot.ma)
 * @created     2025-05-25
 * @updated     2025-05-26
 * @project     SalamBot - AI CRM for Moroccan SMEs
 */

/* eslint-disable */
export default {
  displayName: 'widget-web',
  preset: '../../jest.preset.js',
  transform: {
    '^(?!.*\\.(js|jsx|ts|tsx|css|json)$)': '@nx/react/plugins/jest',
    '^.+\\.[tj]sx?$': ['babel-jest', { presets: ['@nx/next/babel'] }]
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
  coverageDirectory: '../../coverage/apps/widget-web',
  setupFilesAfterEnv: ['<rootDir>/src/jest-setup.ts'],
  // Ajout pour aider à la résolution des modules dans l'environnement CI
  moduleDirectories: ['node_modules', '<rootDir>/src'], 
};

