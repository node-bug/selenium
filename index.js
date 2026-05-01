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

    Object.keys(this.locatorStrategy.definitions).forEach(type => {
      this[type] = (data) => {
        return this.#typefixer(data, type);
      };
    });
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
  async _finder(t = null, action = null) {
    let locator;
    const stacks = this.getDescriptions();
    const timeout = t ?? (selenium.timeout * 1000);
    const endTime = Date.now() + timeout;

    while (Date.now() < endTime) {
      for (const currentStack of stacks) {
        try {
          locator = await this.locatorStrategy.find(currentStack, action);
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
   * Scrolls an element into the viewport.
   * 
   * @param {boolean} [alignToTop=true] - If true, top of element aligns to top of viewport.
   * @returns {Promise<boolean>} True if successful
   * @example
   * await browser.element('submit').scroll();
   * await browser.element('footer').scroll(false); // Align to bottom
   */
  async scroll(alignToTop = true) {
    return await this.#visibilityDelegate.scroll(alignToTop);
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
 * Internal helper to unify text/value retrieval logic.
 */
  async #retrieveElementText(valueType) {
    if (valueType === 'Text') this.message = messenger({ stack: this.stack, action: 'getText' });
    if (valueType === 'Value') this.message = messenger({ stack: this.stack, action: 'getValue' });
    try {
      let ogStack = this.stack;
      const locator = await this._finder();
      const [textContent, valueAttr, tagName] = await Promise.all([
        locator.getAttribute('textContent'),
        locator.getAttribute('value'),
        locator.tagName
      ]);

      if (tagName === 'select') {
        this.stack = ogStack
        const selectedOption = await this.#selectDelegate.getSelectedOption()
        if (valueType === 'Text') return selectedOption.text
        if (valueType === 'Value') return selectedOption.value
      }

      let result = textContent;

      if ((!result || result.trim() === '') && ['input', 'textarea'].includes(tagName)) {
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
  get is() {
    return {
      /**
       * Checks whether the element is visible.
       *
       * @param {number} [t] - Optional timeout in milliseconds
       * @returns {Promise<boolean>}
       */
      visible: async (t = null) => {
        this.message = messenger({ stack: this.stack, action: 'isVisible' });
        return await this.#visibilityDelegate._isVisible(t);
      },

      /**
       * Checks whether the checkbox is checked.
       *
       * @returns {Promise<boolean>}
       */
      checked: async () => {
        this.message = messenger({ stack: this.stack, action: 'isChecked' });
        const result = await this.#checkboxDelegate._isChecked();
        if (result) log.info(`Checkbox is checked`);
        else log.warn(`Checkbox is not checked`);
        return result;
      },

      /**
       * Checks whether the radio is set.
       *
       * @returns {Promise<boolean>}
       */
      set: async () => {
        this.message = messenger({ stack: this.stack, action: 'isSet' });
        const result = await this.#radioDelegate._isSet();
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
        this.message = messenger({ stack: this.stack, action: 'isOn' });
        const result = await this.#switchDelegate._isOn();
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
        this.message = messenger({ stack: this.stack, action: 'isOff' });
        const result = !(await this.#switchDelegate._isOn());
        if (result) log.info(`Switch is off`);
        else log.warn(`Switch is not off`);
        return result;
      },

      /**
       * Checks whether the dropdown option is selected.
       *
       * @returns {Promise<boolean>}
       */
      selected: async () => {
        this.message = messenger({ stack: this.stack, action: 'isSelected', data: this.#selectDelegate.optionValue });
        const result = await this.#selectDelegate._isSelected();
        if (result) log.info(`Option is selected`);
        else log.warn(`Option is not selected`);
        return result;
      },

      /**
       * Checks whether the element is enabled.
       *
       * @param {number} [t] - Optional timeout in milliseconds
       * @returns {Promise<boolean>}
       */
      enabled: async (t = null) => {
        this.message = messenger({ stack: this.stack, action: 'isEnabled' });
        return await this.#visibilityDelegate._isEnabled(t)
      },

      /**
       * Checks whether the element is disabled.
       *
       * @param {number} [t] - Optional timeout in milliseconds
       * @returns {Promise<boolean>}
       */
      disabled: async (t = null) => {
        this.message = messenger({ stack: this.stack, action: 'isDisabled' });
        return await this.#visibilityDelegate._isDisabled(t);
      },

      not: {
        /**
         * Checks whether the element is not visible.
         *
         * @param {number} [t] - Optional timeout in milliseconds
         * @returns {Promise<boolean>}
         */
        visible: async (t = null) => {
          this.message = messenger({ stack: this.stack, action: 'isNotVisible' });
          return await this.#visibilityDelegate._isNotVisible(t);
        },

        /**
       * Checks whether the checkbox is not checked.
       *
       * @returns {Promise<boolean>}
       */
        checked: async () => {
          this.message = messenger({ stack: this.stack, action: 'isNotChecked' });
          const result = !(await this.#checkboxDelegate._isChecked());
          if (result) log.info(`Checkbox is not checked`);
          else log.warn(`Checkbox is checked`);
          return result;
        },

        /**
         * Checks whether the radio is not set.
         *
         * @returns {Promise<boolean>}
         */
        set: async () => {
          this.message = messenger({ stack: this.stack, action: 'isNotSet' });
          const result = !(await this.#radioDelegate._isSet());
          if (result) log.info(`Radiobutton is not set`);
          else log.warn(`Radiobutton is set`);
          return result;
        },

        /**
         * Checks whether the dropdown option is not selected.
         *
         * @returns {Promise<boolean>}
         */
        selected: async () => {
          this.message = messenger({ stack: this.stack, action: 'isNotSelected', data: this.#selectDelegate.optionValue });
          const result = !(await this.#selectDelegate._isSelected());
          if (result) log.info(`Option is not selected`);
          else log.warn(`Option is selected`);
          return result;
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
            const err = new Error('Element should be visible')
            this.handleError(err, 'validating element to be visible');
            throw err
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
            const err = new Error('Element should be checked')
            this.handleError(err, 'validating element to be checked');
            throw err
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
            const err = new Error('Radiobutton should be set')
            this.handleError(err, 'validating Radiobutton to be set');
            throw err
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
            const err = new Error('Switch should be on')
            this.handleError(err, 'validating switch to be on');
            throw err
          } else {
            log.info(`Switch is on`);
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
            const err = new Error('Switch should be off')
            this.handleError(err, 'validating switch to be off');
            throw err
          } else {
            log.info(`Switch is off`);
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
            const err = new Error('Option should be selected')
            this.handleError(err, 'validating option to be selected');
            throw err
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
            const err = new Error('Element should be enabled')
            this.handleError(err, 'validating element to be enabled');
            throw err
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
            const err = new Error('Element should be disabled')
            this.handleError(err, 'validating element to be disabled');
            throw err
          }
        },
      },

      not: {
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
              const err = new Error('Element should not be visible')
              this.handleError(err, 'validating element to not be visible');
              throw err
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
              const err = new Error('Element should not be checked')
              this.handleError(err, 'validating element to not be checked');
              throw err
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
              const err = new Error('Radiobutton should not be set')
              this.handleError(err, 'validating Radiobutton to not be set');
              throw err
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
              const err = new Error('Option should not be selected')
              this.handleError(err, 'validating option to not be selected');
              throw err
            } else {
              log.info(`Option is not selected`);
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
   * Sets a radio button.
   * 
   * Clicks the radio button if it's not already set. Falls back to JavaScript
   * click if Selenium click fails.
   * 
   * @returns {Promise<boolean>} True if successful
   * @example
   * await browser.radio('option-a').set();
   */
  async set() {
    return await this.#radioDelegate.set();
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
    this.stack[this.stack.length - 1].type = type;
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
   * Targets an element above the currently referenced element.
   * 
   * @returns {this} Returns the WebBrowser instance for chaining
   * @example
   * browser.element('target').above.element('other').click();
   */
  get above() {
    this.stack.push({ type: 'location', located: 'above' });
    return this;
  }

  /**
   * Targets an element below the currently referenced element.
   * 
   * @returns {this} Returns the WebBrowser instance for chaining
   * @example
   * browser.element('target').below.element('other').click();
   */
  get below() {
    this.stack.push({ type: 'location', located: 'below' });
    return this;
  }

  /**
   * Targets an element to the left of the currently referenced element.
   * 
   * @returns {this} Returns the WebBrowser instance for chaining
   * @example
   * browser.element('target').toLeftOf.element('other').click();
   */
  get toLeftOf() {
    this.stack.push({ type: 'location', located: 'toLeftOf' });
    return this;
  }

  /**
   * Targets an element to the right of the currently referenced element.
   * 
   * @returns {this} Returns the WebBrowser instance for chaining
   * @example
   * browser.element('target').toRightOf.element('other').click();
   */
  get toRightOf() {
    this.stack.push({ type: 'location', located: 'toRightOf' });
    return this;
  }

  /**
   * Targets an element located inside another element.
   * 
   * @returns {this} Returns the WebBrowser instance for chaining
   * @example
   * browser.element('menu').within.element('item').click();
   */
  get within() {
    this.stack.push({ type: 'location', located: 'within' });
    return this;
  }

  /**
   * Targets an element based on proximity.
   * 
   * @returns {this} Returns the WebBrowser instance for chaining
   * @example
   * browser.element('target').near.element('other').click();
   */
  get near() {
    this.stack.push({ type: 'location', located: 'near' });
    return this;
  }

  // --- Logic & Filter Modifiers ---

  /**
   * Forces a strict text match for the next element in the stack.
   * 
   * @returns {this} Returns the WebBrowser instance for chaining
   * @example
   * browser.element('text').exactly.toLeftOf.element('other').click();
   */
  get exactly() {
    this.stack.push({ exactly: true });
    return this;
  }

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
   * @param {number} index - 1-based index of element to get
   * @returns {this} Returns the WebBrowser instance for chaining
   * @throws {TypeError} If index is not a number
   * @example
   * browser.element('item').atIndex(2).click(); // Selects 2nd matching element
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
      const dragLocator = await this.locatorStrategy.find(dragStack);

      // 2. Find target element
      this.message = messenger({ stack: dropStack, action: 'drop' });
      const dropLocator = await this.locatorStrategy.find(dropStack);

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
      this.handleError(err, 'performing drag and drop');
    } finally {
      this.stack = [];
    }
    return true;
  }

  // --- Stack Builder Methods ---

  /**
   * Initiates a drag operation on an element.
   * 
   * Must be followed by onto() to complete the drag-and-drop.
   * 
   * @returns {this} Returns the WebBrowser instance for chaining
   * @example
   * browser.element('drag-item').drag().onto().element('drop-target').drop();
   */
  drag() {
    this.stack.push({ type: 'action', perform: 'drag' });
    return this;
  }

  /**
   * Specifies the target element for a drag-and-drop operation.
   * 
   * Must be used after drag() and before drop().
   * 
   * @returns {this} Returns the WebBrowser instance for chaining
   * @example
   * browser.element('drag-item').drag().onto().element('drop-target').drop();
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
