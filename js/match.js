/* ============================================
   MATCH DETECTION - Anniversary Candy Crush
   ============================================ */

const MatchDetector = {
    /**
     * Find all matches in the grid
     * @param {Array} grid - 2D array of tile types
     * @returns {Object} - { matches: Array of matched positions, specials: Array of special candy positions }
     */
    findAllMatches(grid) {
        const size = grid.length;
        const matchedPositions = new Set();
        const specialCandies = [];

        // Check horizontal matches
        for (let row = 0; row < size; row++) {
            let matchStart = 0;
            let matchLength = 1;

            for (let col = 1; col <= size; col++) {
                if (col < size && grid[row][col] && grid[row][col - 1] &&
                    this.getTileType(grid[row][col]) === this.getTileType(grid[row][col - 1])) {
                    matchLength++;
                } else {
                    if (matchLength >= 3) {
                        // Record matched positions
                        for (let i = matchStart; i < matchStart + matchLength; i++) {
                            matchedPositions.add(`${row},${i}`);
                        }
                        // Check for special candy creation
                        if (matchLength === 4) {
                            // Striped candy (horizontal stripe clears row)
                            specialCandies.push({
                                row: row,
                                col: matchStart + Math.floor(matchLength / 2),
                                type: 'striped-h',
                                candyType: this.getTileType(grid[row][matchStart])
                            });
                        } else if (matchLength >= 5) {
                            // For 5+ in a row, create wrapped
                            specialCandies.push({
                                row: row,
                                col: matchStart + Math.floor(matchLength / 2),
                                type: 'wrapped',
                                candyType: this.getTileType(grid[row][matchStart])
                            });
                        }
                    }
                    matchStart = col;
                    matchLength = 1;
                }
            }
        }

        // Check vertical matches
        for (let col = 0; col < size; col++) {
            let matchStart = 0;
            let matchLength = 1;

            for (let row = 1; row <= size; row++) {
                if (row < size && grid[row][col] && grid[row - 1][col] &&
                    this.getTileType(grid[row][col]) === this.getTileType(grid[row - 1][col])) {
                    matchLength++;
                } else {
                    if (matchLength >= 3) {
                        for (let i = matchStart; i < matchStart + matchLength; i++) {
                            matchedPositions.add(`${i},${col}`);
                        }
                        // Check for special candy
                        if (matchLength === 4) {
                            // Striped candy (vertical stripe clears column)
                            specialCandies.push({
                                row: matchStart + Math.floor(matchLength / 2),
                                col: col,
                                type: 'striped-v',
                                candyType: this.getTileType(grid[matchStart][col])
                            });
                        } else if (matchLength >= 5) {
                            specialCandies.push({
                                row: matchStart + Math.floor(matchLength / 2),
                                col: col,
                                type: 'wrapped',
                                candyType: this.getTileType(grid[matchStart][col])
                            });
                        }
                    }
                    matchStart = row;
                    matchLength = 1;
                }
            }
        }

        // Check for L and T shapes (5 pieces in L/T = wrapped candy)
        const lShapes = this.findLTShapes(grid, matchedPositions);
        specialCandies.push(...lShapes);

        // Convert Set to array of {row, col} objects
        const matches = Array.from(matchedPositions).map(pos => {
            const [row, col] = pos.split(',').map(Number);
            return { row, col };
        });

        return { matches, specials: specialCandies };
    },

    /**
     * Find L and T shaped matches for wrapped candies
     */
    findLTShapes(grid, matchedPositions) {
        const specials = [];
        const size = grid.length;
        const checked = new Set();

        for (const pos of matchedPositions) {
            const [row, col] = pos.split(',').map(Number);
            if (checked.has(pos)) continue;

            const type = this.getTileType(grid[row][col]);
            if (!type) continue;

            // Check if this position is part of both a horizontal and vertical match
            let hCount = 1, vCount = 1;

            // Count horizontal
            for (let c = col - 1; c >= 0 && this.getTileType(grid[row][c]) === type; c--) hCount++;
            for (let c = col + 1; c < size && this.getTileType(grid[row][c]) === type; c++) hCount++;

            // Count vertical
            for (let r = row - 1; r >= 0 && this.getTileType(grid[r][col]) === type; r--) vCount++;
            for (let r = row + 1; r < size && this.getTileType(grid[r][col]) === type; r++) vCount++;

            // L or T shape: intersection point has matches in both directions
            if (hCount >= 3 && vCount >= 3) {
                specials.push({
                    row: row,
                    col: col,
                    type: 'wrapped',
                    candyType: type
                });
                checked.add(pos);
            }
        }

        return specials;
    },

    /**
     * Get the base tile type (ignoring special candy modifiers)
     */
    getTileType(tile) {
        if (!tile) return null;
        // tile is an object with type property
        if (typeof tile === 'object') {
            return tile.type;
        }
        return tile;
    },

    /**
     * Check if a swap would result in a match
     * Performance: Uses lightweight check instead of full grid copy + findAllMatches
     */
    wouldMatch(grid, pos1, pos2) {
        // Special candy combinations are ALWAYS valid swaps
        if (this.isSpecialCombination(grid, pos1, pos2)) {
            return true;
        }

        // Temporarily swap in place
        const temp = grid[pos1.row][pos1.col];
        grid[pos1.row][pos1.col] = grid[pos2.row][pos2.col];
        grid[pos2.row][pos2.col] = temp;

        // Only check for matches at the two swapped positions (much faster)
        const hasMatch = this.hasMatchAt(grid, pos1) || this.hasMatchAt(grid, pos2);

        // Swap back
        grid[pos2.row][pos2.col] = grid[pos1.row][pos1.col];
        grid[pos1.row][pos1.col] = temp;

        return hasMatch;
    },

    /**
     * Check if there's a match of 3+ at a specific position
     * Performance: O(1) check instead of O(n²) full grid scan
     */
    hasMatchAt(grid, pos) {
        const size = grid.length;
        const tile = grid[pos.row]?.[pos.col];
        if (!tile) return false;

        const type = this.getTileType(tile);
        if (!type) return false;

        // Check horizontal match (count consecutive same-type tiles)
        let hCount = 1;
        for (let c = pos.col - 1; c >= 0 && this.getTileType(grid[pos.row][c]) === type; c--) hCount++;
        for (let c = pos.col + 1; c < size && this.getTileType(grid[pos.row][c]) === type; c++) hCount++;
        if (hCount >= 3) return true;

        // Check vertical match
        let vCount = 1;
        for (let r = pos.row - 1; r >= 0 && this.getTileType(grid[r]?.[pos.col]) === type; r--) vCount++;
        for (let r = pos.row + 1; r < size && this.getTileType(grid[r]?.[pos.col]) === type; r++) vCount++;
        if (vCount >= 3) return true;

        return false;
    },

    /**
     * Check if two positions are adjacent (horizontally or vertically)
     */
    areAdjacent(pos1, pos2) {
        const rowDiff = Math.abs(pos1.row - pos2.row);
        const colDiff = Math.abs(pos1.col - pos2.col);
        return (rowDiff === 1 && colDiff === 0) || (rowDiff === 0 && colDiff === 1);
    },

    /**
     * Find a possible match (for hint system)
     */
    findPossibleMatch(grid) {
        const size = grid.length;

        for (let row = 0; row < size; row++) {
            for (let col = 0; col < size; col++) {
                // Check swap with right neighbor
                if (col < size - 1) {
                    if (this.wouldMatch(grid, { row, col }, { row, col: col + 1 })) {
                        return [{ row, col }, { row, col: col + 1 }];
                    }
                }
                // Check swap with bottom neighbor
                if (row < size - 1) {
                    if (this.wouldMatch(grid, { row, col }, { row: row + 1, col })) {
                        return [{ row, col }, { row: row + 1, col }];
                    }
                }
            }
        }

        return null; // No possible matches (should shuffle)
    },

    /**
     * Get positions to clear for special candy activation
     */
    getSpecialClearPositions(grid, pos, specialType) {
        const size = grid.length;
        const positions = [];

        switch (specialType) {
            case 'striped-h':
                // Clear entire row
                for (let col = 0; col < size; col++) {
                    positions.push({ row: pos.row, col, animation: 'clearing-row' });
                }
                break;

            case 'striped-v':
                // Clear entire column
                for (let row = 0; row < size; row++) {
                    positions.push({ row, col: pos.col, animation: 'clearing-column' });
                }
                break;

            case 'wrapped':
                // Clear 3x3 area
                for (let r = pos.row - 1; r <= pos.row + 1; r++) {
                    for (let c = pos.col - 1; c <= pos.col + 1; c++) {
                        if (r >= 0 && r < size && c >= 0 && c < size) {
                            positions.push({ row: r, col: c, animation: 'exploding' });
                        }
                    }
                }
                break;
        }

        return positions;
    },

    /**
     * Check if a tile is a special candy
     * @param {Object} tile - Tile data object
     * @returns {string|null} - Special type or null
     */
    isSpecialCandy(tile) {
        if (!tile) return null;
        return tile.special; // Returns 'striped-h', 'striped-v', 'wrapped', or null
    },

    /**
     * Check if swapping two positions would involve two special candies
     * @param {Array} grid - The game grid
     * @param {Object} pos1 - First position {row, col}
     * @param {Object} pos2 - Second position {row, col}
     * @returns {Object|null} - Combination info or null
     */
    isSpecialCombination(grid, pos1, pos2) {
        const tile1 = grid[pos1.row]?.[pos1.col];
        const tile2 = grid[pos2.row]?.[pos2.col];

        const special1 = this.isSpecialCandy(tile1);
        const special2 = this.isSpecialCandy(tile2);

        // Both must be special candies
        if (!special1 || !special2) return null;

        return {
            pos1: pos1,
            pos2: pos2,
            type1: special1,
            type2: special2,
            combinationType: this.getCombinationType(special1, special2)
        };
    },

    /**
     * Determine the combination type based on two special candy types
     * @param {string} type1 - First special type
     * @param {string} type2 - Second special type
     * @returns {string} - Combination type identifier
     */
    getCombinationType(type1, type2) {
        const isStriped = (t) => t === 'striped-h' || t === 'striped-v';
        const isWrapped = (t) => t === 'wrapped';

        // Striped + Striped = cross
        if (isStriped(type1) && isStriped(type2)) {
            return 'striped-striped';
        }

        // Striped + Wrapped = giant cross (3 rows + 3 columns)
        if ((isStriped(type1) && isWrapped(type2)) || (isWrapped(type1) && isStriped(type2))) {
            return 'striped-wrapped';
        }

        // Wrapped + Wrapped = massive explosion (5x5)
        if (isWrapped(type1) && isWrapped(type2)) {
            return 'wrapped-wrapped';
        }

        return 'unknown';
    },

    /**
     * Calculate clear positions for a special candy combination
     * @param {Array} grid - The game grid
     * @param {Object} combination - Combination info from isSpecialCombination()
     * @returns {Array} - Array of positions to clear with animation types
     */
    getSpecialCombinationClearPositions(grid, combination) {
        const size = grid.length;
        const positions = [];
        const seen = new Set();

        // Helper to add position if valid and not duplicate
        const addPos = (row, col, animation) => {
            if (row >= 0 && row < size && col >= 0 && col < size) {
                const key = `${row},${col}`;
                if (!seen.has(key)) {
                    seen.add(key);
                    positions.push({ row, col, animation });
                }
            }
        };

        switch (combination.combinationType) {
            case 'striped-striped':
                // Clear entire row AND column from both positions (cross pattern)
                for (let c = 0; c < size; c++) {
                    addPos(combination.pos1.row, c, 'clearing-cross');
                }
                for (let r = 0; r < size; r++) {
                    addPos(r, combination.pos1.col, 'clearing-cross');
                }
                for (let c = 0; c < size; c++) {
                    addPos(combination.pos2.row, c, 'clearing-cross');
                }
                for (let r = 0; r < size; r++) {
                    addPos(r, combination.pos2.col, 'clearing-cross');
                }
                break;

            case 'striped-wrapped':
                // Clear 3 rows AND 3 columns centered on pos1
                for (let dr = -1; dr <= 1; dr++) {
                    for (let c = 0; c < size; c++) {
                        addPos(combination.pos1.row + dr, c, 'clearing-giant-cross');
                    }
                }
                for (let dc = -1; dc <= 1; dc++) {
                    for (let r = 0; r < size; r++) {
                        addPos(r, combination.pos1.col + dc, 'clearing-giant-cross');
                    }
                }
                break;

            case 'wrapped-wrapped':
                // Massive 5x5 explosion centered on pos1
                for (let dr = -2; dr <= 2; dr++) {
                    for (let dc = -2; dc <= 2; dc++) {
                        addPos(combination.pos1.row + dr, combination.pos1.col + dc, 'mega-exploding');
                    }
                }
                break;
        }

        return positions;
    }
};

// Export for use in other modules
window.MatchDetector = MatchDetector;
