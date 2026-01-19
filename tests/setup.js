/**
 * Jest Test Setup
 * Configures the test environment with necessary mocks and globals
 */

// Mock Audio API (not available in jsdom)
class MockAudio {
    constructor(src) {
        this.src = src;
        this.volume = 1;
        this.loop = false;
        this.paused = true;
        this.ended = false;
        this.currentTime = 0;
    }

    play() {
        this.paused = false;
        return Promise.resolve();
    }

    pause() {
        this.paused = true;
    }

    load() {}
}

global.Audio = MockAudio;

// Mock requestAnimationFrame
global.requestAnimationFrame = (callback) => setTimeout(callback, 16);
global.cancelAnimationFrame = (id) => clearTimeout(id);

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: jest.fn().mockImplementation(query => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
    })),
});

// Mock getBoundingClientRect
Element.prototype.getBoundingClientRect = jest.fn(() => ({
    width: 50,
    height: 50,
    top: 0,
    left: 0,
    bottom: 50,
    right: 50,
    x: 0,
    y: 0,
    toJSON: () => {}
}));

// Mock offsetHeight/offsetWidth (for force reflow tricks)
Object.defineProperty(HTMLElement.prototype, 'offsetHeight', {
    configurable: true,
    get: function() { return 50; }
});

Object.defineProperty(HTMLElement.prototype, 'offsetWidth', {
    configurable: true,
    get: function() { return 50; }
});

// Suppress console warnings in tests (optional - can be commented out for debugging)
// global.console = {
//     ...console,
//     warn: jest.fn(),
//     error: jest.fn(),
// };

// Helper to create a mock grid for testing
global.createMockGrid = (size, fillType = null) => {
    const grid = [];
    const types = ['heart', 'diamond', 'rose', 'star', 'ring'];

    for (let row = 0; row < size; row++) {
        grid[row] = [];
        for (let col = 0; col < size; col++) {
            grid[row][col] = {
                type: fillType || types[Math.floor(Math.random() * types.length)],
                special: null,
                isMemory: false,
                memoryId: null
            };
        }
    }
    return grid;
};

// Helper to create a grid with specific pattern for testing matches
global.createPatternGrid = (pattern) => {
    return pattern.map(row =>
        row.map(type => ({
            type: type,
            special: null,
            isMemory: false,
            memoryId: null
        }))
    );
};

// Helper to wait for promises/timers in tests
global.flushPromises = () => new Promise(resolve => setImmediate(resolve));

// Clean up after each test
afterEach(() => {
    jest.clearAllMocks();
    jest.clearAllTimers();
    document.body.innerHTML = '';
});

// Use fake timers by default
beforeEach(() => {
    jest.useFakeTimers();
});

afterEach(() => {
    jest.useRealTimers();
});
