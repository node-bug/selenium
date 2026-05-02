# Core Concepts

The WebBrowser library uses a fluent, human-like API for browser automation. This page explains the foundational concepts and architecture.

## Operations: Intermediate vs Terminal

The library uses a two-step operation model:

### Intermediate Operations

Build the selector stack without executing actions. They return the `WebBrowser` instance for method chaining.

**Examples**: `element()`, `button()`, `above`, `below`, `within`, `atIndex()`, `exact`, `hidden`

```javascript
await browser.element('submit').above.button('cancel').click()
```

**Effect**: Adds information to selector stack (no action performed)

### Terminal Operations

Execute the selector stack and perform actual actions. They return values or perform actions and clear the stack.

**Examples**: `click()`, `write()`, `is.visible()`, `scroll()`, `upload()`, `get.text()`

```javascript
await browser.button('submit').click()
```

**Effect**: Executes action and resets selector stack

## Element Locator Strategy: Human-Like Prioritization

Elements are located by searching attributes in priority order, just as humans identify elements.

The library uses a **three-part strategy**:

1. **Text matching** - Search by visible text, placeholder, value
2. **Spatial context** - Use position relative to other elements
3. **Type matching** - Use element type for disambiguation

### How Elements Are Identified

The library searches these attributes in order:

1. **Text** - Element's visible text content
2. **Placeholder** - `placeholder` attribute
3. **Value** - `value` attribute
4. **Test IDs** - `data-tid`, `data-testid`, `data-test-id`, `id`, `resource-id`, `data-id`
5. **Name** - `name` attribute
6. **ARIA Label** - `aria-label` attribute
7. **CSS Class** - `class` attribute
8. **Tooltip** - `title`, `hint`, `tooltip` attributes
9. **Image Attributes** - `alt` and `src` attributes

