// import { LocatorStrategy } from '../../../../app/elements/locator-strategy.js';
// import sinon from 'sinon';

// describe('LocatorStrategy', () => {
//   let locator;
//   let mockDriver;
//   let sandbox;

//   beforeEach(() => {
//     sandbox = sinon.createSandbox();
//     mockDriver = {
//       findElements: sandbox.stub().resolves([]),
//       switchTo: sandbox.stub().returns({
//         defaultContent: sandbox.stub().resolves(),
//         frame: sandbox.stub().resolves()
//       }),
//       executeScript: sandbox.stub().resolves([])
//     };

//     locator = new LocatorStrategy();
//     locator.driver = mockDriver;
//   });

//   afterEach(() => {
//     sandbox.restore();
//   });

//   describe('relativeSearch', () => {
//     it('should return item.matches when no relative location is provided', async () => {
//       const item = { matches: ['element1', 'element2'] };
//       const rel = null;
//       const relativeElement = null;
      
//       const result = await locator.relativeSearch(item, rel, relativeElement);
//       expect(result).toEqual(['element1', 'element2']);
//     });

//     it('should handle above location filter', async () => {
//       const item = { matches: [{ rect: { bottom: 100 } }] };
//       const rel = { located: 'above' };
//       const relativeElement = { rect: { top: 150 } };
      
//       const result = await locator.relativeSearch(item, rel, relativeElement);
//       expect(result).toEqual([]);
//     });

//     it('should handle below location filter', async () => {
//       const item = { matches: [{ rect: { top: 150 } }] };
//       const rel = { located: 'below' };
//       const relativeElement = { rect: { bottom: 100 } };
      
//       const result = await locator.relativeSearch(item, rel, relativeElement);
//       expect(result).toEqual([]);
//     });

//     it('should handle toLeftOf location filter', async () => {
//       const item = { matches: [{ rect: { right: 100 } }] };
//       const rel = { located: 'toLeftOf' };
//       const relativeElement = { rect: { left: 150 } };
      
//       const result = await locator.relativeSearch(item, rel, relativeElement);
//       expect(result).toEqual([]);
//     });

//     it('should handle toRightOf location filter', async () => {
//       const item = { matches: [{ rect: { left: 150 } }] };
//       const rel = { located: 'toRightOf' };
//       const relativeElement = { rect: { right: 100 } };
      
//       const result = await locator.relativeSearch(item, rel, relativeElement);
//       expect(result).toEqual([]);
//     });

//     it('should handle within location filter', async () => {
//       const item = { matches: [{ rect: { top: 100, bottom: 200, left: 100, right: 200 } }] };
//       const rel = { located: 'within' };
//       const relativeElement = { rect: { top: 120, bottom: 180, left: 120, right: 180 } };
      
//       const result = await locator.relativeSearch(item, rel, relativeElement);
//       expect(result).toEqual([]);
//     });

//     it('should throw ReferenceError for unsupported location', async () => {
//       const item = { matches: [] };
//       const rel = { located: 'unsupported' };
//       const relativeElement = null;
      
//       await expect(locator.relativeSearch(item, rel, relativeElement)).rejects.toThrow(ReferenceError);
//     });
//   });

//   describe('addQualifiers', () => {
//     it('should add rect and tagName properties to elements', async () => {
//       const mockElement = { id: 'test' };
//       const mockStats = [{
//         x: 10, y: 20, width: 100, height: 50,
//         top: 20, bottom: 70, left: 10, right: 110,
//         tagName: 'div'
//       }];
      
//       mockDriver.executeScript.resolves(mockStats);
      
//       const result = await locator.addQualifiers(mockElement);
      
//       expect(mockDriver.executeScript.calledOnce).toBe(true);
//       expect(result.rect).toBeDefined();
//       expect(result.tagName).toBe('div');
//     });

//     it('should handle array of elements', async () => {
//       const mockElements = [{ id: 'test1' }, { id: 'test2' }];
//       const mockStats = [
//         { x: 10, y: 20, width: 100, height: 50, top: 20, bottom: 70, left: 10, right: 110, tagName: 'div' },
//         { x: 15, y: 25, width: 110, height: 60, top: 25, bottom: 85, left: 15, right: 125, tagName: 'span' }
//       ];
      
