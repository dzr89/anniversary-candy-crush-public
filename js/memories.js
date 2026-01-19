/* ============================================
   MEMORY REVEAL SYSTEM - Anniversary Candy Crush
   ============================================ */

const MemorySystem = {
    memories: [],
    revealedCount: 0,
    totalMemories: 0,
    overlay: null,
    photoElement: null,
    textElement: null,
    closeButton: null,
    onClose: null,
    abortController: null,  // Performance: For event listener cleanup

    /**
     * Initialize the memory system
     */
    init(memoriesConfig) {
        // Clean up any existing listeners first
        this.cleanupListeners();

        this.memories = memoriesConfig.map((memory, index) => ({
            ...memory,
            id: index,
            revealed: false
        }));
        this.totalMemories = this.memories.length;
        this.revealedCount = 0;

        // Cache DOM elements
        this.overlay = document.getElementById('memory-overlay');
        this.photoElement = document.getElementById('memory-photo');
        this.textElement = document.getElementById('memory-text');
        this.closeButton = document.getElementById('memory-close');

        // Create new AbortController for this session
        this.abortController = new AbortController();
        const { signal } = this.abortController;

        // Setup close button handler (with abort signal for cleanup)
        this.closeButton.addEventListener('click', () => this.hideMemory(), { signal });
        this.overlay.addEventListener('click', (e) => {
            if (e.target === this.overlay) {
                this.hideMemory();
            }
        }, { signal });

        // Keyboard handler
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' || e.key === ' ' || e.key === 'Enter') {
                if (this.overlay.classList.contains('active')) {
                    this.hideMemory();
                }
            }
        }, { signal });

        // Update UI counter
        this.updateCounter();
    },

    /**
     * Clean up event listeners to prevent memory leaks on replay
     */
    cleanupListeners() {
        if (this.abortController) {
            this.abortController.abort();
            this.abortController = null;
        }
    },

    /**
     * Generate random positions for memory tiles
     * Avoids corners and edges for easier matching
     */
    generateMemoryPositions(gridSize) {
        const positions = [];
        const usedPositions = new Set();

        // Define inner area (avoid edges) - use 1 to gridSize-2 for better positions
        const minPos = 1;
        const maxPos = gridSize - 2;
        const innerSize = maxPos - minPos + 1;

        // Ensure memories are spread across the board, avoiding edges
        for (let i = 0; i < this.totalMemories; i++) {
            let attempts = 0;
            let row, col, posKey;

            do {
                // Bias toward inner positions (80% inner for easier matching)
                if (Math.random() < 0.8) {
                    row = minPos + Math.floor(Math.random() * innerSize);
                    col = minPos + Math.floor(Math.random() * innerSize);
                } else {
                    row = Math.floor(Math.random() * gridSize);
                    col = Math.floor(Math.random() * gridSize);
                }
                posKey = `${row},${col}`;
                attempts++;
            } while (usedPositions.has(posKey) && attempts < 100);

            usedPositions.add(posKey);
            positions.push({
                row,
                col,
                memoryId: i
            });
        }

        return positions;
    },

    /**
     * Reveal the next memory in chronological sequence
     * (ignores memoryId - always reveals next in order)
     */
    async revealMemory(memoryId) {
        // Always reveal the next memory in chronological order
        const nextIndex = this.revealedCount;
        if (nextIndex >= this.totalMemories) {
            return false;
        }

        const memory = this.memories[nextIndex];
        if (!memory) {
            return false;
        }

        memory.revealed = true;
        this.revealedCount++;

        // Update photo and text
        this.photoElement.src = memory.image;
        this.photoElement.alt = memory.text;
        this.textElement.textContent = memory.text;

        // Show overlay with animation
        await Animations.revealMemory(this.overlay);

        // Update counter
        this.updateCounter();

        // Play reveal sound
        AudioManager.playSound('reveal');

        return true;
    },

    /**
     * Hide the memory overlay
     */
    async hideMemory() {
        await Animations.hideMemory(this.overlay);

        if (this.onClose) {
            this.onClose();
            this.onClose = null;
        }
    },

    /**
     * Wait for user to close memory overlay
     */
    waitForClose() {
        return new Promise(resolve => {
            this.onClose = resolve;
        });
    },

    /**
     * Update the memories counter in UI
     */
    updateCounter() {
        const countElement = document.getElementById('memories-count');
        const totalElement = document.getElementById('total-memories');
        if (countElement) {
            countElement.textContent = this.revealedCount;
        }
        if (totalElement) {
            totalElement.textContent = this.totalMemories;
        }
    },

    /**
     * Check if all memories have been revealed
     */
    isComplete() {
        return this.revealedCount >= this.totalMemories;
    },

    /**
     * Get all revealed memories for victory screen
     */
    getRevealedMemories() {
        return this.memories.filter(m => m.revealed);
    },

    /**
     * Get memory by ID
     */
    getMemory(memoryId) {
        return this.memories[memoryId];
    },

    /**
     * Reset all memories for replay
     */
    reset() {
        this.memories.forEach(memory => {
            memory.revealed = false;
        });
        this.revealedCount = 0;
        this.updateCounter();
    },

    /**
     * Populate victory gallery with staggered entrance animations
     */
    populateGallery() {
        const gallery = document.getElementById('photo-gallery');
        if (!gallery) return;

        gallery.innerHTML = '';

        this.memories.forEach((memory, index) => {
            const img = document.createElement('img');
            img.src = memory.image;
            img.alt = memory.text;
            img.title = 'Click to view: ' + memory.text;

            // Click to show full memory
            img.addEventListener('click', () => {
                this.photoElement.src = memory.image;
                this.textElement.textContent = memory.text;
                this.overlay.classList.add('active');
                this.overlay.style.opacity = '1';
            });

            gallery.appendChild(img);

            // Staggered entrance animation - 80ms delay between each photo
            setTimeout(() => {
                img.classList.add('visible');
            }, 100 + (index * 80));
        });
    },

    /**
     * Set final message text
     */
    setFinalMessage(message) {
        const messageElement = document.getElementById('final-message-text');
        if (messageElement) {
            messageElement.textContent = message;
        }
    }
};

// Export
window.MemorySystem = MemorySystem;
