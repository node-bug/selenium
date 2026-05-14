/**
 * Spatial selection utilities for filtering elements based on their geometric position
 * relative to reference elements.
 * 
 * Supports six spatial relationships: above, below, toLeftOf, toRightOf, within, near.
 * Each filter compares bounding rectangles to determine if candidates match the spatial constraint.
 * 
 * Configuration constants:
 * - ALIGNMENT_BUFFER: 5px tolerance for "exactly" alignment checks
 * - PROXIMITY_DISTANCE: 100px threshold for "near" relationship (vertical overlap only)
 * - DEFAULT_NEAR_DISTANCE: 100px (5px buffer * 20) for historical compatibility
 */

/**
 * Filters a set of candidate elements based on their spatial relationship
 * to a reference element (or array of reference elements for 'within').
 *
 * **Supported Spatial Relationships:**
 *
 * - `above`: Candidate's bottom edge is above reference's top edge
 *   - If `exactly`: Candidate must be horizontally aligned (within 5px)
 *
 * - `below`: Candidate's top edge is below reference's bottom edge
 *   - If `exactly`: Candidate must be horizontally aligned (within 5px)
 *
 * - `toLeftOf`: Candidate's right edge is left of reference's left edge
 *   - If `exactly`: Candidate must be vertically aligned (within 5px)
 *
 * - `toRightOf`: Candidate's left edge is right of reference's right edge
 *   - If `exactly`: Candidate must be vertically aligned (within 5px)
 *
 * - `within`: Candidate's midpoint lies inside reference's bounding box
 *   - Supports array of references (candidate must be in at least one)
 *   - For item.type === 'element', recursively finds child elements
 *
 * - `near`: Candidate and reference are on the same row
 *   - Checks vertical overlap within 100px threshold
 *
 * **Edge Cases Handled:**
 * - No reference element: returns all candidates
 * - No spatial constraint: returns all candidates
 * - No matches: returns empty array
 * - Array of references for 'within': checks against all
 * - Stale elements: gracefully skipped via try/catch in context
 *
 * @param {Object} item - The stack item containing `type` and `matches` array.
 * @param {Object} [rel] - Spatial constraint with `located` (required) and `exactly` (optional).
 * @param {WebElement|WebElement[]} [relativeElement] - Reference element(s) to filter by.
 * @param {Object} context - Context object with `findChildElements` method and `driver`.
 * @returns {Promise<WebElement[]>} Filtered array of elements matching the spatial constraint.
 * @throws {ReferenceError} If spatial location is not supported.
 */
