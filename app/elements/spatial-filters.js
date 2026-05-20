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
  proximityDistance: 100,
  directionalPenalty: 5
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
     */
    within: (candidate) => {
      if (!candidate.boundingBox) return false;
      const e = candidate.boundingBox;
      return r.left <= e.midx && r.right >= e.midx &&
             r.top <= e.midy && r.bottom >= e.midy;
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

/**
 * Filters candidate elements based on spatial relationship to reference element(s).
 * 
 * Handles special cases:
 * - No reference: returns all candidates
 * - No spatial constraint: returns all candidates
 * - Array of references for 'within': checks against all
 * 
 * @param {Object} candidateMatches - Array of candidate elements
 * @param {Object} referenceRelation - Spatial relationship descriptor
 * @param {string} referenceRelation.located - Spatial relationship type
 * @param {boolean} [referenceRelation.exactly] - Alignment precision flag
 * @param {WebElement|WebElement[]} [referenceElement] - Reference element(s)
 * @param {Object} [config] - Configuration overrides
 * @returns {WebElement[]} Filtered array of elements
 */
export function filterBySpatialRelation(
  candidateMatches,
  referenceRelation,
  referenceElement,
  config = {}
) {
  // Early exit: no constraint or reference
  if (!referenceRelation?.located || !referenceElement) {
    return candidateMatches || [];
  }

  const candidates = candidateMatches || [];

  // Handle array of references for 'within'
  if (referenceRelation.located === 'within' && Array.isArray(referenceElement)) {
    return candidates.filter(candidate => {
      if (!candidate.boundingBox) return false;
      return referenceElement.some(ref => {
        if (!ref.boundingBox) return false;
        const r = ref.boundingBox;
        const c = candidate.boundingBox;
        return r.left <= c.midx && r.right >= c.midx &&
               r.top <= c.midy && r.bottom >= c.midy;
      });
    });
  }

  // Single reference element
  const reference = referenceElement;
  if (!reference?.boundingBox) {
    return candidates;
  }

  const filterFn = createSpatialFilter(reference.boundingBox, referenceRelation, config);
  return candidates.filter(filterFn);
}
