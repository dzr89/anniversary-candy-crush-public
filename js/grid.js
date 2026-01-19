/* ============================================
   GRID MANAGEMENT - Anniversary Candy Crush
   ============================================ */

const Grid = {
    size: 8,
    element: null,
    tiles: [], // 2D array of tile DOM elements
    data: [],  // 2D array of tile data objects

    // Reduced to 5 types for easier matching
    tileTypes: ['heart', 'diamond', 'rose', 'star', 'ring'],
    tileEmojis: {
        heart: '',
        diamond: '',
        rose: '',
        star: '',
        ring: ''
    },

    /**
     * Initialize the grid
     */
    init(boardElement, size = 8) {
        this.element = boardElement;
        this.size = size;
        this.tiles = [];
        this.data = [];

        // Clear existing board
        this.element.innerHTML = '';

        // Initialize arrays
        for (let row = 0; row < this.size; row++) {
            this.tiles[row] = [];
            this.data[row] = [];
        }
    },

    /**
     * Generate initial grid ensuring no starting matches
     */
    generate(memoryPositions = []) {
        // Create memory position lookup with their assigned types
        const memoryLookup = new Set(memoryPositions.map(p => `${p.row},${p.col}`));
        const memoryTypes = new Map(); // Store what type each memory tile will be
        let memoryIndex = 0;

        // First pass: assign types to all tiles
        for (let row = 0; row < this.size; row++) {
            for (let col = 0; col < this.size; col++) {
                let type;
                let attempts = 0;

                // Keep generating until no initial match
                do {
                    type = this.getRandomType();
                    attempts++;
                } while (attempts < 50 && this.wouldCreateInitialMatch(row, col, type));

                // Create tile data
                const isMemory = memoryLookup.has(`${row},${col}`);
                const memId = isMemory ? memoryPositions[memoryIndex++]?.memoryId : null;

                this.data[row][col] = {
                    type: type,
                    special: null,
                    isMemory: isMemory,
                    memoryId: memId
                };

                if (isMemory) {
                    memoryTypes.set(`${row},${col}`, type);
                }

                // Create and render tile
                this.createTileElement(row, col);
            }
        }

        // Memory tiles no longer get guaranteed matching neighbors (removed for difficulty)
    },

    /**
     * Ensure each memory tile has at least one adjacent tile of the same type
     */
    ensureMemoryTilesMatchable(memoryPositions, memoryTypes) {
        for (const memPos of memoryPositions) {
            const { row, col } = memPos;
            const memoryType = this.data[row][col]?.type;
            if (!memoryType) continue;

            // Check if memory tile already has a matching neighbor
            const neighbors = this.getNeighbors(row, col);
            const hasMatch = neighbors.some(n =>
                this.data[n.row][n.col]?.type === memoryType &&
                !this.data[n.row][n.col]?.isMemory
            );

            // If no matching neighbor, convert one neighbor to match
            if (!hasMatch && neighbors.length > 0) {
                // Find a non-memory neighbor to convert
                const nonMemoryNeighbors = neighbors.filter(n => !this.data[n.row][n.col]?.isMemory);
                if (nonMemoryNeighbors.length > 0) {
                    const target = nonMemoryNeighbors[Math.floor(Math.random() * nonMemoryNeighbors.length)];
                    this.data[target.row][target.col].type = memoryType;
                    this.updateTileAppearance(this.tiles[target.row][target.col], this.data[target.row][target.col]);
                }
            }
        }
    },

    /**
     * Get adjacent tile positions
     */
    getNeighbors(row, col) {
        const neighbors = [];
        const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]];
        for (const [dr, dc] of directions) {
            const nr = row + dr;
            const nc = col + dc;
            if (nr >= 0 && nr < this.size && nc >= 0 && nc < this.size) {
                neighbors.push({ row: nr, col: nc });
            }
        }
        return neighbors;
    },

    /**
     * Check if placing a type at position would create an initial match
     */
    wouldCreateInitialMatch(row, col, type) {
        // Check horizontal (2 to the left)
        if (col >= 2) {
            if (this.data[row][col - 1]?.type === type &&
                this.data[row][col - 2]?.type === type) {
                return true;
            }
        }

        // Check vertical (2 above)
        if (row >= 2) {
            if (this.data[row - 1][col]?.type === type &&
                this.data[row - 2][col]?.type === type) {
                return true;
            }
        }

        return false;
    },

    /**
     * Get random tile type
     */
    getRandomType() {
        return this.tileTypes[Math.floor(Math.random() * this.tileTypes.length)];
    },

    /**
     * Create a tile DOM element
     */
    createTileElement(row, col) {
        const tile = document.createElement('div');
        tile.className = 'tile';
        tile.dataset.row = row;
        tile.dataset.col = col;

        this.updateTileAppearance(tile, this.data[row][col]);

        // Add to grid
        const index = row * this.size + col;
        this.element.appendChild(tile);
        this.tiles[row][col] = tile;

        return tile;
    },

    /**
     * Update tile appearance based on data
     */
    updateTileAppearance(tile, data) {
        if (!data) {
            tile.className = 'tile empty';
            tile.textContent = '';
            return;
        }

        // Base class
        let classes = ['tile', data.type];

        // Special candy class
        if (data.special) {
            classes.push(data.special);
        }

        // Memory tile class
        if (data.isMemory) {
            classes.push('memory-tile');
        }

        tile.className = classes.join(' ');
        tile.textContent = this.tileEmojis[data.type] || '';
    },

    /**
     * Get tile element at position
     */
    getTileElement(row, col) {
        if (row < 0 || row >= this.size || col < 0 || col >= this.size) {
            return null;
        }
        return this.tiles[row][col];
    },

    /**
     * Get tile data at position
     */
    getTileData(row, col) {
        if (row < 0 || row >= this.size || col < 0 || col >= this.size) {
            return null;
        }
        return this.data[row][col];
    },

    /**
     * Set tile data at position
     */
    setTileData(row, col, data) {
        this.data[row][col] = data;
        if (this.tiles[row][col]) {
            this.updateTileAppearance(this.tiles[row][col], data);
        }
    },

    /**
     * Swap two tiles
     */
    async swapTiles(pos1, pos2, animate = true) {
        // Swap data
        const temp = this.data[pos1.row][pos1.col];
        this.data[pos1.row][pos1.col] = this.data[pos2.row][pos2.col];
        this.data[pos2.row][pos2.col] = temp;

        // Update appearances
        this.updateTileAppearance(this.tiles[pos1.row][pos1.col], this.data[pos1.row][pos1.col]);
        this.updateTileAppearance(this.tiles[pos2.row][pos2.col], this.data[pos2.row][pos2.col]);

        if (animate) {
            await Animations.swapTiles(
                this.tiles[pos1.row][pos1.col],
                this.tiles[pos2.row][pos2.col]
            );
        }
    },

    /**
     * Remove matched tiles
     */
    async removeMatches(matches) {
        const memoryTiles = [];

        // Collect memory tiles being removed
        for (const match of matches) {
            const data = this.data[match.row][match.col];
            if (data && data.isMemory && data.memoryId !== null) {
                memoryTiles.push({
                    memoryId: data.memoryId,
                    row: match.row,
                    col: match.col
                });
            }
        }

        // Animate removal
        const removePromises = matches.map(match => {
            const tile = this.tiles[match.row][match.col];
            const animation = match.animation || 'matched';
            return Animations.removeTile(tile, animation);
        });

        await Promise.all(removePromises);

        // Clear data
        for (const match of matches) {
            this.data[match.row][match.col] = null;
        }

        return memoryTiles;
    },

    /**
     * Apply gravity - tiles fall down to fill gaps
     */
    async applyGravity() {
        const animations = [];

        for (let col = 0; col < this.size; col++) {
            let emptyRow = this.size - 1;

            // Start from bottom, find empty spots
            for (let row = this.size - 1; row >= 0; row--) {
                if (this.data[row][col] !== null) {
                    if (row !== emptyRow) {
                        // Move tile down
                        const fallDistance = emptyRow - row;
                        this.data[emptyRow][col] = this.data[row][col];
                        this.data[row][col] = null;

                        // Update appearance
                        this.updateTileAppearance(this.tiles[emptyRow][col], this.data[emptyRow][col]);
                        this.updateTileAppearance(this.tiles[row][col], null);

                        // Queue animation
                        animations.push({
                            tile: this.tiles[emptyRow][col],
                            distance: fallDistance
                        });
                    }
                    emptyRow--;
                }
            }
        }

        // Animate all falls
        if (animations.length > 0) {
            await Animations.fallTiles(animations);
        }
    },

    /**
     * Spawn new tiles to fill empty spaces
     * Biased toward helping clear memory tiles
     */
    async spawnNewTiles() {
        const newTiles = [];

        for (let col = 0; col < this.size; col++) {
            let spawnCount = 0;
            for (let row = 0; row < this.size; row++) {
                if (this.data[row][col] === null) {
                    // 40% chance to bias toward nearby memory tiles (optimized for fun)
                    let type = this.getRandomType();
                    if (Math.random() < 0.4) {
                        const helpfulType = this.getHelpfulTypeForPosition(row, col);
                        if (helpfulType) {
                            type = helpfulType;
                        }
                    }

                    this.data[row][col] = {
                        type: type,
                        special: null,
                        isMemory: false,
                        memoryId: null
                    };
                    this.updateTileAppearance(this.tiles[row][col], this.data[row][col]);
                    newTiles.push({
                        tile: this.tiles[row][col],
                        delay: spawnCount * 50
                    });
                    spawnCount++;
                }
            }
        }

        // Animate spawning
        if (newTiles.length > 0) {
            await Animations.spawnTiles(newTiles);
        }
    },

    /**
     * Find a tile type that would help match nearby memory tiles
     */
    getHelpfulTypeForPosition(row, col) {
        // Look in a 3x3 area around the position for memory tiles
        for (let dr = -2; dr <= 2; dr++) {
            for (let dc = -2; dc <= 2; dc++) {
                const nr = row + dr;
                const nc = col + dc;
                if (nr >= 0 && nr < this.size && nc >= 0 && nc < this.size) {
                    const tile = this.data[nr][nc];
                    if (tile && tile.isMemory) {
                        return tile.type;
                    }
                }
            }
        }
        return null;
    },

    /**
     * Create a special candy at position
     */
    createSpecialCandy(row, col, specialType, candyType) {
        this.data[row][col] = {
            type: candyType,
            special: specialType,
            isMemory: false,
            memoryId: null
        };
        this.updateTileAppearance(this.tiles[row][col], this.data[row][col]);
    },

    /**
     * Check if grid has any possible moves
     */
    hasPossibleMoves() {
        return MatchDetector.findPossibleMatch(this.data) !== null;
    },

    /**
     * Shuffle grid when no moves available
     */
    async shuffle() {
        // Collect all tile data
        const allTiles = [];
        for (let row = 0; row < this.size; row++) {
            for (let col = 0; col < this.size; col++) {
                if (this.data[row][col]) {
                    allTiles.push({ ...this.data[row][col] });
                }
            }
        }

        // Fisher-Yates shuffle
        for (let i = allTiles.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [allTiles[i], allTiles[j]] = [allTiles[j], allTiles[i]];
        }

        // Reassign to grid
        let index = 0;
        for (let row = 0; row < this.size; row++) {
            for (let col = 0; col < this.size; col++) {
                this.data[row][col] = allTiles[index++];
                this.updateTileAppearance(this.tiles[row][col], this.data[row][col]);
            }
        }

        // Animate shuffle
        await Animations.shuffleBoard(this.element);

        // Check if shuffle created matches or still no moves
        const { matches } = MatchDetector.findAllMatches(this.data);
        if (matches.length > 0 || !this.hasPossibleMoves()) {
            // Regenerate if we have matches or still no moves
            await this.shuffle();
        }
    },

    /**
     * Show hint for possible move
     */
    showHint() {
        const possibleMove = MatchDetector.findPossibleMatch(this.data);
        if (possibleMove) {
            const [pos1, pos2] = possibleMove;
            Animations.showHint(this.tiles[pos1.row][pos1.col], this.tiles[pos2.row][pos2.col]);
            return true;
        }
        return false;
    },

    /**
     * Clear all hints
     */
    clearHints() {
        for (let row = 0; row < this.size; row++) {
            for (let col = 0; col < this.size; col++) {
                this.tiles[row][col].classList.remove('hinting');
            }
        }
    }
};

// Export
window.Grid = Grid;
