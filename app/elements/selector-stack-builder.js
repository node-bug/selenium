/**
 * Builder for constructing and managing a stack of selector descriptors.
 * Each descriptor represents an element type, its identifier, matching flags,
 * and a placeholder for resolved WebElement matches.
 *
 * The builder operates by pushing structured objects onto a shared stack
 * (owned by the parent WebBrowser instance). Modifier methods like {@link exact}
 * and {@link hidden} mutate the top-of-stack flags, while type methods like
 * {@link element} consume those flags and push a fully-formed selector member.
 *
 * Chainable methods return either the builder itself (for further modifiers)
 * or the parent WebBrowser instance (to switch back to action mode).
 */
export class SelectorStackBuilder {
  /**
   * @param {WebBrowser} parent - The parent WebBrowser instance that owns the stack.
   */
  constructor(parent) {
    this.parent = parent; // Reference to the WebBrowser instance
    this.stack = parent.stack; // Direct reference to the parent's stack
  }

  // Private helper to check if an object is a flag container
  #isFlagObject(obj) {
    return obj && typeof obj.exact === 'boolean' && typeof obj.hidden === 'boolean';
  }

  /**
   * Sets a flag on the top-of-stack item.
   * If the top item is already a flag container, it mutates it in place.
   * Otherwise, it pushes a new flag container onto the stack.
   *
   * @private
   * @param {string} key - The flag key to set (e.g., 'exact', 'hidden').
   * @param {*} value - The value to assign.
   * @returns {SelectorStackBuilder} The builder instance for chaining.
   */
  #setFlag(key, value) {
    const top = this.stack[this.stack.length - 1];

    if (this.#isFlagObject(top)) {
      top[key] = value;
    } else {
      this.stack.push({ exact: false, hidden: false, [key]: value });
    }
    return this; // Returns this builder instance for further chaining
  }

  /**
   * Marks the current selector for exact (case-sensitive, full-string) matching.
   * Sets the `exact` flag to `true` on the top-of-stack item.
   *
   * @returns {WebBrowser} The parent WebBrowser instance to switch back to action mode.
   */
  exact() {
    this.#setFlag('exact', true);
    return this.parent;
  }

  /**
   * Marks the current selector to include hidden (zero-dimension) elements in results.
   * Sets the `hidden` flag to `true` on the top-of-stack item.
   *
   * @returns {WebBrowser} The parent WebBrowser instance to switch back to action mode.
   */
  hidden() {
    this.#setFlag('hidden', true);
    return this.parent;
  }

  /**
   * Pushes a generic `element` selector onto the stack.
   *
   * Consumes any pending flag container from the top of the stack and merges
   * its `exact` and `hidden` values into the new member. If the top item is
   * not a flag container, it is pushed back unchanged.
   *
   * The resulting member object contains:
   * - `type`: always `'element'` (matches any XPath node).
   * - `id`: the stringified identifier used for text/attribute matching.
   * - `exact` / `hidden`: resolved flag values.
   * - `matches`: an empty array, later populated by {@link LocatorStrategy#resolveElements}.
   * - `index`: set to `false` to indicate default (first) index selection.
   *
   * @param {*} data - The element identifier (text, attribute value, etc.). Will be coerced to a string.
   * @returns {WebBrowser} The parent WebBrowser instance to switch back to action mode.
   */
  element(data) {
    const og = this.stack.pop();
    let flags = { exact: false, hidden: false };

    if (this.#isFlagObject(og)) {
      flags = og;
    } else if (og) {
      this.stack.push(og);
    }

    const member = {
      type: 'element',
      id: data.toString(),
      exact: flags.exact,
      hidden: flags.hidden,
      matches: [],
      index: false
    };

    this.stack.push(member);
    
    // CRITICAL: Return the parent (WebBrowser) to switch back to action mode
    return this.parent;
  }
}