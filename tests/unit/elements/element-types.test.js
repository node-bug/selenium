import { ELEMENT_DEFINITIONS, SEARCHABLE_ATTRIBUTES } from '@nodebug/browser-element-finder';

function getValidTypes() {
  return Object.keys(ELEMENT_DEFINITIONS);
}

function isValidElementType(type) {
  return Boolean(type && typeof type === 'string' && Object.hasOwn(ELEMENT_DEFINITIONS, type));
}

function getElementConstraint(type) {
  return ELEMENT_DEFINITIONS[type] || ELEMENT_DEFINITIONS['element'];
}

describe('element-types', () => {
  describe('ELEMENT_DEFINITIONS', () => {
    it('should have expected element types', () => {
      const expectedTypes = ['link', 'navigation', 'heading', 'button', 'checkbox', 'radio', 'slider', 'dropdown', 'textbox', 'file', 'list', 'listitem', 'menu', 'menuitem', 'toolbar', 'dialog', 'table', 'row', 'column', 'image', 'element'];
      expectedTypes.forEach(type => {
        expect(ELEMENT_DEFINITIONS).toHaveProperty(type);
      });
    });

    it('should have string values for all definitions', () => {
      Object.values(ELEMENT_DEFINITIONS).forEach(value => {
        expect(typeof value).toBe('string');
      });
    });
  });

  describe('SEARCHABLE_ATTRIBUTES', () => {
    it('should be an array with expected attributes', () => {
      expect(Array.isArray(SEARCHABLE_ATTRIBUTES)).toBe(true);
      expect(SEARCHABLE_ATTRIBUTES.length).toBeGreaterThan(0);
      expect(SEARCHABLE_ATTRIBUTES).toContain('placeholder');
      expect(SEARCHABLE_ATTRIBUTES).toContain('value');
      expect(SEARCHABLE_ATTRIBUTES).toContain('id');
    });
  });

  describe('getValidTypes', () => {
    it('should return array of type names', () => {
      const types = getValidTypes();
      expect(Array.isArray(types)).toBe(true);
      expect(types.length).toBeGreaterThan(0);
    });

    it('should return all keys from ELEMENT_DEFINITIONS', () => {
      const types = getValidTypes();
      expect(types.sort()).toEqual(Object.keys(ELEMENT_DEFINITIONS).sort());
    });
  });

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

  describe('getElementConstraint', () => {
    it('should return the constraint for valid types', () => {
      expect(getElementConstraint('button')).toBe(ELEMENT_DEFINITIONS.button);
      expect(getElementConstraint('link')).toBe(ELEMENT_DEFINITIONS.link);
    });

    it('should return element constraint for invalid types', () => {
      expect(getElementConstraint('invalid')).toBe(ELEMENT_DEFINITIONS.element);
    });
  });
});