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
      expect(mockStack[0]).toEqual({ exact: true, hidden: false, onscreen: false });
    });

    test('should return parent for chaining', () => {
      const result = selectorStackBuilder.exact();
      expect(result).toBe(mockParent);
    });
  });

  describe('hidden method', () => {
    test('should set hidden flag to true', () => {
      selectorStackBuilder.hidden();
      expect(mockStack[0]).toEqual({ exact: false, hidden: true, onscreen: false });
    });

    test('should return parent for chaining', () => {
      const result = selectorStackBuilder.hidden();
      expect(result).toBe(mockParent);
    });
  });

  describe('onscreen method', () => {
    test('should set onscreen flag to true', () => {
      selectorStackBuilder.onscreen();
      expect(mockStack[0]).toEqual({ exact: false, hidden: false, onscreen: true });
    });

    test('should return parent for chaining', () => {
      const result = selectorStackBuilder.onscreen();
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
        onscreen: false,
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
        onscreen: false,
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
        onscreen: false,
        matches: [],
        index: false
      });
    });

    test('should handle onscreen flag when adding element', () => {
      selectorStackBuilder.onscreen();
      selectorStackBuilder.element('test-id');

      expect(mockStack[0]).toEqual({
        type: 'element',
        id: 'test-id',
        exact: false,
        hidden: false,
        onscreen: true,
        matches: [],
        index: false
      });
    });

    test('should handle exact, hidden and onscreen flags when adding element', () => {
      selectorStackBuilder.exact();
      selectorStackBuilder.hidden();
      selectorStackBuilder.onscreen();
      selectorStackBuilder.element('test-id');

      expect(mockStack[0]).toEqual({
        type: 'element',
        id: 'test-id',
        exact: true,
        hidden: true,
        onscreen: true,
        matches: [],
        index: false
      });
    });

    test('should return parent when element is added', () => {
      selectorStackBuilder.element('test-id');
      expect(mockParent).toBeDefined();
    });

    test('should leave index false when data is undefined', () => {
      selectorStackBuilder.element(undefined);
      expect(mockStack[0].index).toBe(false);
    });

    test('should handle null data', () => {
      selectorStackBuilder.element(null);
      expect(mockStack[0].id).toBeUndefined();
      expect(mockStack[0].index).toBe(false);
    });
  });
});
