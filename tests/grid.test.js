/**
 * Grid Tests
 * Tests for grid management functionality
 */

// Load dependencies
const fs = require('fs');
const path = require('path');

// Mock Animations (required by Grid)
global.Animations = {
    swapTiles: jest.fn().mockResolvedValue(undefined),
    removeTile: jest.fn().mockResolvedValue(undefined),
    fallTiles: jest.fn().mockResolvedValue(undefined),
    spawnTiles: jest.fn().mockResolvedValue(undefined),
    shuffleBoard: jest.fn().mockResolvedValue(undefined),
    showHint: jest.fn(),
    wait: jest.fn().mockResolvedValue(undefined),
};

// Mock MatchDetector (required by Grid)
global.MatchDetector = {
    findPossibleMatch: jest.fn().mockReturnValue([{ row: 0, col: 0 }, { row: 0, col: 1 }]),
    findAllMatches: jest.fn().mockReturnValue({ matches: [], specials: [] }),
};

// Load Grid module
const gridCode = fs.readFileSync(path.join(__dirname, '../js/grid.js'), 'utf8');
eval(gridCode);

describe('Grid', () => {
    let mockBoard;

    beforeEach(() => {
        // Create mock board element
        mockBoard = document.createElement('div');
        mockBoard.id = 'game-board';
        document.body.appendChild(mockBoard);

        // Reset mocks
        jest.clearAllMocks();
        Animations.swapTiles.mockResolvedValue(undefined);
        Animations.removeTile.mockResolvedValue(undefined);
        Animations.fallTiles.mockResolvedValue(undefined);
        Animations.spawnTiles.mockResolvedValue(undefined);
    });

    afterEach(() => {
        document.body.innerHTML = '';
    });

    describe('init', () => {
        test('initializes grid with default size of 8', () => {
            Grid.init(mockBoard);

            expect(Grid.size).toBe(8);
            expect(Grid.element).toBe(mockBoard);
            expect(Grid.tiles.length).toBe(8);
            expect(Grid.data.length).toBe(8);
        });

        test('initializes grid with custom size', () => {
            Grid.init(mockBoard, 6);

            expect(Grid.size).toBe(6);
            expect(Grid.tiles.length).toBe(6);
            expect(Grid.data.length).toBe(6);
        });

        test('clears existing board content', () => {
            mockBoard.innerHTML = '<div>Old content</div>';
            Grid.init(mockBoard);

            expect(mockBoard.innerHTML).toBe('');
        });

        test('initializes empty 2D arrays', () => {
            Grid.init(mockBoard, 4);

            for (let row = 0; row < 4; row++) {
                expect(Array.isArray(Grid.tiles[row])).toBe(true);
                expect(Array.isArray(Grid.data[row])).toBe(true);
            }
        });
    });

    describe('tileTypes', () => {
        test('has 5 tile types', () => {
            expect(Grid.tileTypes.length).toBe(5);
        });

        test('contains expected types', () => {
            expect(Grid.tileTypes).toContain('heart');
            expect(Grid.tileTypes).toContain('diamond');
            expect(Grid.tileTypes).toContain('rose');
            expect(Grid.tileTypes).toContain('star');
            expect(Grid.tileTypes).toContain('ring');
        });
    });

    describe('getRandomType', () => {
        test('returns a valid tile type', () => {
            for (let i = 0; i < 100; i++) {
                const type = Grid.getRandomType();
                expect(Grid.tileTypes).toContain(type);
            }
        });
    });

    describe('generate', () => {
        beforeEach(() => {
            Grid.init(mockBoard, 4);
        });

        test('creates tiles for entire grid', () => {
            Grid.generate();

            expect(mockBoard.children.length).toBe(16); // 4x4
        });

        test('populates data array with tile data', () => {
            Grid.generate();

            for (let row = 0; row < 4; row++) {
                for (let col = 0; col < 4; col++) {
                    expect(Grid.data[row][col]).not.toBeNull();
                    expect(Grid.data[row][col].type).toBeDefined();
                    expect(Grid.tileTypes).toContain(Grid.data[row][col].type);
                }
            }
        });

        test('tiles have correct data attributes', () => {
            Grid.generate();

            const tiles = mockBoard.querySelectorAll('.tile');
            tiles.forEach((tile, index) => {
                const row = Math.floor(index / 4);
                const col = index % 4;
                expect(tile.dataset.row).toBe(String(row));
                expect(tile.dataset.col).toBe(String(col));
            });
        });

        test('marks memory positions correctly', () => {
            const memoryPositions = [
                { row: 1, col: 1, memoryId: 0 },
                { row: 2, col: 2, memoryId: 1 }
            ];

            Grid.generate(memoryPositions);

            expect(Grid.data[1][1].isMemory).toBe(true);
            expect(Grid.data[1][1].memoryId).toBe(0);
            expect(Grid.data[2][2].isMemory).toBe(true);
            expect(Grid.data[2][2].memoryId).toBe(1);
        });

        test('non-memory tiles are not marked as memory', () => {
            const memoryPositions = [{ row: 1, col: 1, memoryId: 0 }];
            Grid.generate(memoryPositions);

            expect(Grid.data[0][0].isMemory).toBe(false);
            expect(Grid.data[0][0].memoryId).toBeNull();
        });
    });

    describe('wouldCreateInitialMatch', () => {
        beforeEach(() => {
            Grid.init(mockBoard, 4);
            // Manually set up some data for testing
            Grid.data[0][0] = { type: 'heart' };
            Grid.data[0][1] = { type: 'heart' };
        });

        test('returns true when placing same type would create horizontal match', () => {
            expect(Grid.wouldCreateInitialMatch(0, 2, 'heart')).toBe(true);
        });

        test('returns false when placing different type', () => {
            expect(Grid.wouldCreateInitialMatch(0, 2, 'star')).toBe(false);
        });

        test('handles vertical matches', () => {
            Grid.data[0][0] = { type: 'star' };
            Grid.data[1][0] = { type: 'star' };

            expect(Grid.wouldCreateInitialMatch(2, 0, 'star')).toBe(true);
            expect(Grid.wouldCreateInitialMatch(2, 0, 'heart')).toBe(false);
        });

        test('handles first positions safely', () => {
            expect(Grid.wouldCreateInitialMatch(0, 0, 'heart')).toBe(false);
            expect(Grid.wouldCreateInitialMatch(0, 1, 'heart')).toBe(false);
            expect(Grid.wouldCreateInitialMatch(1, 0, 'heart')).toBe(false);
        });
    });

    describe('getNeighbors', () => {
        beforeEach(() => {
            Grid.init(mockBoard, 4);
        });

        test('returns 4 neighbors for center position', () => {
            const neighbors = Grid.getNeighbors(2, 2);

            expect(neighbors.length).toBe(4);
            expect(neighbors).toContainEqual({ row: 1, col: 2 }); // up
            expect(neighbors).toContainEqual({ row: 3, col: 2 }); // down
            expect(neighbors).toContainEqual({ row: 2, col: 1 }); // left
            expect(neighbors).toContainEqual({ row: 2, col: 3 }); // right
        });

        test('returns 2 neighbors for corner position', () => {
            const neighbors = Grid.getNeighbors(0, 0);

            expect(neighbors.length).toBe(2);
            expect(neighbors).toContainEqual({ row: 1, col: 0 }); // down
            expect(neighbors).toContainEqual({ row: 0, col: 1 }); // right
        });

        test('returns 3 neighbors for edge position', () => {
            const neighbors = Grid.getNeighbors(0, 2);

            expect(neighbors.length).toBe(3);
        });
    });

    describe('getTileElement', () => {
        beforeEach(() => {
            Grid.init(mockBoard, 4);
            Grid.generate();
        });

        test('returns tile element for valid position', () => {
            const tile = Grid.getTileElement(1, 2);

            expect(tile).toBeInstanceOf(HTMLElement);
            expect(tile.classList.contains('tile')).toBe(true);
        });

        test('returns null for out of bounds position', () => {
            expect(Grid.getTileElement(-1, 0)).toBeNull();
            expect(Grid.getTileElement(0, -1)).toBeNull();
            expect(Grid.getTileElement(4, 0)).toBeNull();
            expect(Grid.getTileElement(0, 4)).toBeNull();
        });
    });

    describe('getTileData', () => {
        beforeEach(() => {
            Grid.init(mockBoard, 4);
            Grid.generate();
        });

        test('returns tile data for valid position', () => {
            const data = Grid.getTileData(1, 2);

            expect(data).not.toBeNull();
            expect(data.type).toBeDefined();
        });

        test('returns null for out of bounds position', () => {
            expect(Grid.getTileData(-1, 0)).toBeNull();
            expect(Grid.getTileData(0, -1)).toBeNull();
            expect(Grid.getTileData(4, 0)).toBeNull();
            expect(Grid.getTileData(0, 4)).toBeNull();
        });
    });

    describe('setTileData', () => {
        beforeEach(() => {
            Grid.init(mockBoard, 4);
            Grid.generate();
        });

        test('sets tile data at position', () => {
            const newData = { type: 'star', special: 'wrapped', isMemory: false, memoryId: null };
            Grid.setTileData(1, 2, newData);

            expect(Grid.data[1][2]).toEqual(newData);
        });

        test('updates tile appearance when data is set', () => {
            const newData = { type: 'star', special: null, isMemory: false, memoryId: null };
            Grid.setTileData(1, 2, newData);

            const tile = Grid.getTileElement(1, 2);
            expect(tile.classList.contains('star')).toBe(true);
        });
    });

    describe('swapTiles', () => {
        beforeEach(() => {
            Grid.init(mockBoard, 4);
            Grid.generate();
        });

        test('swaps data between two positions', async () => {
            const originalData1 = { ...Grid.data[0][0] };
            const originalData2 = { ...Grid.data[0][1] };

            await Grid.swapTiles({ row: 0, col: 0 }, { row: 0, col: 1 });

            expect(Grid.data[0][0].type).toBe(originalData2.type);
            expect(Grid.data[0][1].type).toBe(originalData1.type);
        });

        test('calls animation when animate is true', async () => {
            await Grid.swapTiles({ row: 0, col: 0 }, { row: 0, col: 1 }, true);

            expect(Animations.swapTiles).toHaveBeenCalled();
        });

        test('skips animation when animate is false', async () => {
            await Grid.swapTiles({ row: 0, col: 0 }, { row: 0, col: 1 }, false);

            expect(Animations.swapTiles).not.toHaveBeenCalled();
        });
    });

    describe('removeMatches', () => {
        beforeEach(() => {
            Grid.init(mockBoard, 4);
            Grid.generate();
        });

        test('clears data for matched positions', async () => {
            const matches = [
                { row: 0, col: 0 },
                { row: 0, col: 1 },
                { row: 0, col: 2 }
            ];

            await Grid.removeMatches(matches);

            expect(Grid.data[0][0]).toBeNull();
            expect(Grid.data[0][1]).toBeNull();
            expect(Grid.data[0][2]).toBeNull();
        });

        test('returns memory tiles that were removed', async () => {
            Grid.data[1][1] = { type: 'heart', special: null, isMemory: true, memoryId: 5 };

            const matches = [{ row: 1, col: 1 }];
            const memoryTiles = await Grid.removeMatches(matches);

            expect(memoryTiles.length).toBe(1);
            expect(memoryTiles[0].memoryId).toBe(5);
        });

        test('calls remove animation for each tile', async () => {
            const matches = [
                { row: 0, col: 0 },
                { row: 0, col: 1 }
            ];

            await Grid.removeMatches(matches);

            expect(Animations.removeTile).toHaveBeenCalledTimes(2);
        });
    });

    describe('applyGravity', () => {
        beforeEach(() => {
            Grid.init(mockBoard, 4);
            Grid.generate();
        });

        test('moves tiles down to fill gaps', async () => {
            // Create a gap
            const originalTopTile = { ...Grid.data[0][0] };
            Grid.data[2][0] = null;

            await Grid.applyGravity();

            // Top tiles should have moved down
            expect(Grid.data[2][0]).not.toBeNull();
        });

        test('calls fall animation when tiles move', async () => {
            Grid.data[3][0] = null; // Create gap at bottom

            await Grid.applyGravity();

            expect(Animations.fallTiles).toHaveBeenCalled();
        });

        test('does not call animation when no gaps', async () => {
            // Grid is full, no gaps
            await Grid.applyGravity();

            expect(Animations.fallTiles).not.toHaveBeenCalled();
        });
    });

    describe('spawnNewTiles', () => {
        beforeEach(() => {
            Grid.init(mockBoard, 4);
            Grid.generate();
        });

        test('fills null positions with new tiles', async () => {
            Grid.data[0][0] = null;
            Grid.data[1][1] = null;

            await Grid.spawnNewTiles();

            expect(Grid.data[0][0]).not.toBeNull();
            expect(Grid.data[1][1]).not.toBeNull();
        });

        test('new tiles have valid types', async () => {
            Grid.data[0][0] = null;

            await Grid.spawnNewTiles();

            expect(Grid.tileTypes).toContain(Grid.data[0][0].type);
        });

        test('new tiles are not memory tiles', async () => {
            Grid.data[0][0] = null;

            await Grid.spawnNewTiles();

            expect(Grid.data[0][0].isMemory).toBe(false);
            expect(Grid.data[0][0].memoryId).toBeNull();
        });
    });

    describe('createSpecialCandy', () => {
        beforeEach(() => {
            Grid.init(mockBoard, 4);
            Grid.generate();
        });

        test('creates striped candy', () => {
            Grid.createSpecialCandy(1, 1, 'striped-h', 'heart');

            expect(Grid.data[1][1].special).toBe('striped-h');
            expect(Grid.data[1][1].type).toBe('heart');
        });

        test('creates wrapped candy', () => {
            Grid.createSpecialCandy(2, 2, 'wrapped', 'star');

            expect(Grid.data[2][2].special).toBe('wrapped');
            expect(Grid.data[2][2].type).toBe('star');
        });

        test('updates tile appearance', () => {
            Grid.createSpecialCandy(1, 1, 'wrapped', 'diamond');

            const tile = Grid.getTileElement(1, 1);
            expect(tile.classList.contains('wrapped')).toBe(true);
            expect(tile.classList.contains('diamond')).toBe(true);
        });
    });

    describe('hasPossibleMoves', () => {
        beforeEach(() => {
            Grid.init(mockBoard, 4);
            Grid.generate();
        });

        test('returns true when moves are available', () => {
            MatchDetector.findPossibleMatch.mockReturnValue([{ row: 0, col: 0 }, { row: 0, col: 1 }]);

            expect(Grid.hasPossibleMoves()).toBe(true);
        });

        test('returns false when no moves available', () => {
            MatchDetector.findPossibleMatch.mockReturnValue(null);

            expect(Grid.hasPossibleMoves()).toBe(false);
        });
    });

    describe('showHint', () => {
        beforeEach(() => {
            Grid.init(mockBoard, 4);
            Grid.generate();
        });

        test('shows hint animation for available move', () => {
            MatchDetector.findPossibleMatch.mockReturnValue([{ row: 0, col: 0 }, { row: 0, col: 1 }]);

            const result = Grid.showHint();

            expect(result).toBe(true);
            expect(Animations.showHint).toHaveBeenCalled();
        });

        test('returns false when no moves available', () => {
            MatchDetector.findPossibleMatch.mockReturnValue(null);

            const result = Grid.showHint();

            expect(result).toBe(false);
            expect(Animations.showHint).not.toHaveBeenCalled();
        });
    });

    describe('clearHints', () => {
        beforeEach(() => {
            Grid.init(mockBoard, 4);
            Grid.generate();
        });

        test('removes hinting class from all tiles', () => {
            // Add hinting class to some tiles
            Grid.tiles[0][0].classList.add('hinting');
            Grid.tiles[1][1].classList.add('hinting');

            Grid.clearHints();

            expect(Grid.tiles[0][0].classList.contains('hinting')).toBe(false);
            expect(Grid.tiles[1][1].classList.contains('hinting')).toBe(false);
        });
    });

    describe('updateTileAppearance', () => {
        beforeEach(() => {
            Grid.init(mockBoard, 4);
            Grid.generate();
        });

        test('sets empty class for null data', () => {
            const tile = Grid.getTileElement(0, 0);
            Grid.updateTileAppearance(tile, null);

            expect(tile.classList.contains('empty')).toBe(true);
        });

        test('sets type class', () => {
            const tile = Grid.getTileElement(0, 0);
            Grid.updateTileAppearance(tile, { type: 'heart', special: null });

            expect(tile.classList.contains('heart')).toBe(true);
        });

        test('adds memory-tile class for memory tiles', () => {
            const tile = Grid.getTileElement(0, 0);
            Grid.updateTileAppearance(tile, { type: 'star', special: null, isMemory: true });

            expect(tile.classList.contains('memory-tile')).toBe(true);
        });

        test('adds special class for special candies', () => {
            const tile = Grid.getTileElement(0, 0);
            Grid.updateTileAppearance(tile, { type: 'diamond', special: 'wrapped' });

            expect(tile.classList.contains('wrapped')).toBe(true);
        });
    });

    describe('getHelpfulTypeForPosition', () => {
        beforeEach(() => {
            Grid.init(mockBoard, 4);
            Grid.generate();
        });

        test('returns type of nearby memory tile', () => {
            Grid.data[2][2] = { type: 'heart', special: null, isMemory: true, memoryId: 0 };

            const helpfulType = Grid.getHelpfulTypeForPosition(2, 3);

            expect(helpfulType).toBe('heart');
        });

        test('returns null when no nearby memory tiles', () => {
            // No memory tiles in grid
            for (let r = 0; r < 4; r++) {
                for (let c = 0; c < 4; c++) {
                    Grid.data[r][c].isMemory = false;
                }
            }

            const helpfulType = Grid.getHelpfulTypeForPosition(2, 2);

            expect(helpfulType).toBeNull();
        });
    });
});
