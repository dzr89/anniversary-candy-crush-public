/* ============================================================
   CONTENT LOADER - Anniversary Candy Crush
   ============================================================

   This file loads your customizations from /customize/my-config.js
   and sets up the game. You don't need to edit this file!

   To customize the game, edit: customize/my-config.js

   ============================================================ */

// Wait for custom config to load, then initialize
(function() {
    'use strict';

    // Default configuration (used if custom config not found)
    const defaults = {
        memories: [
            { photo: "photo1.jpg", caption: "A beautiful memory" },
            { photo: "photo2.jpg", caption: "Another special moment" }
        ],
        messages: {
            title: "Happy Anniversary",
            subtitle: "A game made with love",
            startButton: "Begin Our Journey",
            victoryTitle: "Our Beautiful Journey",
            victorySubtitle: "Every moment with you is a treasure",
            finalMessage: "Happy Anniversary!",
            signature: "With love"
        },
        music: "",
        settings: {
            moves: 75,
            gridSize: 8,
            colors: {
                primary: "#FF69B4",
                secondary: "#FFD700",
                background: "#FFF5F5"
            }
        }
        // Note: Password feature removed (client-side passwords provide no real security)
    };

    // Merge custom config with defaults
    function loadConfig() {
        const custom = window.CustomConfig || {};

        return {
            memories: custom.memories || defaults.memories,
            messages: { ...defaults.messages, ...custom.messages },
            music: custom.music !== undefined ? custom.music : defaults.music,
            settings: {
                ...defaults.settings,
                ...custom.settings,
                colors: { ...defaults.settings.colors, ...(custom.settings?.colors || {}) }
            }
        };
    }

    // Security: Sanitize file paths to prevent path traversal
    function sanitizePath(filename) {
        if (!filename || typeof filename !== 'string') return '';
        // Remove any path traversal sequences and normalize
        return filename
            .replace(/\.\./g, '')      // Remove ..
            .replace(/^\/+/, '')       // Remove leading slashes
            .replace(/\/+/g, '/')      // Normalize multiple slashes
            .replace(/[<>:"|?*]/g, ''); // Remove invalid filename chars
    }

    // Convert to game's internal format
    function initializeGame() {
        const config = loadConfig();

        // Build memories array in game format (with path sanitization)
        window.memories = config.memories.map(m => ({
            image: 'customize/photos/' + sanitizePath(m.photo),
            text: m.caption
        }));

        // Build game config
        window.gameConfig = {
            gridSize: config.settings.gridSize,
            startingMoves: config.settings.moves,

            // Audio paths (with path sanitization)
            backgroundMusic: config.music ? 'customize/music/' + sanitizePath(config.music) : '',
            soundEffects: {
                match: 'assets/sounds/match.mp3',
                special: 'assets/sounds/special.mp3',
                reveal: 'assets/sounds/reveal.mp3',
                victory: 'assets/sounds/victory.mp3'
            },

            // Messages
            startScreenTitle: config.messages.title,
            startScreenSubtitle: config.messages.subtitle,
            startButtonText: config.messages.startButton,
            victoryTitle: config.messages.victoryTitle,
            victorySubtitle: config.messages.victorySubtitle,
            finalMessage: config.messages.finalMessage,
            signature: config.messages.signature,

            // Theme colors
            theme: config.settings.colors
        };

        // Apply custom colors to CSS variables
        if (config.settings.colors) {
            const root = document.documentElement;
            root.style.setProperty('--color-primary', config.settings.colors.primary);
            root.style.setProperty('--color-secondary', config.settings.colors.secondary);
            root.style.setProperty('--color-background', config.settings.colors.background);
        }

        // Update HTML content with custom messages
        updatePageContent(config.messages);
    }

    // Update page text with custom messages
    function updatePageContent(messages) {
        // Start screen
        const title = document.querySelector('.start-content .title');
        if (title) title.textContent = messages.title;

        const subtitle = document.querySelector('.start-content .subtitle');
        if (subtitle) subtitle.textContent = messages.subtitle;

        const startBtn = document.getElementById('start-button');
        if (startBtn) startBtn.textContent = messages.startButton;

        // Victory screen
        const victoryTitle = document.querySelector('.victory-title');
        if (victoryTitle) victoryTitle.textContent = messages.victoryTitle;

        const victorySubtitle = document.querySelector('.victory-subtitle');
        if (victorySubtitle) victorySubtitle.textContent = messages.victorySubtitle;

        const finalMsg = document.getElementById('final-message-text');
        if (finalMsg) finalMsg.textContent = messages.finalMessage;

        const signature = document.querySelector('.victory-content .signature');
        if (signature) {
            // Security: Use textContent to prevent XSS, then append heart symbol
            signature.textContent = messages.signature + ' ♥';
        }
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeGame);
    } else {
        initializeGame();
    }

})();


// ============================================================
// AUDIO MANAGER
// ============================================================
// Handles all game audio (music and sound effects)

const AudioManager = {
    bgMusic: null,
    sounds: {},
    soundPools: {},  // Performance: Audio pools to avoid memory leaks
    poolSize: 3,     // Max simultaneous instances per sound
    isMuted: false,
    initialized: false,

    init() {
        if (this.initialized) return;
        this.initialized = true;

        // Initialize background music
        if (gameConfig.backgroundMusic) {
            this.bgMusic = new Audio(gameConfig.backgroundMusic);
            this.bgMusic.loop = true;
            this.bgMusic.volume = 0.3;
        }

        // Preload sound effects with pools
        Object.entries(gameConfig.soundEffects).forEach(([name, path]) => {
            // Create a pool of audio elements for each sound
            this.soundPools[name] = [];
            for (let i = 0; i < this.poolSize; i++) {
                const audio = new Audio(path);
                audio.volume = 0.5;
                this.soundPools[name].push(audio);
            }
            // Keep reference to first one for compatibility
            this.sounds[name] = this.soundPools[name][0];
        });
    },

    playMusic() {
        if (this.bgMusic && !this.isMuted) {
            this.bgMusic.play().catch(() => {
                console.log('Music will play after user interaction');
            });
        }
    },

    pauseMusic() {
        if (this.bgMusic) {
            this.bgMusic.pause();
        }
    },

    /**
     * Play a sound effect using pooled audio elements
     * Performance: Reuses audio elements instead of creating new ones
     */
    playSound(name) {
        const pool = this.soundPools[name];
        if (!pool || this.isMuted) return;

        // Find an available audio element (one that's not playing)
        let audio = pool.find(a => a.paused || a.ended);

        // If all are playing, reuse the first one
        if (!audio) {
            audio = pool[0];
        }

        // Reset and play
        audio.currentTime = 0;
        audio.play().catch(() => {});
    },

    toggleMute() {
        this.isMuted = !this.isMuted;
        if (this.bgMusic) {
            if (this.isMuted) {
                this.bgMusic.pause();
            } else {
                this.bgMusic.play().catch(() => {});
            }
        }
        return this.isMuted;
    },

    setMusicVolume(volume) {
        if (this.bgMusic) {
            this.bgMusic.volume = Math.max(0, Math.min(1, volume));
        }
    }
};

window.AudioManager = AudioManager;
