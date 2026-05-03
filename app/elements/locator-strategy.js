import { By } from 'selenium-webdriver';
import { ElementTypes } from './element-types.js';

/**
 * Core element-finding strategy that extends {@link ElementTypes} with
 * Selenium WebDriver integration. Handles cross-iframe scanning, spatial
 * filtering (above, below, left, right, within), and stack-based element
 * resolution.
 */
export class LocatorStrategy extends ElementTypes {
  /**
   * @type {import('selenium-webdriver').WebDriver}
   */
  set driver(value) { this._driver = value; }
  get driver() { return this._driver; }

  /**
   * Helper to switch context safely.
   * Switches to the default content, then optionally into a specific frame
   * before executing the callback. Silently swallows NoSuchFrameError.
   *
   * @param {number} frame - The frame index to switch into, or -1 for default content.
   * @param {Function} callback - The async function to execute within the frame context.
   * @returns {Promise<*>} The result of the callback, or null if the frame was not found.
   */
  async _withContext(frame, callback) {
    await this.driver.switchTo().defaultContent();
    if (frame >= 0) {
      try {
        await this.driver.switchTo().frame(frame);
      } catch (err) {
        if (err.name !== 'NoSuchFrameError') throw err;
        return null;
      }
    }
    return callback();
  }

  /**
   * Finds child elements within a parent element's frame context.
   * Switches to the parent's frame, queries for matching children using
   * the childData selector, qualifies them with bounding-box metadata,
   * and filters out zero-dimension elements.
   *
   * @param {WebElement} parent - The parent WebElement whose frame context to use.
   * @param {Object} childData - The selector descriptor containing `id`, `exact`, and `type`.
   * @returns {Promise<WebElement[]>} Array of qualified child elements with visible dimensions.
   */
  async findChildElements(parent, childData) {
    return this._withContext(parent.frame, async () => {
      const xpath = this.getSelectors(childData.id, childData.exact)[childData.type];
      const elements = await parent.findElements(By.xpath(xpath));

      const qualified = await Promise.all(
        elements.map(async (el) => {
          el.frame = parent.frame;
          return this.addQualifiers(el);
        })
      );

      return qualified.filter(e => e.rect.height > 0 && e.rect.width > 0);
    });
  }

  /**
   * Filters a set of candidate elements based on their spatial relationship
   * to a reference element.
   *
   * Supported locations: 'above', 'below', 'toLeftOf', 'toRightOf', 'within'.
   * When `rel.exactly` is true, the filter also requires horizontal (for above/below)
   * or vertical (for left/right) alignment within a 5px buffer.
   * For 'within', the filter checks that the candidate's midpoint lies inside
   * the reference element's bounding box.
   *
   * If no relative constraint is provided, returns `item.matches` unchanged.
   *
   * @param {Object} item - The stack item containing `type` and `matches` array.
   * @param {Object} [rel] - The relative constraint object with `located` and optional `exactly`.
   * @param {WebElement} [relativeElement] - The reference element to compare positions against.
   * @returns {Promise<WebElement[]>} Filtered array of elements matching the spatial constraint.
   */
  async relativeSearch(item, rel, relativeElement) {
    if (rel?.located) {
      const validLocations = ['above', 'below', 'toLeftOf', 'toRightOf', 'within'];
      if (!validLocations.includes(rel.located)) {
        throw new ReferenceError(`Location '${rel.located}' is not supported`);
      }
    }

    if (!rel?.located || !relativeElement) return item.matches;

    const { rect: r } = relativeElement;
    const BUFFER = 5;

    const spatialFilters = {
      above: (e) => r.top >= e.rect.bottom && (!rel.exactly || (r.left - BUFFER <= e.rect.left && r.right + BUFFER >= e.rect.right)),
      below: (e) => r.bottom <= e.rect.top && (!rel.exactly || (r.left - BUFFER <= e.rect.left && r.right + BUFFER >= e.rect.right)),
      toLeftOf: (e) => r.left >= e.rect.right && (!rel.exactly || (r.top - BUFFER <= e.rect.top && r.bottom + BUFFER >= e.rect.bottom)),
      toRightOf: (e) => r.right <= e.rect.left && (!rel.exactly || (r.top - BUFFER <= e.rect.top && r.bottom + BUFFER >= e.rect.bottom)),
      within: async (e) => {
        if (item.type === 'element') {
          item.matches = await this.findChildElements(relativeElement, item);
        }
        return (r.left <= e.rect.midx && r.right >= e.rect.midx && r.top <= e.rect.midy && r.bottom >= e.rect.midy);
      }
    };

    const filterFn = spatialFilters[rel.located];
    if (!filterFn) throw new ReferenceError(`Location '${rel.located}' is not supported`);

    // Handle the 'within' async exception separately or use a regular filter
    const results = [];
    for (const el of item.matches) {
      if (await filterFn(el)) results.push(el);
    }
    return results;
  }

