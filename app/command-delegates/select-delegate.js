import { Select } from 'selenium-webdriver';
import { log } from '@nodebug/logger';
import messenger from '../messenger.js';
import { BaseDelegate } from './base-delegate.js';

/**
 * Select delegate for handling dropdown/combobox selection operations
 * 
 * This class encapsulates all dropdown-related functionality, supporting both
 * native <select> elements and custom combobox widgets (role='combobox').
 * 
 * @class SelectDelegate
 */
export class SelectDelegate extends BaseDelegate {
  constructor(browser) {
    super(browser);
    this.optionValue = null;
    this.isIndex = false;
  }

  /**
   * Sets the option value to be selected.
   * 
   * @param {string|number} value - The visible text, value, or 1-based index of the option
   * @returns {SelectDelegate} Returns this for chaining
   * @example
   * delegate.option('United States');  // Select by visible text
   * delegate.option('us');             // Select by value
   * delegate.option(1);                // Select by 1-based index
   */
  option(value) {
    this.optionValue = value;
    this.isIndex = typeof value === 'number' && value > 0;
    return this;
  }

  /**
   * Resolves a dropdown element to the actual select element or combobox container.
   * Handles cases where the finder returns a label or wrapper instead of the actual control.
   * 
   * @private
   * @param {Object} locator - The WebElement from _finder
   * @returns {Promise<{element: Object, tagName: string}>} Object with resolved element and its tag name
   */
  async #resolveDropdownElement(locator) {
    const browser = this.browser;
    let tagName = (await locator.tagName).toLowerCase();

    // If locator is a label with 'for' attribute, find the associated element
    if (tagName === 'label') {
      try {
        const forAttr = await locator.getAttribute('for');
        if (forAttr) {
          const targetElement = await browser.driver.findElement({ using: 'id', value: forAttr });
          if (targetElement) {
            tagName = (await targetElement.tagName).toLowerCase();
            log.debug(`Label 'for' attribute points to ${tagName} element with id ${forAttr}`);
            return { element: targetElement, tagName };
          }
        }
      } catch (err) {
        log.debug(`Could not resolve label 'for' attribute: ${err.message}`);
      }
    }

    // If locator is an option element, find the parent select
    if (tagName === 'option') {
      try {
        const selectParent = await locator.findElement({ using: 'xpath', value: './ancestor::select' });
        if (selectParent) {
          log.debug(`Found parent select element for option`);
          return { element: selectParent, tagName: 'select' };
        }
      } catch {
        // No parent select, continue with current locator
      }
    }

    // If not a select or combobox div, try to find a select element within
    if (tagName !== 'select' && tagName !== 'div') {
      try {
        const selectChild = await locator.findElement({ using: 'xpath', value: './/select' });
        if (selectChild) {
          log.debug(`Found nested select element within ${tagName}`);
          return { element: selectChild, tagName: 'select' };
        }
      } catch {
        // No nested select, continue with current locator
      }
    }

