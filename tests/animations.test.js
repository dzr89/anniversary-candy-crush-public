/**
 * Animations Tests
 * Tests for animation system
 */

const fs = require('fs');
const path = require('path');

// Load Animations module
const animationsCode = fs.readFileSync(path.join(__dirname, '../js/animations.js'), 'utf8');
eval(animationsCode);

describe('Animations', () => {
    beforeEach(() => {
        document.body.innerHTML = `
            <div id="game-board" class="game-board">
                <div class="tile" data-row="0" data-col="0"></div>
                <div class="tile" data-row="0" data-col="1"></div>
            </div>
        `;

        // Reset Animations state
        Animations.ambientParticles = [];
        Animations.particleInterval = null;
    });

    afterEach(() => {
        // Cleanup
        Animations.stopAmbientParticles();
        jest.clearAllTimers();
    });

    describe('wait', () => {
        test('returns a promise', () => {
            const result = Animations.wait(100);
            expect(result).toBeInstanceOf(Promise);
        });

        test('resolves after specified time', async () => {
            jest.useFakeTimers();
            let resolved = false;

            Animations.wait(100).then(() => { resolved = true; });

            expect(resolved).toBe(false);

            jest.advanceTimersByTime(100);
            await Promise.resolve(); // Let microtasks run

            expect(resolved).toBe(true);
        });
    });

    describe('selectTile', () => {
        test('adds selected class to tile', () => {
            const tile = document.querySelector('.tile');

            Animations.selectTile(tile);

            expect(tile.classList.contains('selected')).toBe(true);
        });
    });

    describe('deselectTile', () => {
        test('removes selected class from tile', () => {
            const tile = document.querySelector('.tile');
            tile.classList.add('selected');

            Animations.deselectTile(tile);

            expect(tile.classList.contains('selected')).toBe(false);
        });
    });

    describe('swapTiles', () => {
        test('adds swapping class to both tiles', async () => {
            jest.useFakeTimers();
            const tile1 = document.querySelectorAll('.tile')[0];
            const tile2 = document.querySelectorAll('.tile')[1];

            const promise = Animations.swapTiles(tile1, tile2);

            expect(tile1.classList.contains('swapping')).toBe(true);
            expect(tile2.classList.contains('swapping')).toBe(true);

            jest.runAllTimers();
            await promise;
        });

        test('removes swapping class after animation', async () => {
            jest.useFakeTimers();
            const tile1 = document.querySelectorAll('.tile')[0];
            const tile2 = document.querySelectorAll('.tile')[1];

            const promise = Animations.swapTiles(tile1, tile2);
            jest.runAllTimers();
            await promise;

            expect(tile1.classList.contains('swapping')).toBe(false);
            expect(tile2.classList.contains('swapping')).toBe(false);
        });

        test('resets transforms after animation', async () => {
            jest.useFakeTimers();
            const tile1 = document.querySelectorAll('.tile')[0];
            const tile2 = document.querySelectorAll('.tile')[1];

            const promise = Animations.swapTiles(tile1, tile2);
            jest.runAllTimers();
            await promise;

            expect(tile1.style.transform).toBe('');
            expect(tile2.style.transform).toBe('');
        });
    });

    describe('invalidSwap', () => {
        test('calls swapTiles twice (swap and revert)', () => {
            const tile1 = document.querySelectorAll('.tile')[0];
            const tile2 = document.querySelectorAll('.tile')[1];

            // Just verify the function can be called without error
            Animations.invalidSwap(tile1, tile2);

            // Both tiles get swapping class immediately
            expect(tile1.classList.contains('swapping')).toBe(true);
            expect(tile2.classList.contains('swapping')).toBe(true);
        });

        test('function returns a promise', () => {
            const tile1 = document.querySelectorAll('.tile')[0];
            const tile2 = document.querySelectorAll('.tile')[1];

            const result = Animations.invalidSwap(tile1, tile2);

            expect(result).toBeInstanceOf(Promise);
        });
    });

    describe('removeTile', () => {
        test('adds animation class to tile', async () => {
            jest.useFakeTimers();
            const tile = document.querySelector('.tile');

            const promise = Animations.removeTile(tile, 'matched');

            expect(tile.classList.contains('matched')).toBe(true);

            jest.runAllTimers();
            await promise;
        });

        test('removes animation class after delay', async () => {
            jest.useFakeTimers();
            const tile = document.querySelector('.tile');

            const promise = Animations.removeTile(tile, 'matched');
            jest.runAllTimers();
            await promise;

            expect(tile.classList.contains('matched')).toBe(false);
        });

        test('uses default animation type', async () => {
            jest.useFakeTimers();
            const tile = document.querySelector('.tile');

            const promise = Animations.removeTile(tile);

            expect(tile.classList.contains('matched')).toBe(true);

            jest.runAllTimers();
            await promise;
        });
    });

    describe('fallTiles', () => {
        test('adds falling class to tiles', async () => {
            jest.useFakeTimers();
            const tile = document.querySelector('.tile');

            const animations = [{ tile, distance: 2 }];
            const promise = Animations.fallTiles(animations);

            expect(tile.classList.contains('falling')).toBe(true);

            jest.runAllTimers();
            await promise;
        });

        test('removes falling class after animation', async () => {
            jest.useFakeTimers();
            const tile = document.querySelector('.tile');

            const animations = [{ tile, distance: 2 }];
            const promise = Animations.fallTiles(animations);
            jest.runAllTimers();
            await promise;

            expect(tile.classList.contains('falling')).toBe(false);
        });
    });

    describe('spawnTiles', () => {
        test('adds spawning class to new tiles', async () => {
            jest.useFakeTimers();
            const tile = document.querySelector('.tile');

            const newTiles = [{ tile, delay: 0 }];
            const promise = Animations.spawnTiles(newTiles);

            jest.advanceTimersByTime(1);

            expect(tile.classList.contains('spawning')).toBe(true);

            jest.runAllTimers();
            await promise;
        });

        test('removes spawning class after animation', async () => {
            jest.useFakeTimers();
            const tile = document.querySelector('.tile');

            const newTiles = [{ tile, delay: 0 }];
            const promise = Animations.spawnTiles(newTiles);
            jest.runAllTimers();
            await promise;

            expect(tile.classList.contains('spawning')).toBe(false);
        });

        test('respects delay parameter', async () => {
            jest.useFakeTimers();
            const tile = document.querySelector('.tile');

            const newTiles = [{ tile, delay: 100 }];
            Animations.spawnTiles(newTiles);

            jest.advanceTimersByTime(50);
            expect(tile.classList.contains('spawning')).toBe(false);

            jest.advanceTimersByTime(100);
            expect(tile.classList.contains('spawning')).toBe(true);
        });
    });

    describe('showHint', () => {
        test('adds hinting class to both tiles', () => {
            const tile1 = document.querySelectorAll('.tile')[0];
            const tile2 = document.querySelectorAll('.tile')[1];

            Animations.showHint(tile1, tile2);

            expect(tile1.classList.contains('hinting')).toBe(true);
            expect(tile2.classList.contains('hinting')).toBe(true);
        });

        test('removes hinting class after 3 seconds', () => {
            jest.useFakeTimers();
            const tile1 = document.querySelectorAll('.tile')[0];
            const tile2 = document.querySelectorAll('.tile')[1];

            Animations.showHint(tile1, tile2);

            jest.advanceTimersByTime(3000);

            expect(tile1.classList.contains('hinting')).toBe(false);
            expect(tile2.classList.contains('hinting')).toBe(false);
        });

        test('clears existing hints before showing new ones', () => {
            const tile1 = document.querySelectorAll('.tile')[0];
            const tile2 = document.querySelectorAll('.tile')[1];

            // Add hint to tile1
            tile1.classList.add('hinting');

            // Show hint on tile2 (should clear tile1)
            Animations.showHint(tile2, tile2);

            // tile1 should no longer have hinting
            expect(tile1.classList.contains('hinting')).toBe(false);
        });
    });

    describe('shuffleBoard', () => {
        test('applies transform animation to board', () => {
            const board = document.getElementById('game-board');

            // Just call the function - it sets transition synchronously
            Animations.shuffleBoard(board);

            expect(board.style.transition).toBe('transform 300ms ease-in-out');
        });

        test('sets transform initially', () => {
            const board = document.getElementById('game-board');

            Animations.shuffleBoard(board);

            // Transform should be set (doesn't matter the exact value)
            expect(board.style.transform).toBeTruthy();
        });
    });

    describe('transitionScreens', () => {
        test('immediately sets opacity on hide screen', () => {
            const screen1 = document.createElement('div');
            const screen2 = document.createElement('div');
            screen1.classList.add('active');
            document.body.appendChild(screen1);
            document.body.appendChild(screen2);

            Animations.transitionScreens(screen1, screen2);

            // Screen1 opacity should be set to 0 immediately
            expect(screen1.style.opacity).toBe('0');
        });
    });

    describe('revealMemory', () => {
        test('activates overlay immediately', () => {
            const overlay = document.createElement('div');
            overlay.className = 'overlay';
            document.body.appendChild(overlay);

            Animations.revealMemory(overlay);

            expect(overlay.classList.contains('active')).toBe(true);
        });
    });

    describe('hideMemory', () => {
        test('deactivates overlay', async () => {
            jest.useFakeTimers();
            const overlay = document.createElement('div');
            overlay.className = 'overlay active';
            document.body.appendChild(overlay);

            const promise = Animations.hideMemory(overlay);
            jest.runAllTimers();
            await promise;

            expect(overlay.classList.contains('active')).toBe(false);
        });
    });

    describe('screenShake', () => {
        test('applies shake animation to board', () => {
            jest.useFakeTimers();
            const board = document.getElementById('game-board');

            Animations.screenShake('medium');

            expect(board.style.animation).toBe('shake-medium 0.3s ease-out');
        });

        test('clears animation after duration', () => {
            jest.useFakeTimers();
            const board = document.getElementById('game-board');

            Animations.screenShake('light');
            jest.advanceTimersByTime(300);

            expect(board.style.animation).toBe('');
        });

        test('uses default intensity', () => {
            jest.useFakeTimers();
            const board = document.getElementById('game-board');

            Animations.screenShake();

            expect(board.style.animation).toBe('shake-light 0.3s ease-out');
        });
    });

    describe('backgroundPulse', () => {
        test('adds pulse class to body', () => {
            jest.useFakeTimers();

            Animations.backgroundPulse();

            expect(document.body.classList.contains('match-pulse')).toBe(true);
        });

        test('removes pulse class after duration', () => {
            jest.useFakeTimers();

            Animations.backgroundPulse();
            jest.advanceTimersByTime(300);

            expect(document.body.classList.contains('match-pulse')).toBe(false);
        });
    });

    describe('startAmbientParticles', () => {
        test('creates particle interval', () => {
            jest.useFakeTimers();

            Animations.startAmbientParticles();

            expect(Animations.particleInterval).not.toBeNull();
        });

        test('does not create duplicate intervals', () => {
            jest.useFakeTimers();

            Animations.startAmbientParticles();
            const firstInterval = Animations.particleInterval;

            Animations.startAmbientParticles();

            expect(Animations.particleInterval).toBe(firstInterval);
        });

        test('creates particles periodically', () => {
            jest.useFakeTimers();

            Animations.startAmbientParticles();
            jest.advanceTimersByTime(2500);

            expect(document.querySelectorAll('.ambient-particle').length).toBeGreaterThan(0);
        });

        test('limits particle count', () => {
            jest.useFakeTimers();

            Animations.startAmbientParticles();

            // Fast-forward many intervals
            for (let i = 0; i < 20; i++) {
                jest.advanceTimersByTime(2500);
            }

            // Should not exceed limit (12)
            expect(Animations.ambientParticles.length).toBeLessThanOrEqual(12);
        });
    });

    describe('stopAmbientParticles', () => {
        test('clears particle interval', () => {
            jest.useFakeTimers();
            Animations.startAmbientParticles();

            Animations.stopAmbientParticles();

            expect(Animations.particleInterval).toBeNull();
        });

        test('removes all particles', () => {
            jest.useFakeTimers();
            Animations.startAmbientParticles();
            jest.advanceTimersByTime(5000);

            Animations.stopAmbientParticles();

            expect(Animations.ambientParticles.length).toBe(0);
            expect(document.querySelectorAll('.ambient-particle').length).toBe(0);
        });
    });

    describe('createSparkles', () => {
        test('creates sparkle elements', () => {
            const board = document.getElementById('game-board');
            const tile = document.querySelector('.tile');

            Animations.createSparkles(tile, 5);

            expect(board.querySelectorAll('.sparkle').length).toBe(5);
        });

        test('removes sparkles after delay', () => {
            jest.useFakeTimers();
            const board = document.getElementById('game-board');
            const tile = document.querySelector('.tile');

            Animations.createSparkles(tile, 3);

            expect(board.querySelectorAll('.sparkle').length).toBe(3);

            jest.advanceTimersByTime(600);

            expect(board.querySelectorAll('.sparkle').length).toBe(0);
        });

        test('uses document fragment for performance', () => {
            const board = document.getElementById('game-board');
            const tile = document.querySelector('.tile');

            const appendChildSpy = jest.spyOn(board, 'appendChild');

            Animations.createSparkles(tile, 5);

            // Should only call appendChild once (with fragment)
            expect(appendChildSpy).toHaveBeenCalledTimes(1);
        });
    });

    describe('celebrateVictory', () => {
        test('activates victory screen', async () => {
            jest.useFakeTimers();
            const victoryScreen = document.createElement('div');
            document.body.appendChild(victoryScreen);

            const promise = Animations.celebrateVictory(victoryScreen);
            jest.runAllTimers();
            await promise;

            expect(victoryScreen.classList.contains('active')).toBe(true);
        });

        test('creates celebration effects', async () => {
            jest.useFakeTimers();
            const victoryScreen = document.createElement('div');
            document.body.appendChild(victoryScreen);

            const promise = Animations.celebrateVictory(victoryScreen);
            jest.advanceTimersByTime(100);

            // Should have created particles
            expect(victoryScreen.children.length).toBeGreaterThan(0);

            jest.runAllTimers();
            await promise;
        });
    });
});