export async function relativeSearch(item, rel, relativeElement, context) {
  // Validate spatial location parameter
  if (rel?.located) {
    const validLocations = ['above', 'below', 'toLeftOf', 'toRightOf', 'within', 'near'];
    if (!validLocations.includes(rel.located)) {
      throw new ReferenceError(`Location '${rel.located}' is not supported. Valid options: ${validLocations.join(', ')}`);
    }
  }

  // Early exit: if no spatial constraint, return all candidates
  if (!rel?.located || !relativeElement) {
    return item.matches || [];
  }

  // Configuration for spatial calculations
  const ALIGNMENT_BUFFER = 5;         // 5px tolerance for "exactly" alignment
  const DEFAULT_NEAR_DISTANCE = ALIGNMENT_BUFFER * 20;  // 100px for backward compatibility

  // Start with item matches, but don't mutate the original
  let matches = item.matches || [];

  // Special case: 'within' + generic 'element' type triggers child element resolution
  // This allows finding elements nested within a parent container
  if (rel.located === 'within' && item.type === 'element') {
    try {
      const refEl = Array.isArray(relativeElement) ? relativeElement[0] : relativeElement;
      if (refEl) {
        matches = await context.findChildElements(refEl, item);
      }
    } catch (err) {
      // If child element resolution fails, use regular matching instead
      if (context.debug) {
        console.warn('Child element resolution failed, using regular matching:', err.message);
      }
      matches = item.matches || [];
    }
  }

  // Special case: 'within' with array of references
  // Check if candidate is within ANY of the reference elements
  if (rel.located === 'within' && Array.isArray(relativeElement)) {
    const refs = relativeElement;
    return matches.filter(candidate => {
      if (!candidate.rect) return false;
      
      return refs.some(ref => {
        if (!ref.rect) return false;
        
        const c = candidate.rect;
        const r = ref.rect;
        
        // Check if candidate's midpoint is inside reference's bounding box
        return r.left <= c.midx && r.right >= c.midx &&
               r.top <= c.midy && r.bottom >= c.midy;
      });
    });
  }

  // Single reference element case
  // Extract rect once for efficiency
  const reference = relativeElement;
  if (!reference?.rect) {
    return matches; // Reference has no rect, can't filter
  }

  const r = reference.rect;

  /**
   * Spatial filter functions. Each returns true if the candidate satisfies
   * the spatial relationship with the reference element.
   */
  const spatialFilters = {
    /**
     * above: Candidate is vertically above reference
     * Condition: candidate.bottom <= reference.top
     * If exactly: candidate must be horizontally aligned (centers within 5px)
     */
    above: (candidate) => {
      if (!candidate.rect) return false;
      
      const e = candidate.rect;
      const isAbove = r.top >= e.bottom;
      
      if (!isAbove) return false;
      if (!rel.exactly) return true;
      
      // Check horizontal alignment: their left edges should align (within buffer)
      const leftEdgeAligned = Math.abs(r.left - e.left) <= ALIGNMENT_BUFFER;
      const rightEdgeAligned = Math.abs(r.right - e.right) <= ALIGNMENT_BUFFER;
      const horizontallyAligned = leftEdgeAligned || rightEdgeAligned;
      
      return horizontallyAligned;
    },

    /**
     * below: Candidate is vertically below reference
     * Condition: candidate.top >= reference.bottom
     * If exactly: candidate must be horizontally aligned
     */
    below: (candidate) => {
      if (!candidate.rect) return false;
      
      const e = candidate.rect;
      const isBelow = r.bottom <= e.top;
      
      if (!isBelow) return false;
      if (!rel.exactly) return true;
      
      const leftEdgeAligned = Math.abs(r.left - e.left) <= ALIGNMENT_BUFFER;
      const rightEdgeAligned = Math.abs(r.right - e.right) <= ALIGNMENT_BUFFER;
      const horizontallyAligned = leftEdgeAligned || rightEdgeAligned;
      
      return horizontallyAligned;
    },

    /**
     * toLeftOf: Candidate is horizontally left of reference
     * Condition: candidate.right <= reference.left
     * If exactly: candidate must be vertically aligned
     */
    toLeftOf: (candidate) => {
      if (!candidate.rect) return false;
      
      const e = candidate.rect;
      const isLeft = r.left >= e.right;
      
      if (!isLeft) return false;
      if (!rel.exactly) return true;
      
      const topEdgeAligned = Math.abs(r.top - e.top) <= ALIGNMENT_BUFFER;
      const bottomEdgeAligned = Math.abs(r.bottom - e.bottom) <= ALIGNMENT_BUFFER;
      const verticallyAligned = topEdgeAligned || bottomEdgeAligned;
      
      return verticallyAligned;
    },

    /**
     * toRightOf: Candidate is horizontally right of reference
     * Condition: candidate.left >= reference.right
     * If exactly: candidate must be vertically aligned
     */
    toRightOf: (candidate) => {
      if (!candidate.rect) return false;
      
      const e = candidate.rect;
      const isRight = r.right <= e.left;
      
      if (!isRight) return false;
      if (!rel.exactly) return true;
      
      const topEdgeAligned = Math.abs(r.top - e.top) <= ALIGNMENT_BUFFER;
      const bottomEdgeAligned = Math.abs(r.bottom - e.bottom) <= ALIGNMENT_BUFFER;
      const verticallyAligned = topEdgeAligned || bottomEdgeAligned;
      
      return verticallyAligned;
    },

    /**
     * within: Candidate's center point is inside reference's bounding box
     * Checks if candidate's midpoint falls within reference's rectangle
     */
    within: (candidate) => {
      if (!candidate.rect) return false;
      
      const e = candidate.rect;
      return r.left <= e.midx && r.right >= e.midx &&
             r.top <= e.midy && r.bottom >= e.midy;
    },

    /**
     * near: Candidate is on the same row as reference (vertical overlap)
     * Checks if candidate and reference vertically overlap within proximity threshold
     * Allows candidates that are 100px above or below
     */
    near: (candidate) => {
      if (!candidate.rect) return false;
      
      const e = candidate.rect;
      // Elements are NOT near if one is far above or far below the other
      const isFarAbove = r.bottom < e.top - DEFAULT_NEAR_DISTANCE;
      const isFarBelow = r.top > e.bottom + DEFAULT_NEAR_DISTANCE;
      
      return !(isFarAbove || isFarBelow);
    }
  };

  // Get the appropriate filter function
  const filterFn = spatialFilters[rel.located];
  if (!filterFn) {
    throw new ReferenceError(`Location '${rel.located}' is not supported`);
  }

  // Apply the filter and return results
  return matches.filter(filterFn);
}