  /**
   * Injects bounding-box metadata into WebElement(s) by executing a script
   * in the browser to retrieve `getBoundingClientRect()` data.
   *
   * Adds `tagName` (lowercased) and `rect` (with `midx`/`midy` midpoints)
   * directly onto each WebElement instance.
   *
   * @param {WebElement|WebElement[]|null} elements - Single element, array of elements, or null.
   * @returns {Promise<WebElement[]>} Array of qualified elements with rect metadata.
   */
  async addQualifiers(elements) {
    if (!elements) return []; // Fix for "should handle null elements"
    const targets = Array.isArray(elements) ? elements : [elements];
    if (targets.length === 0) return [];

    const stats = await this.driver.executeScript(`
      return Array.from(arguments).map(el => {
        const r = el.getBoundingClientRect();
        return {
          x: r.x, y: r.y, width: r.width, height: r.height,
          top: r.top, bottom: r.bottom, left: r.left, right: r.right,
          tagName: el.tagName
        };
      });
    `, ...targets);

    return targets.map((el, i) => {
      const s = stats[i];
      el.tagName = s.tagName.toLowerCase();
      el.rect = {
        ...s,
        midx: s.x + s.width / 2,
        midy: s.y + s.height / 2
      };
      return el;
    });
  }

  /**
   * Finds the closest element of a specific type relative to a starting element.
   * Calculated using Euclidean distance between midpoints.
   *
   * @param {WebElement} originElement - The reference element to measure distance from.
   * @param {string} [targetType='element'] - The element type to search for.
   * @returns {Promise<WebElement>} The nearest qualified element, or the origin if no candidates exist.
   */
  async nearestElement(originElement, targetType = 'element') {
    // 1. Find all potential candidates in the same frame
    const xpath = this.getSelectors('', false)[targetType];
    const candidates = await this.driver.findElements(By.xpath(xpath));

    if (candidates.length === 0) return originElement;

    // 2. Optimization: Send all candidates and the origin to the browser 
    // to calculate distances in a single execution.
    const distances = await this.driver.executeScript(`
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
        
        // Euclidean distance formula: sqrt((x2-x1)^2 + (y2-y1)^2)
        return Math.sqrt(
          Math.pow(targetMid.x - originMid.x, 2) + 
          Math.pow(targetMid.y - originMid.y, 2)
        );
      });
    `, originElement, ...candidates);

    // 3. Map distances back to elements and sort
    const sortedCandidates = candidates
      .map((el, index) => {
        el.distance = distances[index];
        el.frame = originElement.frame;
        return el;
      })
      .sort((a, b) => a.distance - b.distance);

    // 4. Qualify the winner (add rect and midx/midy)
    const [winner] = await this.addQualifiers(sortedCandidates[0]);

    // Clean up temporary property
    delete winner.distance;

    return winner;
  }

  /**
   * Finds all matching elements across all frames (including default content).
   *
   * Primary pass: queries using the requested element type's XPath selector.
   * Fallback pass (if primary yields no results): queries using the generic
   * 'element' selector, then replaces each match with the nearest element
   * of the requested type via {@link nearestElement}.
   *
   * Results are qualified with bounding-box metadata and filtered by visibility
   * (or hidden status, if `elementData.hidden` is true).
   *
   * @param {Object} elementData - The selector descriptor containing `id`, `exact`, `type`, and `hidden`.
   * @returns {Promise<WebElement[]>} Array of qualified matching elements across all frames.
   */
  async findElements(elementData) {
    const found = [];
    const frames = await this.driver.findElements(By.xpath('//iframe'));
    const frameIndices = [-1, ...frames.keys()]; // -1 represents default content

    for (const i of frameIndices) {
      await this._withContext(i, async () => {
        const xpaths = this.getSelectors(elementData.id, elementData.exact);
        const targetXpath = xpaths[elementData.type] || xpaths['element'];

        let elements = await this.driver.findElements(By.xpath(targetXpath));

        if (elements.length > 0) {
          // 1. Tag the elements with the frame index first
          elements.forEach(el => el.frame = i);

          // 2. Pass the WHOLE array to addQualifiers (much faster, 1 driver call)
          const qualified = await this.addQualifiers(elements);

          // 3. Define the filter
          const filter = elementData.hidden
            ? (e) => e.rect.height < 1 || e.rect.width < 1
            : (e) => e.rect.height > 0 && e.rect.width > 0;

          // 4. Filter and push
          found.push(...qualified.filter(filter));
        }
      });
    }

    if (found.length < 1) {
      const frames = await this.driver.findElements(By.xpath('//iframe'));
      const frameIndices = [-1, ...frames.keys()]; // -1 represents default content

      for (const i of frameIndices) {
        await this._withContext(i, async () => {
          const xpaths = this.getSelectors(elementData.id, elementData.exact);
          const targetXpath = xpaths['element'];

          let elements = await this.driver.findElements(By.xpath(targetXpath));
          for (const [index, element] of elements.entries()) {
            elements[index] = await this.nearestElement(element, elementData.type)
          }

          if (elements.length > 0) {
            // 1. Tag the elements with the frame index first
            elements.forEach(el => el.frame = i);

            // 2. Pass the WHOLE array to addQualifiers (much faster, 1 driver call)
            const qualified = await this.addQualifiers(elements);

            // 3. Define the filter
            const filter = elementData.hidden
              ? (e) => e.rect.height < 1 || e.rect.width < 1
              : (e) => e.rect.height > 0 && e.rect.width > 0;

            // 4. Filter and push
            found.push(...qualified.filter(filter));
          }
        });
      }
    }
    return found;
  }

