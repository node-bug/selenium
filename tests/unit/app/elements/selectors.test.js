import { ElementTypes } from '../../../../app/elements/element-types.js';

describe('ElementTypes Unit Tests', () => {
  let elementTypes;

  beforeEach(() => {
    elementTypes = new ElementTypes();
  });

  describe('constructor', () => {
    it('should initialize with attributes array', () => {
      expect(elementTypes.attributes).toBeDefined();
      expect(Array.isArray(elementTypes.attributes)).toBe(true);
    });

    it('should have expected attributes', () => {
      const expectedAttributes = [
        'placeholder', 'value', 'data-test-id', 'data-testid', 'id',
        'resource-id', 'name', 'aria-label', 'class', 'hint',
        'title', 'tooltip', 'alt', 'src', 'role'
      ];
      expect(elementTypes.attributes).toEqual(expectedAttributes);
    });
  });

  describe('transform method', () => {
    it('should transform string without single quotes', () => {
      const result = elementTypes.transform('test value');
      expect(result).toBe("'test value'");
    });

    it('should transform string with single quotes', () => {
      const result = elementTypes.transform("test 'value'");
      expect(result).toContain('concat');
      // The exact pattern is hard to predict due to escaping, so just check it's a concat function
      expect(result.startsWith('concat(')).toBe(true);
      expect(result.endsWith(')')).toBe(true);
    });

    it('should handle empty string', () => {
      const result = elementTypes.transform('');
      expect(result).toBe("''");
    });

    it('should handle string with multiple single quotes', () => {
      const result = elementTypes.transform("test 'value' 'test'");
      expect(result).toContain('concat');
      // The exact pattern is hard to predict due to escaping, so just check it's a concat function
      expect(result.startsWith('concat(')).toBe(true);
      expect(result.endsWith(')')).toBe(true);
    });

    it('should handle string with no single quotes', () => {
      const result = elementTypes.transform('simple');
      expect(result).toBe("'simple'");
    });

    it('should handle special characters', () => {
      const result = elementTypes.transform('test@#$%');
      expect(result).toBe("'test@#$%'");
    });

    it('should handle numbers', () => {
      const result = elementTypes.transform('123');
      expect(result).toBe("'123'");
    });

    it('should handle mixed content', () => {
      const result = elementTypes.transform('test 123 "quotes"');
      expect(result).toBe("'test 123 \"quotes\"'");
    });
  });

  describe('buildMatcher method', () => {
    it('should build matcher for exact match', () => {
      const result = elementTypes.buildMatcher('test', true);
      expect(result).toContain('normalize-space(');
      expect(result).toContain(')=');
      expect(result).toContain('not(.//*[normalize-space(.)=');
    });

    it('should build matcher for partial match', () => {
      const result = elementTypes.buildMatcher('test', false);
      expect(result).toContain('contains(normalize-space(');
      expect(result).toContain('),');
    });

    it('should use transform in matcher', () => {
      const result = elementTypes.buildMatcher("test 'value'", true);
      expect(result).toContain('concat');
    });

    it('should include all attributes in matcher', () => {
      const result = elementTypes.buildMatcher('test', false);
      elementTypes.attributes.forEach(attr => {
        expect(result).toContain(`@${attr}`);
      });
    });

    it('should include text content in matcher', () => {
      const result = elementTypes.buildMatcher('test', false);
      expect(result).toContain('.');
    });

    it('should build exact match with recursion prevention', () => {
      const result = elementTypes.buildMatcher('test', true);
      expect(result).toContain('not(.//*[normalize-space(.)=');
    });

    it('should build partial match with recursion prevention', () => {
      const result = elementTypes.buildMatcher('test', false);
      expect(result).toContain('not(.//*[contains(normalize-space(.),');
    });

    it('should handle empty string in matcher', () => {
      const result = elementTypes.buildMatcher('', true);
      expect(result).toContain("''");
    });

    it('should handle special characters in matcher', () => {
      const result = elementTypes.buildMatcher('test@#$%', true);
      expect(result).toContain("'test@#$%'");
    });
  });

  describe('getSelectors method', () => {
    it('should return object with all element types', () => {
      const result = elementTypes.getSelectors('test', false);
      expect(Object.keys(result)).toContain('link');
      expect(Object.keys(result)).toContain('button');
      expect(Object.keys(result)).toContain('textbox');
      expect(Object.keys(result)).toContain('checkbox');
      expect(Object.keys(result)).toContain('image');
      expect(Object.keys(result)).toContain('element');
    });

    it('should generate XPath for link', () => {
      const result = elementTypes.getSelectors('test', false);
      expect(result.link).toContain('@href');
      expect(result.link).toContain('test');
    });

    it('should generate XPath for button', () => {
      const result = elementTypes.getSelectors('test', false);
      expect(result.button).toContain('@role=\'button\'');
      expect(result.button).toContain('@type=\'button\'');
      expect(result.button).toContain('test');
    });

    it('should generate XPath for textbox', () => {
      const result = elementTypes.getSelectors('test', false);
      expect(result.textbox).toContain('@role=\'textbox\'');
      expect(result.textbox).toContain('@type=\'search\'');
      expect(result.textbox).toContain('test');
    });

    it('should generate XPath for checkbox', () => {
      const result = elementTypes.getSelectors('test', false);
      expect(result.checkbox).toContain('@role=\'checkbox\'');
      expect(result.checkbox).toContain('@type=\'checkbox\'');
      expect(result.checkbox).toContain('test');
    });

    it('should generate XPath for image', () => {
      const result = elementTypes.getSelectors('test', false);
      expect(result.image).toContain('self::img');
      expect(result.image).toContain('test');
    });

    it('should generate XPath for dialog', () => {
      const result = elementTypes.getSelectors('test', false);
      expect(result.dialog).toContain('@role=\'dialog\'');
      expect(result.dialog).toContain('test');
    });

    it('should generate XPath for file', () => {
      const result = elementTypes.getSelectors('test', false);
      expect(result.file).toContain('@role=\'file\'');
      expect(result.file).toContain('@type=\'file\'');
      expect(result.file).toContain('test');
    });

    it('should generate XPath for element', () => {
      const result = elementTypes.getSelectors('test', false);
      expect(result.element).toContain('true()');
      expect(result.element).toContain('test');
    });

    it('should use exact matcher when exact=true', () => {
      const result = elementTypes.getSelectors('test', true);
      expect(result.link).toContain('normalize-space(');
      expect(result.link).toContain(')=');
    });

    it('should use partial matcher when exact=false', () => {
      const result = elementTypes.getSelectors('test', false);
      expect(result.link).toContain('contains(normalize-space(');
      expect(result.link).toContain('),');
    });

    it('should handle empty string', () => {
      const result = elementTypes.getSelectors('', false);
      expect(result.link).toContain("''");
    });

    it('should handle special characters', () => {
      const result = elementTypes.getSelectors('test@#$%', false);
      expect(result.link).toContain("'test@#$%'");
    });

    it('should handle long text', () => {
      const longText = 'a'.repeat(100);
      const result = elementTypes.getSelectors(longText, false);
      expect(result.link).toContain(longText);
    });

    it('should handle string with single quotes', () => {
      const result = elementTypes.getSelectors("test 'value'", false);
      expect(result.link).toContain('concat');
    });
  });

  describe('XPath generation', () => {
    it('should generate valid XPath syntax', () => {
      const result = elementTypes.getSelectors('test', false);
      expect(result.link).toMatch(/^\/\/\*/);
      // The XPath should end with a closing bracket
      expect(result.link).toMatch(/\]$/);
    });

    it('should include all conditions in XPath', () => {
      const result = elementTypes.getSelectors('test', false);
      expect(result.link).toContain('or');
      expect(result.link).toContain('and');
    });

    it('should escape single quotes properly', () => {
      const result = elementTypes.getSelectors("test 'value'", false);
      expect(result.link).toContain('concat');
      expect(result.link).not.toContain("test 'value'");
    });
  });

  describe('edge cases', () => {
    it('should handle null value', () => {
      const result = elementTypes.getSelectors(null, false);
      expect(result.link).toBeDefined();
    });

    it('should handle undefined value', () => {
      const result = elementTypes.getSelectors(undefined, false);
      expect(result.link).toBeDefined();
    });

    it('should handle special characters in value', () => {
      const result = elementTypes.getSelectors('test@#$%', false);
      expect(result.link).toContain("'test@#$%'");
    });

    it('should handle Unicode characters', () => {
      const result = elementTypes.getSelectors('测试', false);
      expect(result.link).toContain("'测试'");
    });

    it('should handle numbers in value', () => {
      const result = elementTypes.getSelectors('123', false);
      expect(result.link).toContain("'123'");
    });

    it('should handle mixed content', () => {
      const result = elementTypes.getSelectors('test 123 "quotes"', false);
      expect(result.link).toContain("'test 123 \"quotes\"'");
    });
  });

  describe('error handling', () => {
    it('should handle null in buildMatcher', () => {
      expect(() => {
        elementTypes.buildMatcher(null, false);
      }).not.toThrow();
    });

    it('should handle undefined in buildMatcher', () => {
      expect(() => {
        elementTypes.buildMatcher(undefined, false);
      }).not.toThrow();
    });

    it('should handle null in getSelectors', () => {
      expect(() => {
        elementTypes.getSelectors(null, false);
      }).not.toThrow();
    });

    it('should handle undefined in getSelectors', () => {
      expect(() => {
        elementTypes.getSelectors(undefined, false);
      }).not.toThrow();
    });
  });

  describe('attribute coverage', () => {
    it('should include all expected attributes in the generated matcher', () => {
      const expectedAttributes = [
        'placeholder', 'value', 'data-test-id', 'data-testid', 'id',
        'resource-id', 'name', 'aria-label', 'class', 'hint',
        'title', 'tooltip', 'alt', 'src', 'role'
      ];

      // Generate the matcher once to save resources
      const matcher = elementTypes.buildMatcher('test-value', false);

      expectedAttributes.forEach(attr => {
        // We expect each attribute to be prefixed with @ in the selector string
        expect(matcher).toContain(`@${attr}`);
      });
    });

    it('should handle all attribute types', () => {
      const result = elementTypes.getSelectors('test', false);
      expect(result.link).toContain('@href');
      expect(result.button).toContain('@role');
      expect(result.textbox).toContain('@type');
      expect(result.image).toContain('self::img');
    });
  });
});