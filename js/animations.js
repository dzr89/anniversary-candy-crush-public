/* ============================================
   ANIMATIONS - Anniversary Candy Crush
   ============================================ */

const Animations = {
    // Ambient particle state
    ambientParticles: [],
    particleInterval: null,

    /**
     * Swap animation between two tiles
     */
    async swapTiles(tile1, tile2) {
        const rect1 = tile1.getBoundingClientRect();
        const rect2 = tile2.getBoundingClientRect();

        const deltaX = rect2.left - rect1.left;
        const deltaY = rect2.top - rect1.top;

        tile1.classList.add('swapping');
        tile2.classList.add('swapping');

        // Animate tile1 to tile2's position
        tile1.style.transform = `translate(${deltaX}px, ${deltaY}px)`;
        // Animate tile2 to tile1's position
        tile2.style.transform = `translate(${-deltaX}px, ${-deltaY}px)`;

        await this.wait(200);

        // Reset transforms
        tile1.style.transform = '';
        tile2.style.transform = '';
        tile1.classList.remove('swapping');
        tile2.classList.remove('swapping');
    },

    /**
     * Invalid swap animation (shake and return)
     */
    async invalidSwap(tile1, tile2) {
        await this.swapTiles(tile1, tile2);
        await this.wait(100);
        await this.swapTiles(tile2, tile1);

        tile1.classList.add('invalid-swap');
        tile2.classList.add('invalid-swap');

        await this.wait(300);

        tile1.classList.remove('invalid-swap');
        tile2.classList.remove('invalid-swap');
    },

    /**
     * Remove tile animation
     */
    async removeTile(tile, animationType = 'matched') {
        tile.classList.add(animationType);
        await this.wait(300);
        tile.classList.remove(animationType);
        // Create sparkle effect
        this.createSparkles(tile, 5);
    },

    /**
     * Fall animation for tiles
     */
    async fallTiles(animations) {
        const tileHeight = animations[0]?.tile?.offsetHeight || 50;

        animations.forEach(({ tile, distance }) => {
            tile.classList.add('falling');
            // Start from above current position
            tile.style.transform = `translateY(${-distance * (tileHeight + 4)}px)`;
        });

        // Force reflow
        void animations[0]?.tile?.offsetHeight;

        // Animate to final position
        animations.forEach(({ tile }) => {
            tile.style.transform = 'translateY(0)';
        });

        await this.wait(300);

        animations.forEach(({ tile }) => {
            tile.classList.remove('falling');
            tile.style.transform = '';
        });
    },

    /**
     * Spawn new tiles animation
     */
    async spawnTiles(newTiles) {
        newTiles.forEach(({ tile, delay }) => {
            setTimeout(() => {
                tile.classList.add('spawning');
            }, delay);
        });

        await this.wait(300 + (newTiles.length * 50));

        newTiles.forEach(({ tile }) => {
            tile.classList.remove('spawning');
        });
    },

    /**
     * Show hint animation
     */
    showHint(tile1, tile2) {
        // Clear any existing hints first
        document.querySelectorAll('.tile.hinting').forEach(t => {
            t.classList.remove('hinting');
        });

        tile1.classList.add('hinting');
        tile2.classList.add('hinting');

        // Auto-clear after 3 seconds
        setTimeout(() => {
            tile1.classList.remove('hinting');
            tile2.classList.remove('hinting');
        }, 3000);
    },

    /**
     * Shuffle board animation
     */
    async shuffleBoard(board) {
        board.style.transition = 'transform 300ms ease-in-out';
        board.style.transform = 'scale(0.95) rotate(2deg)';
        await this.wait(150);
        board.style.transform = 'scale(0.95) rotate(-2deg)';
        await this.wait(150);
        board.style.transform = 'scale(1) rotate(0)';
        await this.wait(300);
        board.style.transform = '';
        board.style.transition = '';
    },

    /**
     * Create sparkle effects at tile position
     * Performance: Cache rect values to avoid layout thrashing
     */
    createSparkles(tile, count = 5) {
        const board = tile.closest('.game-board');
        if (!board) return;

        // Batch all layout reads BEFORE any writes
        const tileRect = tile.getBoundingClientRect();
        const boardRect = board.getBoundingClientRect();

        // Pre-calculate relative position
        const relativeLeft = tileRect.left - boardRect.left;
        const relativeTop = tileRect.top - boardRect.top;

        // Random color palette
        const colors = ['#D8BFD8', '#CCBFD8', '#E8D0E8', '#C8A8C8'];

        // Create document fragment to batch DOM writes
        const fragment = document.createDocumentFragment();

        for (let i = 0; i < count; i++) {
            const sparkle = document.createElement('div');
            sparkle.className = 'sparkle';

            // Use cached rect values
            const x = relativeLeft + Math.random() * tileRect.width;
            const y = relativeTop + Math.random() * tileRect.height;

            sparkle.style.left = `${x}px`;
            sparkle.style.top = `${y}px`;
            sparkle.style.background = `radial-gradient(circle, ${colors[Math.floor(Math.random() * colors.length)]} 0%, transparent 70%)`;

            fragment.appendChild(sparkle);

            // Schedule removal
            setTimeout(() => sparkle.remove(), 600);
        }

        // Single DOM write
        board.appendChild(fragment);
    },

    /**
     * Screen transition animation
     */
    async transitionScreens(hideScreen, showScreen) {
        hideScreen.style.opacity = '0';
        await this.wait(500);
        hideScreen.classList.remove('active');
        hideScreen.style.opacity = '';

        showScreen.classList.add('active');
        showScreen.style.opacity = '0';
        // Force reflow
        void showScreen.offsetHeight;
        showScreen.style.opacity = '1';
        await this.wait(500);
    },

    /**
     * Memory reveal animation
     */
    async revealMemory(overlay) {
        overlay.classList.add('active');
        await this.wait(50);
        overlay.style.opacity = '1';
        await this.wait(800);
    },

    /**
     * Hide memory overlay
     */
    async hideMemory(overlay) {
        overlay.style.opacity = '0';
        await this.wait(500);
        overlay.classList.remove('active');
    },

    /**
     * Victory celebration animation
     */
    async celebrateVictory(victoryScreen) {
        // Create confetti/hearts
        this.createCelebration(victoryScreen);

        victoryScreen.classList.add('active');
        victoryScreen.style.opacity = '0';
        void victoryScreen.offsetHeight;
        victoryScreen.style.opacity = '1';
        await this.wait(500);
    },

    /**
     * Create celebration effects - burst from center with varied particles
     */
    createCelebration(container) {
        // Add celebration keyframes if not exists
        if (!document.querySelector('#celebration-keyframes')) {
            const style = document.createElement('style');
            style.id = 'celebration-keyframes';
            style.textContent = `
                @keyframes burstOut {
                    0% {
                        transform: translate(-50%, -50%) scale(0);
                        opacity: 1;
                    }
                    20% {
                        opacity: 1;
                    }
                    100% {
                        transform: translate(var(--tx), var(--ty)) scale(1) rotate(var(--rot));
                        opacity: 0;
                    }
                }
                @keyframes floatDown {
                    0% {
                        transform: translateY(0) rotate(0deg) scale(1);
                        opacity: 0.9;
                    }
                    25% {
                        transform: translateY(25vh) rotate(var(--sway1)) scale(0.95);
                    }
                    50% {
                        transform: translateY(50vh) rotate(var(--sway2)) scale(0.9);
                    }
                    75% {
                        transform: translateY(75vh) rotate(var(--sway3)) scale(0.85);
                    }
                    100% {
                        transform: translateY(110vh) rotate(var(--rot)) scale(0.8);
                        opacity: 0;
                    }
                }
                @keyframes screenFlash {
                    0% { opacity: 0; }
                    15% { opacity: 0.3; }
                    100% { opacity: 0; }
                }
            `;
            document.head.appendChild(style);
        }

        // Screen flash effect
        const flash = document.createElement('div');
        flash.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: radial-gradient(circle at center, rgba(255, 255, 255, 0.8) 0%, rgba(216, 191, 216, 0.4) 50%, transparent 70%);
            pointer-events: none;
            z-index: 1002;
            animation: screenFlash 0.6s ease-out forwards;
        `;
        container.appendChild(flash);
        setTimeout(() => flash.remove(), 600);

        // Particle types with varied styles
        const particles = [
            { emoji: '💕', weight: 3 },
            { emoji: '💖', weight: 3 },
            { emoji: '💗', weight: 2 },
            { emoji: '✨', weight: 4 },
            { emoji: '💫', weight: 2 },
            { emoji: '🌸', weight: 2 },
            { emoji: '💝', weight: 1 },
            { emoji: '♥', weight: 2 }
        ];

        // Build weighted array
        const weightedParticles = [];
        particles.forEach(p => {
            for (let i = 0; i < p.weight; i++) {
                weightedParticles.push(p.emoji);
            }
        });

        // Phase 1: Initial burst from center (20 particles)
        const centerX = window.innerWidth / 2;
        const centerY = window.innerHeight / 2;

        for (let i = 0; i < 25; i++) {
            const particle = document.createElement('div');
            particle.textContent = weightedParticles[Math.floor(Math.random() * weightedParticles.length)];

            // Calculate burst direction - full 360 degrees
            const angle = (Math.PI * 2 * i) / 25 + (Math.random() * 0.3);
            const distance = 150 + Math.random() * 300;
            const tx = Math.cos(angle) * distance;
            const ty = Math.sin(angle) * distance;
            const rotation = -180 + Math.random() * 360;

            particle.style.cssText = `
                position: fixed;
                left: ${centerX}px;
                top: ${centerY}px;
                font-size: ${24 + Math.random() * 20}px;
                z-index: 1001;
                pointer-events: none;
                --tx: ${tx}px;
                --ty: ${ty}px;
                --rot: ${rotation}deg;
                animation: burstOut ${0.8 + Math.random() * 0.4}s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
                animation-delay: ${i * 15}ms;
            `;

            container.appendChild(particle);
            setTimeout(() => particle.remove(), 1500);
        }

        // Phase 2: Continuous falling particles with natural sway (40 particles over time)
        for (let i = 0; i < 40; i++) {
            setTimeout(() => {
                const particle = document.createElement('div');
                particle.textContent = weightedParticles[Math.floor(Math.random() * weightedParticles.length)];

                // Natural sway values
                const swayAmount = 15 + Math.random() * 30;
                const sway1 = (Math.random() > 0.5 ? 1 : -1) * swayAmount;
                const sway2 = -sway1 * 0.7;
                const sway3 = sway1 * 0.5;
                const finalRot = -180 + Math.random() * 360;

                particle.style.cssText = `
                    position: fixed;
                    left: ${Math.random() * 100}vw;
                    top: -50px;
                    font-size: ${18 + Math.random() * 24}px;
                    z-index: 1001;
                    pointer-events: none;
                    --sway1: ${sway1}deg;
                    --sway2: ${sway2}deg;
                    --sway3: ${sway3}deg;
                    --rot: ${finalRot}deg;
                    animation: floatDown ${4 + Math.random() * 3}s ease-in-out forwards;
                `;

                container.appendChild(particle);
                setTimeout(() => particle.remove(), 7000);
            }, 200 + i * 100); // Stagger particle spawning
        }
    },

    /**
     * Tile selection animation
     */
    selectTile(tile) {
        tile.classList.add('selected');
    },

    /**
     * Tile deselection animation
     */
    deselectTile(tile) {
        tile.classList.remove('selected');
    },

    /**
     * Start ambient background particles
     */
    startAmbientParticles() {
        if (this.particleInterval) return;

        const symbols = ['♡', '✦', '❀', '✧', '♥'];
        const container = document.body;

        this.particleInterval = setInterval(() => {
            if (this.ambientParticles.length > 12) return; // Limit particles

            const particle = document.createElement('div');
            particle.className = 'ambient-particle';
            particle.textContent = symbols[Math.floor(Math.random() * symbols.length)];
            particle.style.left = `${Math.random() * 100}vw`;
            particle.style.bottom = '-20px';
            particle.style.animationDuration = `${10 + Math.random() * 8}s`;

            container.appendChild(particle);
            this.ambientParticles.push(particle);

            // Remove after animation
            const duration = parseFloat(particle.style.animationDuration) * 1000;
            setTimeout(() => {
                particle.remove();
                this.ambientParticles = this.ambientParticles.filter(p => p !== particle);
            }, duration);
        }, 2500);
    },

    /**
     * Stop ambient particles
     */
    stopAmbientParticles() {
        if (this.particleInterval) {
            clearInterval(this.particleInterval);
            this.particleInterval = null;
        }
        this.ambientParticles.forEach(p => p.remove());
        this.ambientParticles = [];
    },

    /**
     * Screen shake effect for big matches
     * @param {string} intensity - 'light', 'medium', 'heavy'
     */
    screenShake(intensity = 'light') {
        const board = document.getElementById('game-board');
        if (!board) return;

        board.style.animation = `shake-${intensity} 0.3s ease-out`;
        setTimeout(() => {
            board.style.animation = '';
        }, 300);
    },

    /**
     * Background pulse effect on match
     */
    backgroundPulse() {
        document.body.classList.add('match-pulse');
        setTimeout(() => {
            document.body.classList.remove('match-pulse');
        }, 300);
    },

    /**
     * Utility: Wait for specified milliseconds
     */
    wait(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
};

// Export
window.Animations = Animations;
