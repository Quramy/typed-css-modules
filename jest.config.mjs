export default {
  transform: {
    '^.+\\.ts$': ['ts-jest', { diagnostics: false }],
  },
  testRegex: '(test/.*|(src/.*\\.test))\\.ts$',
  testPathIgnorePatterns: ['/node_modules/', '\\.d\\.ts$', 'lib/', 'example/', 'coverage/'],
  moduleFileExtensions: ['js', 'ts', 'json'],
};
