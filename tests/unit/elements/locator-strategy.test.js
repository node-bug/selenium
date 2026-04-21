import { jest } from '@jest/globals';
import { LocatorStrategy } from '../../../app/elements/locator-strategy.js';
import { ElementTypes } from '../../../app/elements/element-types.js';

describe('LocatorStrategy', () => {
  let locatorStrategy;
  let mockDriver;
  let mockElement;

  beforeEach(() => {
    // Create a mock driver
    mockDriver = {
      switchTo: jest.fn(() => ({
        defaultContent: jest.fn().mockResolvedValue(),
        frame: jest.fn().mockResolvedValue()
      })),
      findElements: jest.fn(),
      executeScript: jest.fn()
    };

    // Create a mock element
    mockElement = {
      frame: 0,
      getBoundingClientRect: jest.fn()
    };

    locatorStrategy = new LocatorStrategy();
    locatorStrategy.driver = mockDriver;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('should initialize correctly', () => {
      expect(locatorStrategy).toBeInstanceOf(LocatorStrategy);
      expect(locatorStrategy).toBeInstanceOf(ElementTypes);
    });
  });

  describe('#withContext', () => {
    it('should switch to default content and handle frame switching', async () => {
      const mockCallback = jest.fn().mockResolvedValue('result');
      mockDriver.switchTo().defaultContent.mockResolvedValue();
      mockDriver.switchTo().frame.mockResolvedValue();

      const result = await locatorStrategy['#withContext'](0, mockCallback);

      expect(mockDriver.switchTo().defaultContent).toHaveBeenCalled();
      expect(mockDriver.switchTo().frame).toHaveBeenCalledWith(0);
      expect(mockCallback).toHaveBeenCalled();
      expect(result).toBe('result');
    });

    it('should handle NoSuchFrameError gracefully', async () => {
      const mockCallback = jest.fn();
      mockDriver.switchTo().defaultContent.mockResolvedValue();
      mockDriver.switchTo().frame.mockRejectedValue({ name: 'NoSuchFrameError' });

      const result = await locatorStrategy['#withContext'](0, mockCallback);

      expect(result).toBeNull();
      expect(mockCallback).not.toHaveBeenCalled();
    });

    it('should handle other frame errors', async () => {
      const mockCallback = jest.fn();
      mockDriver.switchTo().defaultContent.mockResolvedValue();
      mockDriver.switchTo().frame.mockRejectedValue(new Error('Some other error'));

      await expect(locatorStrategy['#withContext'](0, mockCallback))
        .rejects.toThrow('Some other error');
    });

    it('should handle negative frame index', async () => {
      const mockCallback = jest.fn().mockResolvedValue('result');
      mockDriver.switchTo().defaultContent.mockResolvedValue();

      const result = await locatorStrategy['#withContext'](-1, mockCallback);

      expect(mockDriver.switchTo().defaultContent).toHaveBeenCalled();
      expect(mockDriver.switchTo().frame).not.toHaveBeenCalled();
      expect(mockCallback).toHaveBeenCalled();
      expect(result).toBe('result');
    });
  });

  describe('findChildElements', () => {
    it('should find child elements and filter by size', async () => {
      const mockParent = { frame: 0, findElements: jest.fn() };
      const mockChildData = { id: 'test', exact: false, type: 'element' };
      const mockElements = [{ frame: 0 }, { frame: 0 }];
      const mockResults = [{ rect: { height: 10, width: 10 } }, { rect: { height: 0, width: 0 } }];

      mockParent.findElements.mockResolvedValue(mockElements);
      locatorStrategy.getSelectors = jest.fn().mockReturnValue({ element: '//xpath' });
      locatorStrategy.addQualifiers = jest.fn().mockResolvedValue(mockResults);

      const result = await locatorStrategy.findChildElements(mockParent, mockChildData);

      expect(mockParent.findElements).toHaveBeenCalled();
      expect(locatorStrategy.addQualifiers).toHaveBeenCalled();
      expect(result).toHaveLength(1);
      expect(result[0].rect.height).toBe(10);
    });
  });

  describe('relativeSearch', () => {
    it('should return matches when no relative element is provided', async () => {
      const item = { matches: [{ rect: { top: 10, bottom: 20 } }] };
      const rel = null;
      const relativeElement = null;

      const result = await locatorStrategy.relativeSearch(item, rel, relativeElement);
      expect(result).toBe(item.matches);
    });

    it('should handle spatial filters correctly', async () => {
      const item = { matches: [{ rect: { top: 10, bottom: 20, left: 10, right: 20, midx: 15, midy: 15 } }] };
      const rel = { located: 'above', exactly: false };
      const relativeElement = { rect: { top: 30, bottom: 40, left: 10, right: 20, midx: 15, midy: 35 } };

      const result = await locatorStrategy.relativeSearch(item, rel, relativeElement);
      expect(result).toHaveLength(1);
    });

    it('should throw error for unsupported location', async () => {
      const item = { matches: [] };
      const rel = { located: 'unsupported' };
      const relativeElement = null;

      await expect(locatorStrategy.relativeSearch(item, rel, relativeElement))
        .rejects.toThrow(ReferenceError);
    });

    it('should handle exactly flag with spatial filters', async () => {
      const item = { matches: [{ rect: { top: 10, bottom: 20, left: 10, right: 20, midx: 15, midy: 15 } }] };
      const rel = { located: 'above', exactly: true };
      const relativeElement = { rect: { top: 30, bottom: 40, left: 10, right: 20, midx: 15, midy: 35 } };

      const result = await locatorStrategy.relativeSearch(item, rel, relativeElement);
      expect(result).toHaveLength(1);
    });

    it('should filter out elements that don\'t match spatial criteria', async () => {
      const item = {
        matches: [
          { rect: { top: 30, bottom: 40, left: 10, right: 20, midx: 15, midy: 35 } },
          { rect: { top: 50, bottom: 60, left: 10, right: 20, midx: 15, midy: 55 } }
        ]
      };
      const rel = { located: 'above', exactly: false };
      const relativeElement = { rect: { top: 30, bottom: 40, left: 10, right: 20, midx: 15, midy: 35 } };

      const result = await locatorStrategy.relativeSearch(item, rel, relativeElement);
      expect(result).toHaveLength(1);
    });
  });

  describe('addQualifiers', () => {
    it('should add rect properties to elements', async () => {
      const mockElements = [mockElement];
      const mockStats = [{
        x: 10, y: 10, width: 20, height: 20,
        top: 10, bottom: 30, left: 10, right: 30,
        tagName: 'div'
      }];

      mockDriver.executeScript.mockResolvedValue(mockStats);

      const result = await locatorStrategy.addQualifiers(mockElements);

      expect(mockDriver.executeScript).toHaveBeenCalled();
      expect(result[0].rect).toBeDefined();
      expect(result[0].rect.midx).toBe(20);
      expect(result[0].rect.midy).toBe(20);
      expect(result[0].tagName).toBe('div');
    });

    it('should add rect properties to multiple elements', async () => {
      const mockElements = [mockElement, mockElement];
      const mockStats = [
        {
          x: 10, y: 10, width: 20, height: 20,
          top: 10, bottom: 30, left: 10, right: 30,
          tagName: 'div'
        },
        {
          x: 30, y: 30, width: 25, height: 25,
          top: 30, bottom: 55, left: 30, right: 55,
          tagName: 'span'
        }
      ];

      mockDriver.executeScript.mockResolvedValue(mockStats);

      const result = await locatorStrategy.addQualifiers(mockElements);

      expect(result).toHaveLength(2);
      expect(result[0].rect.midx).toBe(20);
      expect(result[0].rect.midy).toBe(20);
      expect(result[1].rect.midx).toBe(42.5);
      expect(result[1].rect.midy).toBe(42.5);
      expect(result[0].tagName).toBe('div');
      expect(result[1].tagName).toBe('span');
    });

    it('should handle empty elements array', async () => {
      const result = await locatorStrategy.addQualifiers([]);

      expect(result).toHaveLength(0);
      expect(mockDriver.executeScript).not.toHaveBeenCalled();
    });

    it('should handle null elements', async () => {
      const result = await locatorStrategy.addQualifiers(null);

      expect(result).toHaveLength(0);
      expect(mockDriver.executeScript).not.toHaveBeenCalled();
    });

    it('should preserve original element properties', async () => {
      const mockElements = [{ frame: 0, customProp: 'value' }];
      const mockStats = [{
        x: 10, y: 10, width: 20, height: 20,
        top: 10, bottom: 30, left: 10, right: 30,
        tagName: 'div'
      }];

      mockDriver.executeScript.mockResolvedValue(mockStats);

      const result = await locatorStrategy.addQualifiers(mockElements);

      expect(result[0].customProp).toBe('value');
      expect(result[0].frame).toBe(0);
    });
  });

  describe('nearestElement', () => {
    it('should find the nearest element using Euclidean distance', async () => {
      const mockOriginElement = { frame: 0 };
      const mockCandidates = [{ frame: 0 }, { frame: 1 }];
      const mockDistances = [10, 20];

      mockDriver.findElements.mockResolvedValue(mockCandidates);
      mockDriver.executeScript.mockResolvedValue(mockDistances);
      locatorStrategy.addQualifiers = jest.fn().mockResolvedValue([{ rect: { height: 10, width: 10 } }]);

      const result = await locatorStrategy.nearestElement(mockOriginElement, 'element');

      expect(mockDriver.findElements).toHaveBeenCalled();
      expect(mockDriver.executeScript).toHaveBeenCalled();
      expect(locatorStrategy.addQualifiers).toHaveBeenCalled();
      expect(result).toBeDefined();
    });
  });

  describe('findElements', () => {
    it('should find elements across all frames', async () => {
      const mockElementData = { id: 'test', exact: false, type: 'element' };
      const mockFrames = [{ frame: 0 }, { frame: 1 }];
      const mockElements = [{ frame: 0 }, { frame: 1 }];
      const mockQualified = [{ rect: { height: 10, width: 10 } }];

      mockDriver.findElements.mockResolvedValue(mockFrames);
      mockDriver.findElements.mockResolvedValue(mockElements);
      locatorStrategy.getSelectors = jest.fn().mockReturnValue({ element: '//xpath' });
      locatorStrategy.addQualifiers = jest.fn().mockResolvedValue(mockQualified);

      const result = await locatorStrategy.findElements(mockElementData);

      expect(mockDriver.findElements).toHaveBeenCalledTimes(2);
      expect(locatorStrategy.addQualifiers).toHaveBeenCalled();
      expect(result).toHaveLength(2);
    });
  });

  describe('resolveElements', () => {
    it('should resolve elements in the stack', async () => {
      const mockStack = [
        { type: 'element', id: 'test' }
      ];

      mockDriver.findElements.mockResolvedValue([]);
      locatorStrategy.findElements = jest.fn().mockResolvedValue([{ rect: { height: 10, width: 10 } }]);

      const result = await locatorStrategy.resolveElements(mockStack);

      expect(result).toHaveLength(1);
      expect(locatorStrategy.findElements).toHaveBeenCalled();
    });
  });

  describe('find', () => {
    it('should find elements using the stack', async () => {
      const mockStack = [
        { type: 'element', id: 'test' }
      ];

      mockDriver.findElements.mockResolvedValue([]);
      locatorStrategy.resolveElements = jest.fn().mockResolvedValue(mockStack);
      locatorStrategy.relativeSearch = jest.fn().mockResolvedValue([{ rect: { height: 10, width: 10 } }]);

      const result = await locatorStrategy.find(mockStack);

      expect(locatorStrategy.resolveElements).toHaveBeenCalled();
      expect(locatorStrategy.relativeSearch).toHaveBeenCalled();
      expect(result).toBeDefined();
    });
  });

  describe('findAll', () => {
    it('should find all elements using the stack', async () => {
      const mockStack = [
        { type: 'element', id: 'test' }
      ];

      mockDriver.findElements.mockResolvedValue([]);
      locatorStrategy.resolveElements = jest.fn().mockResolvedValue(mockStack);
      locatorStrategy.relativeSearch = jest.fn().mockResolvedValue([{ rect: { height: 10, width: 10 } }]);

      const result = await locatorStrategy.findAll(mockStack);

      expect(locatorStrategy.resolveElements).toHaveBeenCalled();
      expect(locatorStrategy.relativeSearch).toHaveBeenCalled();
      expect(result).toBeDefined();
    });
  });
});