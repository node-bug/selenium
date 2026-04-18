import { By } from 'selenium-webdriver';
import { ElementTypes } from './element-types.js';

export class LocatorStrategy extends ElementTypes {
  set driver(value) { this._driver = value; }
  get driver() { return this._driver; }

  /**
   * Helper to switch context safely
   */
  async #withContext(frame, callback) {
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

  async findChildElements(parent, childData) {
    return this.#withContext(parent.frame, async () => {
      const xpath = this.getSelectors(childData.id, childData.exact)[childData.type];
      const elements = await parent.findElements(By.xpath(xpath));

      const results = await Promise.all(
        elements.map(async (el) => {
          el.frame = parent.frame;
          return this.addQualifiers(el);
        })
      );

      return results.filter(e => e.rect.height > 0 && e.rect.width > 0);
    });
  }

  async relativeSearch(item, rel, relativeElement) {
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

  async addQualifiers(elements) {
    const targets = Array.isArray(elements) ? elements : [elements];
    if (targets.length === 0) return [];

    const stats = await this.driver.executeScript(`
      return Array.from(arguments).map(el => {
        const r = el.getBoundingClientRect();
        return {
          x: r.x, y: r.y, width: r.width, height: r.height,
          top: r.top, bottom: r.bottom, left: r.left, right: r.right,
          tagName: el.tagName.toLowerCase()
        };
      });
    `, ...targets);

    return targets.map((el, i) => {
      const s = stats[i];
      el.tagName = s.tagName;
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
    const winner = await this.addQualifiers(sortedCandidates[0]);

    // Clean up temporary property
    delete winner.distance;

    return winner;
  }

  async findElements(elementData) {
    const found = [];
    const frames = await this.driver.findElements(By.xpath('//iframe'));
    const frameIndices = [-1, ...frames.keys()]; // -1 represents default content

    for (const i of frameIndices) {
      await this.#withContext(i, async () => {
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
    return found;
  }

  /**
   * Iterates through the stack and finds the actual WebElements 
   * for any entry that doesn't have matches yet.
   */
  async resolveElements(stack) {
    const ELEMENT_TYPES = new Set([
      'element', 'button', 'radio', 'textbox', 'checkbox',
      'dropdown', 'option', 'image', 'row', 'column',
      'toolbar', 'link', 'dialog', 'file'
    ]);

    // Map through the stack and resolve each item
    // We use a loop here because finding elements involves frame switching, 
    // which is a stateful operation on the driver and cannot be done in parallel.
    const resolvedStack = [];

    for (const item of stack) {
      const newItem = { ...item };

      if (ELEMENT_TYPES.has(newItem.type) && (!newItem.matches || newItem.matches.length === 0)) {
        // FindElements handles the cross-iframe scanning logic
        newItem.matches = await this.findElements(newItem);
      }

      resolvedStack.push(newItem);
    }

    return resolvedStack;
  }

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