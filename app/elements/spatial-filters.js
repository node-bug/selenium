/**
 * Spatial filtering and relative search utilities.
 * 
 * Filters elements based on their geometric position relative to reference elements.
 * Supports: above, below, toLeftOf, toRightOf, within, near
 */

/**
 * Default configuration for spatial search behavior.
 */
const DEFAULT_CONFIG = {
  alignmentBuffer: 5,
  proximityDistance: 100
};

/**
 * Factory for creating spatial filter functions.
 * 
 * @param {Object} referenceRect - Reference element's bounding rectangle
 * @param {Object} relationConfig - Spatial relationship configuration
 * @param {string} relationConfig.located - Spatial relationship type
 * @param {boolean} [relationConfig.exactly] - Whether to apply alignment checks
 * @param {Object} [config] - Configuration overrides
 * @returns {Function} Filter function that takes a candidate element and returns boolean
 */
export function createSpatialFilter(referenceRect, relationConfig, config = {}) {
  const cfg = { ...DEFAULT_CONFIG, ...config };
  const r = referenceRect;
  const { alignmentBuffer } = cfg;

  const filters = {
    /**
     * above: Candidate's bottom edge is above reference's top edge.
     * If exactly: candidate must be horizontally aligned (within buffer).
     */
    above: (candidate) => {
      if (!candidate.boundingBox) return false;
      const e = candidate.boundingBox;
      const isAbove = r.top >= e.bottom;
      
      if (!isAbove) return false;
      if (!relationConfig.exactly) return true;
      
      const leftEdgeAligned = Math.abs(r.left - e.left) <= alignmentBuffer;
      const rightEdgeAligned = Math.abs(r.right - e.right) <= alignmentBuffer;
      return leftEdgeAligned || rightEdgeAligned;
    },

    /**
     * below: Candidate's top edge is below reference's bottom edge.
     * If exactly: candidate must be horizontally aligned (within buffer).
     */
    below: (candidate) => {
      if (!candidate.boundingBox) return false;
      const e = candidate.boundingBox;
      const isBelow = r.bottom <= e.top;
      
      if (!isBelow) return false;
      if (!relationConfig.exactly) return true;
      
      const leftEdgeAligned = Math.abs(r.left - e.left) <= alignmentBuffer;
      const rightEdgeAligned = Math.abs(r.right - e.right) <= alignmentBuffer;
      return leftEdgeAligned || rightEdgeAligned;
    },

    /**
     * toLeftOf: Candidate's right edge is left of reference's left edge.
     * If exactly: candidate must be vertically aligned (within buffer).
     */
    toLeftOf: (candidate) => {
      if (!candidate.boundingBox) return false;
      const e = candidate.boundingBox;
      const isLeft = r.left >= e.right;
      
      if (!isLeft) return false;
      if (!relationConfig.exactly) return true;
      
      const topEdgeAligned = Math.abs(r.top - e.top) <= alignmentBuffer;
      const bottomEdgeAligned = Math.abs(r.bottom - e.bottom) <= alignmentBuffer;
      return topEdgeAligned || bottomEdgeAligned;
    },

    /**
     * toRightOf: Candidate's left edge is right of reference's right edge.
     * If exactly: candidate must be vertically aligned (within buffer).
     */
    toRightOf: (candidate) => {
      if (!candidate.boundingBox) return false;
      const e = candidate.boundingBox;
      const isRight = r.right <= e.left;
      
      if (!isRight) return false;
      if (!relationConfig.exactly) return true;
      
      const topEdgeAligned = Math.abs(r.top - e.top) <= alignmentBuffer;
      const bottomEdgeAligned = Math.abs(r.bottom - e.bottom) <= alignmentBuffer;
      return topEdgeAligned || bottomEdgeAligned;
    },

    /**
     * within: Candidate's center point is inside reference's bounding box.
     * If exactly: entire candidate must be within bounds.
     */
    within: (candidate) => {
      if (!candidate.boundingBox) return false;
      const e = candidate.boundingBox;
      
      // Check midpoint is inside reference
      const midpointInside = r.left <= e.midx && r.right >= e.midx &&
                             r.top <= e.midy && r.bottom >= e.midy;
      
      if (!midpointInside) return false;
      
      // When exactly is true, entire candidate must be within bounds
      if (relationConfig.exactly) {
        return r.left <= e.left && r.right >= e.right &&
               r.top <= e.top && r.bottom >= e.bottom;
      }
      
      return true;
    },

    /**
     * near: Candidate is on the same row as reference (vertical overlap).
     * Allows candidates within proximity distance threshold.
     */
    near: (candidate) => {
      if (!candidate.boundingBox) return false;
      const e = candidate.boundingBox;
      const isFarAbove = r.bottom < e.top - cfg.proximityDistance;
      const isFarBelow = r.top > e.bottom + cfg.proximityDistance;
      return !(isFarAbove || isFarBelow);
    }
  };

  const filterFn = filters[relationConfig.located];
  if (!filterFn) {
    throw new ReferenceError(
      `Location '${relationConfig.located}' is not supported. ` +
      `Valid options: ${Object.keys(filters).join(', ')}`
    );
  }

  return filterFn;
}


