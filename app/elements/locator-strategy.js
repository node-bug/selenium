import { log } from '@nodebug/logger';
import { relativeSearch } from './spatial-selection.js';
import { readFile } from 'fs/promises';
import { createRequire } from 'module';
import ELEMENT_DEFINITIONS from '@nodebug/browser-element-finder/element-definitions.json' with { type: 'json' };
import { selenium } from '../config.js';

// Load ElementFinder browser bundle from @nodebug/browser-element-finder package
const require = createRequire(import.meta.url);
const elementFinderPath = require.resolve('@nodebug/browser-element-finder/min');

/**
 * Core element-finding strategy with Selenium WebDriver integration.
 * Uses ElementFinder.findProbableElements() for element discovery, with support
 * for cross-iframe scanning, spatial filtering, and stack-based element resolution.
 * 
 * ## Supported Finding Strategies
 * 1. **Direct Matching**: Match by element type + text/attribute content
 * 2. **Exact vs Substring**: Full-text or partial matching
 * 3. **Index Selection**: 1-based indexing into result sets
 * 4. **Spatial Filtering**: above, below, toLeftOf, toRightOf, within, near
 * 5. **Frame Scanning**: Cross-iframe element resolution
 * 6. **Visibility Filtering**: Include/exclude hidden elements
 * 7. **Chained Filters**: Combine spatial filters in sequence
 * 8. **Alignment Precision**: Optional exact alignment (for above/below/left/right)
 */
export class LocatorStrategy {
  // Flag to track if ElementFinder script has been injected
  #elementFinderInjected = false;

  /**
   * @type {import('selenium-webdriver').WebDriver}
   */
  set driver(value) { this._driver = value; }
  get driver() { return this._driver; }

  /**
   * @type {boolean}
   */
  get debug() { return selenium.debug ?? false; }

  /**
   * Injects the ElementFinder script into the browser context.
   * This is called once per session to make ElementFinder available.
   * @private
   */
  async _injectElementFinder() {
    if (this.#elementFinderInjected) return;

    // Check if ElementFinder already exists
    const exists = await this.driver.executeScript(`
      return typeof window.ElementFinder !== 'undefined';
    `);

    if (!exists) {
      // Inject the ElementFinder script from @nodebug/browser-element-finder package
      const scriptContent = await readFile(elementFinderPath, 'utf8');
      // Execute the IIFE script and assign to window.ElementFinder
      await this.driver.executeScript(`
        ${scriptContent}
        window.ElementFinder = ElementFinder;
      `);

      // Verify injection succeeded
      const injected = await this.driver.executeScript(`
        return typeof window.ElementFinder !== 'undefined';
      `);
      if (!injected) {
        throw new Error('ElementFinder script injection failed - window.ElementFinder not defined');
      }
    }
    this.#elementFinderInjected = true;
  }

  /**
   * Helper to switch context safely.
   * 
   * Switches to the default content, then optionally into a specific frame
   * before executing the callback. Handles frame errors gracefully by returning null
   * if the frame is no longer accessible (common in dynamic SPAs).
   *
   * @param {number} frameIndex - The frame index to switch into, or -1 for default content.
   * @param {Function} callback - The async function to execute within the frame context.
   * @returns {Promise<*>} The result of the callback, or null if the frame was not found.
   * @throws {Error} Any error from the callback (not frame-switching errors)
   */
  async _withContext(frameIndex, callback) {
    try {
      await this.driver.switchTo().defaultContent();
    } catch {
      // If we can't switch to default content, the driver may be detached
      return null;
    }

    if (frameIndex >= 0) {
      try {
        await this.driver.switchTo().frame(frameIndex);
      } catch (err) {
        // Frame doesn't exist, moved, or is inaccessible - this is normal in dynamic pages
        // Only catch NoSuchFrameError, rethrow other errors
        if (err.name === 'NoSuchFrameError') {
          return null;
        }
        throw err;
      }
    }

    try {
      return await callback();
    } finally {
      // CRITICAL: Always switch back to default content after callback
      // This ensures the driver context is restored for subsequent operations
      try {
        await this.driver.switchTo().defaultContent();
      } catch {
        // Silently ignore frame switch errors during cleanup
      }
    }
  }

  /**
   * Finds child elements within a parent element's frame context.
   *
   * This method is used for the 'within' spatial filter. It switches to the parent's
   * frame and uses ElementFinder to find matching children, then qualifies them
   * with bounding-box metadata.
   *
   * @param {WebElement} parent - The parent WebElement whose frame context to use.
   * @param {Object} childData - The selector descriptor containing `id`, `exact`, and `type`.
   * @returns {Promise<WebElement[]>} Array of qualified child elements with metadata.
   * @throws {Error} If context switching or query fails
   */
  async findChildElements(parent, childData) {
    if (!parent) {
      return [];
    }

    return this._withContext(parent.frameIndex, async () => {
      try {
        // Ensure ElementFinder is injected
        await this._injectElementFinder();

        // Use ElementFinder.findProbableElements with parent parameter for within-element search
        // Visibility filtering is done after based on boundingBox dimensions
        const elements = await this.driver.executeScript(`
          const parent = arguments[0];
          const type = arguments[1];
          const text = arguments[2];
          const exact = arguments[3];
          
          // Call ElementFinder.findProbableElements with parent parameter
          const result = window.ElementFinder.findProbableElements(type, text, exact, parent);
          return result;
        `, parent, childData.type, childData.id, childData.exact);

        if (!elements || !elements.elements || elements.elements.length === 0) {
          return [];
        }

        // Selenium has wrapped the DOM elements as WebElements
        // Now attach the metadata to each WebElement
        // Use parent's frameIndex since we're searching within the parent's context
        // Filter out elements without the element property (from cross-origin iframes)
        const qualified = elements.elements
          .filter(elem => elem.element)
          .map((elem) => {
            const webElement = elem.element;
            webElement.frameIndex = parent.frameIndex;
            webElement.tagName = elem.tagName;
            webElement.boundingBox = elem.boundingBox;
            webElement.isHidden = elem.isHidden;
            webElement.inViewport = elem.inViewport;
            return webElement;
          });

        return qualified;
      } catch {
        return [];
      }
    });
  }

  /**
   * Filters a set of candidate elements based on their spatial relationship
   * to a reference element (or array of reference elements for 'within').
   *
   * Supported spatial relationships:
   * - `above`: Candidate is vertically above reference (r.top >= e.boundingBox.bottom)
   * - `below`: Candidate is vertically below reference (r.bottom <= e.boundingBox.top)
   * - `toLeftOf`: Candidate is horizontally left of reference (r.left >= e.boundingBox.right)
   * - `toRightOf`: Candidate is horizontally right of reference (r.right <= e.boundingBox.left)
   * - `within`: Candidate's midpoint is inside reference's bounding box
   * - `near`: Candidate vertically overlaps reference (on same row, within 100px)
   * 
   * When `rel.exactly` is true, alignment is also checked (within 5px buffer):
   * - For above/below: horizontal alignment required
   * - For left/right: vertical alignment required
   *
   * For 'within', supports array of reference elements (all must be checked).
   * If no spatial constraint, returns all candidates unchanged.
   *
   * @param {Object} item - The stack item containing `type` and `matches` array.
   * @param {Object} [rel] - Spatial constraint object with `located` and optional `exactly`.
   * @param {WebElement|WebElement[]} [relativeElement] - Reference element(s) to filter by.
   * @returns {Promise<WebElement[]>} Filtered array of elements matching the spatial constraint.
   * @throws {Error} If spatial location is unsupported
   */
  async relativeSearch(item, rel, relativeElement) {
    return relativeSearch(item, rel, relativeElement);
  }

  /**
   * Checks DOM containment for elements within a reference element.
   * Uses `reference.contains(candidate)` to determine if candidates are DOM descendants.
   *
   * @param {WebElement} reference - The reference element to check containment within.
   * @param {WebElement[]} candidates - Array of candidate elements to filter (with metadata).
   * @returns {Promise<WebElement[]>} Elements that are contained within the reference (preserving metadata).
   */
  async #checkContainment(reference, candidates) {
    if (!candidates || candidates.length === 0) return [];

    // Get indices of contained elements (since executeScript returns new WebElement objects)
    const containedIndices = await this.driver.executeScript(`
      const ref = arguments[0];
      const cands = arguments[1];
      return cands
        .map((c, idx) => ref.contains(c) ? idx : -1)
        .filter(idx => idx !== -1);
    `, reference, candidates);

    // Return the original WebElement objects that have metadata
    return containedIndices.map(idx => candidates[idx]);
  }