//       mockDriver.executeScript.resolves(mockStats);
      
//       const result = await locator.addQualifiers(mockElements);
      
//       expect(mockDriver.executeScript.calledOnce).toBe(true);
//       expect(result[0].rect).toBeDefined();
//       expect(result[0].tagName).toBe('div');
//       expect(result[1].rect).toBeDefined();
//       expect(result[1].tagName).toBe('span');
//     });

//     it('should return empty array for empty input', async () => {
//       const result = await locator.addQualifiers([]);
//       expect(result).toEqual([]);
//     });
//   });

//   describe('nearestElement', () => {
//     it('should find the nearest element using Euclidean distance', async () => {
//       const originElement = { id: 'origin' };
//       const mockCandidates = [{ id: 'candidate1' }, { id: 'candidate2' }];
//       const mockDistances = [10, 20];
      
//       mockDriver.findElements.resolves(mockCandidates);
//       mockDriver.executeScript.resolves(mockDistances);
      
//       const result = await locator.nearestElement(originElement);
      
//       expect(mockDriver.findElements.calledOnce).toBe(true);
//       expect(mockDriver.executeScript.calledOnce).toBe(true);
//       expect(result).toBeDefined();
//     });

//     it('should return origin element when no candidates found', async () => {
//       const originElement = { id: 'origin' };
      
//       mockDriver.findElements.resolves([]);
      
//       const result = await locator.nearestElement(originElement);
      
//       expect(result).toBe(originElement);
//     });
//   });

//   describe('findElements', () => {
//     it('should find elements across all frames', async () => {
//       const elementData = { id: 'test', type: 'element', exact: false };
//       const mockFrames = [{ id: 'frame1' }, { id: 'frame2' }];
//       const mockElements = [{ id: 'element1' }];
      
//       mockDriver.findElements.onCall(0).resolves(mockFrames);
//       mockDriver.findElements.onCall(1).resolves(mockElements);
//       mockDriver.switchTo().defaultContent.resolves();
//       mockDriver.switchTo().frame.resolves();
      
//       const result = await locator.findElements(elementData);
      
//       expect(mockDriver.findElements.calledTwice).toBe(true);
//       expect(result).toEqual([]);
//     });

//     it('should filter out hidden elements when hidden flag is true', async () => {
//       const elementData = { id: 'test', type: 'element', exact: false, hidden: true };
//       const mockElements = [{ id: 'element1' }];
      
//       mockDriver.findElements.resolves(mockElements);
//       mockDriver.switchTo().defaultContent.resolves();
//       mockDriver.switchTo().frame.resolves();
      
//       const result = await locator.findElements(elementData);
      
//       expect(mockDriver.findElements.calledOnce).toBe(true);
//       expect(result).toEqual([]);
//     });
//   });

//   describe('resolveElements', () => {
//     it('should resolve elements in the stack', async () => {
//       const stack = [
//         { type: 'element', id: 'test' },
//         { type: 'button', id: 'button' }
//       ];
      
//       mockDriver.findElements.resolves([]);
//       mockDriver.switchTo().defaultContent.resolves();
//       mockDriver.switchTo().frame.resolves();
      
//       const result = await locator.resolveElements(stack);
      
//       expect(result).toEqual([]);
//     });

//     it('should not resolve elements that already have matches', async () => {
//       const stack = [
//         { type: 'element', id: 'test', matches: ['existing'] }
//       ];
      
//       const result = await locator.resolveElements(stack);
      
//       expect(result).toEqual(stack);
//     });
//   });

//   describe('find', () => {
//     it('should find elements using the stack', async () => {
//       const stack = [
//         { type: 'element', id: 'test' }
//       ];
      
//       mockDriver.findElements.resolves([]);
//       mockDriver.switchTo().defaultContent.resolves();
//       mockDriver.switchTo().frame.resolves();
      
//       const result = await locator.find(stack);
      
//       expect(result).toBeDefined();
//     });

//     it('should throw ReferenceError when element is not found', async () => {
//       const stack = [
//         { type: 'element', id: 'test' }
//       ];
      
