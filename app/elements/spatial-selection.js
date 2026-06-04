/**
 * Spatial selection utilities for filtering elements based on their geometric position
 * relative to reference elements.
 * 
 * Supports six spatial relationships: above, below, toLeftOf, toRightOf, within, near.
 * Each filter compares bounding rectangles to determine if candidates match the spatial constraint.
 */

import { createSpatialFilter } from './spatial-filters.js';

/**
 * Filters a set of candidate elements based on their spatial relationship
 * to a reference element (or array of reference elements for 'within').
 *
 * **Supported Spatial Relationships:**
 *
 * - `above`: Candidate's bottom edge is above reference's top edge
 *   - If `exactly`: Candidate must be horizontally aligned (left/right edges or centers within 5px)
 *
 * - `below`: Candidate's top edge is below reference's bottom edge
 *   - If `exactly`: Candidate must be horizontally aligned (left/right edges or centers within 5px)
 *
 * - `toLeftOf`: Candidate's right edge is left of reference's left edge
 *   - If `exactly`: Candidate must be vertically aligned (top/bottom edges or centers within 5px)
 *
 * - `toRightOf`: Candidate's left edge is right of reference's right edge
 *   - If `exactly`: Candidate must be vertically aligned (top/bottom edges or centers within 5px)
 *
 * - `within`: Candidate's midpoint lies inside reference's bounding box
 *   - Supports array of references (candidate must be in at least one)
 *
 * - `near`: Candidate and reference are on the same row
 *   - Checks vertical overlap within 100px threshold
 *
 * **Edge Cases Handled:**
 * - No reference element: returns all candidates
 * - No spatial constraint: returns all candidates
 * - No matches: returns empty array
 * - Array of references for 'within': checks against all
 * @param {Object} item - The stack item containing `type` and `matches` array.
 * @param {Object} [rel] - Spatial constraint with `located` (required) and `exactly` (optional).
 * @param {WebElement|WebElement[]} [relativeElement] - Reference element(s) to filter by.
 * @returns {Promise<WebElement[]>} Filtered array of elements matching the spatial constraint.
 * @throws {ReferenceError} If spatial location is not supported.
 */
export async function relativeSearch(item, rel, relativeElement) {
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

  // Start with item matches, but don't mutate the original
  let matches = item.matches || [];

  // Special case: array of references
  // For any location type, check if candidate is in the relationship with ANY of the reference elements
  if (Array.isArray(relativeElement)) {
    const refs = relativeElement;
    const seenPositions = new Set();
    const uniqueMatches = [];
    
    for (const candidate of matches) {
      if (!candidate.boundingBox) continue;
      
      // Check if this candidate matches ANY reference element
      const matchesAny = refs.some(ref => {
        if (!ref.boundingBox) return false;
        
        // Create a filter for this specific reference and relationship type
        const filterFn = createSpatialFilter(ref.boundingBox, rel);
        return filterFn(candidate);
      });
      
      if (matchesAny) {
        // Deduplicate by position - use rounded coordinates as key
        // Round to nearest 2 pixels to merge elements at very close positions (e.g., x=701 and x=702)
        const bbox = candidate.boundingBox;
        const posKey = `${Math.round(bbox.top / 2) * 2},${Math.round(bbox.left / 2) * 2},${Math.round(bbox.bottom / 2) * 2},${Math.round(bbox.right / 2) * 2}`;
        
        if (!seenPositions.has(posKey)) {
          seenPositions.add(posKey);
          uniqueMatches.push(candidate);
        }
      }
    }
    
    return uniqueMatches;
  }

  // Single reference element case
  // Use shared spatial filter from spatial-filters.js
  const reference = relativeElement;
  if (!reference?.boundingBox) {
    return matches; // Reference has no rect, can't filter
  }

  const filterFn = createSpatialFilter(reference.boundingBox, rel);
  return matches.filter(filterFn);
}