import { LocatorStrategy } from '../../app/elements/locator-strategy.js';
import sinon from 'sinon';

describe('LocatorStrategy Unit Tests', () => {
  let locator;
  let mockDriver;
  let sandbox;

  beforeEach(() => {
    sandbox = sinon.createSandbox();
    mockDriver = {
      findElements: sandbox.stub().resolves([]),
      switchTo: sandbox.stub().returns({
        defaultContent: sandbox.stub().resolves(),
        frame: sandbox.stub().resolves()
      }),
      executeScript: sandbox.stub().resolves([])
    };

    locator = new LocatorStrategy();
    locator.driver = mockDriver;
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe('constructor', () => {
    it('should initialize with driver', () => {
      expect(locator.driver).toBe(mockDriver);
    });

    it('should initialize without driver', () => {
      const newLocator = new LocatorStrategy();
      expect(newLocator.driver).toBeUndefined();
    });

    it('should allow setting driver', () => {
      const newDriver = { findElements: sandbox.stub().resolves() };
      locator.driver = newDriver;
      expect(locator.driver).toBe(newDriver);
    });
  });

  describe('#withContext helper', () => {
    it('should switch to default content', async () => {
      const callback = sandbox.stub().resolves('result');
      await locator['#withContext'](-1, callback);
      expect(mockDriver.switchTo().defaultContent.calledOnce).toBe(true);
      expect(callback.calledOnce).toBe(true);
    });

    it('should switch to frame', async () => {
      const callback = sandbox.stub().resolves('result');
      await locator['#withContext'](0, callback);
      expect(mockDriver.switchTo().defaultContent.calledOnce).toBe(true);
      expect(mockDriver.switchTo().frame.calledWith(0)).toBe(true);
      expect(callback.calledOnce).toBe(true);
    });

    it('should handle NoSuchFrameError', async () => {
      const callback = sandbox.stub().resolves('result');
      mockDriver.switchTo().frame = sandbox.stub().rejects(new Error('NoSuchFrameError'));
      const result = await locator['#withContext'](999, callback);
      expect(result).toBeNull();
      expect(callback.calledOnce).toBe(false);
    });

    it('should throw other errors', async () => {
      const callback = sandbox.stub().resolves('result');
      mockDriver.switchTo().frame = sandbox.stub().rejects(new Error('OtherError'));
      await expect(locator['#withContext'](999, callback)).rejects.toThrow('OtherError');
    });
  });

  describe('addQualifiers method', () => {
    it('should add qualifiers to single element', async () => {
      const mockElement = {
        tagName: 'button',
        getBoundingClientRect: sandbox.stub().resolves({
          x: 10, y: 20, width: 100, height: 50,
          top: 20, bottom: 70, left: 10, right: 110
        })
      };
      const result = await locator.addQualifiers(mockElement);
      expect(result.tagName).toBe('button');
      expect(result.rect).toBeDefined();
      expect(result.rect.midx).toBe(60);
      expect(result.rect.midy).toBe(45);
    });

    it('should add qualifiers to array of elements', async () => {
      const mockElements = [
        {
          tagName: 'button',
          getBoundingClientRect: sandbox.stub().resolves({
            x: 10, y: 20, width: 100, height: 50,
            top: 20, bottom: 70, left: 10, right: 110
          })
        },
        {
          tagName: 'input',
          getBoundingClientRect: sandbox.stub().resolves({
            x: 20, y: 30, width: 80, height: 40,
            top: 30, bottom: 70, left: 20, right: 100
          })
        }
      ];
      const result = await locator.addQualifiers(mockElements);
      expect(result).toHaveLength(2);
      expect(result[0].tagName).toBe('button');
      expect(result[1].tagName).toBe('input');
    });

    it('should handle empty array', async () => {
      const result = await locator.addQualifiers([]);
      expect(result).toEqual([]);
    });

    it('should handle null element', async () => {
      const result = await locator.addQualifiers(null);
      expect(result).toEqual([]);
    });

    it('should handle undefined element', async () => {
      const result = await locator.addQualifiers(undefined);
      expect(result).toEqual([]);
    });
  });

  describe('findChildElements method', () => {
    it('should find child elements', async () => {
      const parent = {
        frame: 0,
        findElements: sandbox.stub().resolves([{}])
      };
      const childData = { id: 'child', type: 'element', exact: false };
      const result = await locator.findChildElements(parent, childData);
      expect(result).toBeDefined();
    });

    it('should handle NoSuchFrameError', async () => {
      const parent = {
        frame: 999,
        findElements: sandbox.stub().resolves([{}])
      };
      const childData = { id: 'child', type: 'element', exact: false };
      const result = await locator.findChildElements(parent, childData);
      expect(result).toBeNull();
    });
  });

  describe('relativeSearch method', () => {
    it('should handle above location', async () => {
      const item = { type: 'element', id: 'test', matches: [] };
      const rel = { located: 'above', exactly: false };
      const relativeElement = {
        rect: { top: 100, bottom: 200, left: 50, right: 150, midx: 100, midy: 150 }
      };
      const result = await locator.relativeSearch(item, rel, relativeElement);
      expect(result).toBeDefined();
    });

    it('should handle below location', async () => {
      const item = { type: 'element', id: 'test', matches: [] };
      const rel = { located: 'below', exactly: false };
      const relativeElement = {
        rect: { top: 100, bottom: 200, left: 50, right: 150, midx: 100, midy: 150 }
      };
      const result = await locator.relativeSearch(item, rel, relativeElement);
      expect(result).toBeDefined();
    });

    it('should handle toLeftOf location', async () => {
      const item = { type: 'element', id: 'test', matches: [] };
      const rel = { located: 'toLeftOf', exactly: false };
      const relativeElement = {
        rect: { top: 100, bottom: 200, left: 50, right: 150, midx: 100, midy: 150 }
      };
      const result = await locator.relativeSearch(item, rel, relativeElement);
      expect(result).toBeDefined();
    });

    it('should handle toRightOf location', async () => {
      const item = { type: 'element', id: 'test', matches: [] };
      const rel = { located: 'toRightOf', exactly: false };
      const relativeElement = {
        rect: { top: 100, bottom: 200, left: 50, right: 150, midx: 100, midy: 150 }
      };
      const result = await locator.relativeSearch(item, rel, relativeElement);
      expect(result).toBeDefined();
    });

    it('should handle within location', async () => {
      const item = { type: 'element', id: 'test', matches: [] };
      const rel = { located: 'within', exactly: false };
      const relativeElement = {
        rect: { top: 100, bottom: 200, left: 50, right: 150, midx: 100, midy: 150 }
      };
      const result = await locator.relativeSearch(item, rel, relativeElement);
      expect(result).toBeDefined();
    });

    it('should throw error for invalid location', async () => {
      const item = { type: 'element', id: 'test', matches: [] };
      const rel = { located: 'invalid', exactly: false };
      const relativeElement = {
        rect: { top: 100, bottom: 200, left: 50, right: 150, midx: 100, midy: 150 }
      };
      await expect(locator.relativeSearch(item, rel, relativeElement)).rejects.toThrow('Location');
    });

    it('should handle exactly flag', async () => {
      const item = { type: 'element', id: 'test', matches: [] };
      const rel = { located: 'above', exactly: true };
      const relativeElement = {
        rect: { top: 100, bottom: 200, left: 50, right: 150, midx: 100, midy: 150 }
      };
      const result = await locator.relativeSearch(item, rel, relativeElement);
      expect(result).toBeDefined();
    });
  });

  describe('nearestElement method', () => {
    it('should find nearest element', async () => {
      const originElement = {
        frame: 0,
        getBoundingClientRect: sandbox.stub().resolves({
          left: 100, width: 50, height: 50,
          top: 100, bottom: 150, right: 150
        })
      };
      const mockCandidates = [
        {
          getBoundingClientRect: sandbox.stub().resolves({
            top: 200, width: 50, height: 50,
            bottom: 250, left: 200, right: 250
          })
        },
        {
          getBoundingClientRect: sandbox.stub().resolves({
            top: 300, width: 50, height: 50,
            bottom: 350, left: 300, right: 350
          })
        }
      ];
      mockDriver.findElements = sandbox.stub().resolves(mockCandidates);
      const result = await locator.nearestElement(originElement);
      expect(result).toBeDefined();
    });

    it('should return origin if no candidates', async () => {
      const originElement = { frame: 0 };
      mockDriver.findElements = sandbox.stub().resolves([]);
      const result = await locator.nearestElement(originElement);
      expect(result).toBe(originElement);
    });
  });

  describe('findElements method', () => {
    it('should find elements in default content', async () => {
      const elementData = { id: 'test', type: 'element', exact: false };
      mockDriver.findElements = sandbox.stub().resolves([{}]);
      const result = await locator.findElements(elementData);
      expect(result).toBeDefined();
    });

    it('should find elements in iframe', async () => {
      const elementData = { id: 'test', type: 'element', exact: false };
      mockDriver.findElements = sandbox.stub().resolves([{}]);
      const result = await locator.findElements(elementData);
      expect(result).toBeDefined();
    });

    it('should handle hidden elements', async () => {
      const elementData = { id: 'test', type: 'element', exact: false, hidden: true };
      mockDriver.findElements = sandbox.stub().resolves([{}]);
      const result = await locator.findElements(elementData);
      expect(result).toBeDefined();
    });

    it('should filter out zero-size elements', async () => {
      const elementData = { id: 'test', type: 'element', exact: false };
      mockDriver.findElements = sandbox.stub().resolves([
        { rect: { height: 0, width: 0 } },
        { rect: { height: 100, width: 100 } }
      ]);
      const result = await locator.findElements(elementData);
      expect(result).toHaveLength(1);
    });
  });

  describe('resolveElements method', () => {
    it('should resolve element types', async () => {
      const stack = [
        { type: 'element', id: 'test', matches: [] }
      ];
      mockDriver.findElements = sandbox.stub().resolves([{}]);
      const result = await locator.resolveElements(stack);
      expect(result).toBeDefined();
    });

    it('should handle non-element types', async () => {
      const stack = [
        { type: 'condition', operator: 'or' }
      ];
      const result = await locator.resolveElements(stack);
      expect(result).toBeDefined();
    });

    it('should preserve existing matches', async () => {
      const stack = [
        { type: 'element', id: 'test', matches: [{ id: 'existing' }] }
      ];
      const result = await locator.resolveElements(stack);
      expect(result[0].matches).toBeDefined();
    });
  });

  describe('find method', () => {
    it('should find single element', async () => {
      const stack = [
        { type: 'element', id: 'test', matches: [{ id: 'found' }] }
      ];
      mockDriver.switchTo().defaultContent = sandbox.stub().resolves();
      mockDriver.switchTo().frame = sandbox.stub().resolves();
      const result = await locator.find(stack);
      expect(result).toBeDefined();
    });

    it('should handle location search', async () => {
      const stack = [
        { type: 'element', id: 'test', matches: [] },
        { type: 'location', located: 'above', index: 1 }
      ];
      mockDriver.switchTo().defaultContent = sandbox.stub().resolves();
      mockDriver.switchTo().frame = sandbox.stub().resolves();
      const result = await locator.find(stack);
      expect(result).toBeDefined();
    });

    it('should throw error if element not found', async () => {
      const stack = [
        { type: 'element', id: 'test', matches: [] }
      ];
      await expect(locator.find(stack)).rejects.toThrow('Matching element');
    });
  });

  describe('findAll method', () => {
    it('should find all elements', async () => {
      const stack = [
        { type: 'element', id: 'test', matches: [] }
      ];
      mockDriver.switchTo().defaultContent = sandbox.stub().resolves();
      mockDriver.switchTo().frame = sandbox.stub().resolves();
      const result = await locator.findAll(stack);
      expect(result).toBeDefined();
    });

    it('should handle location search in findAll', async () => {
      const stack = [
        { type: 'element', id: 'test', matches: [] },
        { type: 'location', located: 'above', index: 1 }
      ];
      mockDriver.switchTo().defaultContent = sandbox.stub().resolves();
      mockDriver.switchTo().frame = sandbox.stub().resolves();
      const result = await locator.findAll(stack);
      expect(result).toBeDefined();
    });

    it('should throw error if no elements found', async () => {
      const stack = [
        { type: 'element', id: 'test', matches: [] }
      ];
      await expect(locator.findAll(stack)).rejects.toThrow('0 matching elements');
    });
  });

  describe('edge cases', () => {
    it('should handle empty stack', async () => {
      const result = await locator.resolveElements([]);
      expect(result).toEqual([]);
    });

    it('should handle null stack', async () => {
      const result = await locator.resolveElements(null);
      expect(result).toBeDefined();
    });

    it('should handle undefined stack', async () => {
      const result = await locator.resolveElements(undefined);
      expect(result).toBeDefined();
    });

    it('should handle special characters in element IDs', async () => {
      const stack = [
        { type: 'element', id: 'test@#$%', matches: [] }
      ];
      mockDriver.findElements = sandbox.stub().resolves([{}]);
      const result = await locator.resolveElements(stack);
      expect(result).toBeDefined();
    });

    it('should handle long element IDs', async () => {
      const longId = 'a'.repeat(100);
      const stack = [
        { type: 'element', id: longId, matches: [] }
      ];
      mockDriver.findElements = sandbox.stub().resolves([{}]);
      const result = await locator.resolveElements(stack);
      expect(result).toBeDefined();
    });
  });

  describe('error handling', () => {
    it('should handle errors in addQualifiers', async () => {
      mockDriver.executeScript = sandbox.stub().rejects(new Error('Test Error'));
      const result = await locator.addQualifiers({});
      expect(result).toBeDefined();
    });

    it('should handle errors in findElements', async () => {
      const elementData = { id: 'test', type: 'element', exact: false };
      mockDriver.findElements = sandbox.stub().rejects(new Error('Test Error'));
      const result = await locator.findElements(elementData);
      expect(result).toBeDefined();
    });

    it('should handle errors in find', async () => {
      const stack = [
        { type: 'element', id: 'test', matches: [] }
      ];
      mockDriver.findElements = sandbox.stub().rejects(new Error('Test Error'));
      await expect(locator.find(stack)).rejects.toThrow();
    });

    it('should handle errors in findAll', async () => {
      const stack = [
        { type: 'element', id: 'test', matches: [] }
      ];
      mockDriver.findElements = sandbox.stub().rejects(new Error('Test Error'));
      await expect(locator.findAll(stack)).rejects.toThrow();
    });
  });
});