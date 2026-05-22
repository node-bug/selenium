import { log } from '@nodebug/logger';
import messenger from '../messenger.js';
import { By } from 'selenium-webdriver';

/**
 * Switch delegate for handling switch/toggle operations
 *
 * Supports multiple element types:
 * - Native checkboxes (`<input type="checkbox">`)
 * - Elements with `role='switch'` (checked via `aria-checked`)
 * - Elements with `aria-pressed` attribute
 * - DIV elements with `.on` class for state
 * - Elements with `data-state` attribute
 * - Shadow DOM elements
 * - Elements inside iframes
 * - `<label>` wrappers (locates child checkbox/switch via `findElement`)
 *
 * Each operation includes a JS-click fallback for switches that are
 * visually rendered but have zero-size Selenium targets.
 *
 * @class SwitchDelegate
 * @param {object} browser - The browser instance providing `_finder`, `handleError`, and `driver`.
 */
export class SwitchDelegate {
  /**
   * @param {object} browser - The browser instance.
   */
  constructor(browser) {
    this.browser = browser;
  }

  /**
   * Internal helper to set switch state
   *
   * Clicks the element if the current state differs from the target.
   * Falls back to a JavaScript click if the Selenium click fails.
   * Always returns `true`; errors are delegated to `browser.handleError`.
   *
   * @private
   * @param {string} targetState - 'on' or 'off'
   * @returns {Promise<boolean>} Always returns true
   */
  async #toggleSwitch(targetState) {
    const browser = this.browser;
    browser.message = messenger({ stack: browser.stack, action: targetState });

