/**
 * Game Controller Tests
 * Tests for main game controller functionality
 */

const fs = require('fs');
const path = require('path');

// Setup mock DOM
function setupMockDOM() {
    document.body.innerHTML = `
        <div id="start-screen" class="screen"></div>
        <div id="loading-screen" class="screen"></div>
        <div id="game-screen" class="screen"></div>
        <div id="victory-screen" class="screen"></div>
        <div id="bonus-modal" class="screen"></div>
        <div id="game-board"></div>
        <span id="moves-count">50</span>
        <button id="mute-button">
            <span class="music-on">🔊</span>
            <span class="music-off" style="display:none">🔇</span>
        </button>
        <button id="hint-button">Hint</button>
        <button id="start-button">Start</button>
        <button id="replay-button">Replay</button>
        <button id="bonus-yes">Yes</button>
        <button id="bonus-no">No</button>
        <div class="start-content">
            <h1 class="title">Title</h1>
            <p class="subtitle">Subtitle</p>
        </div>
        <h1 class="victory-title">Victory</h1>
        <p class="victory-subtitle">Subtitle</p>
        <div class="signature">Signature</div>
    `;
}

// Mock dependencies
global.AudioManager = {
    init: jest.fn(),
    playMusic: jest.fn(),
    pauseMusic: jest.fn(),
    playSound: jest.fn(),
    toggleMute: jest.fn().mockReturnValue(false),
};

global.MemorySystem = {
    init: jest.fn(),
    reset: jest.fn(),
    generateMemoryPositions: jest.fn().mockReturnValue([]),
    revealMemory: jest.fn().mockResolvedValue(true),
    waitForClose: jest.fn().mockResolvedValue(undefined),
    isComplete: jest.fn().mockReturnValue(false),
    populateGallery: jest.fn(),
    setFinalMessage: jest.fn(),
};

global.Grid = {
    init: jest.fn(),
    generate: jest.fn(),
    hasPossibleMoves: jest.fn().mockReturnValue(true),
    shuffle: jest.fn().mockResolvedValue(undefined),
    data: createMockGrid(8),
    getTileElement: jest.fn().mockReturnValue(document.createElement('div')),
    getTileData: jest.fn().mockReturnValue({ type: 'heart', special: null }),
    swapTiles: jest.fn().mockResolvedValue(undefined),
    removeMatches: jest.fn().mockResolvedValue([]),
    applyGravity: jest.fn().mockResolvedValue(undefined),
    spawnNewTiles: jest.fn().mockResolvedValue(undefined),
    createSpecialCandy: jest.fn(),
    clearHints: jest.fn(),
    showHint: jest.fn(),
};

global.Animations = {
    transitionScreens: jest.fn().mockResolvedValue(undefined),
    wait: jest.fn().mockResolvedValue(undefined),
    selectTile: jest.fn(),
    deselectTile: jest.fn(),
    invalidSwap: jest.fn().mockResolvedValue(undefined),
    backgroundPulse: jest.fn(),
    screenShake: jest.fn(),
    startAmbientParticles: jest.fn(),
    stopAmbientParticles: jest.fn(),
    celebrateVictory: jest.fn().mockResolvedValue(undefined),
};

global.MatchDetector = {
    areAdjacent: jest.fn().mockReturnValue(true),
    wouldMatch: jest.fn().mockReturnValue(true),
    isSpecialCombination: jest.fn().mockReturnValue(null),
    findAllMatches: jest.fn().mockReturnValue({ matches: [], specials: [] }),
    getSpecialClearPositions: jest.fn().mockReturnValue([]),
    getSpecialCombinationClearPositions: jest.fn().mockReturnValue([]),
};

global.gameConfig = {
    gridSize: 8,
    startingMoves: 50,
    startScreenTitle: 'Happy Anniversary',
    startScreenSubtitle: 'A game made with love',
    startButtonText: 'Begin',
    victoryTitle: 'Victory!',
    victorySubtitle: 'Amazing!',
    finalMessage: 'Happy Anniversary!',
    signature: 'With love',
};

global.memories = [];

// Load Game module
const gameCode = fs.readFileSync(path.join(__dirname, '../js/game.js'), 'utf8');

