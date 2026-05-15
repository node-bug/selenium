/**
 * Refactored Selector Stack Builder
 * 
 * Chainable builder API for constructing selector stacks.
 * Uses a stack-based approach for building complex element queries.
 */

/**
 * Determines if an object is a flag container (temporary holder for flags).
 * 
 * @private
 * @param {any} obj - Object to check
 * @returns {boolean} True if object has exact and hidden boolean flags
 */
function isFlagObject(obj) {
  return obj && typeof obj.exact === 'boolean' && typeof obj.hidden === 'boolean';
}

/**
 * Creates a new selector member with default values.
 * 
 * @private
 * @param {string} type - Element type
 * @param {string} id - Element identifier
 * @param {boolean} exact - Exact matching flag
 * @param {boolean} hidden - Include hidden elements flag
 * @returns {Object} Selector member object
 */
function createSelectorMember(type, id, exact = false, hidden = false) {
  const value = id?.toString() ?? undefined;
  const member = {
    type,
    id: value,
    exact,
    hidden,
    matches: [],
    index: false
  };
  
  // Default to first match if no ID provided
  if (value === undefined) {
    member.index = 1;
  }

  return member;
}

/**
 * Creates a location/spatial filter member.
 * 
 * @private
 * @param {string} located - Spatial relationship (above, below, etc.)
 * @param {boolean} [exactly] - Require exact alignment
 * @returns {Object} Location member object
 */
function createLocationMember(located, exactly = false) {
  return {
    type: 'location',
    located,
    exactly,
    matches: []
  };
}

/**
 * Selector Stack Builder - Chainable API for building complex element queries.
 * 
 * **Usage Pattern:**
 * ```javascript
 * browser
 *   .button('Submit')
 *   .hidden()
 *   .below(button1)
 *   .toRightOf(reference)
 *   .element('123')
 * ```
 * 
 * **How It Works:**
 * 1. Call type methods (button(), textbox(), etc.) to add element selectors
 * 2. Call modifier methods (exact(), hidden()) to adjust flags
 * 3. Call spatial methods (above(), below(), etc.) to add spatial filters
 * 4. Each operation adds or modifies the stack
 * 5. Final call to execute (find(), findAll()) processes the stack
 */
export class SelectorStackBuilder {
  #stack;

  /**
   * @param {any} parent - Parent object (e.g., WebBrowser instance)
   * @param {any} [stack] - Existing stack to build on
   */
  constructor(parent, stack = null) {
    this.#stack = stack || [];
  }

  /**
   * Gets the current stack.
   * 
   * @returns {Object[]} Stack items
   */
  getStack() {
    return [...this.#stack];
  }

  /**
   * Sets a flag on the top-of-stack item.
   * If top is already a flag container, mutates it.
   * Otherwise, pushes a new flag container.
   * 
   * @private
   * @param {string} key - Flag key (exact, hidden, etc.)
   * @param {*} value - Flag value
   * @returns {SelectorStackBuilder} This builder for chaining
   */
  #setFlag(key, value) {
    const top = this.#stack[this.#stack.length - 1];

    if (isFlagObject(top)) {
      top[key] = value;
    } else {
      this.#stack.push({ exact: false, hidden: false, [key]: value });
    }
    return this;
  }

  /**
   * Marks selector for exact (full-string, case-sensitive) matching.
   * 
   * @returns {SelectorStackBuilder} This builder for chaining
   */
  exact() {
    this.#setFlag('exact', true);
    return this;
  }

  /**
   * Marks selector to include hidden elements (zero-dimension).
   * 
   * @returns {SelectorStackBuilder} This builder for chaining
   */
  hidden() {
    this.#setFlag('hidden', true);
    return this;
  }

  /**
   * Selects by index (1-based).
   * Example: element().at(2) selects the second match
   * 
   * @param {number} index - 1-based index
   * @returns {SelectorStackBuilder} This builder for chaining
   */
  at(index) {
    if (this.#stack.length > 0) {
      const top = this.#stack[this.#stack.length - 1];
      if (top.type && typeof top.type === 'string') {
        top.index = Math.max(1, Math.floor(index));
      }
    }
    return this;
  }

  /**
   * Generic element selector (matches any element).
   * 
   * @param {*} data - Element identifier
   * @returns {SelectorStackBuilder} This builder for chaining
   */
  element(data) {
    const flags = this.#consumeFlags();
    this.#stack.push(createSelectorMember('element', data, flags.exact, flags.hidden));
    return this;
  }

  /**
   * Button selector.
   * 
   * @param {*} data - Button text or identifier
   * @returns {SelectorStackBuilder} This builder for chaining
   */
  button(data) {
    const flags = this.#consumeFlags();
    this.#stack.push(createSelectorMember('button', data, flags.exact, flags.hidden));
    return this;
  }

  /**
   * Checkbox selector.
   * 
   * @param {*} data - Checkbox label or identifier
   * @returns {SelectorStackBuilder} This builder for chaining
   */
  checkbox(data) {
    const flags = this.#consumeFlags();
    this.#stack.push(createSelectorMember('checkbox', data, flags.exact, flags.hidden));
    return this;
  }

  /**
   * Link selector.
   * 
   * @param {*} data - Link text or identifier
   * @returns {SelectorStackBuilder} This builder for chaining
   */
  link(data) {
    const flags = this.#consumeFlags();
    this.#stack.push(createSelectorMember('link', data, flags.exact, flags.hidden));
    return this;
  }

