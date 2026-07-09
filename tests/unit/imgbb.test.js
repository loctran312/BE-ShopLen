// Unit tests for utils/imgbb — mocks fetch and env
jest.mock('node:crypto', () => jest.requireActual('node:crypto'));

const { isImgBBUrl, normalizeText } = require('../../src/utils/imgbb');

describe('utils/imgbb', () => {
  describe('isImgBBUrl', () => {
    it('returns true for i.ibb.co URLs', () => {
      expect(isImgBBUrl('https://i.ibb.co/abc123/image.jpg')).toBe(true);
    });

    it('returns true for ibb.co URLs', () => {
      expect(isImgBBUrl('https://ibb.co/xyz')).toBe(true);
    });

    it('returns true for api.imgbb.com URLs', () => {
      expect(isImgBBUrl('https://api.imgbb.com/1/upload')).toBe(true);
    });

    it('returns false for non-ImgBB URLs', () => {
      expect(isImgBBUrl('https://example.com/image.jpg')).toBe(false);
    });

    it('returns false for empty input', () => {
      expect(isImgBBUrl('')).toBe(false);
    });
  });

  describe('normalizeText', () => {
    it('trims surrounding whitespace', () => {
      expect(normalizeText('  hello  ')).toBe('hello');
    });

    it('returns empty string for null', () => {
      expect(normalizeText(null)).toBe('');
    });

    it('returns empty string for undefined', () => {
      expect(normalizeText(undefined)).toBe('');
    });

    it('converts numbers to string', () => {
      expect(normalizeText(123)).toBe('123');
    });
  });
});