//       mockDriver.findElements.resolves([]);
//       mockDriver.switchTo().defaultContent.resolves();
//       mockDriver.switchTo().frame.resolves();
      
//       await expect(locator.find(stack)).rejects.toThrow(ReferenceError);
//     });
//   });

//   describe('findAll', () => {
//     it('should resolve the entire stack and return all matching elements', async () => {
//       const stack = [
//         { type: 'element', id: 'test' }
//       ];
      
//       mockDriver.findElements.resolves([]);
//       mockDriver.switchTo().defaultContent.resolves();
//       mockDriver.switchTo().frame.resolves();
      
//       const result = await locator.findAll(stack);
      
//       expect(result).toEqual([]);
//     });

//     it('should handle location-based searches in findAll', async () => {
//       const stack = [
//         { type: 'location', located: 'above' },
//         { type: 'element', id: 'target' }
//       ];
      
//       mockDriver.findElements.resolves([]);
//       mockDriver.switchTo().defaultContent.resolves();
//       mockDriver.switchTo().frame.resolves();
      
//       const result = await locator.findAll(stack);
      
//       expect(result).toEqual([]);
//     });

//     it('should throw ReferenceError when no elements are found in findAll', async () => {
//       const stack = [
//         { type: 'element', id: 'test' }
//       ];
      
//       mockDriver.findElements.resolves([]);
//       mockDriver.switchTo().defaultContent.resolves();
//       mockDriver.switchTo().frame.resolves();
      
//       await expect(locator.findAll(stack)).rejects.toThrow(ReferenceError);
//     });
//   });
// });

//   describe('addQualifiers', () => {
//     it('should add rect and tagName properties to elements', async () => {
//       const mockElement = { id: 'test' };
//       const mockStats = [{
//         x: 10, y: 20, width: 100, height: 50,
//         top: 20, bottom: 70, left: 10, right: 110,
//         tagName: 'div'
//       }];
      
//       mockDriver.executeScript.resolves(mockStats);
      
//       const result = await locator.addQualifiers(mockElement);
      
//       expect(mockDriver.executeScript.calledOnce).toBe(true);
//       expect(result.rect).toBeDefined();
//       expect(result.tagName).toBe('div');
//     });

//     it('should handle array of elements', async () => {
//       const mockElements = [{ id: 'test1' }, { id: 'test2' }];
//       const mockStats = [
//         { x: 10, y: 20, width: 100, height: 50, top: 20, bottom: 70, left: 10, right: 110, tagName: 'div' },
//         { x: 15, y: 25, width: 110, height: 60, top: 25, bottom: 85, left: 15, right: 125, tagName: 'span' }
//       ];
      
//       mockDriver.executeScript.resolves(mockStats);
      
//       const result = await locator.addQualifiers(mockElements);
      
//       expect(mockDriver.executeScript.calledOnce).toBe(true);
//       expect(result[0].rect).toBeDefined();
//       expect(result[0].tagName).toBe('div');
//       expect(result[1].rect).toBeDefined();
//       expect(result[1].tagName).toBe('span');
//     });

//     it('should return empty array for empty input', async () => {
//       const result = await locator.addQualifiers([]);
//       expect(result).toEqual([]);
//     });
//   });

//   describe('nearestElement', () => {
//     it('should find the nearest element using Euclidean distance', async () => {
//       const originElement = { id: 'origin' };
//       const mockCandidates = [{ id: 'candidate1' }, { id: 'candidate2' }];
//       const mockDistances = [10, 20];
      
//       mockDriver.findElements.resolves(mockCandidates);
//       mockDriver.executeScript.resolves(mockDistances);
      
//       const result = await locator.nearestElement(originElement);
      
//       expect(mockDriver.findElements.calledOnce).toBe(true);
//       expect(mockDriver.executeScript.calledOnce).toBe(true);
//       expect(result).toBeDefined();
//     });

//     it('should return origin element when no candidates found', async () => {
//       const originElement = { id: 'origin' };
      
//       mockDriver.findElements.resolves([]);
      
//       const result = await locator.nearestElement(originElement);
      
//       expect(result).toBe(originElement);
//     });
//   });

