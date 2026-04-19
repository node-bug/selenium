export class SelectorStackBuilder {
  constructor(parent) {
    this.parent = parent; // Reference to the WebBrowser instance
    this.stack = parent.stack; // Direct reference to the parent's stack
  }

  // Private helper to check if an object is a flag container
  #isFlagObject(obj) {
    return obj && typeof obj.exact === 'boolean' && typeof obj.hidden === 'boolean';
  }

  // Internal helper to set flags on the stack
  #setFlag(key, value) {
    const top = this.stack[this.stack.length - 1];

    if (this.#isFlagObject(top)) {
      top[key] = value;
    } else {
      this.stack.push({ exact: false, hidden: false, [key]: value });
    }
    return this; // Returns this builder instance for further chaining
  }

  exact() {
    return this.#setFlag('exact', true);
  }

  hidden() {
    return this.#setFlag('hidden', true);
  }

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

// Chainable Delegate for building XPath selectors based on element types and attributes
// Builder Pattern: Each method returns the builder for chaining, and the final call returns the parent (WebBrowser) for action execution