/**
 * Refactored Locator Strategy
 * 
 * Core element-finding strategy using modular components:
 * - ShadowDOMScanner for shadow DOM traversal
 * - FrameContextManager for frame switching
 * - Element qualifier for bounding box metadata
 * - Spatial filters for relative positioning
 * 
 * Implements a two-pass finding strategy:
 * 1. Direct matching by element type + text/attribute content
 * 2. Fallback: find nearest element of target type (for custom components)
 */

import { By } from 'selenium-webdriver';
import { generateXPathSelectors, isValidElementType } from './element-types-refactored.js';
import { ShadowDOMScanner } from './shadow-dom-scanner.js';
import { FrameContextManager } from './frame-context.js';
import { addBoundingBoxMetadata, filterByVisibility, highlightElements } from './element-qualifier.js';
import { filterBySpatialRelation } from './spatial-filters.js';

/**
 * Default configuration for element finding.
 */
const DEFAULT_CONFIG = {
  alignmentBuffer: 5,
  proximityDistance: 100,
  directionalPenalty: 5,
  maxFrameDepth: 10,
  maxShadowDepth: 10,
  enableCrossFrameSearch: true,
  debug: false
};

/**
 * Refactored locator strategy for finding and filtering elements.
 */
export class LocatorStrategy {
  #config;
  #driver;
  #shadowScanner;
  #frameContext;

