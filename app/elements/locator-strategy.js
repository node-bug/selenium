import config from '@nodebug/config';
import { log } from '@nodebug/logger';
import { relativeSearch } from './spatial-selection.js';
import { readFile } from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import ELEMENT_DEFINITIONS from '@nodebug/browser-element-finder/element-definitions.json' with { type: 'json' };

// Load ElementFinder script from @nodebug/browser-element-finder package
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const elementFinderPath = join(__dirname, '../../node_modules/@nodebug/browser-element-finder/index.js');

const selenium = config('selenium');

/**
 * Core element-finding strategy with Selenium WebDriver integration.
 * Uses ElementFinder.findElement() for element discovery, with support
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

    try {
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
    } catch (err) {
      if (this.debug) {
        console.warn('Failed to inject ElementFinder:', err.message);
      }
      throw err; // Re-throw to ensure we know if injection fails
    }
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
    } catch (err) {
      // If we can't switch to default content, the driver may be detached
      if (this.debug) console.warn('Failed to switch to default content:', err.message);
      return null;
    }

    if (frameIndex >= 0) {
      try {
        await this.driver.switchTo().frame(frameIndex);
      } catch (err) {
        // Frame doesn't exist, moved, or is inaccessible - this is normal in dynamic pages
        // Only catch NoSuchFrameError, rethrow other errors
        if (err.name === 'NoSuchFrameError') {
          if (this.debug) console.warn(`Frame ${frameIndex} not found`);
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
      } catch (err) {
        if (this.debug) console.warn('Failed to restore default content after callback:', err.message);
      }
    }
  }

  /**
   * Finds child elements within a parent element's frame context.
   *
   * This method is used for the 'within' spatial filter. It switches to the parent's
   * frame and uses ElementFinder to find matching children, then qualifies them
   * with bounding-box metadata and filters out zero-dimension (invisible) elements.
   *
   * @param {WebElement} parent - The parent WebElement whose frame context to use.
   * @param {Object} childData - The selector descriptor containing `id`, `exact`, and `type`.
   * @returns {Promise<WebElement[]>} Array of qualified child elements with visible dimensions.
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

        // Use ElementFinder.findElement with parent parameter for within-element search
        // ElementFinder already computes boundingBox and filters hidden elements
        const elements = await this.driver.executeScript(`
          const parent = arguments[0];
          const type = arguments[1];
          const text = arguments[2];
          const exact = arguments[3];
          
          // Call ElementFinder.findElement with parent parameter
          const result = window.ElementFinder.findElement(type, text, exact, false, parent);
          return result;
        `, parent, childData.type, childData.id, childData.exact);

        if (this.debug) {
          log.debug(`findChildElements: type='${childData.type}', id='${childData.id}', exact=${childData.exact}, result count=${elements?.elements?.length || 0}`);
        }

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
            return webElement;
          });

        return qualified;
      } catch (err) {
        if (this.debug) {
          console.error(`Error finding child elements of type '${childData.type}':`, err.message);
        }
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
    return relativeSearch(item, rel, relativeElement, this);
  }

  /**
   * Finds all matching elements across frames.
   * 
   * Searches frame-by-frame: main frame first, then child frames.
   * Uses ElementFinder.findElement() for element discovery within each frame context.
   *
   * @param {Object} elementData - Selector descriptor with `id`, `exact`, `type`, `hidden`.
   * @returns {Promise<WebElement[]>} Array of qualified matching elements across frames.
   */
  async findElements(elementData) {
    // Ensure ElementFinder is injected
    await this._injectElementFinder();

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

    // 4. If no elements found in any frame, fall back to closest element search
    if (elementData.type !== 'element') {
      const closestResults = await this._findClosestElementOfType(elementData);
      if (closestResults && closestResults.elements && closestResults.elements.length > 0) {
        return closestResults.elements
          .filter(elem => elem.element)
          .map((elem) => {
            const webElement = elem.element;
            webElement.frameIndex = elem.frameIndex;
            webElement.tagName = elem.tagName;
            webElement.boundingBox = elem.boundingBox;
            return webElement;
          });
      }
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
    } catch (err) {
      if (this.debug) {
        console.warn('Failed to get frame count:', err.message);
      }
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
          const includeHidden = arguments[3];
          
          // Call ElementFinder.findElement in current frame context
          const result = window.ElementFinder.findElement(type, text, exact, includeHidden);
          
          return result;
        `, elementData.type, elementData.id, elementData.exact, elementData.hidden);

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
          return webElement;
        });

        // For child frame elements, we need to switch to that frame and find the element
        // This is handled by the findElements method which searches child frames separately
        // We just need to return the main frame elements here

        // Filter by visibility settings
        const visibilityFilter = elementData.hidden
          ? (e) => e.boundingBox.height < 1 || e.boundingBox.width < 1
          : (e) => e.boundingBox.height > 0 && e.boundingBox.width > 0;

        return qualified.filter(visibilityFilter);
      } catch (err) {
        if (this.debug) {
          console.warn(`Error searching in frame ${frameIndex}:`, err.message);
        }
        return [];
      }
    });
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
          const includeHidden = arguments[2];
          const targetType = arguments[3];
          const threshold = arguments[4];
          
          // First find the generic element (label or text) as reference
          const genericResult = window.ElementFinder.findElement('element', text, exact, includeHidden);
          
          if (!genericResult || !genericResult.elements || genericResult.elements.length === 0) {
            return null;
          }
          
          // Get all elements of the target type
          const targetResult = window.ElementFinder.findElement(targetType, null, false, includeHidden);
          
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
        `, elementData.id, elementData.exact, elementData.hidden, elementData.type, threshold);

        if (result) {
          // Attach frameIndex to the result
          result.frameIndex = frameIndex;
        }
        return result;
      } catch (err) {
        if (this.debug) {
          console.warn(`Error finding closest element in frame ${frameIndex}:`, err.message);
        }
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

      // Only resolve items that are element types and don't have matches yet
      if (Object.keys(ELEMENT_DEFINITIONS).includes(newItem.type) && (!newItem.matches || newItem.matches.length === 0)) {
        try {
          newItem.matches = await this.findElements(newItem);
        } catch (err) {
          if (this.debug) {
            console.error(`Failed to resolve element '${newItem.id}' of type '${newItem.type}':`, err.message);
          }
          newItem.matches = []; // Empty matches on error
        }
      }

      resolvedStack.push(newItem);
    }

    return resolvedStack;
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

    // Process from bottom of stack up
    for (let i = data.length - 1; i >= 0; i--) {
      const item = data[i];

      try {
        if (item.type === 'location') {
          // Spatial filter: current item is location, target is next item
          const target = data[--i];

          // For 'within', pass the reference element (not matches array) to find child elements
          const refElement = currentElement;

          const results = await this.relativeSearch(target, item, refElement);
          currentElement = results[target.index ? target.index - 1 : 0];
        } else {
          // Regular element: apply spatial filter (even if no spatial constraint)
          const results = await this.relativeSearch(item);
          currentElement = results[item.index ? item.index - 1 : 0];
        }

        if (!currentElement) {
          const location = item.type === 'location' ? ` ${item.located}` : '';
          throw new ReferenceError(`Matching element for '${item.id}'${location} not found.`);
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
    } catch (err) {
      if (this.debug) {
        log.warn('Failed to switch to final element frame:', err.message);
      }
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

    let elements = [];
    let currentContextElement = null;
    let currentMatches = [];

    // 2. Traverse the stack from bottom to top (Reverse)
    for (let i = data.length - 1; i >= 0; i--) {
      const item = data[i];
      const isLocation = item.type === 'location';

      try {
        if (isLocation) {
          // Spatial location: current is the filter, next is the target element
          const target = data[--i];

          // For 'within', pass all matches for multi-reference filtering
          const refElement = item.located === 'within' ? currentMatches : currentContextElement;
          elements = await this.relativeSearch(target, item, refElement);
        } else {
          // Regular element: apply any spatial filter (or pass through if none)
          elements = await this.relativeSearch(item);
        }

        // Set context for next level: use first match as reference point
        currentContextElement = elements[0];
        currentMatches = elements;

        if (elements.length === 0) {
          const location = isLocation ? ` ${item.located}` : '';
          throw new ReferenceError(
            `'${item.id}'${location} resulted in 0 matching elements.`
          );
        }
      } catch (err) {
        if (err instanceof ReferenceError) {
          throw err;
        }
        throw new Error(`Stack resolution failed at index ${i}: ${err.message}`, { cause: err });
      }
    }

    // Highlight all elements with debug outline
    if (this.debug && elements.length > 0) {
      try {
        await this.driver.executeScript(`
          Array.from(arguments).forEach(el => {
            el.style.outline = '4px solid red';
            el.style.outlineOffset = '2px';
          });
        `, ...elements);
      } catch (err) {
        console.warn('Failed to highlight elements:', err.message);
      }
    }

    // 3. Return the final collection of elements
    return elements;
  }
}