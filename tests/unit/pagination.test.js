const { parseInteger, parsePositiveInteger } = require('../../src/utils/pagination');

describe('utils/pagination', () => {
  describe('parseInteger', () => {
    it('parses a valid positive integer string', () => {
      expect(parseInteger('10', 'page')).toBe(10);
    });

    it('parses a valid integer number', () => {
      expect(parseInteger(5, 'limit')).toBe(5);
    });

    it('accepts zero', () => {
      expect(parseInteger(0, 'offset')).toBe(0);
    });

    it('rejects a negative number', () => {
      expect(() => parseInteger(-1, 'page')).toThrow('page không hợp lệ');
    });

    it('rejects a non-integer string', () => {
      expect(() => parseInteger('abc', 'page')).toThrow('page không hợp lệ');
    });

    it('rejects a float', () => {
      expect(() => parseInteger(3.5, 'page')).toThrow('page không hợp lệ');
    });

    it('sets statusCode 400 on error', () => {
      try {
        parseInteger('xyz', 'limit');
        throw new Error('should have thrown');
      } catch (err) {
        expect(err.statusCode).toBe(400);
      }
    });
  });

  describe('parsePositiveInteger', () => {
    it('parses a valid positive integer', () => {
      expect(parsePositiveInteger('1', 'page')).toBe(1);
    });

    it('rejects zero', () => {
      expect(() => parsePositiveInteger(0, 'limit')).toThrow('limit không hợp lệ');
    });

    it('rejects a negative number', () => {
      expect(() => parsePositiveInteger(-3, 'page')).toThrow('page không hợp lệ');
    });

    it('rejects a non-numeric string', () => {
      expect(() => parsePositiveInteger('abc', 'page')).toThrow('page không hợp lệ');
    });

    it('sets statusCode 400 on error', () => {
      try {
        parsePositiveInteger(0, 'limit');
        throw new Error('should have thrown');
      } catch (err) {
        expect(err.statusCode).toBe(400);
      }
    });
  });
});
