import { Select } from 'selenium-webdriver';
import { log } from '@nodebug/logger';
import messenger from '../messenger.js';

/**
 * Select delegate for handling dropdown/combobox selection operations
 * 
 * This class encapsulates all dropdown-related functionality, supporting both
 * native <select> elements and custom combobox widgets (role='combobox').
 * 
 * @class SelectDelegate
 */
export class SelectDelegate {
  constructor(browser) {
    this.browser = browser;
    this.optionValue = null;
    this.isIndex = false;
  }

  /**
   * Sets the option value for subsequent selection operations.
   * 
   * This is the first step in the chaining pattern. The value can be:
   * - A string: matches against visible text or value attribute
   * - A positive number: treated as a 1-based index
   * 
   * @param {string|number} value - Text, value, or 1-based index of the option
   * @example
   * await browser.dropdown('Country').option('United States').select();
   * await browser.dropdown('Country').option(1).select();
   */
  option(value) {
    this.optionValue = value;
    if (typeof value === 'number' && value > 0) this.isIndex = true;
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
      const locator = await browser._finder(null, 'select');
      const tagName = await locator.tagName;

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
   * Returns the currently selected option from a dropdown.
   * 
   * Supports two types of dropdowns:
   * 1. Native <select> elements - returns the selected option's text and value
   * 2. Custom combobox widgets (role='combobox') - returns the currently displayed text
   * 
   * @returns {Promise<Object>} An object with `text` and `value` properties
   * @example
   * const text = await browser.dropdown('Country').get.text();
   * const value = await browser.dropdown('Country').get.value();
   * console.log(text);   // "United States"
   * console.log(value);  // "us"
   */
  async getSelectedOption() {
    const browser = this.browser;
    try {
      const locator = await browser._finder(null, 'select');
      const tagName = await locator.tagName;
      if (tagName === 'select') {
        return this.#getSelectedNative(locator);
      } else {
        return this.#getSelectedCombobox(locator);
      }
    } catch (err) {
      browser.handleError(err, 'getting selected option from dropdown');
    } finally {
      this.optionValue = null;
      this.isIndex = false;
      browser.stack = [];
    }
    return { text: '', value: '' };
  }

  /**
   * Gets the currently selected option from a native <select> element.
   * 
   * @private
   * @param {Object} locator - The WebElement representing the <select> element
   * @returns {Promise<Object>} Object with `text` and `value` of the selected option
   */
  async #getSelectedNative(locator) {
    const select = new Select(locator);
    const selectedOption = await select.getFirstSelectedOption();
    const [text, value] = await Promise.all([
      selectedOption.getAttribute('textContent'),
      selectedOption.getAttribute('value'),
    ]);
    const result = { text: text?.trim(), value: value?.trim() };
    log.info(`Selected option in native <select>: text='${result.text}', value='${result.value}'`);
    return result;
  }

