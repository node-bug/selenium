# Core Concepts

## Operations: Intermediate vs Terminal

The WebBrowser library uses a fluent API with two operation types:

### Intermediate Operations

Build the selector stack without executing actions. They return the `WebBrowser` instance for method chaining.

**Examples**: `element()`, `button()`, `above()`, `below()`, `within()`, `atIndex()`, `exact()`, `hidden()`

```javascript
await browser.element('submit').above().button('cancel').click()
```

### Terminal Operations

Execute the selector stack and perform actual actions. They return values or perform actions and clear the stack.

**Examples**: `click()`, `write()`, `isVisible()`, `scroll()`, `upload()`, `get.text()`

```javascript
await browser.button('submit').click()
```

## Element Locator Strategy: Human-Like Prioritization

Elements are located by searching attributes in priority order, mimicking how humans identify elements. The library also understands spatial context (position relative to other elements).

### Attribute Priority (How Elements Are Identified)

1. **Text** - Element's text content (e.g., "Email" for an input with label "Email")
2. **Placeholder** - Placeholder attribute (e.g., "Enter email...")
3. **Value** - Value attribute
4. **Test IDs** - `data-tid`, `data-testid`, `data-test-id`, `id`, `resource-id`, `data-id`
5. **Name** - Name attribute
6. **ARIA Label** - `aria-label` attribute
7. **CSS Class** - Class attribute
8. **ML Classification** - Machine learning-based label detection
9. **Tooltip** - `title`, `hint`, `tooltip` attributes
10. **Image Attributes** - `alt` and `src` attributes

### Spatial Context (How Elements Are Located)

Beyond text matching, the library understands position-based descriptions:

```javascript
// "Find the password field below the email field"
await browser.textbox('Password').below().textbox('Email').write('secret')

// "Find the submit button to the right of the cancel button"
await browser.button('Submit').toRightOf().button('Cancel').click()

// "Find the save button inside the dialog"
await browser.button('Save').within().dialog('Settings').click()
```

### Exact Matching

By default, partial text matches. Use `exact()` for exact matching:

```javascript
await browser.exact().element('male').click() // Won't match 'Female'
```

### Label Association

For form elements (input, checkbox, radio, select), the library searches associated `<label>` elements for improved accuracy.

## Element Types

Specify element types to differentiate elements with identical text:

- `button`, `link`, `image` - Interactive elements
- `textbox` (works for `input`, `field`, `edit`, `email`, `search`) - Text inputs
- `checkbox` - Checkboxes
- `switch` - Switches
- `radio` (works for `radiobutton`) - Radio buttons
- `dropdown` (works for `select`, `combobox`) - Dropdowns
- `file` (works for `inputfile`) - File inputs
- `label`, `toolbar`, `dialog`, `navigation`, `heading`, `slider`, `list`, `listitem`, `menu`, `menuitem`, `alert`, `row`, `column` - Semantic elements

```javascript
await browser.button('Search').click() // Specific type
await browser.element('Search').click() // Generic (tries all types)
await browser.textbox('Email').write('...') // Type specificity
```

## Spatial References

Locate elements relative to other elements (anchor elements):

- `above()` / `below()`
- `toLeftOf()` / `toRightOf()`
- `within()` - Contains relationship
- `near()` - Proximity-based

```javascript
browser.button('Delete').below().element('Actions').click()
```

### Precision with `exactly()`

Force precise positioning vs approximate:

```javascript
browser.textbox('Name').exactly().below().element('Section').write('text')
```

## Multiple References

Target elements with different possible names using `or()`:

```javascript
browser.button('checkout').or().button('submit').click()
```

If elements exist, the first matching the order is used. Otherwise, the first displayed is used.

## Window vs Tab Management

- **Windows** - Separate browser windows (independent contexts)
- **Tabs** - Multiple documents in same window (shared context)

```javascript
browser.window().new() // New window
browser.tab().new() // New tab
browser.window('Title').switch() // Switch window
browser.tab(0).switch() // Switch tab
```

## Browser Lifecycle

1. **Create** - `const browser = new WebBrowser()`
2. **Start** - `await browser.start()` (initializes session)
3. **Operate** - Perform actions
4. **Close** - `await browser.close()` (cleanup)

The library automatically handles cleanup on process termination (SIGINT, SIGTERM).

## Method Chaining Pattern

Chain intermediate operations ending with a terminal operation:

```javascript
// Build selector → Execute action
await browser
  .button('Delete') // Intermediate: select element
  .below() // Intermediate: position filter
  .element('Section') // Intermediate: anchor reference
  .click() // Terminal: execute action
```

Stack is cleared after each terminal operation, preventing state pollution.
