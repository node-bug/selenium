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

Elements are located by searching attributes in priority order, mimicking how humans identify elements:

1. **Text** - Element's text content
2. **Placeholder** - Placeholder attribute  
3. **Value** - Value attribute
4. **Test IDs** - `data-tid`, `data-testid`, `data-test-id`, `id`, `resource-id`, `data-id`
5. **Name** - Name attribute
6. **ARIA Label** - `aria-label` attribute
7. **CSS Class** - Class attribute
8. **ML Classification** - Machine learning-based label detection
9. **Tooltip** - `title`, `hint`, `tooltip` attributes
10. **Image Attributes** - `alt` and `src` attributes

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
- `textbox` (aliases: `input`, `field`, `edit`, `email`, `search`) - Text inputs
- `checkbox` (aliases: `toggle`, `switch`) - Checkboxes
- `radio` (alias: `radiobutton`) - Radio buttons
- `dropdown` (alias: `select`) - Dropdowns
- `file` (alias: `inputfile`) - File inputs
- `label`, `toolbar`, `tab`, `dialog`, `navigation`, `heading`, `slider`, `combobox`, `list`, `listitem`, `menu`, `menuitem`, `alert`, `row`, `column` - Semantic elements

```javascript
await browser.button('Search').click()        // Specific type
await browser.element('Search').click()       // Generic (tries all types)
await browser.textbox('Email').write('...')   // Type specificity
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
browser.window().new()        // New window
browser.tab().new()           // New tab
browser.window('Title').switch()  // Switch window
browser.tab(0).switch()       // Switch tab
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
  .button('Delete')           // Intermediate: select element
  .below()                    // Intermediate: position filter
  .element('Section')         // Intermediate: anchor reference
  .click()                    // Terminal: execute action
```

Stack is cleared after each terminal operation, preventing state pollution.
