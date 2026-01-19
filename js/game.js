/* ============================================
   GAME CONTROLLER - Anniversary Candy Crush
   ============================================ */

const Game = {
    // State
    isPlaying: false,
    isPaused: false,
    isProcessing: false,
    moves: 0,
    maxMoves: 50,
    selectedTile: null,

    // DOM Elements
    screens: {},
    elements: {},

    /**
     * Utility: Deduplicate positions array by row,col
     * @param {Array} positions - Array of {row, col} objects
     * @returns {Array} - Deduplicated array
     */
    deduplicatePositions(positions) {
        const seen = new Set();
        return positions.filter(pos => {
            const key = `${pos.row},${pos.col}`;
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
        });
    },

    /**
     * Initialize the game
     */
    init() {
        // Cache screens
        this.screens = {
            start: document.getElementById('start-screen'),
            loading: document.getElementById('loading-screen'),
            game: document.getElementById('game-screen'),
            victory: document.getElementById('victory-screen'),
            bonus: document.getElementById('bonus-modal')
        };

        // Cache elements
        this.elements = {
            board: document.getElementById('game-board'),
            movesCount: document.getElementById('moves-count'),
            muteButton: document.getElementById('mute-button'),
            hintButton: document.getElementById('hint-button'),
            startButton: document.getElementById('start-button'),
            replayButton: document.getElementById('replay-button'),
            bonusYes: document.getElementById('bonus-yes'),
            bonusNo: document.getElementById('bonus-no')
        };

        // Apply custom config text
        this.applyConfigText();

        // Note: Password feature removed (client-side passwords provide no real security)

        // Initialize audio
        AudioManager.init();

        // Initialize memory system
        MemorySystem.init(memories);

        // Setup event listeners
        this.setupEventListeners();

        // Show start screen
        this.showScreen('start');
    },

    /**
     * Apply text from config to UI
     */
    applyConfigText() {
        // Start screen
        const startTitle = document.querySelector('.start-content .title');
        const startSubtitle = document.querySelector('.start-content .subtitle');
        if (startTitle) startTitle.textContent = gameConfig.startScreenTitle;
        if (startSubtitle) startSubtitle.textContent = gameConfig.startScreenSubtitle;
        if (this.elements.startButton) {
            this.elements.startButton.textContent = gameConfig.startButtonText;
        }

        // Victory screen
        const victoryTitle = document.querySelector('.victory-title');
        const victorySubtitle = document.querySelector('.victory-subtitle');
        if (victoryTitle) victoryTitle.textContent = gameConfig.victoryTitle;
        if (victorySubtitle) victorySubtitle.textContent = gameConfig.victorySubtitle;

        MemorySystem.setFinalMessage(gameConfig.finalMessage);

        const signature = document.querySelector('.signature');
        if (signature) signature.textContent = `${gameConfig.signature} ♥`;
    },

    /**
     * Setup all event listeners
     */
    setupEventListeners() {
        // Start button
        this.elements.startButton.addEventListener('click', () => this.startGame());

        // Board clicks (event delegation)
        this.elements.board.addEventListener('click', (e) => this.handleTileClick(e));

        // Touch support
        this.elements.board.addEventListener('touchstart', (e) => {
            if (e.target.classList.contains('tile')) {
                e.preventDefault();
                this.handleTileClick(e);
            }
        }, { passive: false });

        // Mute button
        this.elements.muteButton.addEventListener('click', () => {
            const isMuted = AudioManager.toggleMute();
            this.elements.muteButton.querySelector('.music-on').style.display = isMuted ? 'none' : 'inline';
            this.elements.muteButton.querySelector('.music-off').style.display = isMuted ? 'inline' : 'none';
        });

        // Hint button
        this.elements.hintButton.addEventListener('click', () => {
            if (!this.isProcessing) {
                Grid.showHint();
            }
        });

        // Replay button
        this.elements.replayButton.addEventListener('click', () => this.restartGame());

        // Bonus moves
        this.elements.bonusYes.addEventListener('click', () => this.addBonusMoves());
        this.elements.bonusNo.addEventListener('click', () => this.showVictory());
    },

    /**
     * Show a specific screen
     */
    async showScreen(screenName) {
        // Hide all screens
        Object.values(this.screens).forEach(screen => {
            screen.classList.remove('active');
        });

        // Show target screen
        const screen = this.screens[screenName];
        if (screen) {
            screen.classList.add('active');
        }
    },

    /**
     * Start the game
     */
    async startGame() {
        // Start music
        AudioManager.playMusic();

        // Show loading screen
        await Animations.transitionScreens(this.screens.start, this.screens.loading);

        // Wait for loading animation (6 seconds)
        await Animations.wait(6000);

        // Transition to game screen
        await Animations.transitionScreens(this.screens.loading, this.screens.game);

        // Initialize game state
        this.maxMoves = gameConfig.startingMoves;
        this.moves = this.maxMoves;
        this.updateMovesDisplay();

        // Initialize grid
        Grid.init(this.elements.board, gameConfig.gridSize);

        // Get memory positions
        const memoryPositions = MemorySystem.generateMemoryPositions(gameConfig.gridSize);

        // Generate grid with memory tiles
        Grid.generate(memoryPositions);

        // Ensure there are possible moves
        if (!Grid.hasPossibleMoves()) {
            await Grid.shuffle();
        }

        this.isPlaying = true;
        this.isPaused = false;
        this.isProcessing = false;
        this.selectedTile = null;

        // Start ambient background particles
        Animations.startAmbientParticles();
    },

    /**
     * Handle tile click
     */
    async handleTileClick(e) {
        if (!this.isPlaying || this.isPaused || this.isProcessing) return;

        const tile = e.target.closest('.tile');
        if (!tile) return;

        const row = parseInt(tile.dataset.row);
        const col = parseInt(tile.dataset.col);

        // Clear hints
        Grid.clearHints();

        if (this.selectedTile === null) {
            // Select this tile
            this.selectedTile = { row, col };
            Animations.selectTile(tile);
        } else {
            const prevTile = Grid.getTileElement(this.selectedTile.row, this.selectedTile.col);

            if (this.selectedTile.row === row && this.selectedTile.col === col) {
                // Deselect
                Animations.deselectTile(prevTile);
                this.selectedTile = null;
            } else if (MatchDetector.areAdjacent(this.selectedTile, { row, col })) {
                // Attempt swap
                Animations.deselectTile(prevTile);
                await this.attemptSwap(this.selectedTile, { row, col });
                this.selectedTile = null;
            } else {
                // Select new tile instead
                Animations.deselectTile(prevTile);
                this.selectedTile = { row, col };
                Animations.selectTile(tile);
            }
        }
    },

    /**
     * Attempt to swap two tiles
     */
    async attemptSwap(pos1, pos2) {
        this.isProcessing = true;
        this.elements.board.classList.add('paused');

        // Check for special candy combination FIRST
        const combination = MatchDetector.isSpecialCombination(Grid.data, pos1, pos2);
        if (combination) {
            await this.processSpecialCombination(pos1, pos2, combination);

            // Check win/lose conditions
            if (MemorySystem.isComplete()) {
                this.showVictory();
            } else if (this.moves <= 0) {
                this.showBonusModal();
            } else if (!Grid.hasPossibleMoves()) {
                await Grid.shuffle();
            }

            this.isProcessing = false;
            this.elements.board.classList.remove('paused');
            return;
        }

        // Check if swap would create a match
        if (!MatchDetector.wouldMatch(Grid.data, pos1, pos2)) {
            // Invalid swap - animate and revert
            const tile1 = Grid.getTileElement(pos1.row, pos1.col);
            const tile2 = Grid.getTileElement(pos2.row, pos2.col);
            await Animations.invalidSwap(tile1, tile2);

            this.isProcessing = false;
            this.elements.board.classList.remove('paused');
            return;
        }

        // Valid swap - perform it
        await Grid.swapTiles(pos1, pos2);

        // Use a move
        this.moves--;
        this.updateMovesDisplay();

        // Process matches
        await this.processMatches();

        // Check win/lose conditions
        if (MemorySystem.isComplete()) {
            this.showVictory();
        } else if (this.moves <= 0) {
            this.showBonusModal();
        } else if (!Grid.hasPossibleMoves()) {
            await Grid.shuffle();
        }

        this.isProcessing = false;
        this.elements.board.classList.remove('paused');
    },

    /**
     * Process all matches (including chain reactions)
     */
    async processMatches() {
        let hasMatches = true;

        while (hasMatches) {
            const { matches, specials } = MatchDetector.findAllMatches(Grid.data);

            if (matches.length === 0) {
                hasMatches = false;
                continue;
            }

            // Play match sound and visual feedback
            AudioManager.playSound('match');
            Animations.backgroundPulse();

            // Check for special candies being matched
            const specialsToActivate = [];
            for (const match of matches) {
                const tileData = Grid.getTileData(match.row, match.col);
                if (tileData && tileData.special) {
                    specialsToActivate.push({
                        pos: match,
                        type: tileData.special
                    });
                }
            }

            // Get additional positions from special candy activations
            let allMatches = [...matches];
            for (const special of specialsToActivate) {
                const extraPositions = MatchDetector.getSpecialClearPositions(
                    Grid.data,
                    special.pos,
                    special.type
                );
                allMatches.push(...extraPositions);
                AudioManager.playSound('special');
                Animations.screenShake('medium');
            }

            // Remove duplicates using utility function
            const uniqueMatches = this.deduplicatePositions(allMatches);
            const clearedKeys = new Set(uniqueMatches.map(m => `${m.row},${m.col}`));

            // Remove matched tiles and check for memories
            const memoryTiles = await Grid.removeMatches(uniqueMatches);

            // Create special candies (at positions that weren't cleared)
            for (const special of specials) {
                if (!clearedKeys.has(`${special.row},${special.col}`)) {
                    Grid.createSpecialCandy(special.row, special.col, special.type, special.candyType);
                }
            }

            // Reveal memories
            for (const memory of memoryTiles) {
                this.isPaused = true;
                await MemorySystem.revealMemory(memory.memoryId);
                await MemorySystem.waitForClose();
                this.isPaused = false;
            }

            // Apply gravity
            await Grid.applyGravity();

            // Spawn new tiles
            await Grid.spawnNewTiles();

            // Small delay before checking for chain reactions
            await Animations.wait(100);
        }
    },

    /**
     * Process a special candy combination swap
     * @param {Object} pos1 - First position
     * @param {Object} pos2 - Second position
     * @param {Object} combination - Combination info
     */
    async processSpecialCombination(pos1, pos2, combination) {
        // Animate the swap
        await Grid.swapTiles(pos1, pos2);

        // Use a move
        this.moves--;
        this.updateMovesDisplay();

        // Play special combination sound and heavy shake
        AudioManager.playSound('special');
        Animations.screenShake('heavy');
        Animations.backgroundPulse();

        // Get all positions to clear from the combination
        const clearPositions = MatchDetector.getSpecialCombinationClearPositions(
            Grid.data,
            combination
        );

        // Check for chain reactions (other specials being cleared)
        let allPositions = [...clearPositions];
        for (const pos of clearPositions) {
            // Skip the two candies we just combined (they're consumed)
            if ((pos.row === pos1.row && pos.col === pos1.col) ||
                (pos.row === pos2.row && pos.col === pos2.col)) {
                continue;
            }
            // Check if this position has a special candy that should chain
            const tileData = Grid.getTileData(pos.row, pos.col);
            if (tileData && tileData.special) {
                const extraPositions = MatchDetector.getSpecialClearPositions(
                    Grid.data,
                    pos,
                    tileData.special
                );
                allPositions.push(...extraPositions);
                AudioManager.playSound('special');
            }
        }

        // Remove duplicates using utility function
        const uniquePositions = this.deduplicatePositions(allPositions);

        // Remove tiles and collect memories
        const memoryTiles = await Grid.removeMatches(uniquePositions);

        // Reveal memories
        for (const memory of memoryTiles) {
            this.isPaused = true;
            await MemorySystem.revealMemory(memory.memoryId);
            await MemorySystem.waitForClose();
            this.isPaused = false;
        }

        // Apply gravity
        await Grid.applyGravity();

        // Spawn new tiles
        await Grid.spawnNewTiles();

        // Small delay then check for chain reactions
        await Animations.wait(100);

        // Continue with normal match processing for any cascades
        await this.processMatches();
    },

    /**
     * Update moves display
     */
    updateMovesDisplay() {
        this.elements.movesCount.textContent = this.moves;

        // Add warning color when low on moves
        if (this.moves <= 5) {
            this.elements.movesCount.style.color = '#e91e63';
        } else if (this.moves <= 10) {
            this.elements.movesCount.style.color = '#ff9800';
        } else {
            this.elements.movesCount.style.color = '';
        }
    },

    /**
     * Show bonus moves modal
     */
    showBonusModal() {
        this.isPaused = true;
        this.screens.bonus.classList.add('active');
        this.screens.bonus.style.opacity = '1';
    },

    /**
     * Add bonus moves
     */
    addBonusMoves() {
        this.moves += 10;
        this.updateMovesDisplay();

        this.screens.bonus.style.opacity = '0';
        setTimeout(() => {
            this.screens.bonus.classList.remove('active');
        }, 300);

        this.isPaused = false;
    },

    /**
     * Show victory screen
     */
    async showVictory() {
        this.isPlaying = false;

        // Stop ambient particles
        Animations.stopAmbientParticles();

        // Hide bonus modal if open
        this.screens.bonus.classList.remove('active');

        // Play victory sound
        AudioManager.playSound('victory');

        // Populate gallery with all memories
        MemorySystem.populateGallery();

        // Transition to victory screen
        await Animations.celebrateVictory(this.screens.victory);

        // Hide game screen
        this.screens.game.classList.remove('active');
    },

    /**
     * Restart the game
     */
    async restartGame() {
        // Reset memory system
        MemorySystem.reset();

        // Hide victory screen
        this.screens.victory.style.opacity = '0';
        await Animations.wait(500);
        this.screens.victory.classList.remove('active');

        // Show and initialize game
        this.screens.game.classList.add('active');
        this.screens.game.style.opacity = '1';

        // Reset game state
        this.maxMoves = gameConfig.startingMoves;
        this.moves = this.maxMoves;
        this.updateMovesDisplay();

        // Reinitialize grid
        Grid.init(this.elements.board, gameConfig.gridSize);
        const memoryPositions = MemorySystem.generateMemoryPositions(gameConfig.gridSize);
        Grid.generate(memoryPositions);

        if (!Grid.hasPossibleMoves()) {
            await Grid.shuffle();
        }

        this.isPlaying = true;
        this.isPaused = false;
        this.isProcessing = false;
        this.selectedTile = null;
    }
};

// Start game when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    Game.init();
});

// Export
window.Game = Game;
