/* eslint-env jest */
// Use fake timers to control animations
jest.useFakeTimers();

// Clean up after each test
afterEach(() => {
  jest.clearAllTimers();
});

// Mock native modules
jest.mock('react-native-share', () => ({
  default: {
    open: jest.fn(),
    shareSingle: jest.fn(),
  },
}));

jest.mock('react-native-view-shot', () => ({
  captureRef: jest.fn(),
}));

jest.mock('react-native-fs', () => ({
  writeFile: jest.fn(),
  readFile: jest.fn(),
  exists: jest.fn(),
  mkdir: jest.fn(),
  unlink: jest.fn(),
  DocumentDirectoryPath: '/mock/path',
}));

jest.mock('react-native-safe-area-context', () => {
  const inset = { top: 0, right: 0, bottom: 0, left: 0 };
  return {
    SafeAreaProvider: ({ children }) => children,
    SafeAreaView: ({ children }) => children,
    useSafeAreaInsets: () => inset,
  };
});