  /**
   * Finds all matching elements across frames.
   * 
   * Searches frame-by-frame: main frame first, then child frames.
   * Uses ElementFinder.findProbableElements() for element discovery within each frame context.
   *
   * @param {Object} elementData - Selector descriptor with `id`, `exact`, `type`, `hidden`.
   * @returns {Promise<WebElement[]>} Array of qualified matching elements across frames.
   */
  async findElements(elementData) {
    // Ensure ElementFinder is injected
    await this._injectElementFinder();

    // Switch elements have dedicated search logic (include hidden, custom processing)
    if (elementData.type === 'switch') {
      return this._findSwitchElements(elementData);
    }

    // 1. Search in main frame first (frameIndex = -1)
    // ElementFinder searches ALL frames when called from main frame
    // Elements from child frames are returned without the `element` property
    const mainFrameResults = await this._searchInFrame(-1, elementData);
    if (mainFrameResults.length > 0) {
      return mainFrameResults;
    }

    // 2. Get all iframe elements to search child frames directly
    const frameCount = await this._getChildFrameCount();

    // 3. Search each child frame
    for (let frameIndex = 0; frameIndex < frameCount; frameIndex++) {
      const frameResults = await this._searchInFrame(frameIndex, elementData);
      if (frameResults.length > 0) {
        return frameResults;
      }
    }

    return [];
  }

  /**
   * Finds switch elements across frames with dedicated logic.
   * Always includes hidden elements since switches often have hidden checkboxes.
   *
   * @param {Object} elementData - Selector descriptor with `id`, `exact`, `type`, `hidden`.
   * @returns {Promise<WebElement[]>} Array of qualified switch elements.
   */
  async _findSwitchElements(elementData) {
    // 1. Search in main frame first (frameIndex = -1)
    const mainFrameResults = await this._searchSwitchInFrame(-1, elementData);
    if (mainFrameResults.length > 0) {
      return mainFrameResults;
    }

    // 2. Get all iframe elements to search child frames directly
    const frameCount = await this._getChildFrameCount();

    // 3. Search each child frame
    for (let frameIndex = 0; frameIndex < frameCount; frameIndex++) {
      const frameResults = await this._searchSwitchInFrame(frameIndex, elementData);
      if (frameResults.length > 0) {
        return frameResults;
      }
    }

    // 4. Fall back to closest switch element search
    const closestResults = await this._findClosestSwitchElement(elementData);
    if (closestResults && closestResults.elements && closestResults.elements.length > 0) {
      return closestResults.elements
        .filter(elem => elem.element)
        .map((elem) => {
          const webElement = elem.element;
          webElement.frameIndex = elem.frameIndex;
          webElement.tagName = elem.tagName;
          webElement.boundingBox = elem.boundingBox;
          webElement.isHidden = elem.isHidden;
          webElement.inViewport = elem.inViewport;
          return webElement;
        });
    }

    return [];
  }

