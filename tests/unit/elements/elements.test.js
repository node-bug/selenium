import LocatorStrategy from '../../../app/elements/locator-strategy.js';
import SelectorStackBuilder from '../../../app/elements/selector-stack-builder.js';

describe('Locator Strategy', () => {
  let locatorStrategy;

  beforeEach(() => {
    locatorStrategy = new LocatorStrategy();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('should initialize with correct definitions', () => {
      expect(locatorStrategy.definitions).toBeDefined();
      expect(locatorStrategy.definitions.id).toBe('ById');
      expect(locatorStrategy.definitions.className).toBe('ByClassName');
      expect(locatorStrategy.definitions.tagName).toBe('ByTagName');
      expect(locatorStrategy.definitions.css).toBe('ByCss');
      expect(locatorStrategy.definitions.xpath).toBe('ByXPath');
      expect(locatorStrategy.definitions.linkText).toBe('ByLinkText');
      expect(locatorStrategy.definitions.partialLinkText).toBe('ByPartialLinkText');
      expect(locatorStrategy.definitions.name).toBe('ByName');
    });
  });

  describe('build method', () => {
    it('should build a selector for id', () => {
      const selector = locatorStrategy.build('id', 'test-id');
      expect(selector).toEqual({ using: 'id', value: 'test-id' });
    });

    it('should build a selector for className', () => {
      const selector = locatorStrategy.build('className', 'test-class');
      expect(selector).toEqual({ using: 'className', value: 'test-class' });
    });

    it('should build a selector for tagName', () => {
      const selector = locatorStrategy.build('tagName', 'div');
      expect(selector).toEqual({ using: 'tagName', value: 'div' });
    });

    it('should build a selector for css', () => {
      const selector = locatorStrategy.build('css', '.test-class');
      expect(selector).toEqual({ using: 'css', value: '.test-class' });
    });

    it('should build a selector for xpath', () => {
      const selector = locatorStrategy.build('xpath', '//div[@id="test"]');
      expect(selector).toEqual({ using: 'xpath', value: '//div[@id="test"]' });
    });

    it('should build a selector for linkText', () => {
      const selector = locatorStrategy.build('linkText', 'Test Link');
      expect(selector).toEqual({ using: 'linkText', value: 'Test Link' });
    });

    it('should build a selector for partialLinkText', () => {
      const selector = locatorStrategy.build('partialLinkText', 'Test');
      expect(selector).toEqual({ using: 'partialLinkText', value: 'Test' });
    });

    it('should build a selector for name', () => {
      const selector = locatorStrategy.build('name', 'test-name');
      expect(selector).toEqual({ using: 'name', value: 'test-name' });
    });

    it('should throw error for unknown locator type', () => {
      expect(() => {
        locatorStrategy.build('unknown', 'test-value');
      }).toThrow('Unknown locator type: unknown');
    });
  });
});

describe('Selector Stack Builder', () => {
  let stackBuilder;

  beforeEach(() => {
    stackBuilder = new SelectorStackBuilder();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('should initialize with empty stack', () => {
      expect(stackBuilder.stack).toEqual([]);
    });
  });

  describe('build method', () => {
    it('should build a simple selector', () => {
      const result = stackBuilder.build('id', 'test-id');
      expect(result).toEqual({ using: 'id', value: 'test-id' });
    });

    it('should build a selector with exact flag', () => {
      const result = stackBuilder.build('id', 'test-id', true);
      expect(result).toEqual({ using: 'id', value: 'test-id', exact: true });
    });

    it('should build a selector with hidden flag', () => {
      const result = stackBuilder.build('id', 'test-id', false, true);
      expect(result).toEqual({ using: 'id', value: 'test-id', hidden: true });
    });

    it('should build a selector with relative positioning', () => {
      const result = stackBuilder.build('id', 'test-id', false, false, 'above', 'other-id');
      expect(result).toEqual({ 
        using: 'id', 
        value: 'test-id', 
        relative: { 
          position: 'above', 
          element: 'other-id' 
        } 
      });
    });

    it('should build a selector with logical OR', () => {
      const result = stackBuilder.build('id', 'test-id', false, false, null, null, 'other-id');
      expect(result).toEqual({ using: 'id', value: 'test-id', or: 'other-id' });
    });

    it('should build a selector with index', () => {
      const result = stackBuilder.build('id', 'test-id', false, false, null, null, null, 0);
      expect(result).toEqual({ using: 'id', value: 'test-id', index: 0 });
    });
  });

  describe('stack building methods', () => {
    it('should add to stack with exact method', () => {
      stackBuilder.exact();
      expect(stackBuilder.stack).toEqual([{ exact: true }]);
    });

    it('should add to stack with hidden method', () => {
      stackBuilder.hidden();
      expect(stackBuilder.stack).toEqual([{ hidden: true }]);
    });

    it('should add to stack with above method', () => {
      stackBuilder.above('other-id');
      expect(stackBuilder.stack).toEqual([{ relative: { position: 'above', element: 'other-id' } }]);
    });

    it('should add to stack with below method', () => {
      stackBuilder.below('other-id');
      expect(stackBuilder.stack).toEqual([{ relative: { position: 'below', element: 'other-id' } }]);
    });

    it('should add to stack with or method', () => {
      stackBuilder.or('other-id');
      expect(stackBuilder.stack).toEqual([{ or: 'other-id' }]);
    });

    it('should add to stack with atIndex method', () => {
      stackBuilder.atIndex(2);
      expect(stackBuilder.stack).toEqual([{ index: 2 }]);
    });
  });
});