import { log } from '@nodebug/logger';
import { Key } from 'selenium-webdriver';
import config from '@nodebug/config';
import Browser from './app/browser/index.js';
import { ElementLocator } from './app/elements/index.js';
import messenger from './app/messenger.js';

const selenium = config('selenium');

/**
 * Main WebBrowser class for Selenium WebDriver operations
 * 
 * This is the primary class for browser automation using Selenium WebDriver.
 * It extends the base Browser class and provides additional functionality
 * for managing browser sessions and alert handling.
 * 
 * @class WebBrowser
 * @extends Browser
 * @property {Array} stack - Stack for managing browser operations
 * @property {Object} capabilities - Browser capabilities configuration
 * @property {Object} driver - Selenium WebDriver instance
 */
class WebBrowser extends Browser {
  #message = '';

  constructor() {
    super()
    this.stack = []
    this.elementlocator = new ElementLocator()
  }

  get message() { return this.#message; }
  set message(value) { this.#message = value; }

  /**
   * Start a new browser session
   * 
   * Initializes a new browser session, cleaning up any existing sessions.
   * 
   * @returns {Promise<void>} Resolves when the browser session is started
   * @example
   * const browser = new WebBrowser();
   * await browser.start();
   */
  async start() {
    try {
      // Use optional chaining for safer session cleanup
      const sessionId = this.driver?.sessionId;
      if (sessionId) {
        await this.close();
        log.info(`Deleted existing session: ${sessionId}`);
      }
    } catch (err) {
      // Cleaned up error string matching
      const ignorable = ["reading 'getSession'", "reading 'sessionId'", "as it is undefined"];
      if (!ignorable.some(msg => err.message.includes(msg))) {
        log.error(`Unrecognized error during session deletion: ${err.message}`);
      }
    }

    await super.new();
  }

  /**
   * Splits the stack into sub-arrays based on 'or' conditions.
   * Optimized to use a single pass with reduce.
   */
  getDescriptions() {
    return this.stack.reduce((acc, curr) => {
      if (curr.type === 'condition' && curr.operator === 'or') {
        acc.push([]);
      } else {
        acc[acc.length - 1].push(curr);
      }
      return acc;
    }, [[]]);
  }

  /**
   * Centralized retry logic for finding elements
   */
  async finder(t = null, action = null) {
    let locator;
    const stacks = this.getDescriptions();
    const timeout = t ?? (selenium.timeout * 1000);
    const endTime = Date.now() + timeout;

    while (Date.now() < endTime) {
      for (const currentStack of stacks) {
        try {
          locator = await this.elementlocator.find(currentStack, action);
          if (locator) return locator;
        } catch {
          continue; // Try next stack in the OR condition
        }
      }
      // Small pause to prevent CPU pegging during retries
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    throw new Error(`Element not found after ${timeout}ms timeout`);
  }

  async write(value) {
    this.message = messenger({ stack: this.stack, action: 'write', data: value });
    try {
      const locator = await this.finder(null, 'write');
      const isInput = ['input', 'textarea'].includes(locator.tagName);

      if (isInput) {
        await locator.sendKeys(value);
      } else {
        // Fallback for custom content-editable fields
        const text = await locator.getAttribute('textContent');
        await this.clicker(locator);
        // Move to end of text
        for (let i = 0; i < text.length; i++) {
          await this.actions().sendKeys(Key.RIGHT).perform();
        }
        await this.actions().sendKeys(value).perform();
      }
    } catch (err) {
      this.#handleError(err, 'entering data');
    } finally {
      this.stack = [];
    }
    return true;
  }

  /**
   * Finds a single element based on the current stack.
   * Resets the stack after execution.
   */
  async find() {
    this.message = messenger({ stack: this.stack, action: 'find' });
    try {
      // finder() handles the retry logic and "OR" conditions
      const locator = await this.finder();
      return locator;
    } catch (err) {
      this.#handleError(err, 'finding element');
    } finally {
      this.stack = [];
    }
  }

  /**
   * Finds all matching elements for the current stack.
   * Resets the stack after execution.
   */
  async findAll(t = null) {
    this.message = messenger({ stack: this.stack, action: 'find' });
    const stacks = this.getDescriptions();
    const timeout = t ?? (selenium.timeout * 1000);
    const endTime = Date.now() + timeout;

    let locators = [];

    while (Date.now() < endTime) {
      try {
        for (const currentStack of stacks) {
          // Call the specialized findAll on the locator
          const results = await this.elementlocator.findAll(currentStack);
          if (results.length > 0) {
            locators = results;
            break;
          }
        }
        if (locators.length > 0) break;
      } catch {
        // Silently retry until timeout
      }
      await new Promise(resolve => setTimeout(resolve, 200));
    }

    if (locators.length === 0) {
      this.stack = [];
      throw new Error(`No elements matching the criteria were found within ${timeout}ms`);
    }

    this.stack = [];
    return locators;
  }

  /**
   * Retrieves the text content of an element.
   * Automatically handles <input> and <textarea> by fetching the 'value' attribute.
   */
  async text() {
    this.message = messenger({ stack: this.stack, action: 'getText' });

    try {
      const locator = await this.finder();

      // 1. Try standard text content first
      let value = await locator.getAttribute('textContent');

      // 2. Fallback for form fields if textContent is empty
      if ((value === null || value.trim() === '') &&
        ['input', 'textarea'].includes(locator.tagName)) {
        value = await locator.getAttribute('value');
      }

      return value?.trim() ?? '';
    } catch (err) {
      this.#handleError(err, 'getting text');
    } finally {
      this.stack = [];
    }
  }

  /**
   * Retrieves a specific attribute from an element.
   */
  async attribute(name) {
    this.message = messenger({ stack: this.stack, action: 'getAttribute', data: name });
    try {
      const locator = await this.finder();
      return await locator.getAttribute(name);
    } catch (err) {
      this.#handleError(err, `getting attribute '${name}'`);
    } finally {
      this.stack = [];
    }
  }

  /**
   * Hovers the mouse over an element.
   */
  async hover() {
    this.message = messenger({ stack: this.stack, action: 'hover' });
    try {
      const locator = await this.finder();
      // Move mouse to the center of the element
      await this.actions().move({ origin: locator }).perform();
    } catch (err) {
      this.#handleError(err, 'hovering');
    } finally {
      this.stack = [];
    }
    return true;
  }

  /**
   * Scrolls an element into the viewport.
   * @param {boolean} alignToTop - If true, top of element aligns to top of viewport.
   */
  async scroll(alignToTop = true) {
    this.message = messenger({ stack: this.stack, action: 'scroll' });
    try {
      const locator = await this.finder();

      // 'smooth' behavior can be added here if desired for visual debugging
      await this.driver.executeScript(
        'arguments[0].scrollIntoView({ behavior: "instant", block: arguments[1] ? "start" : "end" });',
        locator,
        alignToTop
      );

      // Optional: Horizontal scroll handling for tables or carousels
      if (alignToTop === 'right') {
        await this.driver.executeScript('arguments[0].scrollLeft = arguments[0].scrollWidth;', locator);
      }
    } catch (err) {
      this.#handleError(err, 'scrolling into view');
    } finally {
      this.stack = [];
    }
    return true;
  }

  // Common Error Handler Helper
  #handleError(err, context) {
    log.error(`${this.message}\nError while ${context}.\n${err.stack}`);
    this.stack = [];
    err.message = `Error while ${this.message}\n${err.message}`;
    throw err;
  }

  async click(x = null, y = null) {
    this.message = messenger({ stack: this.stack, action: 'click', x, y });
    try {
      const locator = await this.finder();
      await this.clicker(locator, x, y);
    } catch (err) {
      this.#handleError(err, 'clicking');
    } finally {
      this.stack = [];
    }
    return true;
  }

  /**
   * Sets focus on an element using JavaScript.
   */
  async focus() {
    this.message = messenger({ stack: this.stack, action: 'focus' });
    try {
      const locator = await this.finder();
      await this.driver.executeScript('arguments[0].focus();', locator);
    } catch (err) {
      this.#handleError(err, 'focusing');
    } finally {
      this.stack = [];
    }
    return true;
  }

  /**
   * Performs a double-click on the element.
   */
  async doubleClick() {
    this.message = messenger({ stack: this.stack, action: 'doubleclick' });
    try {
      const locator = await this.finder();
      // Actions API is required for true double-click simulation
      await this.actions().doubleClick(locator).perform();
    } catch (err) {
      this.#handleError(err, 'double clicking');
    } finally {
      this.stack = [];
    }
    return true;
  }

  /**
   * Performs a right-click (context click) on the element.
   */
  async rightClick() {
    this.message = messenger({ stack: this.stack, action: 'rightclick' });
    try {
      const locator = await this.finder();
      // contextClick is the Selenium equivalent of a right-click
      await this.actions().contextClick(locator).perform();
    } catch (err) {
      this.#handleError(err, 'right clicking');
    } finally {
      this.stack = [];
    }
    return true;
  }

  async clicker(e, x, y) {
    const hasCoordinates = x !== null && y !== null;

    if (hasCoordinates) {
      const rect = await e.getRect();
      if (x >= rect.width || y >= rect.height) {
        throw new Error(`Click out of bounds: target x:${x} y:${y}, element size ${rect.width}x${rect.height}`);
      }
      const ex = rect.x + parseInt(x, 10);
      const ey = rect.y + parseInt(y, 10);

      await this.actions()
        .move({ x: Math.ceil(ex), y: Math.ceil(ey) })
        .pause(500) // Reduced from 1000 for speed
        .click()
        .perform();
    } else {
      try {
        await e.click();
      } catch (err) {
        // Fallback to JS click if element is blocked or not interactable
        if (['ElementNotInteractableError', 'ElementClickInterceptedError'].includes(err.name)) {
          await this.driver.executeScript('arguments[0].click();', e);
        } else {
          throw err;
        }
      }
    }
  }

  async clear() {
    this.message = messenger({ stack: this.stack, action: 'clear' });
    try {
      const locator = await this.finder(null, 'write');
      const isInput = ['input', 'textarea'].includes(locator.tagName);

      if (isInput) {
        await locator.clear();
        // Fallback check: if it's still not empty, use keyboard shortcuts
        const value = await locator.getAttribute('value');
        if (value !== '') {
          await locator.sendKeys(Key.CONTROL, 'a', Key.BACK_SPACE);
        }
      } else {
        // For Content-Editable elements
        await this.clicker(locator);
        await this.actions().keyDown(Key.CONTROL).sendKeys('a').keyUp(Key.CONTROL).sendKeys(Key.BACK_SPACE).perform();
      }
    } catch (err) {
      this.#handleError(err, 'clearing field');
    } finally {
      this.stack = [];
    }
    return true;
  }

  async overwrite(value) {
    this.message = messenger({ stack: this.stack, action: 'overwrite', data: value });
    try {
      let locator = await this.finder(null, 'write');

      // Perform clear logic
      await this.clear();

      // Re-find in case the clear triggered a DOM refresh (common in React)
      locator = await this.finder(null, 'write');
      await locator.sendKeys(value);
    } catch (err) {
      this.#handleError(err, 'overwriting text');
    } finally {
      this.stack = [];
    }
    return true;
  }

  /**
   * Internal helper to set checkbox state
   * @param {string} targetState - 'check' or 'uncheck'
   */
  async #toggleCheckbox(targetState) {
    try {
      const locator = await this.finder(null, 'check');
      const isChecked = await locator.isSelected();
      const needsChange = (targetState === 'check' && !isChecked) ||
        (targetState === 'uncheck' && isChecked);

      if (needsChange) {
        try {
          await locator.click();
        } catch {
          // Fallback: Many modern checkboxes are 0x0 pixels and covered by a <label>.
          // If Selenium can't "click" it, we force the change via JS.
          log.debug('Standard click failed, attempting JS click for checkbox');
          await this.driver.executeScript('arguments[0].click();', locator);
        }

        // Final verification
        const finalState = await locator.isSelected();
        if (finalState === isChecked) {
          throw new Error(`Failed to ${targetState} checkbox. State did not change.`);
        }
      } else {
        log.info(`Checkbox is already ${targetState}ed. Skipping.`);
      }
    } catch (err) {
      this.#handleError(err, `${targetState}ing checkbox`);
    } finally {
      this.stack = [];
    }
    return true;
  }

  async check() {
    this.message = messenger({ stack: this.stack, action: 'check' });
    return await this.#toggleCheckbox('check');
  }

  async uncheck() {
    this.message = messenger({ stack: this.stack, action: 'uncheck' });
    return await this.#toggleCheckbox('uncheck');
  }

  /**
   * Checks if an element is currently in the DOM and visible.
   * Does not throw an error if not found; returns boolean.
   */
  async isVisible(t = null) {
    this.message = messenger({ stack: this.stack, action: 'isVisible' });
    let found = false;
    try {
      // Use a shorter default timeout for a simple check
      const locator = await this.finder(t ?? 2000);
      found = !!locator;
    } catch (err) {
      log.info(`Element not visible: ${err.message}`);
    } finally {
      this.stack = [];
    }
    return found;
  }

  /**
   * Waits for an element to be visible.
   * Throws an error if the element does not appear within the timeout.
   */
  async isDisplayed(t = null) {
    this.message = messenger({ stack: this.stack, action: 'waitVisibility' });
    try {
      await this.finder(t);
      log.info('Element is visible on page');
      return true;
    } catch (err) {
      this.#handleError(err, 'waiting for visibility');
    } finally {
      this.stack = [];
    }
  }

  /**
   * Waits for an element to disappear or become hidden.
   */
  async isNotDisplayed(t = null) {
    this.message = messenger({ stack: this.stack, action: 'waitInvisibility' });
    const timeout = t ?? (selenium.timeout * 1000);
    const endTime = Date.now() + timeout;

    try {
      while (Date.now() < endTime) {
        try {
          // We check with a very short 500ms timeout per loop
          await this.finder(500);
        } catch {
          // If finder throws, the element is gone. Success!
          log.info('Element is no longer visible');
          return true;
        }
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      throw new Error(`Element still visible after ${timeout}ms`);
    } catch (err) {
      this.#handleError(err, 'waiting for invisibility');
    } finally {
      this.stack = [];
    }
  }

  /**
   * Checks if an element is disabled (has the 'disabled' attribute or property).
   */
  async isDisabled() {
    this.message = messenger({ stack: this.stack, action: 'isDisabled' });
    try {
      const locator = await this.finder();
      // Check both the property and the attribute for maximum compatibility
      const isEnabled = await locator.isEnabled();
      const hasDisabledAttr = await locator.getAttribute('disabled');

      const result = !isEnabled || hasDisabledAttr !== null;
      log.info(`Element is ${result ? 'disabled' : 'enabled'}`);
      return result;
    } catch (err) {
      this.#handleError(err, 'checking if disabled');
    } finally {
      this.stack = [];
    }
  }

  /**
   * Captures a screenshot of a specific element or the entire page.
   * Returns a Base64 encoded string.
   */
  async screenshot() {
    let dataUrl = null;

    // 1. If stack has items, take a screenshot of a specific element
    if (this.stack.length > 0) {
      try {
        this.message = messenger({ stack: this.stack, action: 'screenshot' });
        const locator = await this.finder();
        dataUrl = await locator.takeScreenshot(true);
      } catch (err) {
        log.error(`Failed to capture element screenshot: ${err.message}`);
      }
    }

    // 2. Fallback to full page screenshot
    if (!dataUrl) {
      log.info('Capturing screenshot of the full page');
      dataUrl = await this.driver.takeScreenshot();
    }

    this.stack = [];
    return dataUrl;
  }

  async #switchToElementContext(frame) {
    await this.driver.switchTo().defaultContent();
    if (frame >= 0) {
      try {
        await this.driver.switchTo().frame(frame);
      } catch (err) {
        if (err.name !== 'NoSuchFrameError') throw err;
        log.error(`Frame ${frame} no longer exists.`);
      }
    }
  }

  /**
   * Hides all elements matching the current stack by setting opacity to 0.
   */
  async hide() {
    this.message = messenger({ stack: this.stack, action: 'hide' });
    try {
      const elements = await this.findAll();
      log.debug(`Hiding ${elements.length} matching elements.`);

      for (const e of elements) {
        // Automatically handle context switching for each element
        await this.#switchToElementContext(e.frame, async () => {
          await this.driver.executeScript('arguments[0].style.opacity="0";', e);
        });
      }
    } catch (err) {
      this.#handleError(err, 'hiding elements');
    } finally {
      this.stack = [];
    }
    return true;
  }

  /**
   * Restores visibility to all elements matching the stack.
   */
  async unhide() {
    this.message = messenger({ stack: this.stack, action: 'unhide' });
    try {
      const elements = await this.findAll();
      for (const e of elements) {
        await this.#switchToElementContext(e.frame, async () => {
          await this.driver.executeScript('arguments[0].style.opacity="1";', e);
        });
      }
    } catch (err) {
      this.#handleError(err, 'unhiding elements');
    } finally {
      this.stack = [];
    }
    return true;
  }

  /**
   * Uploads a file to a file input element.
   * @param {string} filePath - Absolute path to the file.
   */
  async upload(filePath) {
    this.message = messenger({ stack: this.stack, action: 'upload', data: filePath });
    try {
      const locator = await this.finder();
      // Selenium's sendKeys handles local file paths for <input type="file">
      await locator.sendKeys(filePath);
    } catch (err) {
      this.#handleError(err, 'uploading file');
    } finally {
      this.stack = [];
    }
    return true;
  }

  // STACK BUILDERS
  // Removed JSON.stringify checks for direct object comparison (much faster)
  #isFlagObject(obj) {
    return obj && typeof obj.exact === 'boolean' && typeof obj.hidden === 'boolean';
  }

  element(data) {
    const member = { type: 'element', id: data.toString(), exact: false, hidden: false, matches: [], index: false };
    const og = this.stack.pop();

    if (this.#isFlagObject(og)) {
      member.exact = og.exact;
      member.hidden = og.hidden;
    } else if (og) {
      this.stack.push(og);
    }

    this.stack.push(member);
    return this;
  }

  exact() {
    const og = this.stack.pop();
    if (this.#isFlagObject(og)) {
      og.exact = true;
      this.stack.push(og);
    } else {
      if (og) this.stack.push(og);
      this.stack.push({ exact: true, hidden: false });
    }
    return this;
  }

  // hidden() {
  //   const og = this.stack.pop();
  //   if (this.#isFlagObject(og)) {
  //     og.hidden = true;
  //     this.stack.push(og);
  //   } else {
  //     if (og) this.stack.push(og);
  //     this.stack.push({ exact: false, hidden: true });
  //   }
  //   return this;
  // }

  typefixer(data, type) {
    this.element(data);
    this.stack[this.stack.length - 1].type = type;
    return this;
  }

  // --- Core Element Types ---

  button(data) { return this.typefixer(data, 'button'); }
  radio(data) { return this.typefixer(data, 'radio'); }
  textbox(data) { return this.typefixer(data, 'textbox'); }
  checkbox(data) { return this.typefixer(data, 'checkbox'); }
  image(data) { return this.typefixer(data, 'image'); }
  toolbar(data) { return this.typefixer(data, 'toolbar'); }
  tab(data) { return this.typefixer(data, 'tab'); }
  link(data) { return this.typefixer(data, 'link'); }
  dialog(data) { return this.typefixer(data, 'dialog'); }
  file(data) { return this.typefixer(data, 'file'); }

  // --- Spatial / Relative Positioners ---

  /**
   * Targets an element above the currently referenced element.
   */
  above() { return this.relativePositioner('above'); }

  /**
   * Targets an element below the currently referenced element.
   */
  below() { return this.relativePositioner('below'); }

  /**
   * Targets an element to the left of the currently referenced element.
   */
  toLeftOf() { return this.relativePositioner('toLeftOf'); }

  /**
   * Targets an element to the right of the currently referenced element.
   */
  toRightOf() { return this.relativePositioner('toRightOf'); }

  /**
   * Targets an element located inside another element.
   */
  within() {
    this.stack.push({ type: 'location', located: 'within' });
    return this;
  }

  /**
   * Targets an element based on proximity.
   */
  near() {
    this.stack.push({ type: 'location', located: 'near' });
    return this;
  }

  // --- Logic & Filter Modifiers ---

  /**
   * forces a strict text match for the next element in the stack.
   */
  exactly() {
    this.stack.push({ exactly: true });
    return this;
  }

  /**
   * Allows searching for hidden elements (opacity: 0 or height/width: 0).
   */
  hidden() {
    // Reuses the flag logic from previous methods
    const og = this.stack.pop();
    if (this.#isFlagObject(og)) {
      og.hidden = true;
      this.stack.push(og);
    } else {
      if (og) this.stack.push(og);
      this.stack.push({ exact: false, hidden: true });
    }
    return this;
  }

  /**
   * Combines multiple search criteria using logical OR.
   */
  or() {
    this.stack.push({ type: 'condition', operator: 'or' });
    return this;
  }

  /**
   * Selects a specific occurrence from a list of matching elements (1-based index).
   */
  atIndex(index) {
    if (typeof index !== 'number') throw new TypeError('index must be a number');
    const last = this.stack[this.stack.length - 1];
    if (last) last.index = index;
    return this;
  }

  /**
   * Internal helper to split the stack into source and target descriptions.
   */
  #getDragDropStacks() {
    const dragIndex = this.stack.findIndex(c => c.type === 'action' && c.perform === 'drag');
    const ontoIndex = this.stack.findIndex(c => c.type === 'action' && c.perform === 'onto');

    if (dragIndex === -1 || ontoIndex === -1) {
      throw new Error('Invalid drag-and-drop stack. Ensure both .drag() and .onto() are used.');
    }

    // Source is everything before .drag()
    const dragStack = this.stack.slice(0, dragIndex);
    // Target is everything after .onto()
    const dropStack = this.stack.slice(ontoIndex + 1);

    return { dragStack, dropStack };
  }

  async drop() {
    const { dragStack, dropStack } = this.#getDragDropStacks();

    try {
      // 1. Find source element
      this.message = messenger({ stack: dragStack, action: 'drag' });
      const dragLocator = await this.elementlocator.find(dragStack);

      // 2. Find target element
      this.message = messenger({ stack: dropStack, action: 'drop' });
      const dropLocator = await this.elementlocator.find(dropStack);

      // 3. Execute precise Action sequence
      const actions = this.driver.actions({ async: true });

      await actions
        .move({ origin: dragLocator, x: 5, y: 5 }) // Small offset to avoid center-point deadzones
        .press()
        .pause(500) // Brief pause to trigger the 'dragstart' event
        .move({ origin: dragLocator, x: 20, y: 20 }) // "Nudge" to confirm drag state
        .pause(200)
        .move({ origin: dropLocator })
        .pause(500) // Wait for target to acknowledge the hover
        .release()
        .perform();

      log.info(`Successfully dragged ${dragStack[0].id} onto ${dropStack[0].id}`);
    } catch (err) {
      this.#handleError(err, 'performing drag and drop');
    } finally {
      this.stack = [];
    }
    return true;
  }

  // --- Stack Builder Methods ---

  drag() {
    this.stack.push({ type: 'action', perform: 'drag' });
    return this;
  }

  onto() {
    this.stack.push({ type: 'action', perform: 'onto' });
    return this;
  }
}

export default WebBrowser
