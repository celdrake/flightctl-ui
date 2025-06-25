// Jest setup file for ui-components

// Add any global test setup here
import 'jest-environment-jsdom';

// Mock crypto APIs for unit tests
const mockCrypto = {
  subtle: {
    generateKey: jest.fn(),
    exportKey: jest.fn(),
    sign: jest.fn(),
    verify: jest.fn(),
  },
  getRandomValues: jest.fn((arr: Uint8Array) => {
    for (let i = 0; i < arr.length; i++) {
      arr[i] = Math.floor(Math.random() * 256);
    }
    return arr;
  }),
};

// Setup window.crypto (used by tests)
Object.defineProperty(window, 'crypto', {
  value: mockCrypto,
  writable: true,
});

// Mock TextEncoder/TextDecoder for Node.js
if (typeof TextEncoder === 'undefined') {
  Object.defineProperty(globalThis, 'TextEncoder', {
    value: class {
      encode(input: string): Uint8Array {
        return new Uint8Array(Buffer.from(input, 'utf-8'));
      }
    },
  });
}

if (typeof TextDecoder === 'undefined') {
  Object.defineProperty(globalThis, 'TextDecoder', {
    value: class {
      decode(input: Uint8Array): string {
        return Buffer.from(input).toString('utf-8');
      }
    },
  });
}

// Mock btoa/atob (used by tests for base64 operations)
if (typeof btoa === 'undefined') {
  Object.defineProperty(globalThis, 'btoa', (str: string) => Buffer.from(str, 'binary').toString('base64'));
}

if (typeof atob === 'undefined') {
  Object.defineProperty(globalThis, 'atob', (str: string) => Buffer.from(str, 'binary').toString('base64'));
}
