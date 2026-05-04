/**
 * Defines XPath constraints for semantic element types (button, textbox, link, etc.)
 * and provides utilities for building XPath matchers against attributes and text content.
 *
 * Each element type maps to an XPath predicate that matches by tag, ARIA role,
 * or attribute. The {@link buildMatcher} method combines these predicates with
 * attribute/text comparisons and a recursion guard to target the innermost match.
 */
export class ElementTypes {
  /**
   * Initializes the list of searchable attributes and the element-type
   * to XPath-constraint map.
   */
  constructor() {
    /**
     * HTML attributes checked when building XPath matchers.
     * @type {string[]}
     */
    this.attributes = [
      'placeholder', 'value', 'data-test-id', 'data-testid', 'id',
      'resource-id', 'name', 'aria-label', 'class', 'hint',
      'title', 'tooltip', 'alt', 'src', 'role'
    ];

    this.definitions = {
      // Navigation & Structure
      link: `self::a or @role='link' or @href`,
      navigation: `@role='navigation' or self::nav`,
      heading: `@role='heading' or self::h1 or self::h2 or self::h3 or self::h4 or self::h5 or self::h6`,

      // Interactive Controls
      button: `self::button or @role='button' or @type='button' or @type='submit'`,
      checkbox: `(self::input and @type='checkbox') or @role='checkbox'`,
      switch: `@role='switch'`,
      radio: `(self::input and @type='radio') or @role='radio'`,
      slider: `@role='slider'`,
      // dropdown: `@role='combobox' or self::select`,
      dropdown: `@role='combobox' or self::select or .//option`,

      // Forms & Inputs
      textbox: `self::textarea or (self::input and (@type='text' or @type='password' or @type='search' or @type='email')) or @role='textbox'`,
      file: `self::input and @type='file'`,

      // Lists & Menus
      list: `self::ul or self::ol or @role='list'`,
      listitem: `self::li or @role='listitem'`,
      menu: `self::menu or @role='menu'`,
      menuitem: `@role='menuitem'`,

      // Containers & Layout
      toolbar: `@role='toolbar'`,
      dialog: `@role='dialog'`,

      // Tables / Grids
      row: `self::tr or @role='row'`,
      column: `self::td or self::th or @role='cell' or @role='gridcell' or @role='columnheader'`,

      // Media
      image: `self::img or @role='img' or @alt`,

      // Global Fallback
      element: `true()` // Matches any element fulfilling the text/attr criteria
    }
  }

  /**
   * Properly escapes strings for XPath 1.0.
   * If the value contains single quotes, it is split and wrapped in a
   * `concat()` expression to avoid breaking the XPath syntax.
   *
   * @param {*} value - The string value to escape (null/undefined returns an empty string literal).
   * @returns {string} A valid XPath string literal or `concat()` expression.
   */
  transform(value) {
    // Handle null/undefined values
    if (value === null || value === undefined) {
      return "''";
    }

    if (!value.includes("'")) return `'${value}'`;

    const parts = value.split("'");
    const escaped = parts.map(part => `'${part}'`).join(',"\'",');
    return `concat(${escaped})`;
  }

  /**
   * Generates a combined XPath matcher for all configured attributes and text content.
   *
   * The resulting expression checks every attribute in {@link attributes} plus the
   * element's text node (`.`), joined by `or`. A recursion guard is appended to
   * ensure only the innermost element containing the text is matched.
   *
   * @param {string} value - The text or attribute value to match against.
   * @param {boolean} [exact=false] - If true, uses exact equality (`normalize-space()=...`);
   *                                 if false, uses substring matching (`contains(...)`).
   * @returns {string} An XPath expression fragment suitable for embedding inside a larger query.
   */
  buildMatcher(value, exact = false) {
    const val = this.transform(value);

    // Choose the XPath comparison method
    const conditionFn = (target) => exact
      ? `normalize-space(${target})=${val}`
      : `contains(normalize-space(${target}),${val})`;

    // Build array of attribute conditions + the dot (text content) condition
    const conditions = [...this.attributes.map(attr => `@${attr}`), '.']
      .map(target => conditionFn(target));

    const baseCondition = conditions.join(' or ');

    // Recursive check to ensure we get the innermost element containing the text
    const recursionPreventer = exact
      ? `not(.//*[normalize-space(.)=${val}])`
      : `not(.//*[contains(normalize-space(.),${val})])`;

    return `${baseCondition} and ${recursionPreventer}`;
  }

  /**
   * Returns an object mapping each element type to a full XPath selector.
   *
   * Each selector combines the matcher for the given value with the type-specific
   * XPath constraint (e.g., `self::button or @role='button'`).
   *
   * @param {string} value - The text or attribute value to match against.
   * @param {boolean} [exact=false] - Whether to use exact or substring matching.
   * @returns {Object.<string, string>} A map of element type names to full XPath strings.
   */
  getSelectors(value, exact = false) {
    const matcherStr = this.buildMatcher(value, exact);

    // Convert definitions into full XPaths
    return Object.fromEntries(
      Object.entries(this.definitions).map(([name, constraint]) => [
        name, `//*[(${matcherStr}) and (${constraint})]`
      ])
    );
  }
}