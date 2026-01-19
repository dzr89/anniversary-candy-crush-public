/* ============================================
   UTILITIES - Anniversary Candy Crush
   Performance and Security Helpers
   ============================================ */

'use strict';

const Utils = {
    // ==========================================
    // PERFORMANCE UTILITIES
    // ==========================================

    /**
     * Object Pool for reusing DOM elements
     * Reduces garbage collection and improves performance
     */
    ObjectPool: class {
        constructor(createFn, resetFn, initialSize = 10) {
            this.createFn = createFn;
            this.resetFn = resetFn;
            this.pool = [];
            this.active = new Set();

            // Pre-populate pool
            for (let i = 0; i < initialSize; i++) {
                this.pool.push(this.createFn());
            }
        }

        acquire() {
            let obj = this.pool.pop();
            if (!obj) {
                obj = this.createFn();
            }
            this.active.add(obj);
            return obj;
        }

        release(obj) {
            if (this.active.has(obj)) {
                this.active.delete(obj);
                this.resetFn(obj);
                this.pool.push(obj);
            }
        }

        releaseAll() {
            this.active.forEach(obj => {
                this.resetFn(obj);
                this.pool.push(obj);
            });
            this.active.clear();
        }

        get size() {
            return this.pool.length;
        }

        get activeCount() {
            return this.active.size;
        }
    },

    /**
     * Throttle function calls to limit execution rate
     * @param {Function} fn - Function to throttle
     * @param {number} delay - Minimum time between calls (ms)
     * @returns {Function} - Throttled function
     */
    throttle(fn, delay) {
        let lastCall = 0;
        let timeoutId = null;

        return function throttled(...args) {
            const now = Date.now();
            const timeSinceLastCall = now - lastCall;

            if (timeSinceLastCall >= delay) {
                lastCall = now;
                fn.apply(this, args);
            } else if (!timeoutId) {
                timeoutId = setTimeout(() => {
                    lastCall = Date.now();
                    timeoutId = null;
                    fn.apply(this, args);
                }, delay - timeSinceLastCall);
            }
        };
    },

    /**
     * Debounce function calls to prevent rapid firing
     * @param {Function} fn - Function to debounce
     * @param {number} delay - Wait time after last call (ms)
     * @returns {Function} - Debounced function
     */
    debounce(fn, delay) {
        let timeoutId = null;

        return function debounced(...args) {
            if (timeoutId) {
                clearTimeout(timeoutId);
            }
            timeoutId = setTimeout(() => {
                timeoutId = null;
                fn.apply(this, args);
            }, delay);
        };
    },

    /**
     * Request Animation Frame-based animation helper
     * Smoother animations synced to display refresh
     * @param {number} duration - Animation duration in ms
     * @param {Function} callback - Called each frame with progress (0-1)
     * @returns {Promise} - Resolves when animation completes
     */
    animate(duration, callback) {
        return new Promise(resolve => {
            const startTime = performance.now();

            function frame(currentTime) {
                const elapsed = currentTime - startTime;
                const progress = Math.min(elapsed / duration, 1);

                callback(progress);

                if (progress < 1) {
                    requestAnimationFrame(frame);
                } else {
                    resolve();
                }
            }

            requestAnimationFrame(frame);
        });
    },

    /**
     * Batch DOM updates using requestAnimationFrame
     * Prevents layout thrashing
     * @param {Function} callback - DOM manipulation function
     */
    batchDOMUpdate(callback) {
        requestAnimationFrame(() => {
            callback();
        });
    },

    /**
     * Cache DOM queries for repeated access
     * @returns {Object} - Cache management object
     */
    createDOMCache() {
        const cache = new Map();

        return {
            get(selector) {
                if (!cache.has(selector)) {
                    cache.set(selector, document.querySelector(selector));
                }
                return cache.get(selector);
            },

            getAll(selector) {
                const key = `all:${selector}`;
                if (!cache.has(key)) {
                    cache.set(key, document.querySelectorAll(selector));
                }
                return cache.get(key);
            },

            invalidate(selector) {
                cache.delete(selector);
                cache.delete(`all:${selector}`);
            },

            clear() {
                cache.clear();
            }
        };
    },

    /**
     * Measure performance of a function
     * @param {string} name - Label for measurement
     * @param {Function} fn - Function to measure
     * @returns {*} - Result of function
     */
    measurePerformance(name, fn) {
        const start = performance.now();
        const result = fn();
        const end = performance.now();

        if (typeof result?.then === 'function') {
            return result.then(value => {
                console.debug(`[Perf] ${name}: ${(performance.now() - start).toFixed(2)}ms`);
                return value;
            });
        }

        console.debug(`[Perf] ${name}: ${(end - start).toFixed(2)}ms`);
        return result;
    },

    // ==========================================
    // SECURITY UTILITIES
    // ==========================================

    /**
     * Sanitize string for safe HTML text content
     * Prevents XSS attacks
     * @param {string} str - String to sanitize
     * @returns {string} - Sanitized string
     */
    sanitizeText(str) {
        if (typeof str !== 'string') return '';

        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    },

    /**
     * Sanitize file path to prevent path traversal
     * @param {string} filename - Filename to sanitize
     * @returns {string} - Sanitized filename
     */
    sanitizePath(filename) {
        if (!filename || typeof filename !== 'string') return '';

        return filename
            .replace(/\.\./g, '')           // Remove path traversal
            .replace(/^\/+/, '')            // Remove leading slashes
            .replace(/\/+/g, '/')           // Normalize slashes
            .replace(/[<>:"|?*\\]/g, '')    // Remove invalid chars
            .replace(/\x00/g, '');          // Remove null bytes
    },

    /**
     * Validate that a value is a safe integer within range
     * @param {*} value - Value to validate
     * @param {number} min - Minimum allowed value
     * @param {number} max - Maximum allowed value
     * @param {number} defaultVal - Default if invalid
     * @returns {number} - Validated integer
     */
    safeInt(value, min, max, defaultVal) {
        const num = parseInt(value, 10);

        if (isNaN(num) || !Number.isFinite(num)) {
            return defaultVal;
        }

        return Math.max(min, Math.min(max, num));
    },

    /**
     * Safely parse JSON with error handling
     * @param {string} str - JSON string to parse
     * @param {*} defaultVal - Default value if parsing fails
     * @returns {*} - Parsed value or default
     */
    safeJSONParse(str, defaultVal = null) {
        try {
            return JSON.parse(str);
        } catch {
            return defaultVal;
        }
    },

    /**
     * Create a frozen (immutable) copy of an object
     * Prevents accidental mutations
     * @param {Object} obj - Object to freeze
     * @returns {Object} - Frozen deep copy
     */
    deepFreeze(obj) {
        if (obj === null || typeof obj !== 'object') {
            return obj;
        }

        Object.keys(obj).forEach(key => {
            const value = obj[key];
            if (typeof value === 'object' && value !== null) {
                this.deepFreeze(value);
            }
        });

        return Object.freeze(obj);
    },

    /**
     * Validate URL to ensure it's safe
     * @param {string} url - URL to validate
     * @param {Array} allowedProtocols - Allowed protocols
     * @returns {boolean} - True if URL is safe
     */
    isValidURL(url, allowedProtocols = ['http:', 'https:']) {
        try {
            const parsed = new URL(url, window.location.origin);
            return allowedProtocols.includes(parsed.protocol);
        } catch {
            return false;
        }
    },

    /**
     * Rate limiter to prevent abuse
     * @param {number} maxCalls - Maximum calls allowed
     * @param {number} windowMs - Time window in milliseconds
     * @returns {Function} - Returns true if action is allowed
     */
    createRateLimiter(maxCalls, windowMs) {
        const calls = [];

        return function isAllowed() {
            const now = Date.now();
            const windowStart = now - windowMs;

            // Remove old calls
            while (calls.length > 0 && calls[0] < windowStart) {
                calls.shift();
            }

            if (calls.length < maxCalls) {
                calls.push(now);
                return true;
            }

            return false;
        };
    },

    // ==========================================
    // VALIDATION UTILITIES
    // ==========================================

    /**
     * Validate game configuration object
     * @param {Object} config - Configuration to validate
     * @returns {Object} - Validated configuration with defaults
     */
    validateGameConfig(config) {
        const defaults = {
            gridSize: 8,
            startingMoves: 50,
            minGridSize: 6,
            maxGridSize: 10,
            minMoves: 10,
            maxMoves: 999
        };

        return {
            gridSize: this.safeInt(
                config?.gridSize,
                defaults.minGridSize,
                defaults.maxGridSize,
                defaults.gridSize
            ),
            startingMoves: this.safeInt(
                config?.startingMoves,
                defaults.minMoves,
                defaults.maxMoves,
                defaults.startingMoves
            )
        };
    },

    /**
     * Validate memory/photo configuration
     * @param {Array} memories - Array of memory objects
     * @returns {Array} - Validated memories
     */
    validateMemories(memories) {
        if (!Array.isArray(memories)) {
            return [];
        }

        return memories
            .filter(m => m && typeof m === 'object')
            .map(m => ({
                photo: this.sanitizePath(m.photo || ''),
                caption: typeof m.caption === 'string' ? m.caption.slice(0, 500) : ''
            }))
            .filter(m => m.photo); // Must have a photo
    },

    // ==========================================
    // EASING FUNCTIONS (for smooth animations)
    // ==========================================

    easing: {
        linear: t => t,
        easeInQuad: t => t * t,
        easeOutQuad: t => t * (2 - t),
        easeInOutQuad: t => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t,
        easeInCubic: t => t * t * t,
        easeOutCubic: t => (--t) * t * t + 1,
        easeInOutCubic: t => t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1,
        easeOutElastic: t => {
            const p = 0.3;
            return Math.pow(2, -10 * t) * Math.sin((t - p / 4) * (2 * Math.PI) / p) + 1;
        },
        easeOutBounce: t => {
            if (t < 1 / 2.75) {
                return 7.5625 * t * t;
            } else if (t < 2 / 2.75) {
                return 7.5625 * (t -= 1.5 / 2.75) * t + 0.75;
            } else if (t < 2.5 / 2.75) {
                return 7.5625 * (t -= 2.25 / 2.75) * t + 0.9375;
            } else {
                return 7.5625 * (t -= 2.625 / 2.75) * t + 0.984375;
            }
        }
    }
};

// Export for both browser and module environments
if (typeof window !== 'undefined') {
    window.Utils = Utils;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = Utils;
}