  /**
   * Gets the count of child iframes in the current document.
   * @returns {Promise<number>} Number of iframe elements.
   */
  async _getChildFrameCount() {
    try {
      const count = await this.driver.executeScript(`
        return document.querySelectorAll('iframe').length;
      `);
      return count || 0;
    } catch {
      return 0;
    }
  }

  /**
   * Searches for elements within a specific frame context.
   * 
   * @param {number} frameIndex - Frame index (-1 for main frame, 0+ for child frames).
   * @param {Object} elementData - Selector descriptor with `id`, `exact`, `type`, `hidden`.
   * @returns {Promise<WebElement[]>} Array of qualified matching elements.
   */
  async _searchInFrame(frameIndex, elementData) {
    return this._withContext(frameIndex, async () => {
      try {
        // Inject ElementFinder in this frame context if not already present
        const scriptContent = await readFile(elementFinderPath, 'utf8');
        await this.driver.executeScript(`
          if (typeof window.ElementFinder === 'undefined') {
            ${scriptContent}
            window.ElementFinder = ElementFinder;
          }
        `);

        const results = await this.driver.executeScript(`
          const type = arguments[0];
          const text = arguments[1];
          const exact = arguments[2];
          
          // Call ElementFinder.findProbableElements in current frame context
          const result = window.ElementFinder.findProbableElements(type, text, exact);
          
          return result;
        `, elementData.type, elementData.id, elementData.exact);

        if (!results || !results.elements || results.elements.length === 0) {
          return [];
        }

        // Separate elements by whether they have the element property
        // Elements from child frames (found when searching main frame) don't have element property
        const mainFrameElements = results.elements.filter(elem => elem.element);

        // Process main frame elements (have the element property)
        const qualified = mainFrameElements.map((elem) => {
          const webElement = elem.element;
          webElement.frameIndex = frameIndex;
          webElement.tagName = elem.tagName;
          webElement.boundingBox = elem.boundingBox;
          webElement.isHidden = elem.isHidden;
          webElement.inViewport = elem.inViewport;
          return webElement;
        });

        // For child frame elements, we need to switch to that frame and find the element
        // This is handled by the findElements method which searches child frames separately
        // We just need to return the main frame elements here

        // Filter by visibility settings.
        // ElementFinder's isHidden metadata includes visibility:hidden, ancestor-hidden elements, inert, hidden, and aria-hidden.
        const visibilityFilter = elementData.hidden
          ? (e) => elementData.onscreen ? e.inViewport === true : true  // Include all (or only onscreen)
          : (e) => e.isHidden !== true && (!elementData.onscreen || e.inViewport === true);

        return qualified.filter(visibilityFilter);
      } catch {
        return [];
      }
    });
  }

