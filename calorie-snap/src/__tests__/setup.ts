import { vi } from 'vitest';

// Mock Blob constructor
global.Blob = vi.fn((content, options) => ({
  content,
  options,
  size: content.length,
  type: options?.type || 'text/plain'
})) as any;

// Mock URL methods
global.URL.createObjectURL = vi.fn(() => 'mock-object-url');
global.URL.revokeObjectURL = vi.fn();

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
global.localStorage = localStorageMock as any;

// Mock sessionStorage
const sessionStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
global.sessionStorage = sessionStorageMock as any;

// Mock IndexedDB
const mockIndexedDB = {
  open: vi.fn(() => ({
    result: {},
    onsuccess: null,
    onerror: null,
    onupgradeneeded: null,
  })),
};
global.indexedDB = mockIndexedDB as any;

// Mock navigator.mediaDevices
Object.defineProperty(navigator, 'mediaDevices', {
  value: {
    getUserMedia: vi.fn(() => Promise.resolve({
      getTracks: () => [],
    })),
  },
  writable: true,
});

// Mock TensorFlow.js
vi.mock('@tensorflow/tfjs', () => ({
  loadLayersModel: vi.fn(() => Promise.resolve({
    predict: vi.fn(() => ({
      data: vi.fn(() => Promise.resolve(new Float32Array(1000))),
      dispose: vi.fn(),
    })),
  })),
  browser: {
    fromPixels: vi.fn(() => ({
      resizeNearestNeighbor: vi.fn(() => ({
        expandDims: vi.fn(() => ({
          div: vi.fn(() => ({
            dispose: vi.fn(),
          })),
        })),
      })),
    })),
  },
}));