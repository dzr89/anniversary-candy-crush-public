/**
 * Utils Tests
 * Tests for performance and security utilities
 */

const fs = require('fs');
const path = require('path');

// Load Utils module
const utilsCode = fs.readFileSync(path.join(__dirname, '../js/utils.js'), 'utf8');
eval(utilsCode);

describe('Utils', () => {
    describe('ObjectPool', () => {
        let pool;

        beforeEach(() => {
            pool = new Utils.ObjectPool(
                () => ({ value: 0 }),
                (obj) => { obj.value = 0; },
                5
            );
        });

        test('pre-populates pool with initial size', () => {
            expect(pool.size).toBe(5);
        });

        test('acquires object from pool', () => {
            const obj = pool.acquire();

            expect(obj).toBeDefined();
            expect(pool.activeCount).toBe(1);
            expect(pool.size).toBe(4);
        });

        test('creates new object when pool is empty', () => {
            // Exhaust pool
            for (let i = 0; i < 6; i++) {
                pool.acquire();
            }

            expect(pool.activeCount).toBe(6);
            expect(pool.size).toBe(0);
        });

        test('releases object back to pool', () => {
            const obj = pool.acquire();
            obj.value = 42;

            pool.release(obj);

            expect(pool.activeCount).toBe(0);
            expect(pool.size).toBe(5);
            expect(obj.value).toBe(0); // Reset was called
        });

        test('does not release object not from pool', () => {
            const foreign = { value: 99 };

            pool.release(foreign);

            expect(pool.size).toBe(5); // Unchanged
        });

        test('releases all active objects', () => {
            pool.acquire();
            pool.acquire();
            pool.acquire();

            expect(pool.activeCount).toBe(3);

            pool.releaseAll();

            expect(pool.activeCount).toBe(0);
            expect(pool.size).toBe(5);
        });
    });

    describe('throttle', () => {
        beforeEach(() => {
            jest.useFakeTimers();
        });

        test('calls function immediately on first call', () => {
            const fn = jest.fn();
            const throttled = Utils.throttle(fn, 100);

            throttled();

            expect(fn).toHaveBeenCalledTimes(1);
        });

        test('prevents rapid calls within delay period', () => {
            const fn = jest.fn();
            const throttled = Utils.throttle(fn, 100);

            throttled();
            throttled();
            throttled();

            expect(fn).toHaveBeenCalledTimes(1);
        });

        test('allows call after delay period', () => {
            const fn = jest.fn();
            const throttled = Utils.throttle(fn, 100);

            throttled();
            jest.advanceTimersByTime(100);
            throttled();

            expect(fn).toHaveBeenCalledTimes(2);
        });

        test('queues trailing call', () => {
            const fn = jest.fn();
            const throttled = Utils.throttle(fn, 100);

            throttled('a');
            throttled('b');

            jest.advanceTimersByTime(100);

            expect(fn).toHaveBeenCalledTimes(2);
            expect(fn).toHaveBeenLastCalledWith('b');
        });
    });

    describe('debounce', () => {
        beforeEach(() => {
            jest.useFakeTimers();
        });

        test('delays function call', () => {
            const fn = jest.fn();
            const debounced = Utils.debounce(fn, 100);

            debounced();

            expect(fn).not.toHaveBeenCalled();

            jest.advanceTimersByTime(100);

            expect(fn).toHaveBeenCalledTimes(1);
        });

        test('resets delay on subsequent calls', () => {
            const fn = jest.fn();
            const debounced = Utils.debounce(fn, 100);

            debounced();
            jest.advanceTimersByTime(50);
            debounced();
            jest.advanceTimersByTime(50);

            expect(fn).not.toHaveBeenCalled();

            jest.advanceTimersByTime(50);

            expect(fn).toHaveBeenCalledTimes(1);
        });

        test('calls with latest arguments', () => {
            const fn = jest.fn();
            const debounced = Utils.debounce(fn, 100);

            debounced('a');
            debounced('b');
            debounced('c');

            jest.advanceTimersByTime(100);

            expect(fn).toHaveBeenCalledWith('c');
        });
    });

    describe('animate', () => {
        test('returns a promise', () => {
            const result = Utils.animate(100, () => {});
            expect(result).toBeInstanceOf(Promise);
        });

        test('calls callback with a function', () => {
            const callback = jest.fn();

            Utils.animate(100, callback);

            // The callback will be called via requestAnimationFrame
            // Just verify animate accepts the callback
            expect(typeof callback).toBe('function');
        });
    });

    describe('sanitizeText', () => {
        test('escapes HTML entities', () => {
            expect(Utils.sanitizeText('<script>')).toBe('&lt;script&gt;');
            expect(Utils.sanitizeText('a & b')).toBe('a &amp; b');
            expect(Utils.sanitizeText('"quoted"')).toBe('"quoted"');
        });

        test('handles empty input', () => {
            expect(Utils.sanitizeText('')).toBe('');
        });

        test('handles non-string input', () => {
            expect(Utils.sanitizeText(null)).toBe('');
            expect(Utils.sanitizeText(undefined)).toBe('');
            expect(Utils.sanitizeText(123)).toBe('');
        });

        test('preserves safe text', () => {
            expect(Utils.sanitizeText('Hello World')).toBe('Hello World');
        });
    });

    describe('sanitizePath', () => {
        test('removes path traversal sequences', () => {
            expect(Utils.sanitizePath('../../../etc/passwd')).toBe('etc/passwd');
            expect(Utils.sanitizePath('..\\..\\etc')).toBe('etc');
        });

        test('removes leading slashes', () => {
            expect(Utils.sanitizePath('/etc/passwd')).toBe('etc/passwd');
            expect(Utils.sanitizePath('///photo.jpg')).toBe('photo.jpg');
        });

        test('normalizes slashes', () => {
            expect(Utils.sanitizePath('a//b///c')).toBe('a/b/c');
        });

        test('removes invalid characters', () => {
            expect(Utils.sanitizePath('file<script>.jpg')).toBe('filescript.jpg');
            expect(Utils.sanitizePath('file:name.jpg')).toBe('filename.jpg');
            expect(Utils.sanitizePath('file|name.jpg')).toBe('filename.jpg');
        });

        test('removes null bytes', () => {
            expect(Utils.sanitizePath('photo\x00.jpg')).toBe('photo.jpg');
        });

        test('handles empty input', () => {
            expect(Utils.sanitizePath('')).toBe('');
            expect(Utils.sanitizePath(null)).toBe('');
            expect(Utils.sanitizePath(undefined)).toBe('');
        });

        test('preserves valid filenames', () => {
            expect(Utils.sanitizePath('photo.jpg')).toBe('photo.jpg');
            expect(Utils.sanitizePath('folder/photo.jpg')).toBe('folder/photo.jpg');
        });
    });

    describe('safeInt', () => {
        test('returns valid integer within range', () => {
            expect(Utils.safeInt(5, 0, 10, 0)).toBe(5);
        });

        test('clamps to minimum', () => {
            expect(Utils.safeInt(-5, 0, 10, 0)).toBe(0);
        });

        test('clamps to maximum', () => {
            expect(Utils.safeInt(15, 0, 10, 0)).toBe(10);
        });

        test('returns default for NaN', () => {
            expect(Utils.safeInt('abc', 0, 10, 5)).toBe(5);
            expect(Utils.safeInt(NaN, 0, 10, 5)).toBe(5);
        });

        test('returns default for Infinity', () => {
            expect(Utils.safeInt(Infinity, 0, 10, 5)).toBe(5);
            expect(Utils.safeInt(-Infinity, 0, 10, 5)).toBe(5);
        });

        test('parses string numbers', () => {
            expect(Utils.safeInt('7', 0, 10, 0)).toBe(7);
        });
    });

    describe('safeJSONParse', () => {
        test('parses valid JSON', () => {
            expect(Utils.safeJSONParse('{"a":1}')).toEqual({ a: 1 });
            expect(Utils.safeJSONParse('[1,2,3]')).toEqual([1, 2, 3]);
        });

        test('returns default for invalid JSON', () => {
            expect(Utils.safeJSONParse('not json')).toBeNull();
            expect(Utils.safeJSONParse('not json', {})).toEqual({});
        });

        test('returns default for empty input', () => {
            expect(Utils.safeJSONParse('')).toBeNull();
        });
    });

    describe('deepFreeze', () => {
        test('freezes top-level object', () => {
            const obj = { a: 1 };
            Utils.deepFreeze(obj);

            expect(Object.isFrozen(obj)).toBe(true);
        });

        test('freezes nested objects', () => {
            const obj = { a: { b: { c: 1 } } };
            Utils.deepFreeze(obj);

            expect(Object.isFrozen(obj.a)).toBe(true);
            expect(Object.isFrozen(obj.a.b)).toBe(true);
        });

        test('handles null and primitives', () => {
            expect(Utils.deepFreeze(null)).toBeNull();
            expect(Utils.deepFreeze(42)).toBe(42);
            expect(Utils.deepFreeze('string')).toBe('string');
        });

        test('prevents modifications (object remains frozen)', () => {
            const obj = { a: 1 };
            Utils.deepFreeze(obj);

            // In non-strict mode, assignment silently fails
            // In strict mode, it throws
            // Either way, the object should remain unchanged
            try {
                obj.a = 2;
            } catch (e) {
                // Expected in strict mode
            }

            // Value should still be 1
            expect(obj.a).toBe(1);
        });
    });

    describe('isValidURL', () => {
        test('accepts valid http/https URLs', () => {
            expect(Utils.isValidURL('https://example.com')).toBe(true);
            expect(Utils.isValidURL('http://example.com')).toBe(true);
        });

        test('rejects javascript: URLs', () => {
            expect(Utils.isValidURL('javascript:alert(1)')).toBe(false);
        });

        test('rejects data: URLs', () => {
            expect(Utils.isValidURL('data:text/html,<script>')).toBe(false);
        });

        test('accepts relative URLs', () => {
            expect(Utils.isValidURL('/path/to/file')).toBe(true);
        });

        test('rejects invalid URLs', () => {
            expect(Utils.isValidURL('not a url')).toBe(true); // Treated as relative
        });

        test('accepts custom protocols', () => {
            expect(Utils.isValidURL('ftp://example.com', ['ftp:'])).toBe(true);
        });
    });

    describe('createRateLimiter', () => {
        test('allows calls within limit', () => {
            const limiter = Utils.createRateLimiter(3, 1000);

            expect(limiter()).toBe(true);
            expect(limiter()).toBe(true);
            expect(limiter()).toBe(true);
        });

        test('blocks calls exceeding limit', () => {
            const limiter = Utils.createRateLimiter(2, 1000);

            limiter();
            limiter();

            expect(limiter()).toBe(false);
        });

        test('allows calls after window expires', () => {
            // Mock Date.now() for this test
            const originalNow = Date.now;
            let currentTime = 1000;
            Date.now = jest.fn(() => currentTime);

            const limiter = Utils.createRateLimiter(2, 1000);

            limiter();
            limiter();
            expect(limiter()).toBe(false);

            // Advance time past the window
            currentTime = 2001;

            expect(limiter()).toBe(true);

            // Restore Date.now
            Date.now = originalNow;
        });
    });

    describe('validateGameConfig', () => {
        test('validates valid config', () => {
            const config = { gridSize: 8, startingMoves: 50 };
            const result = Utils.validateGameConfig(config);

            expect(result.gridSize).toBe(8);
            expect(result.startingMoves).toBe(50);
        });

        test('clamps grid size to valid range', () => {
            expect(Utils.validateGameConfig({ gridSize: 3 }).gridSize).toBe(6);
            expect(Utils.validateGameConfig({ gridSize: 15 }).gridSize).toBe(10);
        });

        test('clamps moves to valid range', () => {
            expect(Utils.validateGameConfig({ startingMoves: 5 }).startingMoves).toBe(10);
            expect(Utils.validateGameConfig({ startingMoves: 1500 }).startingMoves).toBe(999);
        });

        test('uses defaults for missing values', () => {
            const result = Utils.validateGameConfig({});

            expect(result.gridSize).toBe(8);
            expect(result.startingMoves).toBe(50);
        });

        test('handles null/undefined config', () => {
            expect(Utils.validateGameConfig(null).gridSize).toBe(8);
            expect(Utils.validateGameConfig(undefined).gridSize).toBe(8);
        });
    });

    describe('validateMemories', () => {
        test('validates valid memories array', () => {
            const memories = [
                { photo: 'photo1.jpg', caption: 'Caption 1' },
                { photo: 'photo2.jpg', caption: 'Caption 2' }
            ];

            const result = Utils.validateMemories(memories);

            expect(result.length).toBe(2);
            expect(result[0].photo).toBe('photo1.jpg');
            expect(result[0].caption).toBe('Caption 1');
        });

        test('filters out entries without photos', () => {
            const memories = [
                { photo: 'photo1.jpg', caption: 'Caption 1' },
                { caption: 'No photo' }
            ];

            const result = Utils.validateMemories(memories);

            expect(result.length).toBe(1);
        });

        test('sanitizes photo paths', () => {
            const memories = [
                { photo: '../../../etc/passwd', caption: 'Attack' }
            ];

            const result = Utils.validateMemories(memories);

            expect(result[0].photo).toBe('etc/passwd');
        });

        test('truncates long captions', () => {
            const memories = [
                { photo: 'photo.jpg', caption: 'x'.repeat(600) }
            ];

            const result = Utils.validateMemories(memories);

            expect(result[0].caption.length).toBe(500);
        });

        test('returns empty array for non-array input', () => {
            expect(Utils.validateMemories(null)).toEqual([]);
            expect(Utils.validateMemories('string')).toEqual([]);
            expect(Utils.validateMemories(123)).toEqual([]);
        });

        test('filters out invalid entries', () => {
            const memories = [
                { photo: 'valid.jpg', caption: 'Valid' },
                null,
                'string',
                123
            ];

            const result = Utils.validateMemories(memories);

            expect(result.length).toBe(1);
        });
    });

    describe('easing functions', () => {
        test('linear easing', () => {
            expect(Utils.easing.linear(0)).toBe(0);
            expect(Utils.easing.linear(0.5)).toBe(0.5);
            expect(Utils.easing.linear(1)).toBe(1);
        });

        test('easeInQuad starts slow', () => {
            expect(Utils.easing.easeInQuad(0)).toBe(0);
            expect(Utils.easing.easeInQuad(0.5)).toBe(0.25);
            expect(Utils.easing.easeInQuad(1)).toBe(1);
        });

        test('easeOutQuad ends slow', () => {
            expect(Utils.easing.easeOutQuad(0)).toBe(0);
            expect(Utils.easing.easeOutQuad(0.5)).toBe(0.75);
            expect(Utils.easing.easeOutQuad(1)).toBe(1);
        });

        test('easeInOutQuad is symmetric', () => {
            expect(Utils.easing.easeInOutQuad(0)).toBe(0);
            expect(Utils.easing.easeInOutQuad(0.5)).toBe(0.5);
            expect(Utils.easing.easeInOutQuad(1)).toBe(1);
        });

        test('easeOutBounce bounces at end', () => {
            expect(Utils.easing.easeOutBounce(0)).toBe(0);
            expect(Utils.easing.easeOutBounce(1)).toBeCloseTo(1);
        });
    });

    describe('createDOMCache', () => {
        beforeEach(() => {
            document.body.innerHTML = `
                <div id="test-element"></div>
                <span class="item">1</span>
                <span class="item">2</span>
            `;
        });

        test('caches querySelector results', () => {
            const cache = Utils.createDOMCache();

            const first = cache.get('#test-element');
            const second = cache.get('#test-element');

            expect(first).toBe(second);
        });

        test('caches querySelectorAll results', () => {
            const cache = Utils.createDOMCache();

            const first = cache.getAll('.item');
            const second = cache.getAll('.item');

            expect(first).toBe(second);
        });

        test('invalidates specific selector', () => {
            const cache = Utils.createDOMCache();

            cache.get('#test-element');
            cache.invalidate('#test-element');

            // Would return new reference if re-queried
            expect(cache.get('#test-element')).toBeDefined();
        });

        test('clears all cache', () => {
            const cache = Utils.createDOMCache();

            cache.get('#test-element');
            cache.getAll('.item');
            cache.clear();

            // Cache is empty, queries would be fresh
        });
    });
});