  /**
   * Searches for switch elements within a specific frame context.
   * Always includes hidden elements since switches often have hidden checkboxes.
   *
   * @param {number} frameIndex - Frame index (-1 for main frame, 0+ for child frames).
   * @param {Object} elementData - Selector descriptor with `id`, `exact`, `type`, `hidden`.
   * @returns {Promise<WebElement[]>} Array of qualified switch elements.
   */
  async _searchSwitchInFrame(frameIndex, elementData) {
    return this._withContext(frameIndex, async () => {
      try {
        // Inject ElementFinder in this frame context if not already present
        const scriptContent = await readFile(elementFinderPath, 'utf8');
        await this.driver.executeScript(`
          if (typeof window.ElementFinder === 'undefined') {
            ${scriptContent}
            window.ElementFinder = ElementFinder;
          }
        `);

        // First try to find switch elements directly by text
        const directResults = await this.driver.executeScript(`
          const type = arguments[0];
          const text = arguments[1];
          const exact = arguments[2];
          
          // Call ElementFinder.findProbableElements in current frame context
          // For switches, we need to include hidden elements (handled by visibility filter)
          const result = window.ElementFinder.findProbableElements(type, text, exact);
          
          return result;
        `, elementData.type, elementData.id, elementData.exact);

        // If direct search found elements, use them
        if (directResults && directResults.elements && directResults.elements.length > 0) {
          const mainFrameElements = directResults.elements.filter(elem => elem.element);
          const qualified = mainFrameElements.map((elem) => {
            const webElement = elem.element;
            webElement.frameIndex = frameIndex;
            webElement.tagName = elem.tagName;
            webElement.boundingBox = elem.boundingBox;
            webElement.isHidden = elem.isHidden;
            webElement.inViewport = elem.inViewport;
            return webElement;
          });
          const processed = await this._postProcessSwitchElements(qualified, elementData);
          return processed;
        }

        // If no direct match, try to find label elements and their associated switch inputs
        const labelResults = await this.driver.executeScript(`
          const text = arguments[0];
          const exact = arguments[1];
          
          // Find label elements that match the text
          const labels = window.ElementFinder.findElements('element', text, exact);
          
          if (!labels || !labels.elements || labels.elements.length === 0) {
            return { elements: [] };
          }
          
          const switchElements = [];
          
          for (const label of labels.elements) {
            if (!label.element) continue;
            const labelEl = label.element;
            
            // Check for label 'for' attribute pointing to a switch
            const forId = labelEl.getAttribute('for');
            if (forId) {
              const forEl = document.getElementById(forId);
              if (forEl && window.ElementFinder.matchesType(forEl, 'switch')) {
                const rect = forEl.getBoundingClientRect();
                switchElements.push({ 
                  element: forEl, 
                  frame: label.frame,
                  tagName: forEl.tagName.toLowerCase(),
                  boundingBox: {
                    x: rect.x, y: rect.y, width: rect.width, height: rect.height,
                    top: rect.top, bottom: rect.bottom, left: rect.left, right: rect.right,
                    midx: rect.x + rect.width / 2, midy: rect.y + rect.height / 2
                  }
                });
                continue;
              }
            }
            
            // Check if any switch element references this label via aria-labelledby
            // Look for all switches and check their aria-labelledby for this label's id
            const allSwitches = document.querySelectorAll('[role="switch"]');
            for (const switchEl of allSwitches) {
              const labelledBy = switchEl.getAttribute('aria-labelledby');
              if (labelledBy) {
                const ids = labelledBy.split(' ').filter(Boolean);
                if (ids.includes(labelEl.id)) {
                  const rect = switchEl.getBoundingClientRect();
                  switchElements.push({ 
                    element: switchEl,
                    frame: label.frame,
                    tagName: switchEl.tagName.toLowerCase(),
                    boundingBox: {
                      x: rect.x, y: rect.y, width: rect.width, height: rect.height,
                      top: rect.top, bottom: rect.bottom, left: rect.left, right: rect.right,
                      midx: rect.x + rect.width / 2, midy: rect.y + rect.height / 2
                    }
                  });
                  // Found a switch for this label, break inner loop
                  break;
                }
              }
            }
          }
          
          return { elements: switchElements };
        `, elementData.id, elementData.exact);

        if (!labelResults || !labelResults.elements || labelResults.elements.length === 0) {
          return [];
        }

        // Process elements found via label association
        const mainFrameElements = labelResults.elements.filter(elem => elem.element);
        const qualified = mainFrameElements.map((elem) => {
          const webElement = elem.element;
          webElement.frameIndex = frameIndex;
          webElement.tagName = elem.tagName;
          webElement.boundingBox = elem.boundingBox;
          webElement.isHidden = elem.isHidden;
          webElement.inViewport = elem.inViewport;
          return webElement;
        });

        // Apply switch-specific post-processing
        const processed = await this._postProcessSwitchElements(qualified, elementData);

        return processed;
      } catch {
        return [];
      }
    });
  }

  /**
   * Finds the closest switch element using edge proximity.
   *
   * @param {Object} elementData - Selector descriptor with `id`, `exact`, `type`, `hidden`.
   * @returns {Promise<Object>} Result object with `elements` array, or empty if none found.
   */
  async _findClosestSwitchElement(elementData) {
    const DISTANCE_THRESHOLD = 500;

    // 1. Search in main frame first
    const mainFrameResult = await this._findClosestSwitchInFrame(-1, elementData, DISTANCE_THRESHOLD);
    if (mainFrameResult) {
      return { elements: [mainFrameResult] };
    }

    // 2. Get all iframe elements to search child frames
    const frameCount = await this._getChildFrameCount();

    // 3. Search each child frame
    for (let frameIndex = 0; frameIndex < frameCount; frameIndex++) {
      const frameResult = await this._findClosestSwitchInFrame(frameIndex, elementData, DISTANCE_THRESHOLD);
      if (frameResult) {
        return { elements: [frameResult] };
      }
    }

    return { elements: [] };
  }

  /**
   * Finds the closest switch element within a single frame.
   *
   * @param {number} frameIndex - Frame index (-1 for main frame, 0+ for child frames).
   * @param {Object} elementData - Selector descriptor with `id`, `exact`, `type`, `hidden`.
   * @param {number} threshold - Maximum distance to consider elements "close".
   * @returns {Promise<Object|null>} Closest switch element object or null if none found.
   */
  async _findClosestSwitchInFrame(frameIndex, elementData, threshold) {
    return this._withContext(frameIndex, async () => {
      try {
        // Inject ElementFinder in this frame context if not already present
        const scriptContent = await readFile(elementFinderPath, 'utf8');
        await this.driver.executeScript(`
          if (typeof window.ElementFinder === 'undefined') {
            ${scriptContent}
            window.ElementFinder = ElementFinder;
          }
        `);

        let result = await this.driver.executeScript(`
          const text = arguments[0];
          const exact = arguments[1];
          const targetType = arguments[2];
          const threshold = arguments[3];
          
          // First find the generic element (label or text) as reference
          const genericResult = window.ElementFinder.findElements('element', text, exact);
          
          if (!genericResult || !genericResult.elements || genericResult.elements.length === 0) {
            return null;
          }
          
          // Get all elements of the target type (never include hidden for fallback search)
          // Fallback should only find closest VISIBLE element, never return hidden elements
          const targetResult = window.ElementFinder.findElements(targetType);
          
          if (!targetResult || !targetResult.elements || targetResult.elements.length === 0) {
            return null;
          }
          
          // Calculate edge proximity distance between two bounding boxes
          function getEdgeProximityDistance(refRect, targetRect) {
            const overlapsX = refRect.left <= targetRect.right && refRect.right >= targetRect.left;
            const overlapsY = refRect.top <= targetRect.bottom && refRect.bottom >= targetRect.top;
            
            if (overlapsX && overlapsY) {
              return 0;
            }
            
            let dx = 0;
            let dy = 0;
            
            if (refRect.left > targetRect.right) {
              dx = refRect.left - targetRect.right;
            } else if (refRect.right < targetRect.left) {
              dx = targetRect.left - refRect.right;
            }
            
            if (refRect.top > targetRect.bottom) {
              dy = refRect.top - targetRect.bottom;
            } else if (refRect.bottom < targetRect.top) {
              dy = targetRect.top - refRect.bottom;
            }
            
            return Math.sqrt(dx * dx + dy * dy);
          }
          
          // Find the closest element to any of the generic elements
          let closestElement = null;
          let minDistance = Infinity;
          
          for (const generic of genericResult.elements) {
            if (!generic.element) continue;
            const refRect = generic.element.getBoundingClientRect();
            
            for (const target of targetResult.elements) {
              if (!target.element) continue;
              const targetRect = target.element.getBoundingClientRect();
              const distance = getEdgeProximityDistance(refRect, targetRect);
              
              if (distance < minDistance && distance <= threshold) {
                minDistance = distance;
                closestElement = target;
              }
            }
          }
          
          return closestElement;
        `, elementData.id, elementData.exact, elementData.type, threshold);

        if (result) {
          result.frameIndex = frameIndex;
          result = await this._postProcessSwitchElement(result, elementData);
        }
        return result;
      } catch {
        return null;
      }
    });
  }

