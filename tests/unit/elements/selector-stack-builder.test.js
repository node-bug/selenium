import { SelectorStackBuilder }  from '../../../app/elements/selector-stack-builder.js';

describe('SelectorStackBuilder', () => {
  let selectorStackBuilder;
  let mockParent;
  let mockStack;

  beforeEach(() => {
    mockStack = [];
    mockParent = {
      stack: mockStack
    };
    selectorStackBuilder = new SelectorStackBuilder(mockParent);
  });

  test('should create a new SelectorStackBuilder instance', () => {
    expect(selectorStackBuilder).toBeInstanceOf(SelectorStackBuilder);
  });

  test('should initialize with parent reference', () => {
    expect(selectorStackBuilder.parent).toBe(mockParent);
  });

  test('should initialize with parent stack reference', () => {
    expect(selectorStackBuilder.stack).toBe(mockStack);
  });

  describe('exact method', () => {
    test('should set exact flag to true', () => {
      selectorStackBuilder.exact();
      expect(mockStack[0]).toEqual({ exact: true, hidden: false });
    });

    test('should return parent for chaining', () => {
      const result = selectorStackBuilder.exact();
      expect(result).toBe(mockParent);
    });
  });

  describe('hidden method', () => {
    test('should set hidden flag to true', () => {
      selectorStackBuilder.hidden();
      expect(mockStack[0]).toEqual({ exact: false, hidden: true });
    });

    test('should return parent for chaining', () => {
      const result = selectorStackBuilder.hidden();
      expect(result).toBe(mockParent);
    });
  });

  describe('element method', () => {
    test('should add element to stack with correct properties', () => {
      const result = selectorStackBuilder.element('test-id');
      
      expect(mockStack[0]).toEqual({
        type: 'element',
        id: 'test-id',
        exact: false,
        hidden: false,
        matches: [],
        index: false
      });
      
      expect(result).toBe(mockParent);
    });

    test('should handle exact flag when adding element', () => {
      selectorStackBuilder.exact();
      selectorStackBuilder.element('test-id');
      
      expect(mockStack[0]).toEqual({
        type: 'element',
        id: 'test-id',
        exact: true,
        hidden: false,
        matches: [],
        index: false
      });
    });

    test('should handle hidden flag when adding element', () => {
      selectorStackBuilder.hidden();
      selectorStackBuilder.element('test-id');
      
      expect(mockStack[0]).toEqual({
        type: 'element',
        id: 'test-id',
        exact: false,
        hidden: true,
        matches: [],
        index: false
      });
    });

    test('should handle both exact and hidden flags when adding element', () => {
      selectorStackBuilder.exact();
      selectorStackBuilder.hidden();
      selectorStackBuilder.element('test-id');
      
      expect(mockStack[0]).toEqual({
        type: 'element',
        id: 'test-id',
        exact: true,
        hidden: true,
        matches: [],
        index: false
      });
    });

    test('should return parent when element is added', () => {
      const result = selectorStackBuilder.element('test-id');
      expect(result).toBe(mockParent);
    });
  });
});