See [Selectors Guide](SELECTORS.md#text-based-selection) for detailed examples.

### How Elements Are Located

Beyond text matching, the library understands **spatial context** (position relative to other elements):

```javascript
// "Find the password field below the email field"
await browser.textbox('Password').below.textbox('Email').write('secret')

// "Find the submit button to the right of the cancel button"
await browser.button('Submit').toRightOf.button('Cancel').click()

// "Find the save button inside the dialog"
await browser.button('Save').within.dialog('Settings').click()
```

See [Selectors Guide - Spatial References](SELECTORS.md#spatial-references) for all positioning options.

## Exact vs Partial Matching

By default, text matching is **partial**. Use `exact` for strict matching:

```javascript
// Partial match: matches "Female", "Male", "Female-Plus"
await browser.element('Male').click()

// Only matches "Male" exactly
await browser.exact.element('Male').click()
```

## Element Types

Specify element types to differentiate elements with identical text:

```javascript
await browser.button('Search').click() // Specific type
await browser.element('Search').click() // Generic (tries all types)
await browser.textbox('Email').write('...') // Type specificity
```

Available types include: `button`, `textbox`, `checkbox`, `switch`, `radio`, `dropdown`, `link`, `image`, `file`, and semantic elements like `dialog`, `heading`, `menu`, etc.

See [Selectors Guide - Element Types](SELECTORS.md#element-types) for complete list.

## Multiple References with or

Target elements with different possible names:

```javascript
// Click either "Checkout" or "Submit" button
await browser.button('Checkout').or.button('Submit').click()
```

If both exist, the first is selected. Otherwise, the first displayed on screen is used.

See [Selectors Guide - Multiple Alternatives](SELECTORS.md#multiple-alternatives-with-or) for details.

## Form Label Association

For form elements, the library searches associated `<label>` elements:

```html
<label for="email">Email:</label> <input id="email" type="text" />
```

```javascript
// Matches the label "Email"
await browser.textbox('Email').write('user@example.com')
```

See [Selectors Guide - Form Label Association](SELECTORS.md#form-label-association) for details.

## Window vs Tab Management

- **Windows** - Separate browser instances with independent contexts (separate cookies, storage)
- **Tabs** - Multiple documents in same window, sharing context

```javascript
await browser.window().new() // New window (auto-switches to it)
await browser.tab().new() // New tab (auto-switches to it)
await browser.window('Title').switch() // Switch window
await browser.tab(0).switch() // Switch tab
```

See [Advanced Guide - Tab Management](ADVANCED.md#tab-management) for tab patterns.  
See [Advanced Guide - Window Management](ADVANCED.md#window-management) for window patterns.

## Browser Lifecycle

Every WebBrowser session follows a consistent lifecycle:

```javascript
// 1. Create instance
const browser = new WebBrowser()

// 2. Start session (initialize WebDriver)
await browser.start()

// 3. Perform operations
await browser.goto('https://example.com')
await browser.button('Submit').click()

// 4. Close session (cleanup resources)
await browser.close()
```

**Automatic cleanup**: The library automatically handles cleanup when:

- `close()` is explicitly called
- Process exits (SIGINT, SIGTERM)
- Uncaught exceptions occur

See [Browser Guide - Session Lifecycle](BROWSER.md#session-lifecycle) for details.

## Method Chaining Pattern

Build complex interactions using method chaining: **Intermediate → Intermediate → Terminal**

```javascript
// Build selector stack, execute at terminal
await browser
  .button('Delete') // Intermediate: Select element type
  .below // Intermediate: Add spatial filter
  .element('Section') // Intermediate: Set anchor reference
  .click() // Terminal: Execute action (clears stack)
```

**Key points**:

- Intermediate operations return `browser` (chainable)
- Terminal operations perform actions and return values
- Stack is cleared after each terminal operation
- Prevents unintended state pollution

## Summary

| Concept              | Purpose               | Details                              |
| -------------------- | --------------------- | ------------------------------------ |
| **Operations**       | Execute in stages     | Intermediate build, Terminal execute |
| **Locator Strategy** | Find elements humanly | Text → Position → Type               |
| **Element Types**    | Disambiguate elements | Specify `button`, `textbox`, etc.    |
| **Spatial Context**  | Relative positioning  | `below`, `toRightOf`, `within`       |
| **Method Chaining**  | Fluent API            | Chain operations logically           |
| **Lifecycle**        | Session management    | Create → Start → Use → Close         |

## Next Steps

- **Finding Elements**: [Selectors Guide](SELECTORS.md)
- **Interacting**: [Interactions Guide](INTERACTIONS.md)
- **Working with Forms**: [Forms Guide](FORMS.md)
- **Browser Management**: [Browser Guide](BROWSER.md)
- **Advanced Patterns**: [Advanced Guide](ADVANCED.md)
- **API Details**: [API Reference](API-REFERENCE.md)

---

## 🤖 Guidance for AI Code Generators

This section helps AI systems understand WebBrowser's design for code generation.

### Architecture Principles

**1. Explicit over Implicit**

- Use semantic types: `button()`, `textbox()`, `checkbox()` over generic `element()`
- Explicit types make code readable and intent clear
- Example: ✅ `browser.checkbox('Agree').check()` vs ❌ `browser.element('Agree').click()`

**2. Text as Primary Identifier**

- Default to element text matching first
- Only use attributes (`data-testid`, `id`) when visible text isn't available
- Example: ✅ `button('Submit')` before `element('submit-btn')`

**3. Spatial Context for Disambiguation**

- When multiple elements have same text, use position
- Natural language: "Password field below Email" → Code: `textbox('Password').below.textbox('Email')`
- Positions: `above`, `below`, `toLeftOf`, `toRightOf`, `within`, `near`

**4. Operation Types (Strict)**

- **Intermediate**: Return `browser` instance (chainable) - no execution
  - Examples: `element()`, `button()`, `below`, `within`, `atIndex()`, `exact`
- **Terminal**: Execute action (return value) - clears stack
  - Examples: `click()`, `write()`, `is.visible()`, `should.be.visible()`, `get.text()`
- Always end chains with terminal operation

**5. State Checking Distinction**

- **Conditionals** (`is.*`): Return boolean - use in branching logic
  - Examples: `is.visible()`, `is.enabled()`, `is.checked()`
  - Use when: You need to branch based on state
- **Assertions** (`should.*`): Throw error on failure - use in tests
  - Examples: `should.be.visible()`, `should.be.enabled()`, `should.be.checked()`
  - Use when: You want test to fail on assertion failure

### Code Generation Patterns

**Pattern 1: Finding and Interacting**

```javascript
// Structure: type.text.interaction
await browser.button('Submit').click()
await browser.textbox('Email').write('user@example.com')
await browser.checkbox('Subscribe').check()
```

**Pattern 2: Spatial Relationships**

```javascript
// Structure: type.text.position.anchor.interaction
await browser
  .textbox('Password') // Select element type and text
  .below // Position filter
  .textbox('Email') // Anchor element
  .write('secret') // Action
```

**Pattern 3: Modal Interactions**

```javascript
// Structure: type.text.within.dialog.interaction
await browser
  .button('Save') // Select element
  .within // Position filter
  .dialog('Settings') // Container reference
  .click() // Action
```

**Pattern 4: Form Filling**

```javascript
// Multiple sequential operations
await browser.textbox('Name').write('John')
await browser.textbox('Email').write('john@example.com')
await browser.dropdown('Country').option('US').select()
await browser.checkbox('Subscribe').check()
await browser.button('Submit').click()
```

**Pattern 5: State-Based Conditional**

```javascript
// Check state, then act
if (await browser.element('Error').is.visible()) {
  await browser.button('Retry').click()
} else {
  await browser.button('Continue').click()
}
```

**Pattern 6: Wait for Condition**

```javascript
// Use should.* to wait with timeout
await browser.element('Success').should.be.visible(5000)
// or default timeout from config
await browser.element('Loading').should.not.be.visible()
```

### Code Generation Rules

1. **Start with semantic type** - Choose from: `button`, `textbox`, `checkbox`, `radio`, `dropdown`, `link`, `heading`, `dialog`, `row`, `column`, `image`, `file`, `switch`, etc.

2. **Match visible text** - Use text that users see, not HTML attributes (unless unavoidable)

3. **Add position when needed** - If text is ambiguous, add `.position.element('anchor')`

4. **End with terminal operation** - Every chain must end with action: `click()`, `write()`, `check()`, `is.visible()`, `should.be.visible()`, etc.

5. **Use correct state check** - Choose `is.*` (boolean) for conditionals, `should.*` (assertion) for tests

6. **Avoid XPath/CSS** - Not supported; use text-based selection instead

7. **Prefer exact type** - `button()` not `element()`, unless truly generic

8. **Build readable chains** - Multi-line chains are ok for readability:

```javascript
// ✅ Readable
await browser.button('Delete').within.row('User Name').click()

// ❌ Less readable
await browser.button('Delete').within.row('User Name').click()
```

### Element Type Priority

When generating code, consider this priority:

1. **Semantic types** (highest priority) - `button`, `textbox`, `checkbox`, etc.
2. **Container types** - `dialog`, `row`, `column`, `menu`
3. **Position modifiers** - `above`, `below`, `within`
4. **Generic fallback** - `element()` only when no type matches

### Common Generation Mistakes to Avoid

❌ **Don't**: Use CSS selectors or XPath

```javascript
// WRONG
await browser.goto('//button[text()="Submit"]')
```

✅ **Do**: Use semantic text-based selection

```javascript
// RIGHT
await browser.button('Submit').click()
```

---

❌ **Don't**: Use generic `element()` for everything

```javascript
// WRONG
await browser.element('Click').click()
await browser.element('Email').write('...')
```

✅ **Do**: Use semantic types

```javascript
// RIGHT
await browser.button('Click').click()
await browser.textbox('Email').write('...')
```

---

❌ **Don't**: Mix intermediate and terminal operations incorrectly

```javascript
// WRONG
await browser.button('Delete').click().below.element('Actions')
// Terminal operation (click) can't chain further
```

✅ **Do**: Put position filters before terminal operations

```javascript
// RIGHT
await browser.button('Delete').below.element('Actions').click()
```

---

❌ **Don't**: Use `is.*` for test assertions

```javascript
// WRONG
const visible = await browser.button('Save').is.visible()
// Just returns boolean, doesn't fail test if false
```

✅ **Do**: Use `should.*` for test assertions

```javascript
// RIGHT
await browser.button('Save').should.be.visible()
// Throws error if not visible, failing the test
```

### Testing Pattern Recognition

When given a user instruction, identify these patterns:

| User Says                         | Pattern                  | Code                                                     |
| --------------------------------- | ------------------------ | -------------------------------------------------------- |
| "Click the button"                | Type + Action            | `button('...').click()`                                  |
| "Fill the email field"            | Type + Text + Action     | `textbox('Email').write('...')`                          |
| "Check the checkbox"              | Type + Action            | `checkbox('...').check()`                                |
| "Click delete in row"             | Type + Position + Action | `button('Delete').within.row('...').click()`             |
| "Click button below the section"  | Type + Position + Anchor | `button('...').below.element('...').click()`             |
| "Verify success message appears"  | State + Assertion        | `element('Success').should.be.visible()`                 |
| "If logout link exists, click it" | State + Conditional      | `if (await browser.link('Logout').is.visible()) { ... }` |
