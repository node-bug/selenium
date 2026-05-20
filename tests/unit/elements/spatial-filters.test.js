import { createSpatialFilter, filterBySpatialRelation } from '../../../app/elements/spatial-filters.js';

describe('spatial-filters', () => {
  describe('createSpatialFilter', () => {
    const referenceRect = { top: 100, bottom: 200, left: 100, right: 200 };

    describe('above filter', () => {
      it('should return true when candidate is above reference', () => {
        const filter = createSpatialFilter(referenceRect, { located: 'above' });
        const candidate = { boundingBox: { top: 0, bottom: 50, left: 100, right: 200 } };
        expect(filter(candidate)).toBe(true);
      });

      it('should return false when candidate is not above reference', () => {
        const filter = createSpatialFilter(referenceRect, { located: 'above' });
        const candidate = { boundingBox: { top: 150, bottom: 250, left: 100, right: 200 } };
        expect(filter(candidate)).toBe(false);
      });

      it('should return false when candidate has no boundingBox', () => {
        const filter = createSpatialFilter(referenceRect, { located: 'above' });
        expect(filter({})).toBe(false);
      });

      it('should enforce alignment when exactly is true', () => {
        const filter = createSpatialFilter(referenceRect, { located: 'above', exactly: true });
        
        // Aligned candidate
        const alignedCandidate = { boundingBox: { top: 0, bottom: 50, left: 100, right: 200 } };
        expect(filter(alignedCandidate)).toBe(true);
        
        // Not aligned candidate
        const notAlignedCandidate = { boundingBox: { top: 0, bottom: 50, left: 0, right: 50 } };
        expect(filter(notAlignedCandidate)).toBe(false);
      });
    });

    describe('below filter', () => {
      it('should return true when candidate is below reference', () => {
        const filter = createSpatialFilter(referenceRect, { located: 'below' });
        const candidate = { boundingBox: { top: 250, bottom: 350, left: 100, right: 200 } };
        expect(filter(candidate)).toBe(true);
      });

      it('should return false when candidate is not below reference', () => {
        const filter = createSpatialFilter(referenceRect, { located: 'below' });
        const candidate = { boundingBox: { top: 50, bottom: 150, left: 100, right: 200 } };
        expect(filter(candidate)).toBe(false);
      });

      it('should enforce alignment when exactly is true', () => {
        const filter = createSpatialFilter(referenceRect, { located: 'below', exactly: true });
        
        // Aligned candidate
        const alignedCandidate = { boundingBox: { top: 250, bottom: 350, left: 100, right: 200 } };
        expect(filter(alignedCandidate)).toBe(true);
        
        // Not aligned candidate
        const notAlignedCandidate = { boundingBox: { top: 250, bottom: 350, left: 0, right: 50 } };
        expect(filter(notAlignedCandidate)).toBe(false);
      });
    });

    describe('toLeftOf filter', () => {
      it('should return true when candidate is left of reference', () => {
        const filter = createSpatialFilter(referenceRect, { located: 'toLeftOf' });
        const candidate = { boundingBox: { top: 100, bottom: 200, left: 0, right: 50 } };
        expect(filter(candidate)).toBe(true);
      });

      it('should return false when candidate is not left of reference', () => {
        const filter = createSpatialFilter(referenceRect, { located: 'toLeftOf' });
        const candidate = { boundingBox: { top: 100, bottom: 200, left: 150, right: 250 } };
        expect(filter(candidate)).toBe(false);
      });

      it('should enforce alignment when exactly is true', () => {
        const filter = createSpatialFilter(referenceRect, { located: 'toLeftOf', exactly: true });
        
        // Aligned candidate
        const alignedCandidate = { boundingBox: { top: 100, bottom: 200, left: 0, right: 50 } };
        expect(filter(alignedCandidate)).toBe(true);
        
        // Not aligned candidate
        const notAlignedCandidate = { boundingBox: { top: 0, bottom: 50, left: 0, right: 50 } };
        expect(filter(notAlignedCandidate)).toBe(false);
      });
    });

    describe('toRightOf filter', () => {
      it('should return true when candidate is right of reference', () => {
        const filter = createSpatialFilter(referenceRect, { located: 'toRightOf' });
        const candidate = { boundingBox: { top: 100, bottom: 200, left: 250, right: 350 } };
        expect(filter(candidate)).toBe(true);
      });

      it('should return false when candidate is not right of reference', () => {
        const filter = createSpatialFilter(referenceRect, { located: 'toRightOf' });
        const candidate = { boundingBox: { top: 100, bottom: 200, left: 50, right: 150 } };
        expect(filter(candidate)).toBe(false);
      });

      it('should enforce alignment when exactly is true', () => {
        const filter = createSpatialFilter(referenceRect, { located: 'toRightOf', exactly: true });
        
        // Aligned candidate
        const alignedCandidate = { boundingBox: { top: 100, bottom: 200, left: 250, right: 350 } };
        expect(filter(alignedCandidate)).toBe(true);
        
        // Not aligned candidate
        const notAlignedCandidate = { boundingBox: { top: 0, bottom: 50, left: 250, right: 350 } };
        expect(filter(notAlignedCandidate)).toBe(false);
      });
    });

    describe('within filter', () => {
      it('should return true when candidate midpoint is inside reference', () => {
        const filter = createSpatialFilter(referenceRect, { located: 'within' });
        const candidate = { boundingBox: { top: 120, bottom: 180, left: 120, right: 180, midx: 150, midy: 150 } };
        expect(filter(candidate)).toBe(true);
      });

      it('should return false when candidate midpoint is outside reference', () => {
        const filter = createSpatialFilter(referenceRect, { located: 'within' });
        const candidate = { boundingBox: { top: 0, bottom: 50, left: 0, right: 50, midx: 25, midy: 25 } };
        expect(filter(candidate)).toBe(false);
      });
    });

    describe('near filter', () => {
      it('should return true when candidate is on same row as reference', () => {
        const filter = createSpatialFilter(referenceRect, { located: 'near' });
        const candidate = { boundingBox: { top: 150, bottom: 250, left: 250, right: 350 } };
        expect(filter(candidate)).toBe(true);
      });

      it('should return false when candidate is far from reference', () => {
        const filter = createSpatialFilter(referenceRect, { located: 'near' });
        const candidate = { boundingBox: { top: 500, bottom: 600, left: 250, right: 350 } };
        expect(filter(candidate)).toBe(false);
      });
    });

    describe('error handling', () => {
      it('should throw ReferenceError for invalid location', () => {
        expect(() => createSpatialFilter(referenceRect, { located: 'invalid' })).toThrow(ReferenceError);
      });
    });
  });

  describe('filterBySpatialRelation', () => {
    const candidates = [
      { id: 1, boundingBox: { top: 0, bottom: 50, left: 100, right: 200, midx: 150, midy: 25 } },
      { id: 2, boundingBox: { top: 150, bottom: 250, left: 100, right: 200, midx: 150, midy: 200 } },
      { id: 3, boundingBox: { top: 250, bottom: 350, left: 100, right: 200, midx: 150, midy: 300 } }
    ];

    it('should return all candidates when no constraint', () => {
      const result = filterBySpatialRelation(candidates, null, null);
      expect(result).toEqual(candidates);
    });

    it('should return all candidates when no reference', () => {
      const result = filterBySpatialRelation(candidates, { located: 'above' }, null);
      expect(result).toEqual(candidates);
    });

    it('should filter candidates by spatial relation', () => {
      const reference = { boundingBox: { top: 100, bottom: 200, left: 100, right: 200 } };
      const result = filterBySpatialRelation(candidates, { located: 'above' }, reference);
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(1);
    });

    it('should handle array of references for within', () => {
      const candidatesWithMidpoints = [
        { id: 1, boundingBox: { top: 0, bottom: 100, left: 0, right: 100, midx: 50, midy: 50 } },
        { id: 2, boundingBox: { top: 100, bottom: 200, left: 100, right: 200, midx: 150, midy: 150 } }
      ];
      const references = [
        { boundingBox: { top: 0, bottom: 100, left: 0, right: 100, midx: 50, midy: 50 } },
        { boundingBox: { top: 100, bottom: 200, left: 100, right: 200, midx: 150, midy: 150 } }
      ];
      const result = filterBySpatialRelation(candidatesWithMidpoints, { located: 'within' }, references);
      expect(result).toHaveLength(2);
    });
  });
});