//   describe('findElements', () => {
//     it('should find elements across all frames', async () => {
//       const elementData = { id: 'test', type: 'element', exact: false };
//       const mockFrames = [{ id: 'frame1' }, { id: 'frame2' }];
//       const mockElements = [{ id: 'element1' }];
      
//       mockDriver.findElements.onCall(0).resolves(mockFrames);
//       mockDriver.findElements.onCall(1).resolves(mockElements);
//       mockDriver.switchTo().defaultContent.resolves();
//       mockDriver.switchTo().frame.resolves();
      
//       const result = await locator.findElements(elementData);
      
//       expect(mockDriver.findElements.calledTwice).toBe(true);
//       expect(result).toEqual([]);
//     });

//     it('should filter out hidden elements when hidden flag is true', async () => {
//       const elementData = { id: 'test', type: 'element', exact: false, hidden: true };
//       const mockElements = [{ id: 'element1' }];
      
//       mockDriver.findElements.resolves(mockElements);
//       mockDriver.switchTo().defaultContent.resolves();
//       mockDriver.switchTo().frame.resolves();
      
//       const result = await locator.findElements(elementData);
      
//       expect(mockDriver.findElements.calledOnce).toBe(true);
//       expect(result).toEqual([]);
//     });
//   });

//   describe('resolveElements', () => {
//     it('should resolve elements in the stack', async () => {
//       const stack = [
//         { type: 'element', id: 'test' },
//         { type: 'button', id: 'button' }
//       ];
      
//       mockDriver.findElements.resolves([]);
//       mockDriver.switchTo().defaultContent.resolves();
//       mockDriver.switchTo().frame.resolves();
      
//       const result = await locator.resolveElements(stack);
      
//       expect(result).toEqual([]);
//     });

//     it('should not resolve elements that already have matches', async () => {
//       const stack = [
//         { type: 'element', id: 'test', matches: ['existing'] }
//       ];
      
//       const result = await locator.resolveElements(stack);
      
//       expect(result).toEqual(stack);
//     });
//   });

//   describe('find', () => {
//     it('should find elements using the stack', async () => {
//       const stack = [
//         { type: 'element', id: 'test' }
//       ];
      
//       mockDriver.findElements.resolves([]);
//       mockDriver.switchTo().defaultContent.resolves();
//       mockDriver.switchTo().frame.resolves();
      
//       const result = await locator.find(stack);
      
//       expect(result).toBeDefined();
//     });

//     it('should throw ReferenceError when element is not found', async () => {
//       const stack = [
//         { type: 'element', id: 'test' }
//       ];
      
//       mockDriver.findElements.resolves([]);
//       mockDriver.switchTo().defaultContent.resolves();
//       mockDriver.switchTo().frame.resolves();
      
//       await expect(locator.find(stack)).rejects.toThrow(ReferenceError);
//     });
//   });

//   describe('findAll', () => {
//     it('should resolve the entire stack and return all matching elements', async () => {
//       const stack = [
//         { type: 'element', id: 'test' }
//       ];
      
//       mockDriver.findElements.resolves([]);
//       mockDriver.switchTo().defaultContent.resolves();
//       mockDriver.switchTo().frame.resolves();
      
//       const result = await locator.findAll(stack);
      
//       expect(result).toEqual([]);
//     });

//     it('should handle location-based searches in findAll', async () => {
//       const stack = [
//         { type: 'location', located: 'above' },
//         { type: 'element', id: 'target' }
//       ];
      
//       mockDriver.findElements.resolves([]);
//       mockDriver.switchTo().defaultContent.resolves();
//       mockDriver.switchTo().frame.resolves();
      
//       const result = await locator.findAll(stack);
      
//       expect(result).toEqual([]);
//     });

//     it('should throw ReferenceError when no elements are found in findAll', async () => {
//       const stack = [
//         { type: 'element', id: 'test' }
//       ];
      
//       mockDriver.findElements.resolves([]);
//       mockDriver.switchTo().defaultContent.resolves();
//       mockDriver.switchTo().frame.resolves();
      
//       await expect(locator.findAll(stack)).rejects.toThrow(ReferenceError);
//     });
//   });
// });