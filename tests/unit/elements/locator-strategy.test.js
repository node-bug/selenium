import { jest } from '@jest/globals';
import { LocatorStrategy } from '../../../app/elements/locator-strategy.js';

describe('LocatorStrategy', () => {
  let locatorStrategy;
  let mockDriver;
  let mockFrame;

  beforeEach(() => {
    // Create a deeply nested mock for the driver
    mockFrame = jest.fn().mockResolvedValue(null);
    const mockDefaultContent = jest.fn().mockResolvedValue(null);

    mockDriver = {
      switchTo: jest.fn().mockReturnValue({
        frame: mockFrame,
        defaultContent: mockDefaultContent
      }),
      findElements: jest.fn().mockResolvedValue([]),
      executeScript: jest.fn()
    };

    locatorStrategy = new LocatorStrategy();
    locatorStrategy.driver = mockDriver;
  });

  afterEach(() => {
    jest.clearAllMocks();
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

    // it('should handle "within" by searching children', async () => {
    //   const parent = { 
    //     frame: 0, 
    //     rect: { left: 0, right: 100, top: 0, bottom: 100 },
    //     findElements: jest.fn().mockResolvedValue([{ id: 'child-web-el' }])
    //   };
      
    //   const item = { type: 'element', matches: [] };
      
    //   // Mock the child's stats so midx (50) and midy (50) fall INSIDE parent
    //   mockDriver.executeScript.mockResolvedValue([{ 
    //     x: 40, y: 40, width: 20, height: 20, 
    // top: 40, bottom: 60, left: 40, right: 60, 
    //     tagName: 'div' 
    //   }]);

    //   const results = await locatorStrategy.relativeSearch(item, { located: 'within' }, parent);
      
    //   expect(results).toHaveLength(1);
    //   expect(results[0].id).toBe('child-web-el');
    // });

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

    it('should use spatial fallback when element type not found', async () => {
      const mockBoundingBox = { x: 0, y: 0, width: 10, height: 10, midx: 5, midy: 5 };
      
      // Mock sequence for findElements:
      // 1. ElementFinder exists check (from _injectElementFinder)
      // 2. Main frame search - no matches (from _searchInFrame)
      // 3. Get frame count - 0 frames (from _getChildFrameCount)
      // 4. Closest element script result (from _findClosestInFrame)
      mockDriver.executeScript
        .mockResolvedValueOnce(true) // ElementFinder exists (from findElements)
        .mockResolvedValueOnce(undefined) // Script injection in frame
        .mockResolvedValueOnce({ elements: [] }) // No direct matches in main frame
        .mockResolvedValueOnce(0) // No child frames
        .mockResolvedValueOnce({ 
          element: { id: 'checkbox1' }, 
          frameIndex: -1, 
          tagName: 'input', 
          boundingBox: mockBoundingBox 
        }); // Spatial fallback result

      const results = await locatorStrategy.findElements({ id: 'test', type: 'checkbox' });
      expect(results).toHaveLength(1);
      expect(results[0].id).toBe('checkbox1');
    });
  });

  describe('_findClosestElementOfType', () => {
    it('should return empty when no generic element found', async () => {
      // Mock sequence:
      // 1. Script result - no generic elements found (returns null)
      mockDriver.executeScript
        .mockResolvedValueOnce(null); // No generic elements found (script returns null)
      
      const results = await locatorStrategy._findClosestElementOfType({ id: 'test', type: 'checkbox' });
      expect(results.elements).toHaveLength(0);
    });

    it('should return empty when no target type elements found', async () => {
      // Mock sequence:
      // 1. Script result - no target type elements found (returns null)
      mockDriver.executeScript
        .mockResolvedValueOnce(null); // No target type elements found (script returns null)
      
      const results = await locatorStrategy._findClosestElementOfType({ id: 'test', type: 'checkbox' });
      expect(results.elements).toHaveLength(0);
    });

    it('should find closest element within threshold', async () => {
      const closeBoundingBox = { top: 130, bottom: 150, left: 100, right: 150 };
      
      // Mock sequence:
      // 1. Script result - found closest element
      mockDriver.executeScript
        .mockResolvedValueOnce({ 
          element: { id: 'close' }, 
          frameIndex: -1, 
          tagName: 'input', 
          boundingBox: closeBoundingBox 
        });
      
      const results = await locatorStrategy._findClosestElementOfType({ id: 'test', type: 'checkbox' });
      expect(results.elements).toHaveLength(1);
      expect(results.elements[0].element.id).toBe('close');
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
      jest.spyOn(locatorStrategy, 'resolveElements').mockResolvedValue(stack);
      
      // Mock relativeSearch to return our final element
      jest.spyOn(locatorStrategy, 'relativeSearch').mockReturnValue([finalElement]);

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
  });
});