import { By } from 'selenium-webdriver';
import { Selectors } from './selectors.js';

export class ElementLocator extends Selectors {
  #driver;

  get driver() { return this.#driver; }
  set driver(value) { this.#driver = value; }

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

  /**
   * Optimization: Qualified multiple elements in one browser-side trip.
   */
  async addQualifiers(elements) {
    const targets = Array.isArray(elements) ? elements : [elements];
    if (targets.length === 0) return [];

    const rects = await this.driver.executeScript(`
      return arguments.map(el => {
        const r = el.getBoundingClientRect();
        return {
          x: r.x, y: r.y, width: r.width, height: r.height,
          top: r.top, bottom: r.bottom, left: r.left, right: r.right,
          tagName: el.tagName.toLowerCase()
        };
      });
    `, ...targets);

    return targets.map((el, i) => {
      const r = rects[i];
      el.tagName = r.tagName;
      el.rect = {
        ...r,
        midx: r.x + r.width / 2,
        midy: r.y + r.height / 2
      };
      return el;
    });
  }

  async relativeSearch(item, rel, relativeElement) {
    if (!rel?.located || !relativeElement) return item.matches;

    const { rect: r } = relativeElement;
    const BUFFER = 5;

    const spatialFilters = {
      above:    (e) => e.rect.bottom <= r.top    && (!rel.exactly || (e.rect.left >= r.left - BUFFER && e.rect.right <= r.right + BUFFER)),
      below:    (e) => e.rect.top >= r.bottom   && (!rel.exactly || (e.rect.left >= r.left - BUFFER && e.rect.right <= r.right + BUFFER)),
      toLeftOf: (e) => e.rect.right <= r.left    && (!rel.exactly || (e.rect.top >= r.top - BUFFER && e.rect.bottom <= r.bottom + BUFFER)),
      toRightOf: (e) => e.rect.left >= r.right   && (!rel.exactly || (e.rect.top >= r.top - BUFFER && e.rect.bottom <= r.bottom + BUFFER)),
      within:   async (e) => {
        if (item.type === 'element') item.matches = await this.findChildElements(relativeElement, item);
        return (e.rect.midx >= r.left && e.rect.midx <= r.right && e.rect.midy >= r.top && e.rect.midy <= r.bottom);
      }
    };

    const filterFn = spatialFilters[rel.located];
    if (!filterFn) throw new ReferenceError(`Location '${rel.located}' is not supported`);

    const results = [];
    for (const el of item.matches) {
      if (await filterFn(el)) results.push(el);
    }
    return results;
  }

  async findElements(elementData) {
    const found = [];
    const frames = await this.driver.findElements(By.css('iframe'));
    const frameIndices = [-1, ...Array.from(frames.keys())];

    for (const i of frameIndices) {
      const matches = await this.#withContext(i, async () => {
        const xpaths = this.getSelectors(elementData.id, elementData.exact);
        const elements = await this.driver.findElements(By.xpath(xpaths[elementData.type] || xpaths.element));
        
        if (elements.length === 0) return [];

        const qualified = await this.addQualifiers(elements);
        qualified.forEach(el => el.frame = i);

        return qualified.filter(e => elementData.hidden 
          ? (e.rect.height < 1 || e.rect.width < 1) 
          : (e.rect.height > 0 && e.rect.width > 0)
        );
      });
      if (matches) found.push(...matches);
    }
    return found;
  }

  async find(stack) {
    const data = await this.resolveElements(stack);
    let currentElement = null;

    for (let i = data.length - 1; i >= 0; i--) {
      const item = data[i];
      const isLocation = item.type === 'location';
      const target = isLocation ? data[--i] : item;
      
      const results = await this.relativeSearch(target, isLocation ? item : null, currentElement);
      currentElement = results[target.index ? target.index - 1 : 0];

      if (!currentElement) {
        throw new ReferenceError(`Could not find ${target.id}${isLocation ? ` ${item.located} relative element` : ''}`);
      }
    }

    await this.#withContext(currentElement.frame, () => {}); 
    return currentElement;
  }
}