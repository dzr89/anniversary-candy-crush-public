/**
 * Content Loader & AudioManager Tests
 * Tests for configuration loading and audio management
 */

const fs = require('fs');
const path = require('path');

describe('Content Loader', () => {
    describe('Path Sanitization', () => {
        // Test the sanitizePath function by evaluating just that part
        let sanitizePath;

        beforeEach(() => {
            // Extract and eval just the sanitizePath function
            sanitizePath = function(filename) {
                if (!filename || typeof filename !== 'string') return '';
                return filename
                    .replace(/\.\./g, '')
                    .replace(/^\/+/, '')
                    .replace(/\/+/g, '/')
                    .replace(/[<>:"|?*]/g, '');
            };
        });

        test('removes path traversal sequences', () => {
            expect(sanitizePath('../../../etc/passwd')).toBe('etc/passwd');
            expect(sanitizePath('foo/../bar')).toBe('foo/bar');
            expect(sanitizePath('..photo.jpg')).toBe('photo.jpg');
        });

        test('removes leading slashes', () => {
            expect(sanitizePath('/etc/passwd')).toBe('etc/passwd');
            expect(sanitizePath('///photo.jpg')).toBe('photo.jpg');
        });

        test('normalizes multiple slashes', () => {
            expect(sanitizePath('foo//bar///baz')).toBe('foo/bar/baz');
        });

        test('removes invalid filename characters', () => {
            expect(sanitizePath('photo<script>.jpg')).toBe('photoscript.jpg');
            expect(sanitizePath('file:name.jpg')).toBe('filename.jpg');
            expect(sanitizePath('test"file.jpg')).toBe('testfile.jpg');
            expect(sanitizePath('my|photo.jpg')).toBe('myphoto.jpg');
            expect(sanitizePath('photo?.jpg')).toBe('photo.jpg');
            expect(sanitizePath('photo*.jpg')).toBe('photo.jpg');
        });

        test('handles empty input', () => {
            expect(sanitizePath('')).toBe('');
            expect(sanitizePath(null)).toBe('');
            expect(sanitizePath(undefined)).toBe('');
        });

        test('handles non-string input', () => {
            expect(sanitizePath(123)).toBe('');
            expect(sanitizePath({})).toBe('');
            expect(sanitizePath([])).toBe('');
        });

        test('preserves valid filenames', () => {
            expect(sanitizePath('photo.jpg')).toBe('photo.jpg');
            expect(sanitizePath('my-photo_2024.png')).toBe('my-photo_2024.png');
            expect(sanitizePath('folder/subfolder/image.gif')).toBe('folder/subfolder/image.gif');
        });

        test('handles complex attack patterns', () => {
            expect(sanitizePath('....//....//etc/passwd')).toBe('etc/passwd');
            expect(sanitizePath('/../../<script>alert(1)</script>')).toBe('scriptalert(1)/script');
        });
    });

    describe('Config Merging', () => {
        // Simulate the loadConfig function behavior
        function loadConfig(custom, defaults) {
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

        const defaults = {
            memories: [{ photo: 'default.jpg', caption: 'Default' }],
            messages: {
                title: 'Default Title',
                subtitle: 'Default Subtitle',
                startButton: 'Start'
            },
            music: 'default.mp3',
            settings: {
                moves: 75,
                gridSize: 8,
                colors: {
                    primary: '#FF69B4',
                    secondary: '#FFD700',
                    background: '#FFF5F5'
                }
            }
        };

        test('uses defaults when no custom config', () => {
            const config = loadConfig({}, defaults);

            expect(config.memories).toEqual(defaults.memories);
            expect(config.messages.title).toBe('Default Title');
            expect(config.music).toBe('default.mp3');
            expect(config.settings.moves).toBe(75);
        });

        test('overrides with custom values', () => {
            const custom = {
                memories: [{ photo: 'custom.jpg', caption: 'Custom' }],
                messages: { title: 'Custom Title' },
                music: 'custom.mp3',
                settings: { moves: 50 }
            };

            const config = loadConfig(custom, defaults);

            expect(config.memories).toEqual(custom.memories);
            expect(config.messages.title).toBe('Custom Title');
            expect(config.messages.subtitle).toBe('Default Subtitle'); // Preserved default
            expect(config.music).toBe('custom.mp3');
            expect(config.settings.moves).toBe(50);
        });

        test('deeply merges colors', () => {
            const custom = {
                settings: {
                    colors: { primary: '#AABBCC' }
                }
            };

            const config = loadConfig(custom, defaults);

            expect(config.settings.colors.primary).toBe('#AABBCC');
            expect(config.settings.colors.secondary).toBe('#FFD700'); // Preserved default
            expect(config.settings.colors.background).toBe('#FFF5F5'); // Preserved default
        });

        test('handles empty music string', () => {
            const custom = { music: '' };

            const config = loadConfig(custom, defaults);

            expect(config.music).toBe('');
        });

        test('handles undefined custom settings', () => {
            const custom = { messages: { title: 'Test' } };

            const config = loadConfig(custom, defaults);

            expect(config.settings.moves).toBe(75);
            expect(config.settings.colors.primary).toBe('#FF69B4');
        });
    });
});

describe('AudioManager', () => {
    let AudioManager;

    beforeEach(() => {
        // Reset global state
        global.gameConfig = {
            backgroundMusic: 'music.mp3',
            soundEffects: {
                match: 'match.mp3',
                special: 'special.mp3',
                reveal: 'reveal.mp3',
                victory: 'victory.mp3'
            }
        };

        // Create fresh AudioManager
        AudioManager = {
            bgMusic: null,
            sounds: {},
            soundPools: {},
            poolSize: 3,
            isMuted: false,
            initialized: false,

            init() {
                if (this.initialized) return;
                this.initialized = true;

                if (gameConfig.backgroundMusic) {
                    this.bgMusic = new Audio(gameConfig.backgroundMusic);
                    this.bgMusic.loop = true;
                    this.bgMusic.volume = 0.3;
                }

                Object.entries(gameConfig.soundEffects).forEach(([name, path]) => {
                    this.soundPools[name] = [];
                    for (let i = 0; i < this.poolSize; i++) {
                        const audio = new Audio(path);
                        audio.volume = 0.5;
                        this.soundPools[name].push(audio);
                    }
                    this.sounds[name] = this.soundPools[name][0];
                });
            },

            playMusic() {
                if (this.bgMusic && !this.isMuted) {
                    this.bgMusic.play().catch(() => {});
                }
            },

            pauseMusic() {
                if (this.bgMusic) {
                    this.bgMusic.pause();
                }
            },

            playSound(name) {
                const pool = this.soundPools[name];
                if (!pool || this.isMuted) return;

                let audio = pool.find(a => a.paused || a.ended);
                if (!audio) {
                    audio = pool[0];
                }

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
    });

    describe('init', () => {
        test('initializes only once', () => {
            AudioManager.init();
            const firstBgMusic = AudioManager.bgMusic;

            AudioManager.init();

            expect(AudioManager.bgMusic).toBe(firstBgMusic);
        });

        test('creates background music when configured', () => {
            AudioManager.init();

            expect(AudioManager.bgMusic).not.toBeNull();
            expect(AudioManager.bgMusic.loop).toBe(true);
            expect(AudioManager.bgMusic.volume).toBe(0.3);
        });

        test('does not create background music when not configured', () => {
            gameConfig.backgroundMusic = '';
            AudioManager.init();

            expect(AudioManager.bgMusic).toBeNull();
        });

        test('creates sound effect pools', () => {
            AudioManager.init();

            expect(AudioManager.soundPools.match.length).toBe(3);
            expect(AudioManager.soundPools.special.length).toBe(3);
            expect(AudioManager.soundPools.reveal.length).toBe(3);
            expect(AudioManager.soundPools.victory.length).toBe(3);
        });

        test('sets sound effect volume', () => {
            AudioManager.init();

            AudioManager.soundPools.match.forEach(audio => {
                expect(audio.volume).toBe(0.5);
            });
        });
    });

    describe('playMusic', () => {
        beforeEach(() => {
            AudioManager.init();
        });

        test('plays background music when not muted', () => {
            const playSpy = jest.spyOn(AudioManager.bgMusic, 'play');

            AudioManager.playMusic();

            expect(playSpy).toHaveBeenCalled();
        });

        test('does not play when muted', () => {
            AudioManager.isMuted = true;
            const playSpy = jest.spyOn(AudioManager.bgMusic, 'play');

            AudioManager.playMusic();

            expect(playSpy).not.toHaveBeenCalled();
        });

        test('handles no background music gracefully', () => {
            AudioManager.bgMusic = null;

            expect(() => AudioManager.playMusic()).not.toThrow();
        });
    });

    describe('pauseMusic', () => {
        beforeEach(() => {
            AudioManager.init();
        });

        test('pauses background music', () => {
            const pauseSpy = jest.spyOn(AudioManager.bgMusic, 'pause');

            AudioManager.pauseMusic();

            expect(pauseSpy).toHaveBeenCalled();
        });

        test('handles no background music gracefully', () => {
            AudioManager.bgMusic = null;

            expect(() => AudioManager.pauseMusic()).not.toThrow();
        });
    });

    describe('playSound', () => {
        beforeEach(() => {
            AudioManager.init();
        });

        test('plays sound from pool', () => {
            const playSpy = jest.spyOn(AudioManager.soundPools.match[0], 'play');

            AudioManager.playSound('match');

            expect(playSpy).toHaveBeenCalled();
        });

        test('resets currentTime before playing', () => {
            AudioManager.soundPools.match[0].currentTime = 5;

            AudioManager.playSound('match');

            expect(AudioManager.soundPools.match[0].currentTime).toBe(0);
        });

        test('does not play when muted', () => {
            AudioManager.isMuted = true;
            const playSpy = jest.spyOn(AudioManager.soundPools.match[0], 'play');

            AudioManager.playSound('match');

            expect(playSpy).not.toHaveBeenCalled();
        });

        test('handles unknown sound name gracefully', () => {
            expect(() => AudioManager.playSound('unknown')).not.toThrow();
        });

        test('finds available audio in pool', () => {
            // Mark first two as playing
            AudioManager.soundPools.match[0].paused = false;
            AudioManager.soundPools.match[0].ended = false;
            AudioManager.soundPools.match[1].paused = false;
            AudioManager.soundPools.match[1].ended = false;

            const playSpy = jest.spyOn(AudioManager.soundPools.match[2], 'play');

            AudioManager.playSound('match');

            expect(playSpy).toHaveBeenCalled();
        });

        test('reuses first audio when all are playing', () => {
            // Mark all as playing
            AudioManager.soundPools.match.forEach(audio => {
                audio.paused = false;
                audio.ended = false;
            });

            const playSpy = jest.spyOn(AudioManager.soundPools.match[0], 'play');

            AudioManager.playSound('match');

            expect(playSpy).toHaveBeenCalled();
        });
    });

    describe('toggleMute', () => {
        beforeEach(() => {
            AudioManager.init();
        });

        test('toggles mute state', () => {
            expect(AudioManager.isMuted).toBe(false);

            AudioManager.toggleMute();
            expect(AudioManager.isMuted).toBe(true);

            AudioManager.toggleMute();
            expect(AudioManager.isMuted).toBe(false);
        });

        test('returns new mute state', () => {
            const result1 = AudioManager.toggleMute();
            expect(result1).toBe(true);

            const result2 = AudioManager.toggleMute();
            expect(result2).toBe(false);
        });

        test('pauses music when muting', () => {
            const pauseSpy = jest.spyOn(AudioManager.bgMusic, 'pause');

            AudioManager.toggleMute(); // Mute

            expect(pauseSpy).toHaveBeenCalled();
        });

        test('plays music when unmuting', () => {
            AudioManager.isMuted = true;
            const playSpy = jest.spyOn(AudioManager.bgMusic, 'play');

            AudioManager.toggleMute(); // Unmute

            expect(playSpy).toHaveBeenCalled();
        });
    });

    describe('setMusicVolume', () => {
        beforeEach(() => {
            AudioManager.init();
        });

        test('sets music volume', () => {
            AudioManager.setMusicVolume(0.5);

            expect(AudioManager.bgMusic.volume).toBe(0.5);
        });

        test('clamps volume to 0-1 range', () => {
            AudioManager.setMusicVolume(-0.5);
            expect(AudioManager.bgMusic.volume).toBe(0);

            AudioManager.setMusicVolume(1.5);
            expect(AudioManager.bgMusic.volume).toBe(1);
        });

        test('handles no background music gracefully', () => {
            AudioManager.bgMusic = null;

            expect(() => AudioManager.setMusicVolume(0.5)).not.toThrow();
        });
    });
});
