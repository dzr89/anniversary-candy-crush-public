/**
 * MemorySystem Tests
 * Tests for the memory reveal system
 */

const fs = require('fs');
const path = require('path');

// Setup mock DOM
function setupMockDOM() {
    document.body.innerHTML = `
        <div id="memory-overlay" class="overlay">
            <img id="memory-photo" src="" alt="">
            <p id="memory-text"></p>
            <button id="memory-close">Close</button>
        </div>
        <span id="memories-count">0</span>
        <span id="total-memories">5</span>
        <div id="photo-gallery"></div>
        <span id="final-message-text"></span>
    `;
}

// Mock Animations
global.Animations = {
    revealMemory: jest.fn().mockResolvedValue(undefined),
    hideMemory: jest.fn().mockResolvedValue(undefined),
    wait: jest.fn().mockResolvedValue(undefined),
};

// Mock AudioManager
global.AudioManager = {
    playSound: jest.fn(),
};

// Load MemorySystem module
const memoriesCode = fs.readFileSync(path.join(__dirname, '../js/memories.js'), 'utf8');

describe('MemorySystem', () => {
    const mockMemories = [
        { image: 'photo1.jpg', text: 'First memory' },
        { image: 'photo2.jpg', text: 'Second memory' },
        { image: 'photo3.jpg', text: 'Third memory' },
    ];

    beforeEach(() => {
        setupMockDOM();
        jest.clearAllMocks();

        // Re-evaluate module
        eval(memoriesCode);
    });

    describe('init', () => {
        test('sets up memories with IDs', () => {
            MemorySystem.init(mockMemories);

            expect(MemorySystem.memories.length).toBe(3);
            expect(MemorySystem.memories[0].id).toBe(0);
            expect(MemorySystem.memories[1].id).toBe(1);
            expect(MemorySystem.memories[2].id).toBe(2);
        });

        test('marks all memories as not revealed', () => {
            MemorySystem.init(mockMemories);

            MemorySystem.memories.forEach(memory => {
                expect(memory.revealed).toBe(false);
            });
        });

        test('sets total memories count', () => {
            MemorySystem.init(mockMemories);

            expect(MemorySystem.totalMemories).toBe(3);
        });

        test('resets revealed count', () => {
            MemorySystem.revealedCount = 5;
            MemorySystem.init(mockMemories);

            expect(MemorySystem.revealedCount).toBe(0);
        });

        test('caches DOM elements', () => {
            MemorySystem.init(mockMemories);

            expect(MemorySystem.overlay).toBe(document.getElementById('memory-overlay'));
            expect(MemorySystem.photoElement).toBe(document.getElementById('memory-photo'));
            expect(MemorySystem.textElement).toBe(document.getElementById('memory-text'));
            expect(MemorySystem.closeButton).toBe(document.getElementById('memory-close'));
        });

        test('updates UI counter', () => {
            MemorySystem.init(mockMemories);

            expect(document.getElementById('memories-count').textContent).toBe('0');
            expect(document.getElementById('total-memories').textContent).toBe('3');
        });

        test('cleans up previous listeners on re-init', () => {
            MemorySystem.init(mockMemories);
            const firstController = MemorySystem.abortController;

            MemorySystem.init(mockMemories);

            expect(firstController.signal.aborted).toBe(true);
        });
    });

    describe('cleanupListeners', () => {
        test('aborts existing abort controller', () => {
            MemorySystem.init(mockMemories);
            const controller = MemorySystem.abortController;

            MemorySystem.cleanupListeners();

            expect(controller.signal.aborted).toBe(true);
            expect(MemorySystem.abortController).toBeNull();
        });

        test('handles null abort controller gracefully', () => {
            MemorySystem.abortController = null;

            expect(() => MemorySystem.cleanupListeners()).not.toThrow();
        });
    });

    describe('generateMemoryPositions', () => {
        beforeEach(() => {
            MemorySystem.init(mockMemories);
        });

        test('generates correct number of positions', () => {
            const positions = MemorySystem.generateMemoryPositions(8);

            expect(positions.length).toBe(3);
        });

        test('each position has row, col, and memoryId', () => {
            const positions = MemorySystem.generateMemoryPositions(8);

            positions.forEach((pos, index) => {
                expect(pos.row).toBeDefined();
                expect(pos.col).toBeDefined();
                expect(pos.memoryId).toBe(index);
            });
        });

        test('positions are within grid bounds', () => {
            const gridSize = 8;
            const positions = MemorySystem.generateMemoryPositions(gridSize);

            positions.forEach(pos => {
                expect(pos.row).toBeGreaterThanOrEqual(0);
                expect(pos.row).toBeLessThan(gridSize);
                expect(pos.col).toBeGreaterThanOrEqual(0);
                expect(pos.col).toBeLessThan(gridSize);
            });
        });

        test('no duplicate positions', () => {
            const positions = MemorySystem.generateMemoryPositions(8);
            const uniqueKeys = new Set(positions.map(p => `${p.row},${p.col}`));

            expect(uniqueKeys.size).toBe(positions.length);
        });

        test('prefers inner positions (avoids edges)', () => {
            // Run multiple times to check statistical bias
            let innerCount = 0;
            let totalPositions = 0;

            for (let i = 0; i < 100; i++) {
                MemorySystem.init(mockMemories);
                const positions = MemorySystem.generateMemoryPositions(8);

                positions.forEach(pos => {
                    totalPositions++;
                    if (pos.row >= 1 && pos.row <= 6 && pos.col >= 1 && pos.col <= 6) {
                        innerCount++;
                    }
                });
            }

            // Expect majority to be inner positions (should be around 80%)
            expect(innerCount / totalPositions).toBeGreaterThan(0.5);
        });
    });

    describe('revealMemory', () => {
        beforeEach(() => {
            MemorySystem.init(mockMemories);
        });

        test('reveals next memory in sequence', async () => {
            await MemorySystem.revealMemory(999); // ID is ignored

            expect(MemorySystem.memories[0].revealed).toBe(true);
            expect(MemorySystem.revealedCount).toBe(1);
        });

        test('updates photo element', async () => {
            await MemorySystem.revealMemory(0);

            expect(MemorySystem.photoElement.src).toContain('photo1.jpg');
            expect(MemorySystem.photoElement.alt).toBe('First memory');
        });

        test('updates text element', async () => {
            await MemorySystem.revealMemory(0);

            expect(MemorySystem.textElement.textContent).toBe('First memory');
        });

        test('plays reveal animation', async () => {
            await MemorySystem.revealMemory(0);

            expect(Animations.revealMemory).toHaveBeenCalledWith(MemorySystem.overlay);
        });

        test('plays reveal sound', async () => {
            await MemorySystem.revealMemory(0);

            expect(AudioManager.playSound).toHaveBeenCalledWith('reveal');
        });

        test('updates counter', async () => {
            await MemorySystem.revealMemory(0);

            expect(document.getElementById('memories-count').textContent).toBe('1');
        });

        test('returns false when all memories revealed', async () => {
            MemorySystem.revealedCount = 3;

            const result = await MemorySystem.revealMemory(0);

            expect(result).toBe(false);
        });

        test('reveals memories in order regardless of memoryId', async () => {
            await MemorySystem.revealMemory(2); // Try to reveal 3rd
            expect(MemorySystem.memories[0].revealed).toBe(true); // Should reveal 1st

            await MemorySystem.revealMemory(0); // Try to reveal 1st
            expect(MemorySystem.memories[1].revealed).toBe(true); // Should reveal 2nd
        });
    });

    describe('hideMemory', () => {
        beforeEach(() => {
            MemorySystem.init(mockMemories);
        });

        test('calls hide animation', async () => {
            await MemorySystem.hideMemory();

            expect(Animations.hideMemory).toHaveBeenCalledWith(MemorySystem.overlay);
        });

        test('calls onClose callback if set', async () => {
            const mockCallback = jest.fn();
            MemorySystem.onClose = mockCallback;

            await MemorySystem.hideMemory();

            expect(mockCallback).toHaveBeenCalled();
        });

        test('clears onClose after calling', async () => {
            MemorySystem.onClose = jest.fn();

            await MemorySystem.hideMemory();

            expect(MemorySystem.onClose).toBeNull();
        });
    });

    describe('waitForClose', () => {
        beforeEach(() => {
            MemorySystem.init(mockMemories);
        });

        test('returns a promise', () => {
            const result = MemorySystem.waitForClose();

            expect(result).toBeInstanceOf(Promise);
        });

        test('sets onClose callback', () => {
            MemorySystem.waitForClose();

            expect(MemorySystem.onClose).not.toBeNull();
            expect(typeof MemorySystem.onClose).toBe('function');
        });

        test('resolves when hideMemory is called', async () => {
            const promise = MemorySystem.waitForClose();
            let resolved = false;

            promise.then(() => { resolved = true; });

            // Simulate calling onClose
            MemorySystem.onClose();

            await Promise.resolve(); // Let promise resolve
            expect(resolved).toBe(true);
        });
    });

    describe('updateCounter', () => {
        beforeEach(() => {
            MemorySystem.init(mockMemories);
        });

        test('updates memories count element', () => {
            MemorySystem.revealedCount = 2;
            MemorySystem.updateCounter();

            expect(document.getElementById('memories-count').textContent).toBe('2');
        });

        test('updates total memories element', () => {
            MemorySystem.totalMemories = 5;
            MemorySystem.updateCounter();

            expect(document.getElementById('total-memories').textContent).toBe('5');
        });
    });

    describe('isComplete', () => {
        beforeEach(() => {
            MemorySystem.init(mockMemories);
        });

        test('returns false when not all revealed', () => {
            MemorySystem.revealedCount = 2;

            expect(MemorySystem.isComplete()).toBe(false);
        });

        test('returns true when all revealed', () => {
            MemorySystem.revealedCount = 3;

            expect(MemorySystem.isComplete()).toBe(true);
        });

        test('returns true when more than total revealed', () => {
            MemorySystem.revealedCount = 5;

            expect(MemorySystem.isComplete()).toBe(true);
        });
    });

    describe('getRevealedMemories', () => {
        beforeEach(() => {
            MemorySystem.init(mockMemories);
        });

        test('returns empty array when none revealed', () => {
            const revealed = MemorySystem.getRevealedMemories();

            expect(revealed).toEqual([]);
        });

        test('returns only revealed memories', () => {
            MemorySystem.memories[0].revealed = true;
            MemorySystem.memories[2].revealed = true;

            const revealed = MemorySystem.getRevealedMemories();

            expect(revealed.length).toBe(2);
            expect(revealed[0].text).toBe('First memory');
            expect(revealed[1].text).toBe('Third memory');
        });
    });

    describe('getMemory', () => {
        beforeEach(() => {
            MemorySystem.init(mockMemories);
        });

        test('returns memory by ID', () => {
            const memory = MemorySystem.getMemory(1);

            expect(memory.text).toBe('Second memory');
        });

        test('returns undefined for invalid ID', () => {
            const memory = MemorySystem.getMemory(99);

            expect(memory).toBeUndefined();
        });
    });

    describe('reset', () => {
        beforeEach(() => {
            MemorySystem.init(mockMemories);
            // Reveal some memories
            MemorySystem.memories[0].revealed = true;
            MemorySystem.memories[1].revealed = true;
            MemorySystem.revealedCount = 2;
        });

        test('marks all memories as not revealed', () => {
            MemorySystem.reset();

            MemorySystem.memories.forEach(memory => {
                expect(memory.revealed).toBe(false);
            });
        });

        test('resets revealed count', () => {
            MemorySystem.reset();

            expect(MemorySystem.revealedCount).toBe(0);
        });

        test('updates UI counter', () => {
            MemorySystem.reset();

            expect(document.getElementById('memories-count').textContent).toBe('0');
        });
    });

    describe('populateGallery', () => {
        beforeEach(() => {
            MemorySystem.init(mockMemories);
        });

        test('creates images for all memories', () => {
            jest.useFakeTimers();
            MemorySystem.populateGallery();
            jest.runAllTimers();

            const gallery = document.getElementById('photo-gallery');
            expect(gallery.children.length).toBe(3);
        });

        test('sets correct image sources', () => {
            jest.useFakeTimers();
            MemorySystem.populateGallery();
            jest.runAllTimers();

            const images = document.querySelectorAll('#photo-gallery img');
            expect(images[0].src).toContain('photo1.jpg');
            expect(images[1].src).toContain('photo2.jpg');
            expect(images[2].src).toContain('photo3.jpg');
        });

        test('sets alt text', () => {
            jest.useFakeTimers();
            MemorySystem.populateGallery();
            jest.runAllTimers();

            const images = document.querySelectorAll('#photo-gallery img');
            expect(images[0].alt).toBe('First memory');
        });

        test('clears existing gallery content', () => {
            const gallery = document.getElementById('photo-gallery');
            gallery.innerHTML = '<div>Old content</div>';

            jest.useFakeTimers();
            MemorySystem.populateGallery();
            jest.runAllTimers();

            expect(gallery.querySelector('div')).toBeNull();
        });

        test('adds staggered entrance animation', () => {
            jest.useFakeTimers();
            MemorySystem.populateGallery();

            const images = document.querySelectorAll('#photo-gallery img');

            // Initially no visible class
            expect(images[0].classList.contains('visible')).toBe(false);

            // After timer, first image should be visible
            jest.advanceTimersByTime(100);
            expect(images[0].classList.contains('visible')).toBe(true);

            // Second image after 180ms (100 + 80)
            jest.advanceTimersByTime(80);
            expect(images[1].classList.contains('visible')).toBe(true);
        });
    });

    describe('setFinalMessage', () => {
        beforeEach(() => {
            MemorySystem.init(mockMemories);
        });

        test('sets final message text', () => {
            MemorySystem.setFinalMessage('Happy Anniversary!');

            expect(document.getElementById('final-message-text').textContent).toBe('Happy Anniversary!');
        });
    });
});