  /**
   * Gets the currently selected option from a custom combobox widget.
   * 
   * @private
   * @param {Object} locator - The WebElement representing the combobox trigger
   * @returns {Promise<Object>} Object with `text` and `value` of the selected option
   */
  async #getSelectedCombobox(locator) {
    const text = await locator.getAttribute('textContent');
    const value = await locator.getAttribute('value');
    const result = { text: text?.trim(), value: value?.trim() || text?.trim() };
    log.info(`Selected option in combobox: text='${result.text}', value='${result.value}'`);
    return result;
  }

  /**
   * Selects an option from a native <select> element.
   * 
   * Tries matching by index first (if numeric), then by visible text (partial,
   * case-insensitive), then by value attribute (partial, case-insensitive).
   * 
   * @private
   * @param {Object} locator - The WebElement representing the <select> element
   */
  async #selectNative(locator) {
    const select = new Select(locator);
    const options = await select.getOptions();

    // If selector is a number, select by 1-based index
    if (this.isIndex) {
      const index = Number(this.optionValue) - 1; // Convert to 0-based
      if (index < 0 || index >= options.length) {
        throw new Error(`Index ${this.optionValue} out of range. Dropdown has ${options.length} options.`);
      }
      await select.selectByIndex(index);
      log.info(`Selected option at index ${this.optionValue} using native <select>`);
      return true;
    }

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

    // Partial match: search through all options by text or value
    for (const o of options) {
      const [text, value] = await Promise.all([
        o.getAttribute('textContent'),
        o.getAttribute('value'),
      ]);

      const textMatch = text?.includes(this.optionValue);
      const valueMatch = value?.includes(this.optionValue);

      if (textMatch || valueMatch) {
        const matchedBy = textMatch ? 'text' : 'value';
        await o.click();
        log.info(`Selected option by partial ${matchedBy} match using native <select>: text: '${text}', value: '${value}' `);
        return true;
      }
    }

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
   * @param {Object} locator - The WebElement representing the combobox trigger
   */
  async #selectCombobox(locator) {
    const browser = this.browser;

    // Click the combobox to open the dropdown
    try {
      await locator.click();
    } catch {
      log.debug('Standard click failed, attempting JS click for combobox');
      await browser.driver.executeScript('arguments[0].click();', locator);
    }

    // Wait briefly for the dropdown options to appear
    await new Promise(resolve => setTimeout(resolve, 300));

    // Find all option elements in the opened dropdown
    const optionSelectors = [
      `//*[contains(@role, 'option')]`,
      `//*[contains(@class, 'option')]`,
      `//li`,
      `//*[self::div or self::span or self::li]`,
    ];

    let allOptions = [];
    for (const sel of optionSelectors) {
      try {
        allOptions = await browser.driver.findElements({ using: 'xpath', value: sel });
        if (allOptions.length > 0) break;
      } catch {
        continue;
      }
    }

    if (allOptions.length === 0) {
      throw new Error(`No options found in dropdown for selector '${this.optionValue}'`);
    }

    // If selector is a number, select by 1-based index
    if (this.isIndex) {
      const index = Number(this.optionValue) - 1; // Convert to 0-based
      if (index < 0 || index >= allOptions.length) {
        throw new Error(`Index ${this.optionValue} out of range. Dropdown has ${allOptions.length} options.`);
      }
      await this.#clickOption(allOptions[index], browser);
      log.info(`Selected option at index ${this.optionValue} from combobox`);
      return true;
    }

    const searchStr = String(this.optionValue);

    // Try to find a matching option by text or value
    for (const option of allOptions) {
      const [text, value] = await Promise.all([
        option.getAttribute('textContent'),
        option.getAttribute('value'),
      ]);

      const textMatch = text?.includes(searchStr);
      const valueMatch = value?.includes(searchStr);

      if (textMatch || valueMatch) {
        await this.#clickOption(option, browser);
        const matchedBy = textMatch ? 'text' : 'value';
        log.info(`Selected option by partial ${matchedBy} match '${this.optionValue}' from combobox`);
        return true;
      }
    }

    throw new Error(`Option '${this.optionValue}' not found in dropdown (tried text, value, and partial matches)`);
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
      const locator = await browser._finder(null, 'select');
      const tagName = await locator.tagName;

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
   * @private
   * @param {Object} locator - The WebElement representing the <select> element
   * @returns {Promise<boolean>} True if the option is selected
   * @throws {Error} Throws if the option is not selected
   */
  async #isSelectedNative(locator) {
    const select = new Select(locator);
    const selectedOption = await select.getFirstSelectedOption();
    const [selectedText, selectedValue] = await Promise.all([
      selectedOption.getAttribute('textContent'),
      selectedOption.getAttribute('value'),
    ]);

    if (!selectedText && !selectedValue) {
      throw new Error(`Selected option has no text or value`);
    }

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
      // log.info(`Option at index ${this.optionValue} is selected: text: '${optText}', value: '${optValue}'`)
      if (optText !== selectedText && optValue !== selectedValue) return false
      // {
      //   throw new Error(`Option '${this.optionValue}' is not selected`);
      // }
      return true;
    }

    // Check by text or value (partial, case-insensitive)
    const textMatch = selectedText?.includes(this.optionValue);
    const valueMatch = selectedValue?.includes(this.optionValue);

    // log.info(`Option selected is: text: '${selectedText}', value: '${selectedValue}'`)
    if (!textMatch && !valueMatch) return false 
    // {
    //   throw new Error(`Option '${this.optionValue}' is not selected`);
    // }
    return true;
  }

  /**
   * Checks if a specific option is selected in a custom combobox widget.
   * 
   * @private
   * @param {Object} locator - The WebElement representing the combobox trigger
   * @returns {Promise<boolean>} True if the option is selected
   * @throws {Error} Throws if the option is not selected
   */
  async #isSelectedCombobox(locator) {
    const text = await locator.getAttribute('textContent');
    if (!text) {
      throw new Error(`Combobox has no text content`);
    }
    if (!text.includes(this.optionValue)) {
      throw new Error(`Option '${this.optionValue}' is not selected`);
    }
    return true;
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