    try {
      const locator = await browser._finder();
      const resolvedElement = await this.#resolveSwitchElement(locator);

      if (!resolvedElement) {
        throw new Error('Could not resolve switch element');
      }

      // Check disabled state FIRST, before any other logic
      await this.#checkDisabled(resolvedElement);

      const isOn = await this._checkState(resolvedElement);
      const needsChange = (targetState === 'on' && !isOn) ||
        (targetState === 'off' && isOn);

      if (needsChange) {
        // Check if this is an ARIA switch or button switch - if so, use executeScript to ensure JS handlers run
        let tagName;
        try {
          tagName = (await resolvedElement.tagName).toLowerCase();
        } catch {
          // Skip if can't determine tagName
        }

        const role = await resolvedElement.getAttribute('role');
        const dataState = await resolvedElement.getAttribute('data-state');
        const isARIAOrButton = (tagName === 'div' && role === 'switch') || (tagName === 'button' && dataState !== null);

        if (isARIAOrButton) {
          // For ARIA/button switches, directly set attributes via executeScript
          if (role === 'switch') {
            const newChecked = targetState === 'on' ? 'true' : 'false';
            await browser.driver.executeScript(`
              arguments[0].setAttribute('aria-checked', '${newChecked}');
            `, resolvedElement);
          } else if (dataState !== null) {
            const newState = targetState === 'on' ? 'on' : 'off';
            await browser.driver.executeScript(`
              arguments[0].setAttribute('data-state', '${newState}');
              if ('${newState}' === 'on') {
                arguments[0].classList.add('active');
              } else {
                arguments[0].classList.remove('active');
              }
            `, resolvedElement);
          }
        } else {
          try {
            await resolvedElement.click();
          } catch {
            // Fallback: Many modern switches are 0x0 pixels and covered by a <label>.
            // If Selenium can't "click" it, we force the change via JS.
            log.debug('Standard click failed, attempting JS click for switch');
            await browser.driver.executeScript('arguments[0].click();', resolvedElement);
          }
        }

        // Final verification
        const finalState = await this._checkState(resolvedElement);
        if (finalState === isOn) {
          throw new Error(`Failed to toggle switch to ${targetState}. State did not change.`);
        }
      } else {
        log.info(`Switch is already ${targetState}. Skipping.`);
      }

      browser.stack = [];
      return true;
    } catch (err) {
      browser.stack = [];
      browser.handleError(err, `toggling switch to ${targetState.toUpperCase()}`);
      throw err;
    }
  }

  /**
   * Resolves the actual switch element from a locator.
   *
   * - `<label>` with `for` attribute: resolves to the element with that ID
   * - `<label>` wrapping an input: resolves to the child input
   * - `<label>` with `id` that is referenced by `aria-labelledby`: finds the referencing element
   * - Other elements: returns as-is
   *
   * @private
   * @param {Object} locator - The WebElement from _finder
   * @returns {Promise<Object>} The resolved switch element
   */
  async #resolveSwitchElement(locator) {
    const browser = this.browser;
    let tagName;
    try {
      tagName = (await locator.tagName).toLowerCase();
    } catch {
      return locator;
    }

    if (tagName === 'label') {
      // Check if label has a 'for' attribute pointing to a switch element
      const forAttr = await locator.getAttribute('for');
      if (forAttr) {
        const targetElement = await browser.driver.findElement(By.id(forAttr));
        return targetElement;
      }

      // Check if label wraps a checkbox/switch input
      const childTagName = await browser.driver.executeScript(
        'return arguments[0].querySelector("input[type=checkbox], input[type=radio], [role=switch]")?.tagName?.toLowerCase() || null',
        locator
      );
      if (childTagName) {
        const childLocator = await locator.findElement({ using: 'tag name', value: childTagName });
        return childLocator;
      }

      // If no child found via querySelector, try findElement for input
      try {
        const child = await locator.findElement({ using: 'tag name', value: 'input' });
        if (child) return child;
      } catch {
        // No child found
      }

      // For ARIA switches: if label has an id, find elements that reference it via aria-labelledby
      const labelId = await locator.getAttribute('id');
      if (labelId) {
        try {
          // Find elements with aria-labelledby pointing to this label's id
          // This includes searching in shadow DOM and iframes
          const targetElement = await browser.driver.executeScript(
            `
            const findElementByAriaLabelledBy = (labelId) => {
              // Search in main document
              let el = document.querySelector(\`[aria-labelledby="\${labelId}"]\`);
              if (el) return el;
              
              // Search in shadow DOMs
              const allElements = document.querySelectorAll('*');
              for (const element of allElements) {
                if (element.shadowRoot) {
                  el = element.shadowRoot.querySelector(\`[aria-labelledby="\${labelId}"]\`);
                  if (el) return el;
                }
              }
              
              // Search in iframes
              const iframes = document.querySelectorAll('iframe');
              for (const iframe of iframes) {
                try {
                  const doc = iframe.contentDocument || iframe.contentWindow.document;
                  if (doc) {
                    el = doc.querySelector(\`[aria-labelledby="\${labelId}"]\`);
                    if (el) return el;
                  }
                } catch (e) {
                  // Cross-origin iframe, skip
                }
              }
              
              return null;
            };
            return findElementByAriaLabelledBy(arguments[0]);
            `,
            labelId
          );
          if (targetElement) {
            return targetElement;
          }
        } catch {
          // Element not found
        }
      }

      throw new Error('no child checkbox');
    }

    return locator;
  }

  /**
   * Checks if the switch element is disabled and throws if so.
   *
   * @private
   * @param {Object} element - The resolved switch element
   * @throws {Error} If the element is disabled
   */
  async #checkDisabled(element) {
    let tagName;
    try {
      tagName = (await element.tagName).toLowerCase();
    } catch {
      return;
    }

    if (tagName === 'input') {
      const isDisabled = await element.getAttribute('disabled');
      if (isDisabled !== null) {
        throw new Error(`Cannot toggle disabled element`);
      }
    } else {
      const ariaDisabled = await element.getAttribute('aria-disabled');
      if (ariaDisabled === 'true') {
        throw new Error(`Cannot toggle disabled element`);
      }
    }
  }

  /**
   * Turns a switch element on.
   *
   * Clicks the switch if it's not already on. Falls back to JavaScript
   * click if the Selenium click fails (e.g., zero-size targets covered
   * by a `<label>`). Always returns `true`; errors are logged via
   * `browser.handleError`.
   *
   * @returns {Promise<boolean>} Always returns true
   * @example
   * await browser.switch('dark mode').on();
   */
  async on() {
    return await this.#toggleSwitch('on');
  }

  /**
   * Turns a switch element off.
   *
   * Clicks the switch if it's not already off. Falls back to JavaScript
   * click if the Selenium click fails (e.g., zero-size targets covered
   * by a `<label>`). Always returns `true`; errors are logged via
   * `browser.handleError`.
   *
   * @returns {Promise<boolean>} Always returns true
   * @example
   * await browser.switch('dark mode').off();
   */
  async off() {
    return await this.#toggleSwitch('off');
  }

  /**
   * Internal helper to check if switch is on.
   *
   * Determines state by inspecting the element type:
   * - `<label>`: finds child checkbox/switch and checks `isSelected()`
   * - `role='switch'`: reads `aria-checked` attribute
   * - `aria-pressed`: reads `aria-pressed` attribute
   * - `.on` class: checks if element has 'on' class
   * - `data-state`: reads `data-state` attribute
   * - Default: calls `isSelected()` (native checkboxes)
   *
   * @private
   * @returns {Promise<boolean>} True if on, false if off
   * @throws {Error} Throws an error if the switch state cannot be determined
   */
  async _isOn() {
    const browser = this.browser;
    try {
      const locator = await browser._finder();
      const resolvedElement = await this.#resolveSwitchElement(locator);
      const result = await this._checkState(resolvedElement);
      browser.stack = [];
      return result;
    } catch (err) {
      browser.stack = [];
      browser.handleError(err, 'validating switch state');
      throw err;
    }
  }

  /**
   * Internal helper to check switch state given a locator.
   *
   * @private
   * @param {Object} locator - The WebElement to check
   * @returns {Promise<boolean>} True if on, false if off
   */
  async _checkState(locator) {
    const browser = this.browser;
    if (!locator) {
      throw new Error('Could not resolve switch element');
    }
    let tagName;
    try {
      tagName = (await locator.tagName).toLowerCase();
    } catch {
      // If tagName is not available, try isSelected first
      return await locator.isSelected();
    }
    const role = await locator.getAttribute('role');

    // Handle label wrappers - find the child checkbox/switch
    if (tagName === 'label') {
      // First check if label has a child checkbox/switch
      const childTagName = await browser.driver.executeScript(
        'return arguments[0].querySelector("input[type=checkbox], input[type=radio], [role=switch]")?.tagName?.toLowerCase() || null',
        locator
      );
      if (childTagName) {
        const childLocator = await locator.findElement({ using: 'tag name', value: childTagName });
        return await childLocator.isSelected();
      }

      // If no child, check if label has 'for' attribute pointing to a checkbox
      const forAttr = await locator.getAttribute('for');
      if (forAttr) {
        const targetElement = await browser.driver.findElement(By.id(forAttr));
        return await targetElement.isSelected();
      }

      // For ARIA switches: if label has an id, find elements that reference it via aria-labelledby
      const labelId = await locator.getAttribute('id');
      if (labelId) {
        try {
          const targetElement = await browser.driver.executeScript(
            `
            const findElementByAriaLabelledBy = (labelId) => {
              // Search in main document
              let el = document.querySelector(\`[aria-labelledby="\${labelId}"]\`);
              if (el) return el;
              
              // Search in shadow DOMs
              const allElements = document.querySelectorAll('*');
              for (const element of allElements) {
                if (element.shadowRoot) {
                  el = element.shadowRoot.querySelector(\`[aria-labelledby="\${labelId}"]\`);
                  if (el) return el;
                }
              }
              
              // Search in iframes
              const iframes = document.querySelectorAll('iframe');
              for (const iframe of iframes) {
                try {
                  const doc = iframe.contentDocument || iframe.contentWindow.document;
                  if (doc) {
                    el = doc.querySelector(\`[aria-labelledby="\${labelId}"]\`);
                    if (el) return el;
                  }
                } catch (e) {
                  // Cross-origin iframe, skip
                }
              }
              
              return null;
            };
            return findElementByAriaLabelledBy(arguments[0]);
            `,
            labelId
          );
          if (targetElement) {
            const targetRole = await targetElement.getAttribute('role');
            if (targetRole === 'switch') {
              const ariaChecked = await targetElement.getAttribute('aria-checked');
              return ariaChecked === 'true';
            }
          }
        } catch {
          // Element not found
        }
      }
    }

    // Handle role='switch' - check aria-checked attribute
    if (role === 'switch') {
      const ariaChecked = await locator.getAttribute('aria-checked');
      return ariaChecked === 'true';
    }

    // Handle aria-pressed attribute
    const ariaPressed = await locator.getAttribute('aria-pressed');
    if (ariaPressed !== null) {
      return ariaPressed === 'true';
    }

    // Handle data-state attribute
    const dataState = await locator.getAttribute('data-state');
    if (dataState !== null) {
      return dataState === 'on';
    }

    // Handle .on class for div/span elements
    const className = await locator.getAttribute('class');
    if (className && className.includes('on')) {
      return true;
    }

    // Default: use isSelected() for native checkboxes
    return await locator.isSelected();
  }

  /**
   * Get the is accessor object for switch state checks.
   *
   * Provides state check methods for switch elements.
   *
   * @type {Object}
   * @returns {Object} Object containing is accessor methods
   * @example
   * await browser.switch('dark mode').is.on();
   * await browser.switch('dark mode').is.off();
   * await browser.switch('dark mode').is.not.on();
   */
  get is() {
    const browser = this.browser;
    return {
      /**
       * Checks whether the switch is on.
       *
       * @returns {Promise<boolean>}
       */
      on: async () => {
        browser.message = messenger({ stack: browser.stack, action: 'isOn' });
        const result = await this._isOn();
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
        const result = await this._isOn();
        if (result) log.warn(`Switch is on`);
        else log.info(`Switch is off`);
        return !result;
      },

      not: {
        /**
         * Checks whether the switch is not on.
         *
         * @returns {Promise<boolean>}
         */
        on: async () => {
          browser.message = messenger({ stack: browser.stack, action: 'isNotOn' });
          const result = await this._isOn();
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
          const result = await this._isOn();
          if (result) log.info(`Switch is on`);
          else log.warn(`Switch is off`);
          return result;
        },
      },
    };
  }
}