  /**
   * Post-processes switch elements with custom logic.
   * Override this method to add switch-specific behavior.
   *
   * @param {WebElement[]} elements - Array of switch elements to process.
   * @param {Object} elementData - The selector descriptor for the switch.
   * @returns {Promise<WebElement[]>} Processed array of switch elements.
   */
  async _postProcessSwitchElements(elements) {
    // Custom logic for switch elements can be added here
    // This method can be overridden in subclasses or extended
    return elements;
  }

  /**
   * Post-processes a single switch element with custom logic.
   * Override this method to add switch-specific behavior for closest element search.
   *
   * @param {Object|null} element - The switch element object to process.
   * @param {Object} elementData - The selector descriptor for the switch.
   * @returns {Promise<Object|null>} Processed switch element object.
   */
  async _postProcessSwitchElement(element) {
    // Custom logic for switch elements can be added here
    // This method can be overridden in subclasses or extended
    return element;
  }

  /**
   * Finds the closest element of a specific type using edge proximity.
   * 
   * When an element type is not found directly, this method finds the closest
   * matching element by searching frame-by-frame:
   * 1. Finding generic elements matching the identifier (label/text)
   * 2. Finding all elements of the target type
   * 3. Calculating edge proximity distance between reference and candidates
   * 4. Returning the closest element within the distance threshold
   *
   * @param {Object} elementData - Selector descriptor with `id`, `exact`, `type`, `hidden`.
   * @returns {Promise<Object>} Result object with `elements` array, or empty if none found.
   */
  async _findClosestElementOfType(elementData) {
    const DISTANCE_THRESHOLD = 500; // Maximum distance to consider elements "close"

    // 1. Search in main frame first
    const mainFrameResult = await this._findClosestInFrame(-1, elementData, DISTANCE_THRESHOLD);
    if (mainFrameResult) {
      return { elements: [mainFrameResult] };
    }

    // 2. Get all iframe elements to search child frames
    const frameCount = await this._getChildFrameCount();

    // 3. Search each child frame
    for (let frameIndex = 0; frameIndex < frameCount; frameIndex++) {
      const frameResult = await this._findClosestInFrame(frameIndex, elementData, DISTANCE_THRESHOLD);
      if (frameResult) {
        return { elements: [frameResult] };
      }
    }

    return { elements: [] };
  }

