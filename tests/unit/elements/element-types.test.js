import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const elementDefinitionsPath = join(__dirname, '../../../node_modules/@nodebug/browser-element-finder/src/element-definitions.json');

function getElementDefinitions() {
  return JSON.parse(readFileSync(elementDefinitionsPath, 'utf8'));
}

function isValidElementType(type) {
  const types = Object.keys(getElementDefinitions());
  return Boolean(type && typeof type === 'string' && types.includes(type));
}

describe('element-types', () => {
  describe('isValidElementType', () => {
    it('should return true for valid types', () => {
      expect(isValidElementType('button')).toBe(true);
      expect(isValidElementType('link')).toBe(true);
      expect(isValidElementType('element')).toBe(true);
    });

    it('should return false for invalid types', () => {
      expect(isValidElementType('invalid')).toBe(false);
      expect(isValidElementType('')).toBe(false);
      expect(isValidElementType(null)).toBe(false);
      expect(isValidElementType(undefined)).toBe(false);
    });
  });

  describe('table element type', () => {
    it('should have table element type defined', () => {
      const definitions = getElementDefinitions();
      expect(definitions.table).toBeDefined();
    });

    it('should match table elements by tag or role', () => {
      const definitions = getElementDefinitions();
      expect(definitions.table).toContain('self::table');
      expect(definitions.table).toContain('@role=\'table\'');
    });
  });

  describe('row element type', () => {
    it('should have row element type defined', () => {
      const definitions = getElementDefinitions();
      expect(definitions.row).toBeDefined();
    });

    it('should match row elements by tag or role', () => {
      const definitions = getElementDefinitions();
      expect(definitions.row).toContain('self::tr');
      expect(definitions.row).toContain('@role=\'row\'');
    });
  });

  describe('column element type', () => {
    it('should have column element type defined', () => {
      const definitions = getElementDefinitions();
      expect(definitions.column).toBeDefined();
    });

    it('should match column elements by tag or role', () => {
      const definitions = getElementDefinitions();
      expect(definitions.column).toContain('self::td');
      expect(definitions.column).toContain('self::th');
      expect(definitions.column).toContain('@role=\'cell\'');
      expect(definitions.column).toContain('@role=\'gridcell\'');
      expect(definitions.column).toContain('@role=\'columnheader\'');
    });
  });
});