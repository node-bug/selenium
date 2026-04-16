import { By } from 'selenium-webdriver';
import { Selectors } from './selectors.js';

export class ElementLocator extends Selectors {
  #driver;
  set driver(v) { this.#driver = v; }

  /**
   * Helper to switch context safely
   */
  async #withContext(frame, callback) {
    await this.#driver.switchTo().defaultContent();
    if (frame >= 0) {
      try {
        await this.#driver.switchTo().frame(frame);
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

  async addQualifiers(element) {
    const rect = await this.#driver.executeScript('return arguments[0].getBoundingClientRect();', element);
    element.rect = {
      ...rect,
      midx: rect.x + rect.width / 2,
      midy: rect.y + rect.height / 2
    };
    element.tagName = (await element.getTagName()).toLowerCase();
    return element;
  }

  async findElements(elementData) {
    const found = [];
    const frames = await this.#driver.findElements(By.xpath('//iframe'));
    const frameIndices = [-1, ...frames.keys()]; // -1 represents default content

    for (const i of frameIndices) {
      await this.#withContext(i, async () => {
        const xpaths = this.getSelectors(elementData.id, elementData.exact);
        const targetXpath = xpaths[elementData.type] || xpaths['element'];
        
        let elements = await this.#driver.findElements(By.xpath(targetXpath));
        
        if (elements.length > 0) {
          const qualified = await Promise.all(elements.map(async el => {
            el.frame = i;
            return this.addQualifiers(el);
          }));

          const filter = elementData.hidden 
            ? (e) => e.rect.height < 1 || e.rect.width < 1
            : (e) => e.rect.height > 0 && e.rect.width > 0;

          found.push(...qualified.filter(filter));
        }
      });
    }
    return found;
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
    await this.#driver.switchTo().defaultContent();
    if (currentElement.frame >= 0) await this.#driver.switchTo().frame(currentElement.frame);
    
    return currentElement;
  }
}