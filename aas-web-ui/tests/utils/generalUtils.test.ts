import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { debounce, downloadFile, downloadJson, isNumber, removeNullValues } from '@/utils/generalUtils';

describe('generalUtils.ts', () => {
    describe('isNumber()', () => {
        it('should return true for standard numeric types', () => {
            expect(isNumber('integer')).toBe(true);
            expect(isNumber('int')).toBe(true);
            expect(isNumber('double')).toBe(true);
            expect(isNumber('float')).toBe(true);
            expect(isNumber('long')).toBe(true);
            expect(isNumber('short')).toBe(true);
            expect(isNumber('byte')).toBe(true);
            expect(isNumber('decimal')).toBe(true);
        });

        it('should return true for unsigned numeric types', () => {
            expect(isNumber('unsignedLong')).toBe(true);
            expect(isNumber('unsignedInt')).toBe(true);
            expect(isNumber('unsignedShort')).toBe(true);
            expect(isNumber('unsignedByte')).toBe(true);
        });

        it('should return true for constrained integer types', () => {
            expect(isNumber('nonNegativeInteger')).toBe(true);
            expect(isNumber('positiveInteger')).toBe(true);
            expect(isNumber('nonPositiveInteger')).toBe(true);
            expect(isNumber('negativeInteger')).toBe(true);
        });

        it('should return true for XML Schema prefixed numeric types', () => {
            expect(isNumber('xs:integer')).toBe(true);
            expect(isNumber('xs:double')).toBe(true);
            expect(isNumber('xs:float')).toBe(true);
            expect(isNumber('xs:long')).toBe(true);
        });

        it('should return false for non-numeric types', () => {
            expect(isNumber('string')).toBe(false);
            expect(isNumber('boolean')).toBe(false);
            expect(isNumber('date')).toBe(false);
            expect(isNumber('time')).toBe(false);
            expect(isNumber('anyType')).toBe(false);
        });

        it('should return false for empty or undefined values', () => {
            expect(isNumber('')).toBe(false);
            expect(isNumber(null as any)).toBe(false);
            expect(isNumber(undefined as any)).toBe(false);
        });
    });

    describe('downloadJson()', () => {
        let createElementSpy: any;
        let createObjectURLSpy: any;
        let revokeObjectURLSpy: any;
        let appendChildSpy: any;
        let removeChildSpy: any;
        let clickSpy: any;

        beforeEach(() => {
            // Create a mock anchor element
            const mockAnchor = {
                href: '',
                download: '',
                click: vi.fn(),
            };

            clickSpy = mockAnchor.click;

            // Mock document.createElement
            createElementSpy = vi.spyOn(document, 'createElement').mockReturnValue(mockAnchor as any);

            // Mock URL methods
            createObjectURLSpy = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:mock-url');
            revokeObjectURLSpy = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});

            // Mock DOM methods
            appendChildSpy = vi.spyOn(document.body, 'appendChild').mockImplementation(() => mockAnchor as any);
            removeChildSpy = vi.spyOn(document.body, 'removeChild').mockImplementation(() => mockAnchor as any);
        });

        afterEach(() => {
            vi.restoreAllMocks();
        });

        it('should create and download a JSON file', () => {
            const testObj = { name: 'Test', value: 42 };
            const fileName = 'test.json';

            downloadJson(testObj, fileName);

            // Verify createElement was called
            expect(createElementSpy).toHaveBeenCalledWith('a');

            // Verify URL.createObjectURL was called
            expect(createObjectURLSpy).toHaveBeenCalled();

            // Verify the anchor was configured correctly
            expect(appendChildSpy).toHaveBeenCalled();
            expect(clickSpy).toHaveBeenCalled();
            expect(removeChildSpy).toHaveBeenCalled();

            // Verify cleanup
            expect(revokeObjectURLSpy).toHaveBeenCalledWith('blob:mock-url');
        });

        it('should format JSON with 4-space indentation', () => {
            const testObj = { a: 1, b: { c: 2 } };
            let blobContent = '';

            // Intercept Blob creation to check content
            const originalBlob = global.Blob;
            global.Blob = vi.fn(function (content: any[], options: any) {
                blobContent = content[0];
                return new originalBlob(content, options);
            }) as any;

            downloadJson(testObj, 'test.json');

            expect(blobContent).toBe(JSON.stringify(testObj, null, 4));

            global.Blob = originalBlob;
        });
    });

    describe('downloadFile()', () => {
        let createElementSpy: any;
        let createObjectURLSpy: any;
        let appendChildSpy: any;
        let removeChildSpy: any;
        let clickSpy: any;

        beforeEach(() => {
            const mockAnchor = {
                href: '',
                download: '',
                click: vi.fn(),
            };

            clickSpy = mockAnchor.click;

            createElementSpy = vi.spyOn(document, 'createElement').mockReturnValue(mockAnchor as any);
            createObjectURLSpy = vi.spyOn(window.URL, 'createObjectURL').mockReturnValue('blob:mock-url');
            appendChildSpy = vi.spyOn(document.body, 'appendChild').mockImplementation(() => mockAnchor as any);
            removeChildSpy = vi.spyOn(document.body, 'removeChild').mockImplementation(() => mockAnchor as any);
        });

        afterEach(() => {
            vi.restoreAllMocks();
        });

        it('should create and download a binary file', () => {
            const blob = new Blob(['test content'], { type: 'text/plain' });
            const filename = 'test.txt';

            downloadFile(filename, blob);

            expect(createElementSpy).toHaveBeenCalledWith('a');
            expect(createObjectURLSpy).toHaveBeenCalledWith(blob);
            expect(appendChildSpy).toHaveBeenCalled();
            expect(clickSpy).toHaveBeenCalled();
            expect(removeChildSpy).toHaveBeenCalled();
        });
    });

    describe('removeNullValues()', () => {
        it('should remove null values from a flat object', () => {
            const input = { a: 1, b: null, c: 'test' };
            const expected = { a: 1, c: 'test' };

            expect(removeNullValues(input)).toEqual(expected);
        });

        it('should remove null values from nested objects', () => {
            const input = {
                a: 1,
                b: null,
                c: {
                    d: 2,
                    e: null,
                    f: {
                        g: null,
                        h: 3,
                    },
                },
            };
            const expected = {
                a: 1,
                c: {
                    d: 2,
                    f: {
                        h: 3,
                    },
                },
            };

            expect(removeNullValues(input)).toEqual(expected);
        });

        it('should remove null values from arrays', () => {
            const input = [1, null, 2, null, 3];
            const expected = [1, 2, 3];

            expect(removeNullValues(input)).toEqual(expected);
        });

        it('should handle arrays with objects', () => {
            const input = [
                { a: 1, b: null },
                { c: null, d: 2 },
            ];
            const expected = [{ a: 1 }, { d: 2 }];

            expect(removeNullValues(input)).toEqual(expected);
        });

        it('should preserve undefined, false, 0, and empty string values', () => {
            const input = {
                a: undefined,
                b: false,
                c: 0,
                d: '',
                e: null,
            };
            const expected = {
                a: undefined,
                b: false,
                c: 0,
                d: '',
            };

            expect(removeNullValues(input)).toEqual(expected);
        });

        it('should handle empty objects and arrays', () => {
            expect(removeNullValues({})).toEqual({});
            expect(removeNullValues([])).toEqual([]);
        });

        it('should handle primitive values', () => {
            expect(removeNullValues(42)).toBe(42);
            expect(removeNullValues('test')).toBe('test');
            expect(removeNullValues(true)).toBe(true);
            expect(removeNullValues(null)).toBe(null);
        });
    });

    describe('debounce()', () => {
        beforeEach(() => {
            vi.useFakeTimers();
        });

        afterEach(() => {
            vi.restoreAllMocks();
        });

        it('should delay function execution', () => {
            const fn = vi.fn();
            const debouncedFn = debounce(fn, 300);

            debouncedFn();

            expect(fn).not.toHaveBeenCalled();

            vi.advanceTimersByTime(300);

            expect(fn).toHaveBeenCalledTimes(1);
        });

        it('should only execute once for multiple rapid calls', () => {
            const fn = vi.fn();
            const debouncedFn = debounce(fn, 300);

            debouncedFn();
            debouncedFn();
            debouncedFn();

            vi.advanceTimersByTime(300);

            expect(fn).toHaveBeenCalledTimes(1);
        });

        it('should reset the timer on each call', () => {
            const fn = vi.fn();
            const debouncedFn = debounce(fn, 300);

            debouncedFn();
            vi.advanceTimersByTime(200);

            debouncedFn();
            vi.advanceTimersByTime(200);

            expect(fn).not.toHaveBeenCalled();

            vi.advanceTimersByTime(100);

            expect(fn).toHaveBeenCalledTimes(1);
        });

        it('should pass arguments to the debounced function', () => {
            const fn = vi.fn();
            const debouncedFn = debounce(fn, 300);

            debouncedFn('arg1', 'arg2', 42);

            vi.advanceTimersByTime(300);

            expect(fn).toHaveBeenCalledWith('arg1', 'arg2', 42);
        });

        it('should handle multiple separate executions', () => {
            const fn = vi.fn();
            const debouncedFn = debounce(fn, 300);

            debouncedFn('first');
            vi.advanceTimersByTime(300);

            debouncedFn('second');
            vi.advanceTimersByTime(300);

            expect(fn).toHaveBeenCalledTimes(2);
            expect(fn).toHaveBeenNthCalledWith(1, 'first');
            expect(fn).toHaveBeenNthCalledWith(2, 'second');
        });

        it('should work with different wait times', () => {
            const fn = vi.fn();
            const debouncedFn100 = debounce(fn, 100);
            const debouncedFn500 = debounce(fn, 500);

            debouncedFn100();
            vi.advanceTimersByTime(100);
            expect(fn).toHaveBeenCalledTimes(1);

            debouncedFn500();
            vi.advanceTimersByTime(100);
            expect(fn).toHaveBeenCalledTimes(1);

            vi.advanceTimersByTime(400);
            expect(fn).toHaveBeenCalledTimes(2);
        });
    });
});
