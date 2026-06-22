import { vi } from 'vitest';
import { LocatorStrategy } from '../../../app/elements/locator-strategy.js';

describe('LocatorStrategy', () => {
  let locatorStrategy;
  let mockDriver;
  let mockFrame;

  beforeEach(() => {
    // Create a deeply nested mock for the driver
    mockFrame = vi.fn().mockResolvedValue(null);
    const mockDefaultContent = vi.fn().mockResolvedValue(null);

    mockDriver = {
      switchTo: vi.fn().mockReturnValue({
        frame: mockFrame,
        defaultContent: mockDefaultContent
      }),
      findElements: vi.fn().mockResolvedValue([]),
      executeScript: vi.fn()
    };

    locatorStrategy = new LocatorStrategy();
    locatorStrategy.driver = mockDriver;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('_withContext', () => {
    it('should catch NoSuchFrameError and return null', async () => {
      // Configure the mock to throw specifically when called
      mockDriver.switchTo().frame.mockRejectedValue({ name: 'NoSuchFrameError' });
      
      const result = await locatorStrategy._withContext(99, () => 'should not return this');
      expect(result).toBeNull();
    });

    it('should rethrow non-frame errors', async () => {
      mockDriver.switchTo().frame.mockRejectedValue(new Error('Fatal'));
      await expect(locatorStrategy._withContext(1, () => {})).rejects.toThrow('Fatal');
    });
  });

  describe('relativeSearch', () => {
    const relativeElement = { boundingBox: { top: 100, bottom: 200, left: 100, right: 200 } };
    
    it('should filter elements "above" correctly', async () => {
      const item = {
        matches: [
          { boundingBox: { top: 0, bottom: 50, left: 100, right: 200 } }, // Above (bottom 50 < top 100)
          { boundingBox: { top: 150, bottom: 250, left: 100, right: 200 } } // Not above
        ]
      };
      const results = await locatorStrategy.relativeSearch(item, { located: 'above' }, relativeElement);
      expect(results).toHaveLength(1);
      expect(results[0].boundingBox.bottom).toBe(50);
    });

    it('should enforce "exactly" alignment for spatial filters', async () => {
      const rel = { located: 'below', exactly: true };
      const item = {
        matches: [
          { boundingBox: { top: 250, bottom: 350, left: 100, right: 200 } }, // Below and aligned (bottom 350 > 200)
          { boundingBox: { top: 250, bottom: 350, left: 0, right: 50 } }    // Below but not aligned
        ]
      };
      const results = await locatorStrategy.relativeSearch(item, rel, relativeElement);
      expect(results).toHaveLength(1);
    });
  });

  describe('findElements', () => {
    it('should use ElementFinder.findElement for cross-frame scanning', async () => {
      // Mock ElementFinder injection check and results
      const mockElement = { id: 'el1' };
      const mockBoundingBox = { x: 0, y: 0, width: 10, height: 10, midx: 5, midy: 5 };
      
      // Mock sequence:
      // 1. _injectElementFinder check - ElementFinder exists
      // 2. _searchInFrame - inject script in frame (returns undefined, we just need it to not throw)
      // 3. _searchInFrame - ElementFinder results
      // 4. _getChildFrameCount - 0 frames
      mockDriver.executeScript
        .mockResolvedValueOnce(true)  // ElementFinder already exists (from _injectElementFinder)
        .mockResolvedValueOnce(undefined) // Script injection in frame (from _searchInFrame)
        .mockResolvedValueOnce({ 
          elements: [{
            element: mockElement,
            frameIndex: -1,
            tagName: 'div',
            boundingBox: mockBoundingBox
          }]
        }) // ElementFinder results with correct structure
        .mockResolvedValueOnce(0); // No child frames (from _getChildFrameCount)

      const results = await locatorStrategy.findElements({ id: 'test', type: 'element' });
      
      expect(results).toHaveLength(1);
      expect(results[0].id).toBe('el1');
      expect(results[0].frameIndex).toBe(-1);
      expect(results[0].tagName).toBe('div');
      expect(results[0].boundingBox).toEqual(mockBoundingBox);
      expect(results[0].isHidden).toBeUndefined();
      expect(results[0].inViewport).toBeUndefined();
    });

    it('should filter hidden elements when requested', async () => {
      const mockBoundingBox = { x: 0, y: 0, width: 0, height: 0, midx: 0, midy: 0 };
      
      mockDriver.executeScript
        .mockResolvedValueOnce(true) // ElementFinder exists
        .mockResolvedValueOnce(undefined) // Script injection in frame
        .mockResolvedValueOnce({ 
          elements: [{
            element: { id: 'hidden' },
            frameIndex: -1,
            tagName: 'div',
            boundingBox: mockBoundingBox
          }]
        }) // ElementFinder results - zero dimensions
        .mockResolvedValueOnce(0); // No child frames

      const results = await locatorStrategy.findElements({ id: 'test', type: 'element', hidden: true });
      expect(results).toHaveLength(1);
    });
    
    it('should filter visible elements by default', async () => {
      const mockBoundingBox = { x: 0, y: 0, width: 10, height: 10, midx: 5, midy: 5 };
      
      mockDriver.executeScript
        .mockResolvedValueOnce(true) // ElementFinder exists
        .mockResolvedValueOnce(undefined) // Script injection in frame
        .mockResolvedValueOnce({ 
          elements: [{
            element: { id: 'visible' },
            frameIndex: -1,
            tagName: 'div',
            boundingBox: mockBoundingBox
          }]
        }) // ElementFinder results - visible
        .mockResolvedValueOnce(0); // No child frames

      const results = await locatorStrategy.findElements({ id: 'test', type: 'element' });
      expect(results).toHaveLength(1);
    });

    it('should filter visibility-hidden elements by isHidden metadata by default', async () => {
      const mockBoundingBox = { x: 0, y: 0, width: 100, height: 20, midx: 50, midy: 10 };
      
      mockDriver.executeScript
        .mockResolvedValueOnce(true) // ElementFinder exists
        .mockResolvedValueOnce(undefined) // Script injection in frame
        .mockResolvedValueOnce({ 
          elements: [{
            element: { id: 'visibility-hidden' },
            frameIndex: -1,
            tagName: 'a',
            boundingBox: mockBoundingBox,
            isHidden: true
          }]
        }) // ElementFinder results - hidden by visibility metadata
        .mockResolvedValueOnce(0); // No child frames

      const results = await locatorStrategy.findElements({ id: 'Hidden Link', type: 'link' });
      expect(results).toHaveLength(0);
    });

    it('should include visibility-hidden elements when hidden is requested', async () => {
      const mockBoundingBox = { x: 0, y: 0, width: 100, height: 20, midx: 50, midy: 10 };
      
      mockDriver.executeScript
        .mockResolvedValueOnce(true) // ElementFinder exists
        .mockResolvedValueOnce(undefined) // Script injection in frame
        .mockResolvedValueOnce({ 
          elements: [{
            element: { id: 'visibility-hidden' },
            frameIndex: -1,
            tagName: 'a',
            boundingBox: mockBoundingBox,
            isHidden: true
          }]
        }) // ElementFinder results - hidden by visibility metadata
        .mockResolvedValueOnce(0); // No child frames

      const results = await locatorStrategy.findElements({ id: 'Hidden Link', type: 'link', hidden: true });
      expect(results).toHaveLength(1);
      expect(results[0].isHidden).toBe(true);
      expect(results[0].inViewport).toBeUndefined();
    });

    it('should attach ElementFinder metadata to returned elements', async () => {
      const mockBoundingBox = { x: 0, y: 0, width: 100, height: 20, midx: 50, midy: 10 };

      mockDriver.executeScript
        .mockResolvedValueOnce(true)
        .mockResolvedValueOnce(undefined)
        .mockResolvedValueOnce({
          elements: [{
            element: { id: 'metadata' },
            frameIndex: -1,
            tagName: 'button',
            boundingBox: mockBoundingBox,
            isHidden: false,
            inViewport: true
          }]
        })
        .mockResolvedValueOnce(0);

      const results = await locatorStrategy.findElements({ id: 'Metadata Button', type: 'button' });

      expect(results).toHaveLength(1);
      expect(results[0].isHidden).toBe(false);
      expect(results[0].inViewport).toBe(true);
    });

    it('should use findProbableElements for fallback when direct matches not found', async () => {
      const mockBoundingBox = { x: 0, y: 0, width: 10, height: 10, midx: 5, midy: 5 };
      
      // Mock sequence for findElements:
      // 1. ElementFinder exists check (from _injectElementFinder)
      // 2. Main frame search - no direct matches, but findProbableElements returns fallback
      // 3. Get frame count - 0 frames (from _getChildFrameCount)
      mockDriver.executeScript
        .mockResolvedValueOnce(true) // ElementFinder exists (from findElements)
        .mockResolvedValueOnce(undefined) // Script injection in frame
        .mockResolvedValueOnce({ 
          elements: [{
            element: { id: 'checkbox1' }, 
            frameIndex: -1, 
            tagName: 'input', 
            boundingBox: mockBoundingBox 
          }]
        }) // findProbableElements fallback result
        .mockResolvedValueOnce(0); // No child frames

      const results = await locatorStrategy.findElements({ id: 'test', type: 'checkbox' });
      expect(results).toHaveLength(1);
      expect(results[0].id).toBe('checkbox1');
    });
  });

  describe('Stack Resolution (find/findAll)', () => {
    it('should resolve the stack in reverse order and switch to the final frame', async () => {
      const finalElement = { id: 'c1', frameIndex: 5, boundingBox: { midx: 50, midy: 50 } };
      
      const stack = [
        { id: 'child', type: 'element', matches: [finalElement] },
        { id: 'parent', type: 'element', matches: [{ id: 'p1', boundingBox: { left: 0, right: 100, top: 0, bottom: 100 } }] }
      ];

      // Bypass resolveElements to return our controlled stack
      vi.spyOn(locatorStrategy, 'resolveElements').mockResolvedValue(stack);
      
      // Mock relativeSearch to return our final element
      vi.spyOn(locatorStrategy, 'relativeSearch').mockReturnValue([finalElement]);

      const result = await locatorStrategy.find(stack);
      
      expect(result.id).toBe('c1');
      // Verify the final frame switch logic at the end of find()
      expect(mockFrame).toHaveBeenCalledWith(5);
    });

    it('should return all matches in findAll()', async () => {
      const stack = [{ type: 'element', id: 'items', matches: [{ id: 1 }, { id: 2 }] }];
      const results = await locatorStrategy.findAll(stack);
      expect(results).toHaveLength(2);
    });

    it('should return the requested indexed match in findAll()', async () => {
      const stack = [{ type: 'element', id: '', index: 2, matches: [{ id: 1 }, { id: 2 }, { id: 3 }] }];
      const results = await locatorStrategy.findAll(stack);
      expect(results).toEqual([{ id: 2 }]);
    });

    it('should return no matches when requested index is out of range in findAll()', async () => {
      const stack = [{ type: 'element', id: '', index: 5, matches: [{ id: 1 }, { id: 2 }] }];
      const results = await locatorStrategy.findAll(stack);
      expect(results).toEqual([]);
    });
  });

  describe('resolveElements', () => {
    it('should resolve elements for valid types', async () => {
      const stack = [
        { type: 'button', id: 'submit', matches: [], exact: false, hidden: false }
      ];
      
      // Mock findElements to return results
      vi.spyOn(locatorStrategy, 'findElements').mockResolvedValue([{ id: 'btn1' }]);
      
      const result = await locatorStrategy.resolveElements(stack);
      expect(result[0].matches).toHaveLength(1);
    });

    it('should skip items that already have matches', async () => {
      const stack = [
        { type: 'button', id: 'submit', matches: [{ id: 'existing' }], exact: false, hidden: false }
      ];
      
      const result = await locatorStrategy.resolveElements(stack);
      expect(result[0].matches).toEqual([{ id: 'existing' }]);
    });

    it('should skip items with invalid types', async () => {
      const stack = [
        { type: 'invalid-type', id: 'test', matches: [], exact: false, hidden: false }
      ];
      
      const result = await locatorStrategy.resolveElements(stack);
      expect(result[0].matches).toEqual([]);
    });

    it('should handle errors gracefully', async () => {
      const stack = [
        { type: 'button', id: 'submit', matches: [], exact: false, hidden: false }
      ];
      
      vi.spyOn(locatorStrategy, 'findElements').mockRejectedValue(new Error('Find failed'));
      
      const result = await locatorStrategy.resolveElements(stack);
      expect(result[0].matches).toEqual([]);
    });
  });

  describe('findChildElements', () => {
    it('should return empty array when parent is null', async () => {
      const result = await locatorStrategy.findChildElements(null, { type: 'button', id: 'test' });
      expect(result).toEqual([]);
    });

    it('should find child elements within parent frame', async () => {
      const parent = { frameIndex: -1, boundingBox: { top: 0, bottom: 100, left: 0, right: 100 } };
      const mockElement = { id: 'child1' };
      const mockBoundingBox = { top: 10, bottom: 30, left: 10, right: 30 };

      mockDriver.executeScript
        .mockResolvedValueOnce(true) // ElementFinder exists
        .mockResolvedValueOnce({
          elements: [{
            element: mockElement,
            tagName: 'div',
            boundingBox: mockBoundingBox
          }]
        });

      const result = await locatorStrategy.findChildElements(parent, { type: 'button', id: 'test' });
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('child1');
    });
  });
});