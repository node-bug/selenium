import { log } from '@nodebug/logger';
import config from '@nodebug/config';
import Browser from './app/browser/index.js';
import { LocatorStrategy } from './app/elements/locator-strategy.js';
import { SelectorStackBuilder } from './app/elements/selector-stack-builder.js';
import messenger from './app/messenger.js';
import { ClickDelegate } from './app/command-delegates/click-delegate.js';
import { InputDelegate } from './app/command-delegates/input-delegate.js';
import { VisibilityDelegate } from './app/command-delegates/visibility-delegate.js';
import { CheckboxDelegate } from './app/command-delegates/checkbox-delegate.js';
import { SelectDelegate } from './app/command-delegates/select-delegate.js';
import { RadioDelegate } from './app/command-delegates/radio-delegate.js';
import { SwitchDelegate } from './app/command-delegates/switch-delegate.js';
import { SliderDelegate } from './app/command-delegates/slider-delegate.js';
import { DragDropDelegate } from './app/command-delegates/drag-drop-delegate.js';
import { PluginManager } from './app/plugin-manager.js';
import ELEMENT_DEFINITIONS from '@nodebug/browser-element-finder/element-definitions.json' with { type: 'json' };

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
  #tempMods = { control: false, shift: false, alt: false, meta: false };
  #clickDelegate;
  #inputDelegate;
  #visibilityDelegate;
  #checkboxDelegate;
  #selectDelegate;
  #radioDelegate;
  #switchDelegate;
  #sliderDelegate;
  #dragDropDelegate;

  constructor() {
    super()
    this.stack = []
    this.locatorStrategy = new LocatorStrategy()
    this.#clickDelegate = new ClickDelegate(this);
    this.#inputDelegate = new InputDelegate(this);
    this.#visibilityDelegate = new VisibilityDelegate(this);
    this.#checkboxDelegate = new CheckboxDelegate(this);
    this.#selectDelegate = new SelectDelegate(this);
    this.#radioDelegate = new RadioDelegate(this);
    this.#switchDelegate = new SwitchDelegate(this);
    this.#sliderDelegate = new SliderDelegate(this);
    this.#dragDropDelegate = new DragDropDelegate(this);

    Object.keys(ELEMENT_DEFINITIONS).forEach(type => {
      this[type] = (data) => {
        return this.#typefixer(data, type);
      };
    });

    // Initialize plugin manager
    this._pluginManager = new PluginManager(this);
  }

  /**
   * Register a plugin to extend browser functionality at runtime
   * @param {Object|Function} plugin - Plugin object or factory function
   * @param {Object} options - Plugin options
   * @returns {this} Browser instance for chaining
   * @example
   * // Object plugin
   * browser.use({
   *   name: 'my-plugin',
   *   hooks: { beforeClick: (data) => data },
   *   extend: (browser) => ({ customMethod: () => {} })
   * });
   * 
   * // Factory function plugin
   * browser.use((browser, options) => ({
   *   name: 'dynamic-plugin',
   *   extend: () => ({ dynamicMethod: () => {} })
   * }));
   */
  use(plugin, options = {}) {
    this._pluginManager.register(plugin, options);
    this._pluginManager.applyExtensions(this);
    return this;
  }

  /**
   * Get the plugin manager
   * @returns {PluginManager} Plugin manager instance
   */
  get plugins() {
    return this._pluginManager;
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
      // Ensure driver is nullified even if close() fails
      this.driver = null;
    }

    await super.new();
    this.locatorStrategy.driver = this.driver;
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
  async _finder(t = null) {
    let locator;
    const stacks = this.getDescriptions();
    const timeout = t ?? (selenium.timeout * 1000);
    const endTime = Date.now() + timeout;

    while (Date.now() < endTime) {
      for (const currentStack of stacks) {
        try {
          locator = await this.locatorStrategy.find(currentStack);
          if (locator) return locator;
        } catch (err) {
          // Re-throw ReferenceError immediately - it indicates a fundamental problem
          // like "element not found" due to spatial constraints not being met
          if (err instanceof ReferenceError) {
            throw err;
          }
          continue; // Try next stack in the OR condition
        }
      }
      // Small pause to prevent CPU pegging during retries
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    throw new Error(`Element not found after ${timeout}ms timeout`);
  }

  /**
   * Finds a single element based on the current stack.
   * Resets the stack after execution.
   * 
   * @returns {Promise<Object>} WebElement instance
   * @example
   * const element = await browser.element('submit').find();
   */
  async find() {
    this.message = messenger({ stack: this.stack, action: 'find' });
    try {
      // _finder() handles the retry logic and "OR" conditions
      const locator = await this._finder();
      return locator;
    } catch (err) {
      this.handleError(err, 'finding element');
    } finally {
      this.stack = [];
    }
  }

  /**
   * Finds all matching elements for the current stack.
   * Resets the stack after execution.
   * 
   * @param {number} [t] - Custom timeout in milliseconds
   * @returns {Promise<Array>} Array of WebElement instances
   * @throws {Error} If no elements are found within the timeout
   * @example
   * const elements = await browser.element('item').findAll();
   * const links = await browser.link('nav-link').findAll(5000);
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
          const results = await this.locatorStrategy.findAll(currentStack);
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

  // Common Error Handler Helper
  handleError(err, context) {
    log.error(`Error while ${context}.\n${err.stack}`);
    this.stack = [];
    err.message = `Error while ${this.message}\n${err.message}`;
    throw err;
  }

  /**
   * Performs a click on an element.
   * 
   * Clicks on an element at its center or at specified coordinates.
   * Falls back to JavaScript click if Selenium click fails.
   * 
   * @param {number} [x] - X coordinate for click (optional)
   * @param {number} [y] - Y coordinate for click (optional)
   * @returns {Promise<boolean>} True if successful
   * @example
   * await browser.button('submit').click();
   * await browser.element('menu').click(10, 20); // Click at coordinates
   */
  async click(x = null, y = null) {
    return await this.#clickDelegate.click(x, y);
  }

  /**
   * Getter for temporary modifiers state (used by delegates).
   * @private
   */
  get _tempMods() { return { ...this.#tempMods }; }

  /**
   * Resets temporary modifiers and returns the browser for chaining.
   * @private
   */
  _resetMods() {
    this.#tempMods = { control: false, shift: false, alt: false, meta: false };
    return this;
  }

  /**
   * Setter for Shift modifier — flags Shift for the next keyboard/click action.
   * 
   * @returns {WebBrowser} The browser instance for chaining
   * @example
   * await browser.shift.press('a'); // Shift+A
   * await browser.ctrl.shift.press('c'); // Ctrl+Shift+C
   */
  get shift() { this.#tempMods.shift = true; return this; }

  /**
   * Setter for Control modifier — flags Control for the next keyboard/click action.
   * 
   * @returns {WebBrowser} The browser instance for chaining
   * @example
   * await browser.ctrl.press('c'); // Ctrl+C
   * await browser.ctrl.shift.press('c'); // Ctrl+Shift+C
   */
  get ctrl() { this.#tempMods.control = true; return this; }
  get control() { this.#tempMods.control = true; return this; }

  /**
   * Setter for Alt modifier — flags Alt for the next keyboard/click action.
   * 
   * @returns {WebBrowser} The browser instance for chaining
   * @example
   * await browser.alt.press('Tab'); // Alt+Tab
   */
  get alt() { this.#tempMods.alt = true; return this; }

  /**
   * Setter for Meta modifier — flags Meta for the next keyboard/click action.
   * 
   * @returns {WebBrowser} The browser instance for chaining
   * @example
   * await browser.meta.press('w'); // Cmd+W on Mac
   */
  get meta() { this.#tempMods.meta = true; return this; }
  get win() { this.#tempMods.meta = true; return this; }
  get command() { this.#tempMods.meta = true; return this; }

  /**
   * Sets focus on an element using JavaScript.
   * 
   * @returns {Promise<boolean>} True if successful
   * @example
   * await browser.textbox('username').focus();
   * await browser.element('input').focus();
   */
  async focus() {
    return await this.#inputDelegate.focus();
  }

  /**
   * Hovers the mouse over an element.
   * 
   * Moves the mouse cursor to the center of the element to trigger hover states.
   * 
   * @returns {Promise<boolean>} True if successful
   * @example
   * await browser.element('menu').hover();
   * await browser.button('dropdown').hover();
   */
  async hover() {
    return await this.#clickDelegate.hover();
  }

  /**
   * Performs a double-click on the element.
   * 
   * Uses Selenium WebDriver Actions API to simulate a double-click.
   * 
   * @returns {Promise<boolean>} True if successful
   * @example
   * await browser.element('text').doubleClick();
   * await browser.button('edit').doubleClick();
   */
  async doubleClick() {
    return await this.#clickDelegate.doubleClick();
  }

  /**
   * Performs a triple-click on the element.
   * 
   * Uses Selenium WebDriver Actions API to simulate a three consecutive clicks.
   * 
   * @returns {Promise<boolean>} True if successful
   * @example
   * await browser.element('text').tripleClick();
   * await browser.button('edit').tripleClick();
   */
  async tripleClick() {
    return await this.#clickDelegate.tripleClick();
  }

  /**
   * Perform consecutive multiple-clicks on the element.
   * 
   * Uses Selenium WebDriver Actions API to simulate mutliple consecutive clicks.
   * 
   * @returns {Promise<boolean>} True if successful
   * @example
   * await browser.element('text').multipleClick(5);
   * await browser.button('edit').multipleClick(10);
   */
  async multipleClick(times) {
    return await this.#clickDelegate.multipleClick(times);
  }

  /**
   * Performs a right-click (context click) on the element.
   * 
   * Uses Selenium WebDriver Actions API to simulate a right-click.
   * 
   * @returns {Promise<boolean>} True if successful
   * @example
   * await browser.element('context-menu').rightClick();
   * await browser.button('options').rightClick();
   */
  async rightClick() {
    return await this.#clickDelegate.rightClick();
  }

  /**
   * Performs a middle-click on the element.
   * 
   * Uses Selenium WebDriver Actions API to simulate a middle-click.
   * 
   * @returns {Promise<boolean>} True if successful
   * @example
   * await browser.element('middle-click-target').middleClick();
   * await browser.button('tab').middleClick();
   */
  async middleClick() {
    return await this.#clickDelegate.middleClick();
  }

  /**
   * Performs a long press click on the element.
   * 
   * Uses Selenium WebDriver Actions API to simulate a long press.
   * 
   * @param {number} [duration=1000] - Duration of the long press in milliseconds
   * @returns {Promise<boolean>} True if successful
   * @example
   * await browser.element('long-press-target').longPress(); // Default 1000ms
   * await browser.button('menu').longPress(2000); // 2 seconds
   */
  async longPress(duration = 1000) {
    return await this.#clickDelegate.longPress(duration);
  }

  /**
   * Internal click handler for elements.
   * 
   * Handles both standard clicks and coordinate-based clicks.
   * Falls back to JavaScript click if Selenium click fails.
   * 
   * @private
   * @param {Object} e - WebElement to click
   * @param {number} [x] - X coordinate (optional)
   * @param {number} [y] - Y coordinate (optional)
   * @returns {Promise<void>}
   */
  async _clicker(e, x, y) {
    return await this.#clickDelegate._clicker(e, x, y);
  }

  /**
   * Makes the WebBrowser instance "Thenable".
   * If the browser is awaited while a selector stack is active, 
   * it implicitly retrieves the text of the resolved element.
   * 
   * @param {Function} onFulfilled 
   * @param {Function} onRejected 
   * @returns {Promise<string|WebBrowser>}
   */
  then(onFulfilled, onRejected) {
    if (this.stack.length > 0) {
      return this.#retrieveElementText('Text').then(onFulfilled, onRejected);
    }
    return Promise.resolve(this).then(onFulfilled, onRejected);
  }

  /**
   * Internal helper to unify text/value retrieval logic.
   */
  async #retrieveElementText(valueType) {
    if (valueType === 'Text') this.message = messenger({ stack: this.stack, action: 'getText' });
    if (valueType === 'Value') this.message = messenger({ stack: this.stack, action: 'getValue' });
    try {
      const locator = await this._finder();
      const [textContent, valueAttr, tagName] = await Promise.all([
        locator.getAttribute('textContent'),
        locator.getAttribute('value'),
        locator.tagName
      ]);

      let result = textContent;
      if (['input', 'textarea'].includes(tagName)) {
        result = valueAttr;
      }
      log.info(`${valueType} is '${result}'`)
      return result?.trim() ?? '';
    } catch (err) {
      this.handleError(err, 'getting text');
    } finally {
      this.stack = [];
    }
  }

  /**
   * "Namespace" or "Sub-resource" pattern for organized access to retrieval operations.
   * Accessor for retrieval operations.
   * Usage: await browser.element('id').get.text()
   */
  get get() {
    const superget = super.get
    return {
      ...superget,

      text: () => this.#retrieveElementText('Text'),

      value: () => this.#retrieveElementText('Value'),

      options: async () => {
        this.message = messenger({ stack: this.stack, action: 'getOptions' });
        try {
          return await this.#selectDelegate.getOptions();
        } catch (err) {
          this.handleError(err, 'getting options from dropdown');
        } finally {
          this.stack = [];
        }
      },

      selected: {
        options: async () => {
          this.message = messenger({ stack: this.stack, action: 'getSelectedOptions' });
          try {
            return await this.#selectDelegate.getSelectedOptions();
          } catch (err) {
            this.handleError(err, 'getting selected options from dropdown');
          } finally {
            this.stack = [];
          }
        },
      },

      attribute: async (name) => {
        this.message = messenger({ stack: this.stack, action: 'getAttribute', data: name });
        try {
          const locator = await this._finder();
          return await locator.getAttribute(name);
        } catch (err) {
          this.handleError(err, `getting attribute '${name}'`);
        } finally {
          this.stack = [];
        }
      },

      screenshot: async () => {
        let dataUrl = null;
        if (this.stack.length > 0) {
          try {
            this.message = messenger({ stack: this.stack, action: 'screenshot' });
            const locator = await this._finder();
            dataUrl = await locator.takeScreenshot(true);
          } catch (err) {
            log.error(`Failed to capture element screenshot: ${err.message}`);
          }
        }

        if (!dataUrl) {
          log.info('Capturing screenshot of the full page');
          dataUrl = await this.driver.takeScreenshot();
        }

        this.stack = [];
        return dataUrl;
      },
    };
  }

  /**
   * "Namespace" or "Sub-resource" pattern for organized access to validation/visibility operations.
   * Accessor for validation operations.
   * Usage: await browser.element('id').is.disabled(5000)
   *        await browser.element('id').is.enabled(5000)
   *        await browser.element('id').is.visible(5000)
   *        await browser.element('id').is.not.visible(5000)
   */
  get has() {
    return {
      /**
       * Checks that the element has a specific value.
       *
       * @param {string} expectedValue - The expected value to check for
       * @returns {Promise<boolean>}
       */
      value: async (expectedValue) => {
        this.message = messenger({ stack: this.stack, action: 'hasValue', data: expectedValue });
        const actualValue = await this.#retrieveElementText('Value');
        const result = actualValue === expectedValue;
        if (result) log.info(`Value '${actualValue}' has '${expectedValue}'`);
        else log.warn(`Value '${actualValue}' does not have '${expectedValue}'`);
        return result;
      },

      /**
       * Checks that the element has specific text.
       *
       * @param {string} expectedText - The expected text to check for
       * @returns {Promise<boolean>}
       */
      text: async (expectedText) => {
        this.message = messenger({ stack: this.stack, action: 'hasText', data: expectedText });
        const actualText = await this.#retrieveElementText('Text');
        const result = actualText === expectedText;
        if (result) log.info(`Text '${actualText}' has '${expectedText}'`);
        else log.warn(`Text '${actualText}' does not have '${expectedText}'`);
        return result;
      },

      /**
       * Checks that the dropdown has a specific option.
       *
       * @param {string|number} optionValue - The option text, value, or index to check for
       * @returns {Promise<boolean>}
       */
      option: async (optionValue) => {
        this.message = messenger({ stack: this.stack, action: 'hasOption', data: optionValue });
        this.#selectDelegate.option(optionValue);
        const result = await this.#selectDelegate._hasOption();
        if (result) log.info(`Dropdown has option '${optionValue}'`);
        else log.warn(`Dropdown does not have option '${optionValue}'`);
        return result;
      },
    }
  }

  get does() {
    return {
      not: {
        have: {
          /**
           * Checks that the element does not have a specific value.
           *
           * @param {string} unexpectedValue - The value that should not be present
           * @returns {Promise<boolean>}
           */
          value: async (unexpectedValue) => {
            this.message = messenger({ stack: this.stack, action: 'doesNotHaveValue', data: unexpectedValue });
            const actualValue = await this.#retrieveElementText('Value');
            const result = actualValue !== unexpectedValue;
            if (result) log.info(`Value '${actualValue}' does not have '${unexpectedValue}'`);
            else log.warn(`Value '${actualValue}' has '${unexpectedValue}'`);
            return result;
          },

          /**
           * Checks that the element does not have specific text.
           *
           * @param {string} unexpectedText - The text that should not be present
           * @returns {Promise<boolean>}
           */
          text: async (unexpectedText) => {
            this.message = messenger({ stack: this.stack, action: 'doesNotHaveText', data: unexpectedText });
            const actualText = await this.#retrieveElementText('Text');
            const result = actualText !== unexpectedText;
            if (result) log.info(`Text '${actualText}' does not have '${unexpectedText}'`);
            else log.warn(`Text '${actualText}' has '${unexpectedText}'`);
            return result;
          },

          /**
           * Checks that the dropdown does not have a specific option.
           *
           * @param {string|number} optionValue - The option text, value, or index that should not be present
           * @returns {Promise<boolean>}
           */
          option: async (optionValue) => {
            this.message = messenger({ stack: this.stack, action: 'doesNotHaveOption', data: optionValue });
            this.#selectDelegate.option(optionValue);
            const result = !(await this.#selectDelegate._hasOption());
            if (result) log.info(`Dropdown does not have option '${optionValue}'`);
            else log.warn(`Dropdown has option '${optionValue}'`);
            return result;
          },
        },
      },
    };
  }

  /**
   * Assertion-style API for visibility checks.
   * Throws an error if the assertion fails.
   * Usage: await browser.element('id').should.be.visible(5000)
   *        await browser.element('id').should.not.be.visible(5000)
   *        await browser.element('id').should.be.enabled(5000)
   *        await browser.element('id').should.be.disabled(5000)
   */
  get should() {
    return {
      be: {
        /**
         * Asserts that the element is visible within the given timeout.
         *
         * @param {number} [t] - Optional timeout in milliseconds
         * @returns {Promise<void>}
         */
        visible: async (t = null) => {
          this.message = messenger({ stack: this.stack, action: 'shouldBeVisible' });
          const test = await this.#visibilityDelegate._isVisible(t);
          if (!test) {
            const err = new Error('Element should be visible');
            this.handleError(err, 'validating element to be visible');
            throw err;
          }
        },

        /**
         * Asserts that the checkbox is checked.
         *
         * @returns {Promise<void>}
         */
        checked: async () => {
          this.message = messenger({ stack: this.stack, action: 'shouldBeChecked' });
          const test = await this.#checkboxDelegate._isChecked();
          if (!test) {
            log.warn(`Checkbox is not checked`);
            const err = new Error('Element should be checked');
            this.handleError(err, 'validating element to be checked');
            throw err;
          } else {
            log.info(`Checkbox is checked`);
          }
        },

        /**
         * Asserts that the radio is set.
         *
         * @returns {Promise<void>}
         */
        set: async () => {
          this.message = messenger({ stack: this.stack, action: 'shouldBeSet' });
          const test = await this.#radioDelegate._isSet();
          if (!test) {
            log.warn(`Radiobutton is not set`);
            const err = new Error('Radiobutton should be set');
            this.handleError(err, 'validating Radiobutton to be set');
            throw err;
          } else {
            log.info(`Radiobutton is set`);
          }
        },

        /**
         * Asserts that the switch is on.
         *
         * @returns {Promise<void>}
         */
        on: async () => {
          this.message = messenger({ stack: this.stack, action: 'shouldBeOn' });
          const test = await this.#switchDelegate._isOn();
          if (!test) {
            log.warn(`Switch is not on`);
            const err = new Error('Switch should be ON');
            this.handleError(err, 'validating switch to be ON');
            throw err;
          } else {
            log.info(`Switch is ON`);
          }
        },

        /**
         * Asserts that the switch is off.
         *
         * @returns {Promise<void>}
         */
        off: async () => {
          this.message = messenger({ stack: this.stack, action: 'shouldBeOff' });
          const test = !(await this.#switchDelegate._isOn());
          if (!test) {
            log.warn(`Switch is not off`);
            const err = new Error('Switch should be OFF');
            this.handleError(err, 'validating switch to be OFF');
            throw err;
          } else {
            log.info(`Switch is OFF`);
          }
        },

        /**
         * Asserts that the dropdown option is selected.
         *
         * @returns {Promise<void>}
         */
        selected: async () => {
          this.message = messenger({ stack: this.stack, action: 'shouldBeSelected', data: this.#selectDelegate.optionValue });
          const test = await this.#selectDelegate._isSelected();
          if (!test) {
            log.warn(`Option is not selected`);
            const err = new Error('Option should be selected');
            this.handleError(err, 'validating option to be selected');
            throw err;
          } else {
            log.info(`Option is selected`);
          }
        },

        /**
         * Asserts that the element is enabled within the given timeout.
         *
         * @param {number} [t] - Optional timeout in milliseconds
         * @returns {Promise<void>}
         */
        enabled: async (t = null) => {
          this.message = messenger({ stack: this.stack, action: 'shouldBeEnabled' });
          const test = await this.#visibilityDelegate._isEnabled(t);
          if (!test) {
            const err = new Error('Element should be enabled');
            this.handleError(err, 'validating element to be enabled');
            throw err;
          }
        },

        /**
         * Asserts that the element is disabled within the given timeout.
         *
         * @param {number} [t] - Optional timeout in milliseconds
         * @returns {Promise<void>}
         */
        disabled: async (t = null) => {
          this.message = messenger({ stack: this.stack, action: 'shouldBeDisabled' });
          const test = await this.#visibilityDelegate._isDisabled(t);
          if (!test) {
            const err = new Error('Element should be disabled');
            this.handleError(err, 'validating element to be disabled');
            throw err;
          }
        },
      },

      have: {
        /**
         * Asserts that the element has a specific value.
         *
         * @param {string} expectedValue - The expected value to match
         * @returns {Promise<void>}
         */
        value: async (expectedValue) => {
          this.message = messenger({ stack: this.stack, action: 'shouldHaveValue', data: expectedValue });
          const actualValue = await this.#retrieveElementText('Value');
          if (actualValue !== expectedValue) {
            log.warn(`Value '${actualValue}' does not match expected '${expectedValue}'`);
            const err = new Error(`Element value '${actualValue}' should be '${expectedValue}'`);
            this.handleError(err, 'validating element value');
            throw err;
          } else {
            log.info(`Value '${actualValue}' matches expected '${expectedValue}'`);
          }
        },

        /**
         * Asserts that the element has specific text.
         *
         * @param {string} expectedText - The expected text to match
         * @returns {Promise<void>}
         */
        text: async (expectedText) => {
          this.message = messenger({ stack: this.stack, action: 'shouldHaveText', data: expectedText });
          const actualText = await this.#retrieveElementText('Text');
          if (actualText !== expectedText) {
            log.warn(`Text '${actualText}' does not match expected '${expectedText}'`);
            const err = new Error(`Element text '${actualText}' should be '${expectedText}'`);
            this.handleError(err, 'validating element text');
            throw err;
          } else {
            log.info(`Text '${actualText}' matches expected '${expectedText}'`);
          }
        },

        /**
         * Asserts that the dropdown has a specific option.
         *
         * @param {string|number} optionValue - The option text, value, or index to check for
         * @returns {Promise<void>}
         */
        option: async (optionValue) => {
          this.message = messenger({ stack: this.stack, action: 'shouldHaveOption', data: optionValue });
          const test = await this.#selectDelegate._hasOption(optionValue);
          if (!test) {
            log.warn(`Dropdown does not have option '${optionValue}'`);
            const err = new Error(`Dropdown should have option '${optionValue}'`);
            this.handleError(err, 'validating dropdown option');
            throw err;
          } else {
            log.info(`Dropdown has option '${optionValue}'`);
          }
        },
      },

      not: {
        have: {
          /**
           * Asserts that the element does not have a specific value.
           *
           * @param {string} unexpectedValue - The value that should not match
           * @returns {Promise<void>}
           */
          value: async (unexpectedValue) => {
            this.message = messenger({ stack: this.stack, action: 'shouldNotHaveValue', data: unexpectedValue });
            const actualValue = await this.#retrieveElementText('Value');
            if (actualValue === unexpectedValue) {
              log.warn(`Value '${actualValue}' matches unexpected '${unexpectedValue}'`);
              const err = new Error(`Element value '${actualValue}' should not be '${unexpectedValue}'`);
              this.handleError(err, 'validating element value');
              throw err;
            } else {
              log.info(`Value '${actualValue}' does not match unexpected '${unexpectedValue}'`);
            }
          },

          /**
           * Asserts that the element does not have specific text.
           *
           * @param {string} unexpectedText - The text that should not match
           * @returns {Promise<void>}
           */
          text: async (unexpectedText) => {
            this.message = messenger({ stack: this.stack, action: 'shouldNotHaveText', data: unexpectedText });
            const actualText = await this.#retrieveElementText('Text');
            if (actualText === unexpectedText) {
              log.warn(`Text '${actualText}' matches unexpected '${unexpectedText}'`);
              const err = new Error(`Element text '${actualText}' should not be '${unexpectedText}'`);
              this.handleError(err, 'validating element text');
              throw err;
            } else {
              log.info(`Text '${actualText}' does not match unexpected '${unexpectedText}'`);
            }
          },

          /**
           * Asserts that the dropdown does not have a specific option.
           *
           * @param {string|number} optionValue - The option text, value, or index to check for
           * @returns {Promise<void>}
           */
          option: async (optionValue) => {
            this.message = messenger({ stack: this.stack, action: 'shouldNotHaveOption', data: optionValue });
            const test = await this.#selectDelegate._hasOption(optionValue);
            if (test) {
              log.warn(`Dropdown has option '${optionValue}'`);
              const err = new Error(`Dropdown should not have option '${optionValue}'`);
              this.handleError(err, 'validating dropdown option');
              throw err;
            } else {
              log.info(`Dropdown does not have option '${optionValue}'`);
            }
          },
        },
        be: {
          /**
           * Asserts that the element is not visible within the given timeout.
           *
           * @param {number} [t] - Optional timeout in milliseconds
           * @returns {Promise<void>}
           */
          visible: async (t = null) => {
            this.message = messenger({ stack: this.stack, action: 'shouldNotBeVisible' });
            const test = await this.#visibilityDelegate._isNotVisible(t);
            if (!test) {
              const err = new Error('Element should not be visible');
              this.handleError(err, 'validating element to not be visible');
              throw err;
            }
          },

          /**
           * Asserts that the checkbox is not checked.
           *
           * @returns {Promise<void>}
           */
          checked: async () => {
            this.message = messenger({ stack: this.stack, action: 'shouldNotBeChecked' });
            const test = !(await this.#checkboxDelegate._isChecked());
            if (!test) {
              log.warn(`Checkbox is checked`);
              const err = new Error('Element should not be checked');
              this.handleError(err, 'validating element to not be checked');
              throw err;
            } else {
              log.info(`Checkbox is not checked`);
            }
          },

          /**
           * Asserts that the radiobutton is not set.
           *
           * @returns {Promise<void>}
           */
          set: async () => {
            this.message = messenger({ stack: this.stack, action: 'shouldNotBeSet' });
            const test = !(await this.#radioDelegate._isSet());
            if (!test) {
              log.warn(`Radiobutton is set`);
              const err = new Error('Radiobutton should not be set');
              this.handleError(err, 'validating Radiobutton to not be set');
              throw err;
            } else {
              log.info(`Radiobutton is not set`);
            }
          },

          /**
           * Asserts that the dropdown option is not selected.
           *
           * @returns {Promise<void>}
           */
          selected: async () => {
            this.message = messenger({ stack: this.stack, action: 'shouldNotBeSelected', data: this.#selectDelegate.optionValue });
            const test = !(await this.#selectDelegate._isSelected());
            if (!test) {
              log.warn(`Option is selected`);
              const err = new Error('Option should not be selected');
              this.handleError(err, 'validating option to not be selected');
              throw err;
            } else {
              log.info(`Option is not selected`);
            }
          },

          /**
           * Asserts that the switch is not on.
           *
           * @returns {Promise<void>}
           */
          on: async () => {
            this.message = messenger({ stack: this.stack, action: 'shouldNotBeOn' });
            const test = !(await this.#switchDelegate._isOn());
            if (!test) {
              log.warn(`Switch is on`);
              const err = new Error('Switch should not be ON');
              this.handleError(err, 'validating switch to not be ON');
              throw err;
            } else {
              log.info(`Switch is not ON`);
            }
          },

          /**
           * Asserts that the switch is not off.
           *
           * @returns {Promise<void>}
           */
          off: async () => {
            this.message = messenger({ stack: this.stack, action: 'shouldNotBeOff' });
            const test = await this.#switchDelegate._isOn();
            if (!test) {
              log.warn(`Switch is off`);
              const err = new Error('Switch should not be OFF');
              this.handleError(err, 'validating switch to not be OFF');
              throw err;
            } else {
              log.info(`Switch is not OFF`);
            }
          },
        },
      },
    };
  }

  /**
   * Checks a checkbox element.
   * 
   * Clicks the checkbox if it's not already checked. Falls back to JavaScript
   * click if Selenium click fails.
   * 
   * @returns {Promise<boolean>} True if successful
   * @example
   * await browser.checkbox('agree').check();
   */
  async check() {
    return await this.#checkboxDelegate.check();
  }

  /**
   * Unchecks a checkbox element.
   * 
   * Clicks the checkbox if it's not already unchecked. Falls back to JavaScript
   * click if Selenium click fails.
   * 
   * @returns {Promise<boolean>} True if successful
   * @example
   * await browser.checkbox('agree').uncheck();
   */
  async uncheck() {
    return await this.#checkboxDelegate.uncheck();
  }

  /**
   * Turns a switch element on.
   * 
   * Clicks the switch if it's not already on. Falls back to JavaScript
   * click if Selenium click fails.
   * 
   * @returns {Promise<boolean>} True if successful
   * @example
   * await browser.switch('dark mode').on();
   */
  async on() {
    return await this.#switchDelegate.on();
  }

  /**
   * Turns a switch element off.
   * 
   * Clicks the switch if it's not already off. Falls back to JavaScript
   * click if Selenium click fails.
   * 
   * @returns {Promise<boolean>} True if successful
   * @example
   * await browser.switch('dark mode').off();
   */
  async off() {
    return await this.#switchDelegate.off();
  }

  /**
   * Sets the slider to the specified value.
   *
   * @param {string|number} value - The value to set on the slider
   * @returns {Promise<boolean>} True if successful
   * @example
   * await browser.slider('Input Slider Control').slide.to.value(75);
   */
  get slide() {
    return this.#sliderDelegate.slide;
  }

  /**
   * Selects an option from a dropdown or combobox by its visible text.
   *
   * @param {string} optionText - The visible text, value or index of the option to select
   * @returns {Promise<boolean>} True if successful
   * @example
   * await browser.dropdown('Country').select('United States');
   * await browser.dropdown('some combo').select('Option 1');
   */
  option(value) {
    this.#selectDelegate.option(value);
    return this
  }

  /**
   * Selects an option provided by option from a dropdown or combobox .
   *
   * Supports both native <select> elements and custom combobox widgets
   * (role='combobox'). For native selects, uses Selenium's Select class.
   * For custom comboboxes, clicks to open the dropdown and finds the
   * matching option by text content.
   *
   * @param {string} optionText - The visible text, value or index of the option to select
   * @returns {Promise<boolean>} True if successful
   * @example
   * await browser.dropdown('Country').option('United States').select();
   */
  async select() {
    return await this.#selectDelegate.select();
  }

  /**
   * Hides all elements matching the current stack by setting opacity to 0.
   * 
   * Useful for testing visibility changes or hiding elements during testing.
   * 
   * @returns {Promise<boolean>} True if successful
   * @example
   * await browser.element('ad').hide();
   * await browser.element('popup').hide();
   */
  async hide() {
    return await this.#visibilityDelegate.hide();
  }

  /**
   * Restores visibility to all elements matching the stack.
   * 
   * Reverts the opacity changes made by the hide() method.
   * 
   * @returns {Promise<boolean>} True if successful
   * @example
   * await browser.element('ad').unhide();
   * await browser.element('popup').unhide();
   */
  async unhide() {
    return await this.#visibilityDelegate.unhide();
  }

  /**
   * Get the scroll accessor object for element-level scrolling.
   *
   * Provides methods to scroll elements to specific positions.
   * When called without element context (empty stack), delegates to Browser class
   * for window-level scrolling.
   *
   * @type {Object}
   * @returns {Object} Object containing scroll accessor methods
   * @example
   * // Element scrolling
   * await browser.element('scrollable-div').scroll.to.top();
   * await browser.element('scrollable-div').scroll.to.bottom();
   * await browser.element('scrollable-div').scroll.to.left();
   * await browser.element('scrollable-div').scroll.to.right();
   * await browser.element('target').scroll.into.view();
   *
   * // Window scrolling (when no element context)
   * await browser.scroll.to.top();
   * await browser.scroll.to.bottom();
   */
  get scroll() {
    // If stack has elements, use element-level scrolling
    if (this.stack && this.stack.length > 0) {
      return this.#visibilityDelegate.scroll;
    }
    // Otherwise delegate to parent Browser class for window-level scrolling
    return super.scroll;
  }

  /**
   * Get the is accessor object for visibility and state checks.
   *
   * Provides visibility and state check methods.
   * Only works in element context (when stack has elements).
   *
   * @type {Object}
   * @returns {Object} Object containing is accessor methods
   * @example
   * await browser.element('button').is.visible();
   * await browser.element('button').is.enabled();
   * await browser.element('button').is.disabled();
   * await browser.element('button').is.not.visible();
   */
  get is() {
    const browser = this;
    const selectDelegate = this.#selectDelegate;
    const checkboxDelegate = this.#checkboxDelegate;
    const radioDelegate = this.#radioDelegate;
    const switchDelegate = this.#switchDelegate;
    const visibilityDelegate = this.#visibilityDelegate;

    return {
      /**
       * Checks whether the element is visible.
       *
       * @param {number} [t] - Optional timeout in milliseconds
       * @returns {Promise<boolean>}
       */
      visible: async (t = null) => {
        browser.message = messenger({ stack: browser.stack, action: 'isVisible' });
        return await visibilityDelegate._isVisible(t);
      },

      /**
       * Checks whether the element is enabled.
       *
       * @param {number} [t] - Optional timeout in milliseconds
       * @returns {Promise<boolean>}
       */
      enabled: async (t = null) => {
        browser.message = messenger({ stack: browser.stack, action: 'isEnabled' });
        return await visibilityDelegate._isEnabled(t);
      },

      /**
       * Checks whether the element is disabled.
       *
       * @param {number} [t] - Optional timeout in milliseconds
       * @returns {Promise<boolean>}
       */
      disabled: async (t = null) => {
        browser.message = messenger({ stack: browser.stack, action: 'isDisabled' });
        return await visibilityDelegate._isDisabled(t);
      },

      /**
       * Checks whether the checkbox is checked.
       *
       * @returns {Promise<boolean>}
       */
      checked: async () => {
        browser.message = messenger({ stack: browser.stack, action: 'isChecked' });
        const result = await checkboxDelegate._isChecked();
        if (result) log.info(`Checkbox is checked`);
        else log.warn(`Checkbox is not checked`);
        return result;
      },

      /**
       * Checks whether the radio button is set.
       *
       * @returns {Promise<boolean>}
       */
      set: async () => {
        browser.message = messenger({ stack: browser.stack, action: 'isSet' });
        const result = await radioDelegate._isSet();
        if (result) log.info(`Radiobutton is set`);
        else log.warn(`Radiobutton is not set`);
        return result;
      },

      /**
       * Checks whether the switch is on.
       *
       * @returns {Promise<boolean>}
       */
      on: async () => {
        browser.message = messenger({ stack: browser.stack, action: 'isOn' });
        const result = await switchDelegate._isOn();
        if (result) log.info(`Switch is on`);
        else log.warn(`Switch is not on`);
        return result;
      },

      /**
       * Checks whether the switch is off.
       *
       * @returns {Promise<boolean>}
       */
      off: async () => {
        browser.message = messenger({ stack: browser.stack, action: 'isOff' });
        const result = await switchDelegate._isOn();
        if (result) log.warn(`Switch is on`);
        else log.info(`Switch is off`);
        return !result;
      },

      /**
       * Checks whether the dropdown option is selected.
       *
       * @returns {Promise<boolean>}
       */
      selected: async () => {
        browser.message = messenger({ stack: browser.stack, action: 'isSelected', data: selectDelegate.optionValue });
        const result = await selectDelegate._isSelected();
        if (result) log.info(`Option '${selectDelegate.optionValue}' is selected`);
        else log.warn(`Option '${selectDelegate.optionValue}' is not selected`);
        return result;
      },

      not: {
        /**
         * Checks whether the element is not visible.
         *
         * @param {number} [t] - Optional timeout in milliseconds
         * @returns {Promise<boolean>}
         */
        visible: async (t = null) => {
          browser.message = messenger({ stack: browser.stack, action: 'isNotVisible' });
          return await visibilityDelegate._isNotVisible(t);
        },

        /**
         * Checks whether the checkbox is not checked.
         *
         * @returns {Promise<boolean>}
         */
        checked: async () => {
          browser.message = messenger({ stack: browser.stack, action: 'isNotChecked' });
          const result = await checkboxDelegate._isChecked();
          if (result) log.warn(`Checkbox is checked`);
          else log.info(`Checkbox is not checked`);
          return !result;
        },

        /**
         * Checks whether the radio button is not set.
         *
         * @returns {Promise<boolean>}
         */
        set: async () => {
          browser.message = messenger({ stack: browser.stack, action: 'isNotSet' });
          const result = await radioDelegate._isSet();
          if (result) log.warn(`Radiobutton is set`);
          else log.info(`Radiobutton is not set`);
          return !result;
        },

        /**
         * Checks whether the switch is not on.
         *
         * @returns {Promise<boolean>}
         */
        on: async () => {
          browser.message = messenger({ stack: browser.stack, action: 'isNotOn' });
          const result = await switchDelegate._isOn();
          if (result) log.warn(`Switch is on`);
          else log.info(`Switch is not on`);
          return !result;
        },

        /**
         * Checks whether the switch is not off.
         *
         * @returns {Promise<boolean>}
         */
        off: async () => {
          browser.message = messenger({ stack: browser.stack, action: 'isNotOff' });
          const result = await switchDelegate._isOn();
          if (result) log.info(`Switch is on`);
          else log.warn(`Switch is off`);
          return result;
        },

        /**
         * Checks whether the dropdown option is not selected.
         *
         * @returns {Promise<boolean>}
         */
        selected: async () => {
          browser.message = messenger({ stack: browser.stack, action: 'isNotSelected', data: selectDelegate.optionValue });
          const result = await selectDelegate._isSelected();
          if (result) log.warn(`Option '${selectDelegate.optionValue}' is selected`);
          else log.info(`Option '${selectDelegate.optionValue}' is not selected`);
          return !result;
        },
      },
    };
  }

  /**
   * Uploads a file to a file input element.
   * 
   * @param {string} filePath - Absolute path to the file
   * @returns {Promise<boolean>} True if successful
   * @example
   * await browser.file('upload').upload('/path/to/file.txt');
   * await browser.element('avatar').upload('/path/to/image.png');
   */
  async upload(filePath) {
    this.message = messenger({ stack: this.stack, action: 'upload', data: filePath });
    try {
      const locator = await this._finder();
      // Selenium's sendKeys handles local file paths for <input type="file">
      await locator.sendKeys(filePath);
    } catch (err) {
      this.handleError(err, 'uploading file');
    } finally {
      this.stack = [];
    }
    return true;
  }

  // STACK BUILDERS
  #typefixer(data, type) {
    this.#element(data);
    const item = this.stack[this.stack.length - 1];
    item.type = type;

    // If data is a positive integer, treat it as a 1-based index
    // and clear the id so it matches any element of that type
    if (typeof data === 'number' && Number.isInteger(data) && data > 0) {
      item.index = data;
      item.id = '';
    }

    return this;
  }

  // Entry points that return a new builder
  get exact() { return new SelectorStackBuilder(this).exact(); }

  get hidden() { return new SelectorStackBuilder(this).hidden(); }

  // Default element call without modifiers
  // avoid state pollution by not pushing directly to stack here
  #element(data) {
    return new SelectorStackBuilder(this).element(data);
  }

  // --- Spatial / Relative Positioners ---

  /**
   * Checks if the top-of-stack item is a bare { exactly: true } flag.
   * @private
   */
  #isFlag(obj) {
    return obj && typeof obj === 'object' && obj.exactly === true && !('type' in obj) && !('hidden' in obj);
  }

  /**
   * Pushes a location descriptor onto the stack.
   * If the previous item on the stack is a bare { exactly: true } flag,
   * it is consumed and merged into the location descriptor.
   * @private
   */
  #pushLocation(located) {
    const prev = this.stack[this.stack.length - 1];
    const location = { type: 'location', located };

    if (this.#isFlag(prev)) {
      this.stack.pop();
      location.exactly = true;
    }

    this.stack.push(location);
  }

  /** @returns {this} */
  get above() { this.#pushLocation('above'); return this; }

  /** @returns {this} */
  get below() { this.#pushLocation('below'); return this; }

  /** @returns {this} */
  get toLeftOf() { this.#pushLocation('toLeftOf'); return this; }

  /** @returns {this} */
  get toRightOf() { this.#pushLocation('toRightOf'); return this; }

  /** @returns {this} */
  get within() { this.#pushLocation('within'); return this; }

  /** @returns {this} */
  get near() { this.#pushLocation('near'); return this; }

  /**
   * Forces strict alignment for the next spatial location in the stack.
   * @returns {this}
   */
  get exactly() { this.stack.push({ exactly: true }); return this; }

  // --- Logic & Filter Modifiers ---

  /**
   * Combines multiple search criteria using logical OR.
   * 
   * @returns {this} Returns the WebBrowser instance for chaining
   * @example
   * browser.element('text1').or.element('text2').click();
   */
  get or() {
    this.stack.push({ type: 'condition', operator: 'or' });
    return this;
  }

  /**
   * Gets a specific occurrence from a list of matching elements (1-based index).
   * 
   * @returns {{index: function(number): WebBrowser}} Object with index method for chaining
   * @example
   * browser.element('item').at.index(2).click(); // Selects 2nd matching element
   */
  get at() {
    return {
      index: (index) => {
        // Only positive integers are valid indices; everything else defaults to 1 (first element)
        if (typeof index !== 'number' || !Number.isInteger(index) || index <= 0 || Number.isNaN(index)) {
          index = 1;
        }
        const last = this.stack[this.stack.length - 1];
        if (last) {
          last.index = index;
          last.id = '';
        }
        return this;
      }
    };
  }

  /**
   * Internal helper to split the stack into source and target descriptions.
   */
  #getDragDropStacks() {
    const dragIndex = this.stack.findIndex(c => c.type === 'action' && c.perform === 'drag');
    const ontoIndex = this.stack.findIndex(c => c.type === 'action' && c.perform === 'onto');

    if (dragIndex === -1 || ontoIndex === -1) {
      throw new Error('Invalid drag-and-drop stack. Ensure both .drag and .onto are used.');
    }

    // Source is everything between .drag and .onto
    const dragStack = this.stack.slice(dragIndex + 1, ontoIndex);
    // Target is everything after .onto
    const dropStack = this.stack.slice(ontoIndex + 1);

    return { dragStack, dropStack };
  }

  async drop() {
    const { dragStack, dropStack } = this.#getDragDropStacks();

    try {
      // 1. Find source element
      this.message = messenger({ stack: dragStack, action: 'drag' });
      const dragLocator = await this.locatorStrategy.find(dragStack);
      // Scroll the source element into view
      await this.driver.executeScript('arguments[0].scrollIntoView(true);', dragLocator);

      // 2. Find target element
      this.message = messenger({ stack: dropStack, action: 'drop' });
      const dropLocator = await this.locatorStrategy.find(dropStack);
      // Scroll the target element into view
      await this.driver.executeScript('arguments[0].scrollIntoView(true);', dropLocator);

      // 3. Use DragDropDelegate which handles HTML5 drag events automatically
      await this.#dragDropDelegate.perform(dragLocator, dropLocator);

      log.info(`Successfully dragged ${dragStack[0].id} onto ${dropStack[0].id}`);
    } catch (err) {
      this.handleError(err, 'performing drag and drop');
    } finally {
      this.stack = [];
    }
    return true;
  }

  // --- Stack Builder Methods ---

  /**
   * Initiates a drag-and-drop operation.
   * 
   * Must be followed by element(), onto, and drop() to complete the operation.
   * 
   * @returns {this} Returns the WebBrowser instance for chaining
   * @example
   * await browser.drag.element('item 1').onto.element('item 2').drop();
   */
  get drag() {
    this.stack.push({ type: 'action', perform: 'drag' });
    return this;
  }

  /**
   * Specifies the target element for a drag-and-drop operation.
   * 
   * Must be used after drag and before the target element and drop().
   * 
   * @returns {this} Returns the WebBrowser instance for chaining
   * @example
   * await browser.drag.element('item 1').onto.element('item 2').drop();
   */
  get onto() {
    this.stack.push({ type: 'action', perform: 'onto' });
    return this;
  }

  /**
   * Enter text into an input field or content-editable element
   * 
   * Writes text to an input field, textarea, or content-editable element.
   * If the field, textarea or content-editable element was not empty, adds text to it.
   * Handles both standard form fields and custom content-editable elements.
   * 
   * @param {string} value - Text to enter
   * @returns {Promise<boolean>} True if successful
   * @example
   * await browser.element('username').write('myusername');
   * await browser.textbox('search').write('query');
   */
  async write(value) {
    return await this.#inputDelegate.write(value);
  }

  /**
   * Clears text from an input field or content-editable element.
   * 
   * Clears text from input fields, textareas, or content-editable elements.
   * Uses keyboard shortcuts as fallback for complex cases.
   * 
   * @returns {Promise<boolean>} True if successful
   * @example
   * await browser.textbox('username').clear();
   * await browser.element('search').clear();
   */
  async clear() {
    return await this.#inputDelegate.clear();
  }

  /**
   * Overwrites text in an input field.
   * 
   * Clears existing text and enters new text. Useful for form fields that
   * may have default values or validation that prevents direct entry.
   * 
   * @param {string} value - Text to overwrite with
   * @returns {Promise<boolean>} True if successful
   * @example
   * await browser.textbox('username').overwrite('newvalue');
   */
  async overwrite(value) {
    return await this.#inputDelegate.overwrite(value);
  }

  /**
   * Presses a keyboard key, optionally with modifier keys.
   * 
   * Sends a key press to the currently focused element using Selenium's Actions API.
   * Supports modifier keys via chaining: `browser.ctrl.press('c')` for Ctrl+C.
   * 
   * @param {string} key - The key to press (e.g., 'Enter', 'Tab', 'Escape', 'a', 'c')
   * @returns {Promise<boolean>} True if successful
   * @example
   * await browser.press('Enter');
   * await browser.press('Tab');
   * await browser.press('Escape');
   * await browser.ctrl.press('c'); // Ctrl+C
   * await browser.ctrl.shift.press('c'); // Ctrl+Shift+C
   * await browser.alt.press('Tab'); // Alt+Tab
   * await browser.meta.press('w'); // Cmd+W on Mac
   */
  async press(key) {
    return await this.#inputDelegate.press(key);
  }

  /**
   * Types a string character-by-character on the currently focused element.
   *
   * Each character is sent individually via Selenium's Actions API, with optional
   * modifier keys held during the entire sequence. This is a terminal operation —
   * the stack is cleared after execution.
   *
   * @param {string} text - The string to type character by character
   * @returns {Promise<boolean>} True if successful
   * @example
   * await browser.element('username').type('myusername');
   * await browser.ctrl.type('a'); // Ctrl+a
   * await browser.shift.type('abc'); // Types 'ABC'
   * await browser.ctrl.shift.type('abc'); // Ctrl+Shift held during typing
   */
  async type(text) {
    return await this.#inputDelegate.type(text);
  }

  /**
   * Presses the Left Arrow key a specified number of times.
   *
   * @param {number} [count=1] - Number of times to press the left arrow key
   * @returns {Promise<boolean>} True if successful
   * @example
   * await browser.left();       // Press left arrow once
   * await browser.left(5);      // Press left arrow 5 times
   */
  async left(count = 1) {
    for (let i = 0; i < count; i++) {
      await this.press('left');
    }
    return true;
  }

  /**
   * Presses the Right Arrow key a specified number of times.
   *
   * @param {number} [count=1] - Number of times to press the right arrow key
   * @returns {Promise<boolean>} True if successful
   * @example
   * await browser.right();       // Press right arrow once
   * await browser.right(3);      // Press right arrow 3 times
   */
  async right(count = 1) {
    for (let i = 0; i < count; i++) {
      await this.press('right');
    }
    return true;
  }

  /**
   * Presses the Up Arrow key a specified number of times.
   *
   * @param {number} [count=1] - Number of times to press the up arrow key
   * @returns {Promise<boolean>} True if successful
   * @example
   * await browser.up();       // Press up arrow once
   * await browser.up(2);      // Press up arrow 2 times
   */
  async up(count = 1) {
    for (let i = 0; i < count; i++) {
      await this.press('up');
    }
    return true;
  }

  /**
   * Presses the Down Arrow key a specified number of times.
   *
   * @param {number} [count=1] - Number of times to press the down arrow key
   * @returns {Promise<boolean>} True if successful
   * @example
   * await browser.down();       // Press down arrow once
   * await browser.down(4);      // Press down arrow 4 times
   */
  async down(count = 1) {
    for (let i = 0; i < count; i++) {
      await this.press('down');
    }
    return true;
  }
}

export default WebBrowser
