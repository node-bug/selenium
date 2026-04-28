export class ElementTypes {
  constructor() {
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
      dropdown: `@role='combobox' or self::select`,

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
   * Logic: If it contains a single quote, wrap in concat() and escape.
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
   * Generates a combined matcher for all attributes and text content
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

    // Recursive check to ensure we select the innermost element containing the text
    const recursionPreventer = exact
      ? `not(.//*[normalize-space(.)=${val}])`
      : `not(.//*[contains(normalize-space(.),${val})])`;

    return `${baseCondition} and ${recursionPreventer}`;
  }

  /**
   * Returns an object of XPaths mapped to element types
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