  /**
   * Iterates through the stack and finds the actual WebElements
   * for any entry that doesn't have matches yet.
   *
   * Processes items sequentially because frame switching is a stateful
   * operation on the driver and cannot be done in parallel.
   *
   * @param {Object[]} stack - Array of selector descriptor items from the stack builder.
   * @returns {Promise<Object[]>} Resolved stack with `matches` arrays populated on each item.
   */
  async resolveElements(stack) {
    const ELEMENT_TYPES = new Set([
      'link', 'navigation', 'heading',
      'button', 'checkbox', 'switch', 'radio', 'slider', 'dropdown',
      'textbox', 'file',
      'list', 'listitem', 'menu', 'menuitem',
      'toolbar', 'dialog',
      'row', 'column',
      'image',
      'element'
    ]);

    // Map through the stack and resolve each item
    // We use a loop here because finding elements involves frame switching, 
    // which is a stateful operation on the driver and cannot be done in parallel.
    const resolvedStack = [];

    for (const item of stack) {
      const newItem = { ...item };

      if (ELEMENT_TYPES.has(newItem.type) && (!newItem.matches || newItem.matches.length === 0)) {
        // FindElements handles the cross-iframe scanning logic
        newItem.matches = await this.findElements(newItem)
      }

      resolvedStack.push(newItem);
    }

    return resolvedStack;
  }

  /**
   * Resolves a selector stack into a single WebElement.
   *
   * Traverses the resolved stack from bottom to top, applying relative
   * spatial filters and index selection at each step. Throws a
   * ReferenceError if any step yields no matching element.
   *
   * Ensures the driver is switched to the correct frame before returning.
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

      if (item.type === 'location') {
        const target = data[--i];
        const results = await this.relativeSearch(target, item, currentElement);
        currentElement = results[target.index ? target.index - 1 : 0];
      } else {
        const results = await this.relativeSearch(item);
        currentElement = results[item.index ? item.index - 1 : 0];
      }

      if (!currentElement) {
        throw new ReferenceError(`Matching element for '${item.id}' not found.`);
      }
    }

    // Ensure driver is in the correct frame for the final element
    await this.driver.switchTo().defaultContent();
    if (currentElement.frame >= 0) await this.driver.switchTo().frame(currentElement.frame);

    return currentElement;
  }

  /**
   * Resolves the entire stack and returns all matching elements.
   * Supports 'OR' conditions and spatial/relative searches for the whole set.
   *
   * Traverses the resolved stack from bottom to top, maintaining a context
   * element (the first match of each step) for relative spatial filtering.
   *
   * @param {Object[]} stack - Array of selector descriptor items from the stack builder.
   * @returns {Promise<WebElement[]>} Array of all matching WebElements.
   * @throws {ReferenceError} If any step in the chain yields zero matches.
   */
  async findAll(stack) {
    // 1. Resolve logical descriptions into physical WebElements
    const data = await this.resolveElements(stack);

    let elements = [];
    let currentContextElement = null;

    // 2. Traverse the stack from bottom to top (Reverse)
    for (let i = data.length - 1; i >= 0; i--) {
      const item = data[i];
      const isLocation = item.type === 'location';

      if (isLocation) {
        // If we hit a location (above, below, etc.), the target is the NEXT item in the loop
        const target = data[--i];

        // We perform a relative search against the 'currentContextElement' 
        // established by the previous step in the chain
        elements = await this.relativeSearch(target, item, currentContextElement);
      } else {
        // Standard search or the start of a chain
        elements = await this.relativeSearch(item);
      }

      // In a findAll chain, the 'context' for the next step is usually 
      // the first match of the current set (standard index behavior)
      currentContextElement = elements[0];

      if (elements.length === 0) {
        throw new ReferenceError(
          `'${item.id}' ${isLocation ? item.located : ''} resulted in 0 matching elements.`
        );
      }
    }

    // 3. Return the final collection of elements
    return elements;
  }
}