  /**
   * Finds the closest element of a specific type within a single frame.
   * 
   * @param {number} frameIndex - Frame index (-1 for main frame, 0+ for child frames).
   * @param {Object} elementData - Selector descriptor with `id`, `exact`, `type`, `hidden`.
   * @param {number} threshold - Maximum distance to consider elements "close".
   * @returns {Promise<Object|null>} Closest element object or null if none found.
   */
  async _findClosestInFrame(frameIndex, elementData, threshold) {
    return this._withContext(frameIndex, async () => {
      try {
        const result = await this.driver.executeScript(`
          const text = arguments[0];
          const exact = arguments[1];
          const targetType = arguments[2];
          const threshold = arguments[3];
          
          // First find the generic element (label or text) as reference
          const genericResult = window.ElementFinder.findProbableElements('element', text, exact);
          
          if (!genericResult || !genericResult.elements || genericResult.elements.length === 0) {
            return null;
          }
          
          // Get all elements of the target type (never include hidden for fallback search)
          // Fallback should only find closest VISIBLE element, never return hidden elements
          const targetResult = window.ElementFinder.findProbableElements(targetType);
          
          if (!targetResult || !targetResult.elements || targetResult.elements.length === 0) {
            return null;
          }
          
          // Calculate edge proximity distance between two bounding boxes
          function getEdgeProximityDistance(refRect, targetRect) {
            const overlapsX = refRect.left <= targetRect.right && refRect.right >= targetRect.left;
            const overlapsY = refRect.top <= targetRect.bottom && refRect.bottom >= targetRect.top;
            
            if (overlapsX && overlapsY) {
              return 0;
            }
            
            let dx = 0;
            let dy = 0;
            
            if (refRect.left > targetRect.right) {
              dx = refRect.left - targetRect.right;
            } else if (refRect.right < targetRect.left) {
              dx = targetRect.left - refRect.right;
            }
            
            if (refRect.top > targetRect.bottom) {
              dy = refRect.top - targetRect.bottom;
            } else if (refRect.bottom < targetRect.top) {
              dy = targetRect.top - refRect.bottom;
            }
            
            return Math.sqrt(dx * dx + dy * dy);
          }
          
          // Find the closest element to any of the generic elements
          let closestElement = null;
          let minDistance = Infinity;
          
          for (const generic of genericResult.elements) {
            // Skip elements without the element property (from cross-origin iframes)
            if (!generic.element) continue;
            const refRect = generic.element.getBoundingClientRect();
            
            for (const target of targetResult.elements) {
              // Skip elements without the element property (from cross-origin iframes)
              if (!target.element) continue;
              const targetRect = target.element.getBoundingClientRect();
              const distance = getEdgeProximityDistance(refRect, targetRect);
              
              if (distance < minDistance && distance <= threshold) {
                minDistance = distance;
                closestElement = target;
              }
            }
          }
          
          return closestElement;
        `, elementData.id, elementData.exact, elementData.type, threshold);

        if (result) {
          // Attach frameIndex to the result
          result.frameIndex = frameIndex;
        }
        return result;
      } catch {
        return null;
      }
    });
  }

  /**
   * Processes a selector stack and resolves each item into actual WebElement(s).
   *
   * Iterates through the stack and calls findElements() for any item that:
   * - Has a valid element type (button, textbox, element, etc.)
   * - Has not yet been resolved (no matches yet)
   *
   * Processes sequentially because frame switching is stateful on the driver.
   * Other stack items (like 'location' or 'condition') are passed through unchanged.
   *
   * @param {Object[]} stack - Array of selector descriptor items from the stack builder.
   * @returns {Promise<Object[]>} Resolved stack with `matches` arrays populated.
   */
  async resolveElements(stack) {
    const resolvedStack = [];

    for (const item of stack) {
      const newItem = { ...item };

      // Check if this is a flag object (has exact/hidden but no type) that should be merged with previous element
      const isFlagObject = item.type === undefined && 'hidden' in item;
      if (isFlagObject && resolvedStack.length > 0) {
        // Merge flags into the previous element
        const prevItem = resolvedStack[resolvedStack.length - 1];
        if (prevItem && !prevItem.type) {
          // Previous item is also a flag, merge them
          Object.assign(prevItem, newItem);
        } else if (prevItem && Object.keys(ELEMENT_DEFINITIONS).includes(prevItem.type)) {
          // Previous item is an element, merge flags into it
          prevItem.hidden = prevItem.hidden || newItem.hidden;
          prevItem.exact = prevItem.exact || newItem.exact;
        }
        continue; // Skip adding this flag object as a separate item
      }

      // Only resolve items that are element types and don't have matches yet
      if (Object.keys(ELEMENT_DEFINITIONS).includes(newItem.type) && (!newItem.matches || newItem.matches.length === 0)) {
        try {
          newItem.matches = await this.findElements(newItem);
          // For column type, expand to all cells in the same column position
          if (newItem.type === 'column' && newItem.matches.length > 0) {
            newItem.matches = await this._expandColumnMatches(newItem);
          }
        } catch {
          newItem.matches = []; // Empty matches on error
        }
      }

      resolvedStack.push(newItem);
    }

    return resolvedStack;
  }

  /**
   * Expands column matches to include all cells in the same column position.
   * When a column is found by text (e.g., column header "Age"), this method
   * finds all cells in the same column position across all tables.
   *
   * @param {Object} columnItem - The column selector item with matches.
   * @returns {Promise<WebElement[]>} Array of all cells in the column.
   */
  async _expandColumnMatches(columnItem) {
    const originalMatches = columnItem.matches;
    if (originalMatches.length === 0) return originalMatches;

    // Get the first matching element (column header)
    const headerElement = originalMatches[0];
    const frameIndex = headerElement.frameIndex;

    // First, get the cell index within its row
    const headerCellIndex = await this.driver.executeScript(`
      const el = arguments[0];
      return Array.from(el.parentElement.children).indexOf(el);
    `, headerElement);

    // Now find all cells in the same column position across all tables
    // Return elements with their bounding box data already computed
    const expandedMatches = await this.driver.executeScript(`
      const cellIndex = arguments[0];
      const allElements = [];

      // Find all tables in the document
      const tables = document.querySelectorAll('table, [role="table"]');

      for (const table of tables) {
        // Find all rows in the table
        const rows = table.querySelectorAll('tr, [role="row"]');

        for (const row of rows) {
          const cells = row.children;
          if (cells.length > cellIndex) {
            const cell = cells[cellIndex];
            // Check if this cell matches the column type (td, th, or cell roles)
            const tagName = cell.tagName.toLowerCase();
            const role = cell.getAttribute('role');
            if (tagName === 'td' || tagName === 'th' || role === 'cell' || role === 'gridcell' || role === 'columnheader') {
              const rect = cell.getBoundingClientRect();
              allElements.push({
                element: cell,
                tagName: tagName,
                boundingBox: {
                  x: rect.x,
                  y: rect.y,
                  width: rect.width,
                  height: rect.height,
                  top: rect.top,
                  bottom: rect.bottom,
                  left: rect.left,
                  right: rect.right,
                  midx: rect.x + rect.width / 2,
                  midy: rect.y + rect.height / 2
                },
                inViewport: rect.top >= 0 && rect.left >= 0 && rect.bottom <= window.innerHeight && rect.right <= window.innerWidth
              });
            }
          }
        }
      }

      return allElements;
    `, headerCellIndex);

    if (expandedMatches && expandedMatches.length > 0) {
      // Convert to WebElements with proper metadata
      return expandedMatches.map((item) => {
        const webElement = item.element;
        webElement.frameIndex = frameIndex;
        webElement.tagName = item.tagName;
        webElement.boundingBox = item.boundingBox;
        webElement.isHidden = item.isHidden;
        webElement.inViewport = item.inViewport;
        return webElement;
      });
    }

    return originalMatches;
  }