describe('Game', () => {
    beforeEach(() => {
        setupMockDOM();
        jest.clearAllMocks();

        // Re-evaluate game code in fresh context
        eval(gameCode);
    });

    describe('deduplicatePositions', () => {
        test('removes duplicate positions', () => {
            const positions = [
                { row: 0, col: 0 },
                { row: 0, col: 1 },
                { row: 0, col: 0 }, // duplicate
                { row: 1, col: 0 },
                { row: 0, col: 1 }, // duplicate
            ];

            const result = Game.deduplicatePositions(positions);

            expect(result.length).toBe(3);
            expect(result).toContainEqual({ row: 0, col: 0 });
            expect(result).toContainEqual({ row: 0, col: 1 });
            expect(result).toContainEqual({ row: 1, col: 0 });
        });

        test('returns empty array for empty input', () => {
            const result = Game.deduplicatePositions([]);
            expect(result).toEqual([]);
        });

        test('returns same array when no duplicates', () => {
            const positions = [
                { row: 0, col: 0 },
                { row: 0, col: 1 },
                { row: 1, col: 0 },
            ];

            const result = Game.deduplicatePositions(positions);
            expect(result.length).toBe(3);
        });
    });

    describe('init', () => {
        test('caches all screen elements', () => {
            Game.init();

            expect(Game.screens.start).toBeDefined();
            expect(Game.screens.loading).toBeDefined();
            expect(Game.screens.game).toBeDefined();
            expect(Game.screens.victory).toBeDefined();
            expect(Game.screens.bonus).toBeDefined();
        });

        test('caches all control elements', () => {
            Game.init();

            expect(Game.elements.board).toBeDefined();
            expect(Game.elements.movesCount).toBeDefined();
            expect(Game.elements.muteButton).toBeDefined();
            expect(Game.elements.hintButton).toBeDefined();
            expect(Game.elements.startButton).toBeDefined();
        });

        test('initializes AudioManager', () => {
            Game.init();

            expect(AudioManager.init).toHaveBeenCalled();
        });

        test('initializes MemorySystem', () => {
            Game.init();

            expect(MemorySystem.init).toHaveBeenCalledWith(memories);
        });

        test('shows start screen', () => {
            Game.init();

            expect(Game.screens.start.classList.contains('active')).toBe(true);
        });
    });

    describe('showScreen', () => {
        beforeEach(() => {
            Game.init();
        });

        test('activates specified screen', async () => {
            await Game.showScreen('game');

            expect(Game.screens.game.classList.contains('active')).toBe(true);
        });

        test('deactivates all other screens', async () => {
            await Game.showScreen('game');

            expect(Game.screens.start.classList.contains('active')).toBe(false);
            expect(Game.screens.loading.classList.contains('active')).toBe(false);
            expect(Game.screens.victory.classList.contains('active')).toBe(false);
        });
    });

    describe('startGame', () => {
        beforeEach(() => {
            Game.init();
        });

        test('plays background music', async () => {
            jest.useFakeTimers();
            const promise = Game.startGame();
            jest.runAllTimers();
            await promise;

            expect(AudioManager.playMusic).toHaveBeenCalled();
        });

        test('initializes grid', async () => {
            jest.useFakeTimers();
            const promise = Game.startGame();
            jest.runAllTimers();
            await promise;

            expect(Grid.init).toHaveBeenCalledWith(Game.elements.board, 8);
            expect(Grid.generate).toHaveBeenCalled();
        });

        test('sets game state to playing', async () => {
            jest.useFakeTimers();
            const promise = Game.startGame();
            jest.runAllTimers();
            await promise;

            expect(Game.isPlaying).toBe(true);
            expect(Game.isPaused).toBe(false);
            expect(Game.isProcessing).toBe(false);
        });

        test('sets initial moves from config', async () => {
            jest.useFakeTimers();
            const promise = Game.startGame();
            jest.runAllTimers();
            await promise;

            expect(Game.moves).toBe(50);
            expect(Game.maxMoves).toBe(50);
        });

        test('starts ambient particles', async () => {
            jest.useFakeTimers();
            const promise = Game.startGame();
            jest.runAllTimers();
            await promise;

            expect(Animations.startAmbientParticles).toHaveBeenCalled();
        });
    });

    describe('handleTileClick', () => {
        beforeEach(() => {
            Game.init();
            Game.isPlaying = true;
            Game.isPaused = false;
            Game.isProcessing = false;
            Game.selectedTile = null;

            // Create mock tile element
            const tile = document.createElement('div');
            tile.classList.add('tile');
            tile.dataset.row = '2';
            tile.dataset.col = '3';
            Game.elements.board.appendChild(tile);
        });

        test('does nothing when not playing', async () => {
            Game.isPlaying = false;

            const event = { target: Game.elements.board.querySelector('.tile') };
            await Game.handleTileClick(event);

            expect(Animations.selectTile).not.toHaveBeenCalled();
        });

        test('does nothing when paused', async () => {
            Game.isPaused = true;

            const event = { target: Game.elements.board.querySelector('.tile') };
            await Game.handleTileClick(event);

            expect(Animations.selectTile).not.toHaveBeenCalled();
        });

        test('does nothing when processing', async () => {
            Game.isProcessing = true;

            const event = { target: Game.elements.board.querySelector('.tile') };
            await Game.handleTileClick(event);

            expect(Animations.selectTile).not.toHaveBeenCalled();
        });

        test('selects tile when none selected', async () => {
            const tile = Game.elements.board.querySelector('.tile');
            const event = { target: tile, closest: () => tile };

            await Game.handleTileClick(event);

            expect(Game.selectedTile).toEqual({ row: 2, col: 3 });
            expect(Animations.selectTile).toHaveBeenCalledWith(tile);
        });

        test('deselects tile when same tile clicked', async () => {
            const tile = Game.elements.board.querySelector('.tile');
            Game.selectedTile = { row: 2, col: 3 };
            Grid.getTileElement.mockReturnValue(tile);

            const event = { target: tile, closest: () => tile };
            await Game.handleTileClick(event);

            expect(Game.selectedTile).toBeNull();
            expect(Animations.deselectTile).toHaveBeenCalled();
        });
    });

    describe('updateMovesDisplay', () => {
        beforeEach(() => {
            Game.init();
        });

        test('updates moves count text', () => {
            Game.moves = 42;
            Game.updateMovesDisplay();

            expect(Game.elements.movesCount.textContent).toBe('42');
        });

        test('shows warning color when moves <= 5', () => {
            Game.moves = 5;
            Game.updateMovesDisplay();

            expect(Game.elements.movesCount.style.color).toBe('rgb(233, 30, 99)');
        });

        test('shows caution color when moves <= 10', () => {
            Game.moves = 10;
            Game.updateMovesDisplay();

            expect(Game.elements.movesCount.style.color).toBe('rgb(255, 152, 0)');
        });

        test('clears color when moves > 10', () => {
            Game.moves = 15;
            Game.updateMovesDisplay();

            expect(Game.elements.movesCount.style.color).toBe('');
        });
    });

    describe('showBonusModal', () => {
        beforeEach(() => {
            Game.init();
        });

        test('pauses game', () => {
            Game.showBonusModal();

            expect(Game.isPaused).toBe(true);
        });

        test('activates bonus modal', () => {
            Game.showBonusModal();

            expect(Game.screens.bonus.classList.contains('active')).toBe(true);
        });
    });

    describe('addBonusMoves', () => {
        beforeEach(() => {
            Game.init();
            Game.moves = 0;
            Game.isPaused = true;
            Game.screens.bonus.classList.add('active');
        });

        test('adds 10 moves', () => {
            Game.addBonusMoves();

            expect(Game.moves).toBe(10);
        });

        test('unpauses game', () => {
            jest.useFakeTimers();
            Game.addBonusMoves();
            jest.runAllTimers();

            expect(Game.isPaused).toBe(false);
        });

        test('updates moves display', () => {
            Game.addBonusMoves();

            expect(Game.elements.movesCount.textContent).toBe('10');
        });
    });

    describe('showVictory', () => {
        beforeEach(() => {
            Game.init();
            Game.isPlaying = true;
        });

        test('stops playing state', async () => {
            await Game.showVictory();

            expect(Game.isPlaying).toBe(false);
        });

        test('stops ambient particles', async () => {
            await Game.showVictory();

            expect(Animations.stopAmbientParticles).toHaveBeenCalled();
        });

        test('plays victory sound', async () => {
            await Game.showVictory();

            expect(AudioManager.playSound).toHaveBeenCalledWith('victory');
        });

        test('populates gallery', async () => {
            await Game.showVictory();

            expect(MemorySystem.populateGallery).toHaveBeenCalled();
        });

        test('celebrates victory', async () => {
            await Game.showVictory();

            expect(Animations.celebrateVictory).toHaveBeenCalled();
        });
    });

    describe('restartGame', () => {
        beforeEach(() => {
            Game.init();
            Game.isPlaying = false;
            Game.screens.victory.classList.add('active');
        });

        test('resets memory system', async () => {
            jest.useFakeTimers();
            const promise = Game.restartGame();
            jest.runAllTimers();
            await promise;

            expect(MemorySystem.reset).toHaveBeenCalled();
        });

        test('resets game state', async () => {
            jest.useFakeTimers();
            const promise = Game.restartGame();
            jest.runAllTimers();
            await promise;

            expect(Game.isPlaying).toBe(true);
            expect(Game.isPaused).toBe(false);
            expect(Game.isProcessing).toBe(false);
            expect(Game.selectedTile).toBeNull();
        });

        test('resets moves', async () => {
            jest.useFakeTimers();
            const promise = Game.restartGame();
            jest.runAllTimers();
            await promise;

            expect(Game.moves).toBe(50);
        });

        test('reinitializes grid', async () => {
            jest.useFakeTimers();
            const promise = Game.restartGame();
            jest.runAllTimers();
            await promise;

            expect(Grid.init).toHaveBeenCalled();
            expect(Grid.generate).toHaveBeenCalled();
        });
    });

    describe('applyConfigText', () => {
        beforeEach(() => {
            Game.init();
        });

        test('applies start screen title', () => {
            const title = document.querySelector('.start-content .title');
            expect(title.textContent).toBe('Happy Anniversary');
        });

        test('applies start screen subtitle', () => {
            const subtitle = document.querySelector('.start-content .subtitle');
            expect(subtitle.textContent).toBe('A game made with love');
        });

        test('applies victory title', () => {
            const victoryTitle = document.querySelector('.victory-title');
            expect(victoryTitle.textContent).toBe('Victory!');
        });
    });

    describe('processMatches', () => {
        beforeEach(() => {
            Game.init();
            Game.isPlaying = true;
            MatchDetector.findAllMatches.mockReturnValue({ matches: [], specials: [] });
        });

        test('processes until no more matches', async () => {
            // First call returns matches, second returns none
            MatchDetector.findAllMatches
                .mockReturnValueOnce({
                    matches: [{ row: 0, col: 0 }, { row: 0, col: 1 }, { row: 0, col: 2 }],
                    specials: []
                })
                .mockReturnValueOnce({ matches: [], specials: [] });

            await Game.processMatches();

            expect(MatchDetector.findAllMatches).toHaveBeenCalledTimes(2);
        });

        test('plays match sound for matches', async () => {
            MatchDetector.findAllMatches
                .mockReturnValueOnce({
                    matches: [{ row: 0, col: 0 }],
                    specials: []
                })
                .mockReturnValueOnce({ matches: [], specials: [] });

            await Game.processMatches();

            expect(AudioManager.playSound).toHaveBeenCalledWith('match');
        });

        test('removes matched tiles', async () => {
            MatchDetector.findAllMatches
                .mockReturnValueOnce({
                    matches: [{ row: 0, col: 0 }, { row: 0, col: 1 }],
                    specials: []
                })
                .mockReturnValueOnce({ matches: [], specials: [] });

            await Game.processMatches();

            expect(Grid.removeMatches).toHaveBeenCalled();
        });

        test('applies gravity after removing', async () => {
            MatchDetector.findAllMatches
                .mockReturnValueOnce({
                    matches: [{ row: 0, col: 0 }],
                    specials: []
                })
                .mockReturnValueOnce({ matches: [], specials: [] });

            await Game.processMatches();

            expect(Grid.applyGravity).toHaveBeenCalled();
        });

        test('spawns new tiles after gravity', async () => {
            MatchDetector.findAllMatches
                .mockReturnValueOnce({
                    matches: [{ row: 0, col: 0 }],
                    specials: []
                })
                .mockReturnValueOnce({ matches: [], specials: [] });

            await Game.processMatches();

            expect(Grid.spawnNewTiles).toHaveBeenCalled();
        });
    });
});
