/**
 * @file        Configuration Jest pour agent-desk
 * @author      SalamBot Team (contact: info@salambot.ma)
 * @created     2025-05-25
 * @updated     2025-05-25
 * @project     SalamBot - AI CRM for Moroccan SMEs
 */

/* eslint-disable */
export default {
  displayName: 'agent-desk-agent-desk',
  preset: '../../jest.preset.js',
  transform: {
    '^(?!.*\\.(js|jsx|ts|tsx|css|json)$)': '@nx/react/plugins/jest',
    '^.+\\.[tj]sx?$': ['babel-jest', { presets: ['@nx/react/babel'] }],
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
  coverageDirectory: '../../coverage/apps/agent-desk_tmp',
};
