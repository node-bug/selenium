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
    // Mock getSelectors from ElementTypes
    locatorStrategy.getSelectors = jest.fn().mockReturnValue({ 
      element: '//xpath',
      button: '//button' 
    });
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

  describe('addQualifiers', () => {
    it('should calculate midpoints and lowercase tag names', async () => {
      const mockEl = { id: 'el1' };
      const mockStats = [{
        x: 10, y: 10, width: 100, height: 50,
        top: 10, bottom: 60, left: 10, right: 110,
        tagName: 'BUTTON' 
      }];
      mockDriver.executeScript.mockResolvedValue(mockStats);

      const [result] = await locatorStrategy.addQualifiers([mockEl]);
      
      // If this still fails "BUTTON", check if ElementTypes.js 
      // defines addQualifiers and LocatorStrategy is accidentally using it.
      expect(result.tagName).toBe('button'); 
      expect(result.rect.midx).toBe(60);
    });

    it('should return empty array for null/empty input', async () => {
      expect(await locatorStrategy.addQualifiers(null)).toEqual([]);
      expect(await locatorStrategy.addQualifiers([])).toEqual([]);
    });
  });

  describe('relativeSearch', () => {
    const relativeElement = { rect: { top: 100, bottom: 200, left: 100, right: 200 } };
    
    it('should filter elements "above" correctly', async () => {
      const item = {
        matches: [
          { rect: { bottom: 50 } }, // Above
          { rect: { bottom: 150 } } // Not above
        ]
      };
      const results = await locatorStrategy.relativeSearch(item, { located: 'above' }, relativeElement);
      expect(results).toHaveLength(1);
      expect(results[0].rect.bottom).toBe(50);
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
          { rect: { top: 300, left: 100, right: 200 } }, // Aligned
          { rect: { top: 300, left: 0, right: 50 } }    // Not aligned
        ]
      };
      const results = await locatorStrategy.relativeSearch(item, rel, relativeElement);
      expect(results).toHaveLength(1);
    });
  });

  describe('nearestElement', () => {
    it('should sort by Euclidean distance and return the winner', async () => {
      const origin = { frame: 0 };
      const farEl = { id: 'far' };
      const nearEl = { id: 'near' };
      const candidates = [farEl, nearEl];
      
      mockDriver.findElements.mockResolvedValue(candidates);
      
      // 1. Distance Calculation (Euclidean)
      mockDriver.executeScript.mockResolvedValueOnce([100.5, 10.2]);
      
      // 2. Mock addQualifiers internal behavior for the winner
      // We mock the script that addQualifiers calls internally
      mockDriver.executeScript.mockResolvedValueOnce([{ 
        x: 5, y: 5, width: 10, height: 10, 
        top: 5, bottom: 15, left: 5, right: 15, 
        tagName: 'div' 
      }]);

      const result = await locatorStrategy.nearestElement(origin, 'element');
      
      // nearestElement sorts and takes candidates[1] because 10.2 < 100.5
      expect(result.id).toBe('near');
    });

    it('should return origin if no candidates found', async () => {
      mockDriver.findElements.mockResolvedValue([]);
      const origin = { id: 'origin' };
      const result = await locatorStrategy.nearestElement(origin);
      expect(result).toBe(origin);
    });
  });

  describe('findElements', () => {
    it('should scan default content and iframes', async () => {
      const mockIframe = { id: 'frame1' };
      mockDriver.findElements
        .mockResolvedValueOnce([mockIframe]) // frame scan
        .mockResolvedValueOnce([{ id: 'el1' }]) // default content results
        .mockResolvedValueOnce([{ id: 'el2' }]); // iframe results

      mockDriver.executeScript.mockResolvedValue([{ x: 0, y: 0, width: 10, height: 10, tagName: 'div' }]);

      const results = await locatorStrategy.findElements({ id: 'test', type: 'element' });
      
      // One call for iframes, then one for elements in default, one for elements in iframe
      expect(mockDriver.findElements).toHaveBeenCalledTimes(3);
      expect(results).toHaveLength(2);
      expect(results[0].frame).toBe(-1);
      expect(results[1].frame).toBe(0);
    });

    it('should filter hidden elements when requested', async () => {
      mockDriver.findElements.mockResolvedValueOnce([]).mockResolvedValueOnce([{ id: 'hidden' }]);
      mockDriver.executeScript.mockResolvedValue([{ x: 0, y: 0, width: 0, height: 0, tagName: 'div' }]);

      const results = await locatorStrategy.findElements({ id: 'test', type: 'element', hidden: true });
      expect(results).toHaveLength(1);
    });
    
    it('should tag elements with frame indices', async () => {
      mockDriver.findElements
        .mockResolvedValueOnce([{ id: 'f1' }]) // One iframe found
        .mockResolvedValueOnce([{ id: 'el-def' }]) // Elements in default content
        .mockResolvedValueOnce([{ id: 'el-frame' }]); // Elements in iframe

      mockDriver.executeScript.mockResolvedValue([{ 
        x: 10, y: 10, width: 10, height: 10, tagName: 'div' 
      }]);

      const results = await locatorStrategy.findElements({ id: 'test', type: 'element' });
      
      expect(results[0].frame).toBe(-1); // Default content
      expect(results[1].frame).toBe(0);  // First iframe index
    });
  });

  describe('Stack Resolution (find/findAll)', () => {
    it('should resolve the stack in reverse order and switch to the final frame', async () => {
      const finalElement = { id: 'c1', frame: 5, rect: { midx: 50, midy: 50 } };
      
      const stack = [
        { id: 'child', type: 'element', matches: [finalElement] },
        { id: 'parent', type: 'element', matches: [{ id: 'p1', rect: { left: 0, right: 100, top: 0, bottom: 100 } }] }
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