  /**
   * Textbox selector.
   * 
   * @param {*} data - Textbox placeholder or identifier
   * @returns {SelectorStackBuilder} This builder for chaining
   */
  textbox(data) {
    const flags = this.#consumeFlags();
    this.#stack.push(createSelectorMember('textbox', data, flags.exact, flags.hidden));
    return this;
  }

  /**
   * Dropdown selector.
   * 
   * @param {*} data - Dropdown label or option text
   * @returns {SelectorStackBuilder} This builder for chaining
   */
  dropdown(data) {
    const flags = this.#consumeFlags();
    this.#stack.push(createSelectorMember('dropdown', data, flags.exact, flags.hidden));
    return this;
  }

  /**
   * Radio button selector.
   * 
   * @param {*} data - Radio label or identifier
   * @returns {SelectorStackBuilder} This builder for chaining
   */
  radio(data) {
    const flags = this.#consumeFlags();
    this.#stack.push(createSelectorMember('radio', data, flags.exact, flags.hidden));
    return this;
  }

  /**
   * Switch (toggle) selector.
   * 
   * @param {*} data - Switch label or identifier
   * @returns {SelectorStackBuilder} This builder for chaining
   */
  switch(data) {
    const flags = this.#consumeFlags();
    this.#stack.push(createSelectorMember('switch', data, flags.exact, flags.hidden));
    return this;
  }

  /**
   * Image selector.
   * 
   * @param {*} data - Image alt text or src
   * @returns {SelectorStackBuilder} This builder for chaining
   */
  image(data) {
    const flags = this.#consumeFlags();
    this.#stack.push(createSelectorMember('image', data, flags.exact, flags.hidden));
    return this;
  }

  /**
   * Table selector.
   * 
   * @param {*} data - Table identifier
   * @returns {SelectorStackBuilder} This builder for chaining
   */
  table(data) {
    const flags = this.#consumeFlags();
    this.#stack.push(createSelectorMember('table', data, flags.exact, flags.hidden));
    return this;
  }

  /**
   * Spatial filter: above
   * 
   * @param {WebElement} reference - Reference element
   * @param {boolean} [exactly] - Require horizontal alignment
   * @returns {SelectorStackBuilder} This builder for chaining
   */
  above(reference, exactly = false) {
    this.#stack.push(createLocationMember('above', exactly));
    // Store reference for later use
    this.#stack[this.#stack.length - 1].reference = reference;
    return this;
  }

  /**
   * Spatial filter: below
   * 
   * @param {WebElement} reference - Reference element
   * @param {boolean} [exactly] - Require horizontal alignment
   * @returns {SelectorStackBuilder} This builder for chaining
   */
  below(reference, exactly = false) {
    this.#stack.push(createLocationMember('below', exactly));
    this.#stack[this.#stack.length - 1].reference = reference;
    return this;
  }

  /**
   * Spatial filter: to the left of
   * 
   * @param {WebElement} reference - Reference element
   * @param {boolean} [exactly] - Require vertical alignment
   * @returns {SelectorStackBuilder} This builder for chaining
   */
  toLeftOf(reference, exactly = false) {
    this.#stack.push(createLocationMember('toLeftOf', exactly));
    this.#stack[this.#stack.length - 1].reference = reference;
    return this;
  }

  /**
   * Spatial filter: to the right of
   * 
   * @param {WebElement} reference - Reference element
   * @param {boolean} [exactly] - Require vertical alignment
   * @returns {SelectorStackBuilder} This builder for chaining
   */
  toRightOf(reference, exactly = false) {
    this.#stack.push(createLocationMember('toRightOf', exactly));
    this.#stack[this.#stack.length - 1].reference = reference;
    return this;
  }

  /**
   * Spatial filter: within parent element
   * 
   * @param {WebElement|WebElement[]} parent - Parent element(s)
   * @returns {SelectorStackBuilder} This builder for chaining
   */
  within(parent) {
    this.#stack.push(createLocationMember('within'));
    this.#stack[this.#stack.length - 1].reference = parent;
    return this;
  }

  /**
   * Spatial filter: near (same row/column)
   * 
   * @param {WebElement} reference - Reference element
   * @returns {SelectorStackBuilder} This builder for chaining
   */
  near(reference) {
    this.#stack.push(createLocationMember('near'));
    this.#stack[this.#stack.length - 1].reference = reference;
    return this;
  }

  /**
   * Consumes any pending flag container on the stack.
   * 
   * @private
   * @returns {Object} Flag object with exact and hidden properties
   */
  #consumeFlags() {
    const top = this.#stack[this.#stack.length - 1];
    
    if (isFlagObject(top)) {
      this.#stack.pop();
      return { exact: top.exact, hidden: top.hidden };
    }

    return { exact: false, hidden: false };
  }

  /**
   * Clears the entire stack.
   * 
   * @returns {SelectorStackBuilder} This builder for chaining
   */
  clear() {
    this.#stack = [];
    return this;
  }

  /**
   * Returns this builder for method chaining.
   * Useful after spatial methods or when returning to parent context.
   * 
   * @returns {SelectorStackBuilder} This builder
   */
  builder() {
    return this;
  }
}
