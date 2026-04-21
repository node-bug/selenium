import { ElementTypes } from '../../../app/elements/element-types.js';

describe('ElementTypes', () => {
  let elementTypes;

  beforeEach(() => {
    elementTypes = new ElementTypes();
  });

  describe('constructor', () => {
    it('should initialize attributes array', () => {
      expect(elementTypes.attributes).toBeDefined();
      expect(Array.isArray(elementTypes.attributes)).toBe(true);
      expect(elementTypes.attributes.length).toBeGreaterThan(0);
    });

    it('should initialize definitions object', () => {
      expect(elementTypes.definitions).toBeDefined();
      expect(typeof elementTypes.definitions).toBe('object');
      expect(Object.keys(elementTypes.definitions).length).toBeGreaterThan(0);
    });

    it('should have expected element types in definitions', () => {
      const expectedTypes = ['link', 'navigation', 'heading', 'button', 'checkbox', 'radio', 'slider', 'combobox', 'textbox', 'file', 'list', 'listitem', 'menu', 'menuitem', 'tab', 'toolbar', 'dialog', 'row', 'column', 'image', 'element'];
      expectedTypes.forEach(type => {
        expect(elementTypes.definitions).toHaveProperty(type);
      });
    });
  });

  describe('transform method', () => {
    it('should handle null values', () => {
      expect(elementTypes.transform(null)).toBe("''");
    });

    it('should handle undefined values', () => {
      expect(elementTypes.transform(undefined)).toBe("''");
    });

    it('should handle values without quotes', () => {
      expect(elementTypes.transform('test')).toBe("'test'");
    });

    it('should escape single quotes properly', () => {
      expect(elementTypes.transform("test'value")).toBe("concat('test',\"'\",'value')");
    });

    it('should handle multiple single quotes', () => {
      expect(elementTypes.transform("test'value'with'more")).toBe("concat('test',\"'\",'value',\"'\",'with',\"'\",'more')");
    });
  });

  describe('buildMatcher method', () => {
    it('should build matcher for exact match', () => {
      const matcher = elementTypes.buildMatcher('test', true);
      expect(matcher).toContain('normalize-space(.)=');
      expect(matcher).not.toContain('true()');
    });

    it('should build matcher for partial match', () => {
      const matcher = elementTypes.buildMatcher('test', false);
      expect(matcher).toContain('contains(normalize-space(.),');
      expect(matcher).not.toContain('true()');
    });

    it('should include all attributes in matcher', () => {
      const matcher = elementTypes.buildMatcher('test');
      elementTypes.attributes.forEach(attr => {
        expect(matcher).toContain(`@${attr}`);
      });
      expect(matcher).toContain('.');
    });
  });

  describe('getSelectors method', () => {
    it('should return object with element types as keys', () => {
      const selectors = elementTypes.getSelectors('test');
      expect(selectors).toBeDefined();
      expect(typeof selectors).toBe('object');
      Object.keys(elementTypes.definitions).forEach(type => {
        expect(selectors).toHaveProperty(type);
      });
    });

    it('should generate valid XPath selectors', () => {
      const selectors = elementTypes.getSelectors('test');
      Object.values(selectors).forEach(xpath => {
        expect(typeof xpath).toBe('string');
        expect(xpath).toContain('//*[(');
        expect(xpath).toContain(') and (');
      });
    });

    it('should generate different selectors for exact vs partial matching', () => {
      const partialSelectors = elementTypes.getSelectors('test', false);
      const exactSelectors = elementTypes.getSelectors('test', true);
      
      // Both should have the same structure but different matchers
      Object.keys(partialSelectors).forEach(type => {
        expect(partialSelectors[type]).toContain('contains(normalize-space(.),');
        expect(exactSelectors[type]).toContain('normalize-space(.)=');
      });
    });
  });
});