    return { element: locator, tagName };
  }

  /**
   * Selects an option from a dropdown by text, value, or index.
   * 
   * Supports two types of dropdowns:
   * 1. Native <select> elements - uses Selenium's Select class
   * 2. Custom combobox widgets (role='combobox') - clicks the dropdown to open,
   *    then finds and clicks the matching option element
   * 
   * The option value should be set via `.option()` before calling this method.
   * 
   * @returns {Promise<boolean>} True if successful
   * @throws {Error} Throws if `.option()` was not called before this method
   * @example
   * await browser.dropdown('Country').option('United').select();        // Partial text match
   * await browser.dropdown('Volume').option('25%').select();            // Value match
   * await browser.dropdown('Country').option(1).select();               // First option
   * await browser.dropdown('some combo').option('Option 1').select();   // Combobox text match
   */
  async select() {
    const browser = this.browser;
    browser.message = messenger({ stack: browser.stack, action: 'select', data: this.optionValue });

    if(this.optionValue === null){
      log.error(`Option to be selected was not provided. Please use option() chain.`)
      throw new Error(`Option to be selected was not provided. Please use option() chain.`);
    }

    try {
      let locator = await browser._finder();
      const { element, tagName } = await this.#resolveDropdownElement(locator);
      locator = element;

      if (tagName === 'select') {
        await this.#selectNative(locator);
      } else {
        await this.#selectCombobox(locator);
      }
    } catch (err) {
      browser.handleError(err, `selecting '${this.optionValue}' from dropdown`);
    } finally {
      this.optionValue = null;
      this.isIndex = false;
      browser.stack = [];
    }
    return true;
  }

  /**
   * Returns all currently selected options from a dropdown.
   * 
   * Supports two types of dropdowns:
   * 1. Native <select> elements - returns all selected options with text, value, and index
   * 2. Custom combobox widgets (role='combobox') - returns the currently displayed option
   * 
   * @returns {Promise<Array<Object>>} Array of objects with `text`, `value`, and `index` properties
   * @example
   * const options = await browser.dropdown('Multi Select').get.selected.options();
   * console.log(options); // [{ text: 'Option 1', value: 'opt1', index: 0 }, ...]
   */
  async getSelectedOptions() {
    const browser = this.browser;
    try {
      const locator = await browser._finder();
      const tagName = (await locator.tagName).toLowerCase();
      if (tagName === 'select') {
        return this.#getSelectedOptionsNative(locator);
      } else {
        return this.#getSelectedOptionsCombobox(locator);
      }
    } catch (err) {
      browser.handleError(err, 'getting selected options from dropdown');
    } finally {
      this.optionValue = null;
      this.isIndex = false;
      browser.stack = [];
    }
    return [];
  }

  /**
   * Finds an option in an array by text or value match.
   * Returns the matching option element and its index.
   * 
   * @private
   * @param {Array} options - Array of WebElement option elements
   * @param {string} searchStr - The string to search for
   * @returns {Promise<{option: Object|null, index: number}>} The matching option and its index, or null/-1 if not found
   */
  async #findMatchingOption(options, searchStr) {
    for (let i = 0; i < options.length; i++) {
      const [text, value] = await Promise.all([
        options[i].getAttribute('textContent'),
        options[i].getAttribute('value'),
      ]);
      if (text?.includes(searchStr) || value?.includes(searchStr)) {
        return { option: options[i], index: i };
      }
    }
    return { option: null, index: -1 };
  }

  /**
   * Gets all selected options from a native <select> element.
   * 
   * @private
   * @param {Object} locator - The WebElement representing the <select> element
   * @returns {Promise<Array<Object>>} Array of objects with `text`, `value`, and `index`
   */
  async #getSelectedOptionsNative(locator) {
    const select = new Select(locator);
    const selectedOptions = await select.getAllSelectedOptions();
    const allOptions = await select.getOptions();
    const result = [];

    // Build a map of option text/value to index for O(1) lookup
    const optionIndexMap = new Map();
    for (let i = 0; i < allOptions.length; i++) {
      const [text, value] = await Promise.all([
        allOptions[i].getAttribute('textContent'),
        allOptions[i].getAttribute('value'),
      ]);
      optionIndexMap.set(text?.trim(), i);
      optionIndexMap.set(value?.trim(), i);
    }

    for (const selected of selectedOptions) {
      const [text, value] = await Promise.all([
        selected.getAttribute('textContent'),
        selected.getAttribute('value'),
      ]);
      const trimmedText = text?.trim();
      const trimmedValue = value?.trim();
      const index = optionIndexMap.get(trimmedText) ?? optionIndexMap.get(trimmedValue) ?? -1;
      
      result.push({ 
        text: trimmedText,
        value: trimmedValue,
        index: index
      });
    }

    log.info(`Retrieved ${result.length} selected options from native <select>`);
    return result;
  }

  /**
   * Gets the selected option from a custom combobox widget.
   * 
   * @private
   * @param {Object} locator - The WebElement representing the combobox trigger
   * @returns {Promise<Array<Object>>} Array with single object containing `text`, `value`, and `index`
   */
  async #getSelectedOptionsCombobox(locator) {
    const text = await locator.getAttribute('textContent');
    const value = await locator.getAttribute('value');
    const result = [{ 
      text: text?.trim(), 
      value: value?.trim() || text?.trim(),
      index: 0 
    }];
    log.info(`Retrieved selected option from combobox: text='${result[0].text}', value='${result[0].value}'`);
    return result;
  }

  /**
   * Selects an option from a native <select> element.
   * 
   * Tries matching by index first (if numeric), then by visible text (partial,
   * case-insensitive), then by value attribute (partial, case-insensitive).
   * For multi-select elements, clicks the option directly to add to selection.
   * 
   * @private
   * @param {Object} locator - The WebElement representing the <select> element
   */
  async #selectNative(locator) {
    const select = new Select(locator);
    const options = await select.getOptions();
    const isMultiple = await locator.getAttribute('multiple');

    // If selector is a number, select by 1-based index
    if (this.isIndex) {
      const index = Number(this.optionValue) - 1; // Convert to 0-based
      if (index < 0 || index >= options.length) {
        throw new Error(`Index ${this.optionValue} out of range. Dropdown has ${options.length} options.`);
      }
      // For multi-select, use Selenium's selectByIndex to properly accumulate selections
      if (isMultiple !== null) {
        await select.selectByIndex(index);
        log.info(`Selected option at index ${this.optionValue} using native <select> (multi-select)`);
      } else {
        await select.selectByIndex(index);
        log.info(`Selected option at index ${this.optionValue} using native <select>`);
      }
      return true;
    }

    // For multi-select, click the option directly to add to selection
    if (isMultiple !== null) {
      return this.#selectMultiNative(select, options);
    }

    // Single select: use Selenium's Select methods
    return this.#selectSingleNative(select, options);
  }

  /**
   * Selects an option from a multi-select native <select> element.
   * 
   * @private
   * @param {Select} select - Selenium Select instance
   * @param {Array} options - Array of option WebElements
   */
  async #selectMultiNative(select, options) {
    // Try exact visible text match first
    try {
      await select.selectByVisibleText(this.optionValue);
      log.info(`Selected '${this.optionValue}' using native <select> (multi-select)`);
      return true;
    } catch { /* fall through to partial matching */ }

    // Try exact value match
    try {
      await select.selectByValue(this.optionValue);
      log.info(`Selected '${this.optionValue}' using native <select> (multi-select)`);
      return true;
    } catch { /* fall through to partial matching */ }

    // Partial match: use the shared helper
    const { option } = await this.#findMatchingOption(options, this.optionValue);
    if (option) {
      const [text, value] = await Promise.all([
        option.getAttribute('textContent'),
        option.getAttribute('value'),
      ]);
      await select.selectByVisibleText(text);
      log.info(`Selected option by partial match using native <select> (multi-select): text: '${text}', value: '${value}'`);
      return true;
    }

    throw new Error(`Option '${this.optionValue}' not found in dropdown (tried text, value, and partial matches)`);
  }

  /**
   * Selects an option from a single-select native <select> element.
   * 
   * @private
   * @param {Select} select - Selenium Select instance
   * @param {Array} options - Array of option WebElements
   */
  async #selectSingleNative(select, options) {
    // Try exact visible text match first
    try {
      await select.selectByVisibleText(this.optionValue);
      log.info(`Selected '${this.optionValue}' using native <select> (exact text match)`);
      return true;
    } catch { /* fall through to partial matching */ }

    // Try exact value match
    try {
      await select.selectByValue(this.optionValue);
      log.info(`Selected '${this.optionValue}' using native <select> (exact value match)`);
      return true;
    } catch { /* fall through to partial matching */ }

    // Partial match: use the shared helper
    const { option } = await this.#findMatchingOption(options, this.optionValue);
    if (option) {
      const [text, value] = await Promise.all([
        option.getAttribute('textContent'),
        option.getAttribute('value'),
      ]);
      await option.click();
      log.info(`Selected option by partial match using native <select>: text: '${text}', value: '${value}'`);
      return true;
    }

    log.warn(`Option '${this.optionValue}' not found in dropdown (tried text, value, and partial matches)`);
    throw new Error(`Option '${this.optionValue}' not found in dropdown (tried text, value, and partial matches)`);
  }

  /**
   * Selects an option from a custom combobox widget.
   * 
   * Clicks the combobox to open the dropdown list, then searches for an option
   * matching the given selector and clicks it. Supports index, text, and value
   * matching (partial, case-insensitive). Falls back to JavaScript click if
   * Selenium click fails.
   * 
   * @private
   * @param {Object} locator - The WebElement representing the combobox container
   */
  async #selectCombobox(locator) {
    const { allOptions } = await this.#openCombobox(locator);

    if (allOptions.length === 0) {
      throw new Error(`No options found in dropdown for selector '${this.optionValue}'`);
    }

    // If selector is a number, select by 1-based index
    if (this.isIndex) {
      const index = Number(this.optionValue) - 1; // Convert to 0-based
      if (index < 0 || index >= allOptions.length) {
        throw new Error(`Index ${this.optionValue} out of range. Dropdown has ${allOptions.length} options.`);
      }
      await this.#clickOption(allOptions[index], this.browser);
      log.info(`Selected option at index ${this.optionValue} from combobox`);
      return true;
    }

    // Use the shared helper for partial matching
    const { option } = await this.#findMatchingOption(allOptions, String(this.optionValue));
    if (option) {
      await this.#clickOption(option, this.browser);
      log.info(`Selected option by partial match '${this.optionValue}' from combobox`);
      return true;
    }

    throw new Error(`Option '${this.optionValue}' not found in dropdown (tried text, value, and partial matches)`);
  }

  /**
   * Opens a combobox and returns the trigger element and options.
   * 
   * @private
   * @param {Object} locator - The WebElement representing the combobox container
   * @returns {Promise<{triggerElement: Object, allOptions: Array}>}
   */
  async #openCombobox(locator) {
    const browser = this.browser;

    // Find the trigger element within the container to click
    let triggerElement = locator;
    const triggerSelectors = [
      './/*[contains(@class, "trigger")]',
      './/*[contains(@class, "dropdown-trigger")]',
      './/button',
      './/div[contains(@class, "dropdown")]//div[not(contains(@class, "menu"))]',
    ];

    for (const sel of triggerSelectors) {
      try {
        const triggers = await locator.findElements({ using: 'xpath', value: sel });
        if (triggers.length > 0) {
          triggerElement = triggers[0];
          break;
        }
      } catch {
        continue;
      }
    }

    // Click the trigger to open the dropdown
    try {
      await triggerElement.click();
    } catch {
      log.debug('Standard click failed, attempting JS click for combobox');
      await browser.driver.executeScript('arguments[0].click();', triggerElement);
    }

    // Wait briefly for the dropdown options to appear
    await new Promise(resolve => setTimeout(resolve, 300));

    // Find option elements within the container's context
    const optionSelectors = [
      './/*[contains(@role, "option")]',
      './/*[contains(@class, "option")]',
      './/li',
      './/ul/li',
      './/div[contains(@class, "menu")]//li',
    ];

    let allOptions = [];
    for (const sel of optionSelectors) {
      try {
        allOptions = await locator.findElements({ using: 'xpath', value: sel });
        if (allOptions.length > 0) break;
      } catch {
        continue;
      }
    }

    return { triggerElement, allOptions };
  }

  /**
   * Helper to find an option in an array of option elements by text or value.
   * 
   * @private
   * @param {Array} options - Array of WebElement option elements
   * @param {string} searchStr - The string to search for
   * @returns {Promise<boolean>} True if the option is found
   */
  async #findOptionInArray(options, searchStr) {
    const { option } = await this.#findMatchingOption(options, searchStr);
    return option !== null;
  }

  /**
   * Internal helper to check if a specific option is currently selected in a dropdown.
   * 
   * Supports two types of dropdowns:
   * 1. Native <select> elements - compares against the selected option's text/value
   * 2. Custom combobox widgets (role='combobox') - compares against the displayed text
   * 
   * The option to check must be set via `.option()` before calling this method.
   * 
   * @private
   * @returns {Promise<boolean>} True if the option is selected
   */
  async _isSelected() {
    const browser = this.browser; let result; let data = this.optionValue;
    if(data === null){
      log.error(`Option to be asserted was not provided. Please use option() chain.`);
      throw new Error(`Option to be asserted was not provided. Please use option() chain.`);
    }

    try {
      const locator = await browser._finder();
      const tagName = (await locator.tagName).toLowerCase();

      if (tagName === 'select') {
        result = await this.#isSelectedNative(locator);
      } else {
        result = await this.#isSelectedCombobox(locator);
      }
    } catch (err) {
      browser.handleError(err, `validating if '${data}' is selected`);
      throw err;
    } finally {
      this.optionValue = null;
      this.isIndex = false;
      browser.stack = [];
    }
    return result;
  }

  /**
   * Checks if a specific option is selected in a native <select> element.
   * 
   * - Returns `false` if the option exists in the dropdown but is not currently selected.
   * - Throws an error if the option does not exist in the dropdown at all.
   * 
   * @private
   * @param {Object} locator - The WebElement representing the <select> element
   * @returns {Promise<boolean>} True if the option is selected
   * @throws {Error} Throws if the option does not exist in the dropdown
   */
  async #isSelectedNative(locator) {
    const select = new Select(locator);
    const selectedOptions = await select.getAllSelectedOptions();

    // Check by index (1-based)
    if (this.isIndex) {
      const options = await select.getOptions();
      const index = this.optionValue - 1;
      if (index < 0 || index >= options.length) {
        throw new Error(`Index ${this.optionValue} out of range. Dropdown has ${options.length} options.`);
      }
      const [optText, optValue] = await Promise.all([
        options[index].getAttribute('textContent'),
        options[index].getAttribute('value'),
      ]);
      // Check if this option is among the selected options
      for (const selected of selectedOptions) {
        const [selText, selValue] = await Promise.all([
          selected.getAttribute('textContent'),
          selected.getAttribute('value'),
        ]);
        if (optText === selText || optValue === selValue) return true;
      }
      return false;
    }

    // Verify the option actually exists in the dropdown
    const options = await select.getOptions();
    let optionExists = false;
    for (const o of options) {
      const [optText, optValue] = await Promise.all([
        o.getAttribute('textContent'),
        o.getAttribute('value'),
      ]);
      if (optText?.includes(this.optionValue) || optValue?.includes(this.optionValue)) {
        optionExists = true;
        break;
      }
    }

    if (!optionExists) {
      log.warn(`Option '${this.optionValue}' does not exist in dropdown`);
      return false;
    }

    // Option exists — check if it is among the currently selected options
    for (const selected of selectedOptions) {
      const [selectedText, selectedValue] = await Promise.all([
        selected.getAttribute('textContent'),
        selected.getAttribute('value'),
      ]);
      const textMatch = selectedText?.includes(this.optionValue);
      const valueMatch = selectedValue?.includes(this.optionValue);
      if (textMatch || valueMatch) return true;
    }
    return false;
  }

  /**
   * Checks if a specific option is selected in a custom combobox widget.
   * 
   * - Returns `false` if the option exists in the combobox but is not currently selected.
   * - Throws an error if the option does not exist in the combobox at all.
   * 
   * @private
   * @param {Object} locator - The WebElement representing the combobox container
   * @returns {Promise<boolean>} True if the option is selected
   * @throws {Error} Throws if the option does not exist in the combobox
   */
  async #isSelectedCombobox(locator) {
    const { triggerElement, allOptions } = await this.#openCombobox(locator);

    // Get current text from trigger element
    const currentText = await triggerElement.getAttribute('textContent');
    if (!currentText) {
      throw new Error(`Combobox has no text content`);
    }

    // Check if the option exists in the combobox
    const searchStr = String(this.optionValue);
    const optionExists = await this.#findOptionInArray(allOptions, searchStr);

    if (!optionExists) {
      log.warn(`Option '${this.optionValue}' does not exist in combobox`);
      return false;
    }

    // Option exists — check if it is the currently selected one
    return currentText.includes(searchStr);
  }

  /**
   * Checks if a dropdown has a specific option.
   * 
   * Supports both native <select> elements and custom combobox widgets.
   * 
   * @param {string|number} optionValue - The option value to check for
   * @returns {Promise<boolean>} True if the option exists in the dropdown
   */
  async _hasOption(optionValue = null) {
    const browser = this.browser;
    let result = false;

    // Use provided optionValue or fall back to this.optionValue
    const valueToCheck = optionValue !== null ? optionValue : this.optionValue;

    if (valueToCheck === null) {
      log.error(`Option to check was not provided.`);
      throw new Error(`Option to check was not provided.`);
    }

    // Store the original optionValue and set the new one
    const originalOptionValue = this.optionValue;
    const originalIsIndex = this.isIndex;
    this.optionValue = valueToCheck;
    if (typeof valueToCheck === 'number' && valueToCheck > 0) this.isIndex = true;

    try {
      const locator = await browser._finder();
      const tagName = (await locator.tagName).toLowerCase();

      if (tagName === 'select') {
        result = await this.#hasOptionNative(locator);
      } else {
        result = await this.#hasOptionCombobox(locator);
      }
    } catch (err) {
      browser.handleError(err, `checking if option '${valueToCheck}' exists in dropdown`);
    } finally {
      this.optionValue = originalOptionValue;
      this.isIndex = originalIsIndex;
      browser.stack = [];
    }
    return result;
  }

  /**
   * Checks if a native <select> element has a specific option.
   * 
   * @private
   * @param {Object} locator - The WebElement representing the <select> element
   * @returns {Promise<boolean>} True if the option exists
   */
  async #hasOptionNative(locator) {
    const select = new Select(locator);
    const options = await select.getOptions();
    const { option } = await this.#findMatchingOption(options, String(this.optionValue));
    return option !== null;
  }

  /**
   * Checks if a custom combobox widget has a specific option.
   * 
   * @private
   * @param {Object} locator - The WebElement representing the combobox container
   * @returns {Promise<boolean>} True if the option exists
   */
  async #hasOptionCombobox(locator) {
    const searchStr = String(this.optionValue);
    const { allOptions } = await this.#openCombobox(locator);
    return this.#findOptionInArray(allOptions, searchStr);
  }

  /**
   * Gets all options from a dropdown.
   * 
   * Supports both native <select> elements and custom combobox widgets.
   * 
   * @returns {Promise<Array<{text: string, value: string}>>} Array of option objects with text and value
   */
  async getOptions() {
    const browser = this.browser;

    try {
      const locator = await browser._finder();
      const tagName = (await locator.tagName).toLowerCase();

      if (tagName === 'select') {
        return await this.#getOptionsNative(locator);
      } else {
        return await this.#getOptionsCombobox(locator);
      }
    } catch (err) {
      browser.handleError(err, 'getting options from dropdown');
    } finally {
      browser.stack = [];
    }
    return [];
  }

  /**
   * Gets all options from a native <select> element.
   * 
   * @private
   * @param {Object} locator - The WebElement representing the <select> element
   * @returns {Promise<Array<{text: string, value: string}>>} Array of option objects
   */
  async #getOptionsNative(locator) {
    const select = new Select(locator);
    const options = await select.getOptions();
    const result = [];

    for (const o of options) {
      const [text, value] = await Promise.all([
        o.getAttribute('textContent'),
        o.getAttribute('value'),
      ]);
      result.push({ text: text?.trim(), value: value?.trim() });
    }

    log.info(`Retrieved ${result.length} options from native <select>`);
    return result;
  }

  /**
   * Gets all options from a custom combobox widget.
   * 
   * @private
   * @param {Object} locator - The WebElement representing the combobox container
   * @returns {Promise<Array<{text: string, value: string}>>} Array of option objects
   */
  async #getOptionsCombobox(locator) {
    const { allOptions } = await this.#openCombobox(locator);
    const result = [];

    for (const option of allOptions) {
      const [text, value] = await Promise.all([
        option.getAttribute('textContent'),
        option.getAttribute('value'),
      ]);
      result.push({ text: text?.trim(), value: value?.trim() || text?.trim() });
    }

    log.info(`Retrieved ${result.length} options from combobox`);
    return result;
  }

  /**
   * Clicks an option element, falling back to JavaScript click if needed.
   * 
   * @private
   * @param {Object} optionElement - The WebElement representing the option
   * @param {Object} browser - The browser instance
   */
  async #clickOption(optionElement, browser) {
    try {
      await optionElement.click();
    } catch {
      log.debug('Standard click failed, attempting JS click for option');
      await browser.driver.executeScript('arguments[0].click();', optionElement);
    }
  }
}