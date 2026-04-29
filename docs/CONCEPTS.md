# Core Concepts

The WebBrowser library uses a fluent, human-like API for browser automation. This page explains the foundational concepts and architecture.

## Operations: Intermediate vs Terminal

The library uses a two-step operation model:

### Intermediate Operations

Build the selector stack without executing actions. They return the `WebBrowser` instance for method chaining.

**Examples**: `element()`, `button()`, `above()`, `below()`, `within()`, `atIndex()`, `exact()`, `hidden()`

```javascript
await browser.element('submit').above().button('cancel').click()
```

**Effect**: Adds information to selector stack (no action performed)

### Terminal Operations

Execute the selector stack and perform actual actions. They return values or perform actions and clear the stack.

**Examples**: `click()`, `write()`, `isVisible()`, `scroll()`, `upload()`, `get.text()`

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
8. **ML Classification** - Machine learning-based label detection
9. **Tooltip** - `title`, `hint`, `tooltip` attributes
10. **Image Attributes** - `alt` and `src` attributes

See [Selectors Guide](SELECTORS.md#text-based-selection) for detailed examples.

### How Elements Are Located

Beyond text matching, the library understands **spatial context** (position relative to other elements):

```javascript
// "Find the password field below the email field"
await browser.textbox('Password').below().textbox('Email').write('secret')

// "Find the submit button to the right of the cancel button"
await browser.button('Submit').toRightOf().button('Cancel').click()

// "Find the save button inside the dialog"
await browser.button('Save').within().dialog('Settings').click()
```

See [Selectors Guide - Spatial References](SELECTORS.md#spatial-references) for all positioning options.

## Exact vs Partial Matching

By default, text matching is **partial**. Use `exact()` for strict matching:

```javascript
// Partial match: matches "Female", "Male", "Female-Plus"
await browser.element('Male').click()

// Only matches "Male" exactly
await browser.exact().element('Male').click()
```

## Element Types

Specify element types to differentiate elements with identical text:

```javascript
await browser.button('Search').click() // Specific type
await browser.element('Search').click() // Generic (tries all types)
await browser.textbox('Email').write('...') // Type specificity
```

Available types include: `button`, `textbox`, `checkbox`, `switch`, `radio`, `dropdown`, `link`, `image`, `file`, and semantic elements like `dialog`, `heading`, `menu`, etc.

See [Selectors Guide - Element Types](SELECTORS.md#element-types) for complete list and aliases.

## Multiple References with or()

Target elements with different possible names:

```javascript
// Click either "Checkout" or "Submit" button
await browser.button('Checkout').or().button('Submit').click()
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
await browser.window().new() // New window
await browser.tab().new() // New tab
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
  .below() // Intermediate: Add spatial filter
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
| **Spatial Context**  | Relative positioning  | `below()`, `toRightOf()`, `within()` |
| **Method Chaining**  | Fluent API            | Chain operations logically           |
| **Lifecycle**        | Session management    | Create → Start → Use → Close         |

## Next Steps

- **Finding Elements**: [Selectors Guide](SELECTORS.md)
- **Interacting**: [Interactions Guide](INTERACTIONS.md)
- **Working with Forms**: [Forms Guide](FORMS.md)
- **Browser Management**: [Browser Guide](BROWSER.md)
- **Advanced Patterns**: [Advanced Guide](ADVANCED.md)
- **API Details**: [API Reference](API-REFERENCE.md)
