import { relativeSearch } from '../../../app/elements/spatial-selection.js';

describe('spatial-selection', () => {
  describe('relativeSearch', () => {
    it('should throw ReferenceError for invalid location', async () => {
      const item = { matches: [] };
      await expect(relativeSearch(item, { located: 'invalid' }, {}))
        .rejects.toThrow(ReferenceError);
    });

    it('should return all matches when no spatial constraint', async () => {
      const item = { matches: [{ id: 1 }, { id: 2 }] };
      const result = await relativeSearch(item, null, null);
      expect(result).toEqual([{ id: 1 }, { id: 2 }]);
    });

    it('should return all matches when no reference element', async () => {
      const item = { matches: [{ id: 1 }, { id: 2 }] };
      const result = await relativeSearch(item, { located: 'above' }, null);
      expect(result).toEqual([{ id: 1 }, { id: 2 }]);
    });

    it('should filter matches by spatial relation', async () => {
      const item = {
        matches: [
          { boundingBox: { top: 0, bottom: 50, left: 100, right: 200 } },
          { boundingBox: { top: 150, bottom: 250, left: 100, right: 200 } }
        ]
      };
      const reference = { boundingBox: { top: 100, bottom: 200, left: 100, right: 200 } };
      const result = await relativeSearch(item, { located: 'above' }, reference);
      expect(result).toHaveLength(1);
    });

    it('should handle within with array of references', async () => {
      const item = {
        matches: [
          { boundingBox: { top: 10, bottom: 30, left: 10, right: 30, midx: 20, midy: 20 } },
          { boundingBox: { top: 110, bottom: 130, left: 110, right: 130, midx: 120, midy: 120 } }
        ]
      };
      const references = [
        { boundingBox: { top: 0, bottom: 100, left: 0, right: 100, midx: 50, midy: 50 } },
        { boundingBox: { top: 100, bottom: 200, left: 100, right: 200, midx: 150, midy: 150 } }
      ];
      const result = await relativeSearch(item, { located: 'within' }, references);
      expect(result).toHaveLength(2);
    });

    it('should handle within with element type and find child elements', async () => {
      const item = { type: 'element', matches: [], id: 'test' };
      const parent = { frameIndex: -1, boundingBox: { top: 0, bottom: 100, left: 0, right: 100 } };
      const context = {
        findChildElements: async () => [{ id: 'child1', boundingBox: { top: 10, bottom: 30, left: 10, right: 30, midx: 20, midy: 20 } }],
        debug: false
      };

      const result = await relativeSearch(item, { located: 'within' }, parent, context);
      expect(result).toEqual([{ id: 'child1', boundingBox: { top: 10, bottom: 30, left: 10, right: 30, midx: 20, midy: 20 } }]);
    });

    it('should handle child element resolution failure gracefully', async () => {
      const item = { type: 'element', matches: [{ id: 'fallback', boundingBox: { top: 10, bottom: 30, left: 10, right: 30, midx: 20, midy: 20 } }], id: 'test' };
      const parent = { frameIndex: -1, boundingBox: { top: 0, bottom: 100, left: 0, right: 100 } };
      const context = {
        findChildElements: async () => { throw new Error('Failed'); },
        debug: true
      };

      const result = await relativeSearch(item, { located: 'within' }, parent, context);
      expect(result).toEqual([{ id: 'fallback', boundingBox: { top: 10, bottom: 30, left: 10, right: 30, midx: 20, midy: 20 } }]);
    });
  });
});