  /**
   * Resolves a selector stack into a single WebElement.
   *
   * **Algorithm:**
   * 1. Resolve all stack items into WebElement arrays
   * 2. Process stack from BOTTOM TO TOP (reverse order):
   *    - Spatial filters are paired with their target element
   *    - Apply spatial constraint to filter matches
   *    - Select by index (1-based), defaulting to first match
   * 3. Ensure driver is in correct frame before returning
   * 4. Apply debug highlighting if enabled
   *
   * **Error Handling:**
   * - Throws ReferenceError if any step yields zero matches
   * - Includes stack context in error message for debugging
   *
   * @param {Object[]} stack - Array of selector descriptor items from the stack builder.
   * @returns {Promise<WebElement>} The final resolved WebElement.
   * @throws {ReferenceError} If a matching element is not found at any stack level.
   */
  async find(stack) {
    const data = await this.resolveElements(stack);
    let currentElement = null;
    let lastElementId = null;

    // Process from bottom of stack up
    for (let i = data.length - 1; i >= 0; i--) {
      const item = data[i];

      try {
        if (item.type === 'location') {
          // Spatial filter: current item is location, target is next item
          const target = data[--i];

          // For spatial filters with multiple reference elements (common in multi-element pages),
          // we need to pass all reference element matches to relativeSearch so it can check
          // against any of them (similar to findAll behavior)
          const referenceMatches = Array.isArray(currentElement) ? currentElement : [currentElement];

          let results;
          // When 'within' has the parent flag, use DOM containment instead of spatial filtering
          if (item.located === 'within' && item.parent === true) {
            if (referenceMatches.length === 1) {
              results = await this.#checkContainment(referenceMatches[0], target.matches);
            } else {
              // Multiple reference elements: check containment against each
              const containedSet = new Set();
              for (const ref of referenceMatches) {
                const contained = await this.#checkContainment(ref, target.matches);
                contained.forEach(el => containedSet.add(el));
              }
              results = Array.from(containedSet);
            }
          } else {
            // Normal spatial filtering based on bounding box geometry
            results = await this.relativeSearch(target, item, referenceMatches.length === 1 ? referenceMatches[0] : referenceMatches);
          }

          currentElement = results[target.index ? target.index - 1 : 0];

          if (!currentElement) {
            // For location items, report the target element's id with the context element's id
            const relation = item.located || 'within';
            throw new ReferenceError(`Matching element for '${target.id}' ${relation} '${lastElementId}' was not found.`);
          }
        } else {
          // Regular element: apply spatial filter (even if no spatial constraint)
          const results = await this.relativeSearch(item);
          
          // Check if the next element (in reverse, i.e., previous in forward order) is a location
          // If so, keep all matches to pass to the location filter, not just the first
          // BUT: Only do this for element types that are reference elements (like element(), not row/column)
          // Row/column spatial relationships need careful handling, so use first match only
          const nextIsLocation = (i - 1 >= 0) && data[i - 1]?.type === 'location';
          const isSpatialReference = nextIsLocation && !['row', 'column', 'table'].includes(item.type);
          
          if (isSpatialReference) {
            // Keep all matches for the location filter to use as reference elements
            currentElement = results;
          } else {
            // Extract single element for non-location usage
            currentElement = results[item.index ? item.index - 1 : 0];
          }
          
          // Track the id for error messages in subsequent location items
          lastElementId = item.id;
          
          if (!currentElement || (Array.isArray(currentElement) && currentElement.length === 0)) {
            throw new ReferenceError(`Matching element for '${item.id}' was not found.`);
          }
        }
      } catch (err) {
        if (err instanceof ReferenceError) {
          throw err; // Re-throw ReferenceErrors as-is
        }
        // Wrap other errors with context
        throw new Error(`Stack resolution failed at index ${i}: ${err.message}`, { cause: err });
      }
    }

    // Ensure driver is in the correct frame for the final element
    try {
      await this.driver.switchTo().defaultContent();
      if (currentElement.frameIndex >= 0) {
        await this.driver.switchTo().frame(currentElement.frameIndex);
      }
    } catch {
      // Don't throw - element may still be valid even if frame switch fails
    }

    // Highlight the element with a thick red box when debug is enabled
    if (this.debug) {
      try {
        await this.driver.executeScript(`
          const el = arguments[0];
          el.style.outline = '4px solid red';
          el.style.outlineOffset = '2px';
        `, currentElement);
      } catch (err) {
        log.warn('Failed to highlight element:', err.message);
      }
    }

    return currentElement;
  }