  /**
   * @param {WebDriver} driver - Selenium WebDriver instance
   * @param {Object} [config] - Configuration options
   */
  constructor(driver, config = {}) {
    this.#driver = driver;
    this.#config = { ...DEFAULT_CONFIG, ...config };
    this.#shadowScanner = new ShadowDOMScanner(driver, {
      maxShadowDepth: this.#config.maxShadowDepth
    });
    this.#frameContext = new FrameContextManager(driver, this.#config.debug);
  }

  get config() { return { ...this.#config }; }
  get debug() { return this.#config.debug; }

  /**
   * Configure locator strategy (useful for advanced customization).
   * 
   * @param {Object} options - Configuration overrides
   */
  configure(options = {}) {
    Object.assign(this.#config, options);
  }

  /**
   * Clears internal caches (shadow DOM, etc.).
   * Useful when page content changes dynamically.
   */
  clearCaches() {
    this.#shadowScanner.clearCache();
  }

  /**
   * Finds all matching elements across all frames using two-pass strategy.
   * 
   * **Pass 1: Direct Matching**
   * Query using the element type's XPath selector.
   * Returns immediately if matches found.
   * 
   * **Pass 2: Fallback - Nearest Matching**
   * If Pass 1 finds nothing:
   * - Find generic element matches
   * - Calculate nearest element of target type using Euclidean distance
   * - Returns the closest match
   * 
   * Results are qualified with bounding-box metadata and filtered by visibility.
   * 
   * @param {Object} selector - Selector descriptor
   * @param {string} selector.id - Text/attribute to match (null for type-only)
   * @param {boolean} selector.exact - Exact vs substring matching
   * @param {string} selector.type - Element type (button, textbox, etc.)
   * @param {boolean} [selector.hidden] - Include hidden elements
   * @returns {Promise<WebElement[]>} Array of qualified matching elements
   */
  async findElements(selector) {
    if (!isValidElementType(selector.type)) {
      throw new Error(`Invalid element type: ${selector.type}`);
    }

    // PASS 1: Direct matching
    let found = await this.#scanAllFrames(selector);
    if (found.length > 0) return found;

    // PASS 2: Fallback to nearest element
    if (this.debug) {
      console.warn(
        `No direct matches for '${selector.id}' of type '${selector.type}'. ` +
        'Using fallback: nearest element strategy.'
      );
    }

    return await this.#findNearestElements(selector);
  }

  /**
   * Scans all frames (including default content) for matching elements.
   * 
   * @private
   * @returns {Promise<WebElement[]>} Qualified elements across all frames
   */
  async #scanAllFrames(selector) {
    const found = [];
    const frameIndices = await this.#frameContext.getFrameIndices(By);

    for (const frameIndex of frameIndices) {
      const frameResults = await this.#scanFrame(frameIndex, selector);
      if (frameResults) {
        found.push(...frameResults);
      }
    }

    return found;
  }

  /**
   * Scans a single frame for matching elements.
   * 
   * @private
   * @param {number} frameIndex - Frame to scan
   * @param {Object} selector - Selector descriptor
   * @returns {Promise<WebElement[]|null>} Frame results or null if frame unavailable
   */
  async #scanFrame(frameIndex, selector) {
    return this.#frameContext.withFrameContext(frameIndex, async () => {
      try {
        // XPath query for direct match
        const xpaths = generateXPathSelectors(selector.id, selector.exact);
        const xpath = xpaths[selector.type];

        const elements = await this.#driver.findElements(By.xpath(xpath));
        if (elements.length === 0) {
          return [];
        }

        // Tag with frame context
        elements.forEach(el => el.frame = frameIndex);

        // Add bounding box metadata
        const qualified = await addBoundingBoxMetadata(this.#driver, elements);

        // Filter by visibility
        const filtered = filterByVisibility(qualified, selector.hidden);
        
        return filtered;
      } catch (err) {
        if (this.debug) {
          console.error(`Error scanning frame ${frameIndex}:`, err.message);
        }
        return [];
      }
    });
  }

  /**
   * Finds nearest elements when direct matching fails.
   * 
   * @private
   * @returns {Promise<WebElement[]>} Nearest matching elements
   */
  async #findNearestElements(selector) {
    const found = [];
    const frameIndices = await this.#frameContext.getFrameIndices(By);

    for (const frameIndex of frameIndices) {
      const frameResults = await this.#frameContext.withFrameContext(frameIndex, async () => {
        try {
          // Find generic element matches
          const xpaths = generateXPathSelectors(selector.id, selector.exact);
          const genericElements = await this.#driver.findElements(By.xpath(xpaths.element));

          if (genericElements.length === 0) {
            return [];
          }

          // For each generic match, find nearest element of target type
          const nearestElements = [];
          for (const element of genericElements) {
            try {
              const nearest = await this.#findNearestOfType(element, selector.type);
              if (nearest && nearest !== element) {
                nearestElements.push(nearest);
              }
            } catch (err) {
              if (this.debug) {
                console.warn(`Failed to find nearest '${selector.type}':`, err.message);
              }
            }
          }

          if (nearestElements.length === 0) {
            return [];
          }

          // Qualify and filter
          nearestElements.forEach(el => el.frame = frameIndex);
          const qualified = await addBoundingBoxMetadata(this.#driver, nearestElements);
          return filterByVisibility(qualified, selector.hidden);
        } catch (err) {
          if (this.debug) {
            console.error(`Fallback search failed in frame ${frameIndex}:`, err.message);
          }
          return [];
        }
      });

      if (frameResults) {
        found.push(...frameResults);
      }
    }

    return found;
  }

  /**
   * Finds the nearest element of a specific type.
   * 
   * @private
   * @param {WebElement} originElement - Reference element
   * @param {string} targetType - Element type to find
   * @returns {Promise<WebElement>} Nearest element of target type
   */
  async #findNearestOfType(originElement, targetType) {
    const xpaths = generateXPathSelectors(null, false);
    const xpath = xpaths[targetType];

    let candidates;
    try {
      candidates = await this.#driver.findElements(By.xpath(xpath));
    } catch (err) {
      if (this.debug) {
        console.warn(`Failed to find candidates of type '${targetType}':`, err.message);
      }
      return originElement;
    }

    if (candidates.length === 0) {
      return originElement;
    }

    try {
      // Calculate distances and find nearest
      const distances = await this.#driver.executeScript(`
        const origin = arguments[0].getBoundingClientRect();
        const originMid = { 
          x: origin.left + origin.width / 2, 
          y: origin.top + origin.height / 2 
        };

        return Array.from(arguments).slice(1).map(el => {
          const r = el.getBoundingClientRect();
          const targetMid = { 
            x: r.left + r.width / 2, 
            y: r.top + r.height / 2 
          };
          
          let dx = targetMid.x - originMid.x;
          let dy = targetMid.y - originMid.y;

          // Apply directional penalty to prefer forward matches
          const penaltyFactor = ${this.#config.directionalPenalty};
          const weightedDx = dx < 0 ? dx * penaltyFactor : dx;
          const weightedDy = dy < 0 ? dy * penaltyFactor : dy;

          return Math.sqrt(Math.pow(weightedDx, 2) + Math.pow(weightedDy, 2));
        });
      `, originElement, ...candidates);

      // Find element with minimum distance
      let minIndex = 0;
      let minDistance = distances[0];
      for (let i = 1; i < distances.length; i++) {
        if (distances[i] < minDistance) {
          minDistance = distances[i];
          minIndex = i;
        }
      }

      const winner = candidates[minIndex];
      winner.frame = originElement.frame;

      const qualified = await addBoundingBoxMetadata(this.#driver, winner);
      return qualified.length > 0 ? qualified[0] : originElement;
    } catch (err) {
      if (this.debug) {
        console.error('Error calculating nearest element:', err.message);
      }
      return originElement;
    }
  }

  /**
   * Applies spatial filtering to candidate elements.
   * 
   * @param {WebElement[]} candidates - Candidate elements to filter
   * @param {Object} [spatialRelation] - Spatial constraint descriptor
   * @param {string} [spatialRelation.located] - Spatial relationship (above, below, etc.)
   * @param {boolean} [spatialRelation.exactly] - Require exact alignment
   * @param {WebElement|WebElement[]} [referenceElement] - Reference element(s)
   * @returns {Promise<WebElement[]>} Filtered elements
   */
  async spatialFilter(candidates, spatialRelation, referenceElement) {
    if (!spatialRelation?.located || !referenceElement) {
      return candidates || [];
    }

    return filterBySpatialRelation(candidates, spatialRelation, referenceElement, this.#config);
  }

  /**
   * Finds child elements within a parent element.
   * Used for 'within' spatial filter with element type matching.
   * 
   * @param {WebElement} parent - Parent element
   * @param {Object} childSelector - Child selector descriptor
   * @returns {Promise<WebElement[]>} Child elements matching selector
   */
  async findChildElements(parent, childSelector) {
    if (!parent) {
      return [];
    }

    return this.#frameContext.withFrameContext(parent.frame || -1, async () => {
      try {
        const xpaths = generateXPathSelectors(childSelector.id, childSelector.exact);
        const xpath = xpaths[childSelector.type];

        const elements = await parent.findElements(By.xpath(xpath));
        if (elements.length === 0) {
          return [];
        }

        elements.forEach(el => el.frame = parent.frame);
        const qualified = await addBoundingBoxMetadata(this.#driver, elements);
        return filterByVisibility(qualified, childSelector.hidden);
      } catch (err) {
        if (this.debug) {
          console.error(`Error finding child elements:`, err.message);
        }
        return [];
      }
    });
  }

  /**
   * Highlights elements for debugging (red outline).
   * 
   * @param {WebElement|WebElement[]} elements - Element(s) to highlight
   * @returns {Promise<void>}
   */
  async highlightElements(elements) {
    await highlightElements(this.#driver, elements, 'red', 4);
  }

  /**
   * Resolves a selector stack into a single WebElement.
   * 
   * Processes stack from bottom to top:
   * 1. Resolve all items to WebElement arrays
   * 2. Apply spatial filters if present
   * 3. Select by index (1-based), defaulting to first match
   * 4. Ensure driver is in correct frame
   * 5. Highlight if debug enabled
   * 
   * @param {Object[]} stack - Stack of selector descriptors
   * @returns {Promise<WebElement>} Final resolved element
   * @throws {ReferenceError} If any step yields zero matches
   */
  async find(stack) {
    this.clearCaches();
    const resolved = await this.#resolveStack(stack);
    let currentElement = null;
    let currentMatches = [];

    // Process from bottom of stack up (reverse)
    for (let i = resolved.length - 1; i >= 0; i--) {
      const item = resolved[i];

      try {
        if (item.type === 'location') {
          // Spatial filter: current item is filter, next is target
          const target = resolved[--i];
          const refElement = item.located === 'within' ? currentMatches : currentElement;
          const results = await this.spatialFilter(target.matches, item, refElement);
          
          currentElement = results[target.index ? target.index - 1 : 0];
          currentMatches = results;
        } else {
          // Regular element: apply spatial filter (or pass through)
          const results = await this.spatialFilter(item.matches, null, null);
          currentElement = results[item.index ? item.index - 1 : 0];
          currentMatches = results;
        }

        if (!currentElement) {
          const location = item.type === 'location' ? ` ${item.located}` : '';
          throw new ReferenceError(`Matching element for '${item.id}'${location} not found.`);
        }
      } catch (err) {
        if (err instanceof ReferenceError) {
          throw err;
        }
        throw new Error(`Stack resolution failed at index ${i}: ${err.message}`, { cause: err });
      }
    }

    // Ensure driver is in correct frame
    await this.#frameContext.withFrameContext(currentElement.frame || -1, async () => {});

    // Highlight if debug enabled
    if (this.debug) {
      await this.highlightElements(currentElement);
    }

    return currentElement;
  }

  /**
   * Resolves entire stack and returns all matching elements.
   * 
   * @param {Object[]} stack - Stack of selector descriptors
   * @returns {Promise<WebElement[]>} All matching elements
   * @throws {ReferenceError} If any stack step yields zero matches
   */
  async findAll(stack) {
    this.clearCaches();
    const resolved = await this.#resolveStack(stack);
    let elements = [];
    let currentContextElement = null;
    let currentMatches = [];

    // Process from bottom to top
    for (let i = resolved.length - 1; i >= 0; i--) {
      const item = resolved[i];

      try {
        if (item.type === 'location') {
          const target = resolved[--i];
          const refElement = item.located === 'within' ? currentMatches : currentContextElement;
          elements = await this.spatialFilter(target.matches, item, refElement);
        } else {
          elements = await this.spatialFilter(item.matches, null, null);
        }

        currentContextElement = elements[0];
        currentMatches = elements;

        if (elements.length === 0) {
          const location = item.type === 'location' ? ` ${item.located}` : '';
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

    // Highlight all if debug enabled
    if (this.debug && elements.length > 0) {
      await this.highlightElements(elements);
    }

    return elements;
  }

  /**
   * Resolves all stack items into WebElement arrays.
   * 
   * @private
   * @param {Object[]} stack - Stack items
   * @returns {Promise<Object[]>} Resolved stack with matches populated
   */
  async #resolveStack(stack) {
    const ELEMENT_TYPES = new Set([
      'link', 'navigation', 'heading',
      'button', 'checkbox', 'switch', 'radio', 'slider', 'dropdown',
      'textbox', 'file',
      'list', 'listitem', 'menu', 'menuitem',
      'toolbar', 'dialog',
      'table', 'row', 'column',
      'image',
      'element'
    ]);

    const resolved = [];

    for (const item of stack) {
      const newItem = { ...item };

      if (ELEMENT_TYPES.has(newItem.type) && (!newItem.matches || newItem.matches.length === 0)) {
        try {
          newItem.matches = await this.findElements(newItem);
        } catch (err) {
          if (this.debug) {
            console.error(`Failed to resolve element '${newItem.id}' of type '${newItem.type}':`, err.message);
          }
          newItem.matches = [];
        }
      }

      resolved.push(newItem);
    }

    return resolved;
  }
}

/**
 * Creates a new locator strategy instance.
 * 
 * @param {WebDriver} driver - Selenium WebDriver
 * @param {Object} [config] - Configuration options
 * @returns {LocatorStrategy} New strategy instance
 */
export function createLocatorStrategy(driver, config = {}) {
  return new LocatorStrategy(driver, config);
}