  /**
   * Resolves the entire stack and returns all matching elements.
   *
   * **Algorithm:**
   * 1. Resolve all stack items into WebElement arrays
   * 2. Process stack from BOTTOM TO TOP:
   *    - Apply spatial filters if present
   *    - Keep ALL matches (not just first)
   *    - Use first match as context for next level's spatial filter
   * 3. Return complete array of final matches
   *
   * Used for fetching multiple elements matching criteria, supporting OR conditions
   * and spatial/relative searches on the entire result set.
   *
   * @param {Object[]} stack - Array of selector descriptor items from the stack builder.
   * @returns {Promise<WebElement[]>} Array of all matching WebElements.
   * @throws {ReferenceError} If any step in the chain yields zero matches.
   */
  async findAll(stack) {
    // 1. Resolve all stack items into physical WebElements
    const data = await this.resolveElements(stack);

    // Check if this is a simple column query (just column with text, no spatial filters)
    // If so, expand to all cells in that column
    if (data.length === 1 && data[0].type === 'column' && data[0].id) {
      const expandedMatches = await this._expandColumnMatches(data[0]);
      if (expandedMatches.length > 0) {
        return expandedMatches;
      }
    }

    // Find the primary (first) non-location element
    let primaryElementIndex = -1;
    for (let i = 0; i < data.length; i++) {
      if (data[i].type !== 'location') {
        primaryElementIndex = i;
        break;
      }
    }

    if (primaryElementIndex === -1) {
      throw new Error('No element type found in stack');
    }

    // Start with the primary element's matches
    let candidates = data[primaryElementIndex].matches || [];
    let lastContextId = data[primaryElementIndex].id;

    // 2. Process spatial filters that come AFTER the primary element
    // These filters should be applied sequentially to refine the candidate set
    let i = primaryElementIndex + 1;
    while (i < data.length) {
      const item = data[i];

      if (item.type === 'location') {
        // This is a spatial filter
        const locationFilter = item;
        const referenceElement = data[i + 1];

        if (!referenceElement) {
          throw new Error(`Spatial filter '${locationFilter.located}' has no reference element`);
        }

        // Skip the reference element in the next iteration
        i += 2;

        // Apply this spatial filter to the current candidates
        const refMatches = referenceElement.matches;
        if (!refMatches || refMatches.length === 0) {
          throw new ReferenceError(`Reference element '${referenceElement.id}' for '${locationFilter.located}' not found`);
        }

        // Filter the candidates using this spatial relationship
        // When 'within' has the parent flag, use DOM containment instead of spatial filtering
        if (locationFilter.located === 'within' && locationFilter.parent === true) {
          const containedSet = new Set();
          for (const ref of refMatches) {
            const contained = await this.#checkContainment(ref, candidates);
            contained.forEach(el => containedSet.add(el));
          }
          candidates = Array.from(containedSet);
        } else {
          candidates = await this.relativeSearch({ matches: candidates }, locationFilter, refMatches);
        }

        if (candidates.length === 0) {
          throw new ReferenceError(
            `No elements found matching '${lastContextId}' ${locationFilter.located} '${referenceElement.id}'`
          );
        }
      } else {
        i++;
      }
    }

    // 3. Process spatial filters that come BEFORE the primary element (backward chain)
    // These are reference elements for the primary element selector
    if (primaryElementIndex > 0) {
      // There are elements before the primary element
      // Process them from the end backward
      let refCandidates = candidates;
      
      for (let i = primaryElementIndex - 1; i >= 0; i--) {
        const item = data[i];

        if (item.type === 'location') {
          // This is a spatial filter
          const locationFilter = item;
          const referenceElement = data[i - 1];

          if (!referenceElement) {
            throw new Error(`Spatial filter '${locationFilter.located}' has no reference element`);
          }

          // Skip the reference element in the next iteration
          i--;

          // Apply this spatial filter
          const refMatches = referenceElement.matches;
          if (!refMatches || refMatches.length === 0) {
            throw new ReferenceError(`Reference element for '${locationFilter.located}' not found`);
          }

          // Filter the candidates using this spatial relationship
          // When 'within' has the parent flag, use DOM containment instead of spatial filtering
          if (locationFilter.located === 'within' && locationFilter.parent === true) {
            const containedSet = new Set();
            for (const ref of refMatches) {
              const contained = await this.#checkContainment(ref, refCandidates);
              contained.forEach(el => containedSet.add(el));
            }
            refCandidates = Array.from(containedSet);
          } else {
            refCandidates = await this.relativeSearch({ matches: refCandidates }, locationFilter, refMatches);
          }

          if (refCandidates.length === 0) {
            const relation = locationFilter.located || 'within';
            throw new ReferenceError(`No elements found matching '${lastContextId}' ${relation} reference`);
          }
        }
      }

      candidates = refCandidates;
    }

    // 4. Apply index selection to the final result set when requested.
    // For findAll(), an explicit index returns only that occurrence while no index returns all matches.
    const requestedIndex = data[primaryElementIndex].index;
    if (requestedIndex) {
      candidates = candidates.slice(requestedIndex - 1, requestedIndex);
    }

    // Highlight all elements with debug outline
    if (this.debug && candidates.length > 0) {
      try {
        await this.driver.executeScript(`
          Array.from(arguments).forEach(el => {
            el.style.outline = '4px solid red';
            el.style.outlineOffset = '2px';
          });
        `, ...candidates);
      } catch (err) {
        log.warn('Failed to highlight elements:', err.message);
      }
    }

    // 5. Return the final collection of elements
    return candidates;
  }
}