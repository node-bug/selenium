---
name: 'Element Finding Skill'
description: 'Semantic element selection with spatial filters and intelligent locators'
applies:
  [
    'app/elements/locator-strategy.js',
    'app/elements/selector-stack-builder.js',
    'app/elements/spatial-filters.js',
  ]
examples:
  - 'Find button by visible text'
  - 'Find element with spatial context'
  - 'Find elements by type (button, textbox, dialog)'
  - 'Use multiple selection criteria'
---

# Element Finding Skill

## Overview

WebBrowser finds elements using semantic methods based on what users see, not technical selectors. This skill covers:

- **20+ element types** - button, textbox, checkbox, dropdown, etc.
- **Multiple search strategies** - text, placeholder, labels, test IDs, ARIA labels
- **Spatial filters** - position relative to other elements
- **Automatic iframe handling** - Transparent cross-frame element access

## Semantic Element Types

### Input Elements

#### `textbox(label)`

Find text input fields.

```javascript
// By label text
await browser.textbox('Email Address').write('user@example.com')

// By placeholder
await browser.textbox('Enter your email').write('user@example.com')

// By aria-label
await browser.textbox('Email').write('user@example.com')
```

**Searches**: label, placeholder, aria-label, visible text, test IDs  
**Returns**: Element finder for chaining  
**When to use**: Single-line text inputs

---

#### `textarea(label)`

Find multi-line text areas.

```javascript
await browser.textarea('Comments').write('This is a longer comment...')
```

**When to use**: Multi-line text input fields

---

#### `checkbox(label)`

Find checkboxes.

```javascript
// Check a checkbox
await browser.checkbox('I agree to terms').check()

// Verify it's checked
await browser.checkbox('I agree to terms').is.checked()
```

**Related methods**:

- `.check()` - Check the checkbox
- `.uncheck()` - Uncheck the checkbox
- `.is.checked()` - Verify checked state
- `.toggle()` - Switch checked state

**When to use**: Boolean input fields

---

#### `radio(label)`

Find radio buttons.

```javascript
await browser.radio('Option 1').select()
```

**Related methods**:

- `.select()` - Select this radio button
- `.is.selected()` - Verify selected

**When to use**: Single-choice selection

---

#### `dropdown(label)` or `select(label)`

Find select/dropdown elements.

```javascript
// Select by visible text
await browser.dropdown('Country').selectByText('United States')

// Select by value
await browser.dropdown('Country').selectByValue('US')

// Select by index
await browser.dropdown('Country').selectByIndex(0)

// Get selected value
const selected = await browser.dropdown('Country').getSelectedOption()
```

**Related methods**:

- `.selectByText(text)` - Select option by visible text
- `.selectByValue(value)` - Select by value attribute
- `.selectByIndex(index)` - Select by position
- `.getSelectedOption()` - Get currently selected text
- `.getOptions()` - Get all option values

**When to use**: Select/dropdown elements

---

#### `slider(label)`

Find slider/range input elements.

```javascript
// Set slider to specific value
await browser.slider('Volume').setValue(75)

// Get current value
const volume = await browser.slider('Volume').getValue()
```

**Related methods**:

- `.setValue(value)` - Set slider position
- `.getValue()` - Get current value
- `.getMin()`, `.getMax()` - Get range limits

**When to use**: Range inputs, volume sliders, etc.

---

### Display Elements

#### `button(text)`

Find clickable buttons.

```javascript
await browser.button('Submit').click()
await browser.button('Cancel').is.visible()
await browser.button('Delete').should.be.visible()
```

**Searches**: Button text, value, aria-label, title  
**When to use**: Clickable button elements

---

#### `link(text)`

Find hyperlinks.

```javascript
await browser.link('Learn More').click()
const href = await browser.link('GitHub').getAttribute('href')
```

**When to use**: Anchor elements

---

#### `heading(text, level)`

Find heading elements (h1-h6).

```javascript
await browser.heading('Page Title').should.be.visible()

// Specific heading level
await browser.heading('Subtitle', 2).is.visible() // h2
```

**When to use**: Heading/title elements

---

#### `label(text)`

Find label elements.

```javascript
const label = await browser.label('Email Address').find()
```

**When to use**: Form labels

---

#### `paragraph(text)` or `text(text)`

Find paragraphs and text spans.

```javascript
await browser.paragraph('Welcome to our site').should.be.visible()
```

**When to use**: Display text, messages

---

#### `dialog(title)`

Find modal dialogs.

```javascript
await browser.dialog('Confirm Action').should.be.visible()
await browser.button('Yes').within.dialog('Confirm Action').click()
```

**When to use**: Modals, dialogs, popups

---

#### `table(label)`

Find data tables.

```javascript
const table = await browser.table('Users').find()
const rows = await browser.table('Users').findAll()
```

**When to use**: Table data elements

---

#### `image(alt, src)`

Find images.

```javascript
await browser.image('Logo').should.be.visible()
await browser.image('alt-text', 'path/to/image.png').find()
```

**When to use**: Image elements

---

#### `list(label)`

Find lists (ul, ol).

```javascript
const items = await browser.list('Menu Items').findAll()
```

**When to use**: List elements

---

### Generic Elements

#### `element(identifier)`

Find any element (use semantic types when possible).

```javascript
// By class
await browser.element('highlight-box').find()

// By custom attribute
await browser.element('data-testid="special"').find()
```

**When to use**: When semantic type doesn't apply  
**Prefer**: Semantic methods for better readability

---

## Search Strategies

WebBrowser searches in this order for semantic elements:

1. **Visible text** - Element contains exact or partial text
2. **Labels** - Associated label element text
3. **Placeholder** - input placeholder attribute
4. **ARIA labels** - aria-label attribute
5. **Test IDs** - data-testid, id attributes
6. **Title** - title attribute
7. **Alt text** - For images

This makes natural language specifications work:

```javascript
// All of these find the same element if it has label "Email"
await browser.textbox('Email Address').write('...')
await browser.textbox('Email').write('...')
await browser.textbox('email-input').write('...') // data-testid
```

---

## Spatial Filters

Locate elements by position relative to others.

### `above`

Element above another element.

```javascript
// "Find checkbox above the submit button"
await browser.checkbox('Terms').above.button('Submit').check()
```

---

### `below`

Element below another element.

```javascript
// "Find email field below Personal Info section"
await browser
  .textbox('Email')
  .below.heading('Personal Info')
  .write('user@example.com')
```

---

### `toLeftOf`

Element to the left of another element.

```javascript
// "Click label to the left of the toggle"
await browser
  .label('Notifications')
  .toLeftOf.switch('Enable Notifications')
  .click()
```

---

### `toRightOf`

Element to the right of another element.

```javascript
// "Fill field to the right of the label"
await browser.textbox('Phone').toRightOf.label('Phone Number').write('555-0123')
```

---

### `near`

Element near/close to another element (proximity-based).

```javascript
// "Find error message near the invalid field"
await browser.paragraph('required').near.textbox('Email').should.be.visible()
```

---

### `within`

Element contained within another element.

```javascript
// "Find button inside dialog"
await browser.button('Confirm').within.dialog('Delete Confirmation').click()

// Nested within
await browser
  .textbox('Email')
  .within.form('Login')
  .within.dialog('Sign In')
  .write('user@example.com')
```

---

## Multiple Conditions

Combine multiple criteria with `and`.

```javascript
// Find button that is both "Save" and within dialog
await browser
  .button('Save')
  .and.button('Save')
  .within.dialog('Preferences')
  .click()
```

---

## OR Conditions

Find elements matching ANY criteria with `or`.

```javascript
// Find buttons with either text (for different locales)
const saveButton = await browser
  .button('Save')
  .or.button('Guardar') // Spanish
  .or.button('Sauvegarder') // French
  .find()
```

---

## Finding Multiple Elements

Use `findAll()` to get multiple matching elements.

```javascript
// Get all table rows
const rows = await browser.table('Users').findAll()

// Get all menu items
const items = await browser.element('menu-item').findAll()

// Get all with custom timeout
const results = await browser.button('Delete').findAll(5000)
```

**Returns**: Array of WebElements  
**Throws**: Error if no elements found

---

## Finding Single Elements

Use `find()` to get first matching element.

```javascript
const element = await browser.button('Submit').find()
const textElement = await browser.paragraph('Error').find()
```

**Returns**: Single WebElement  
**Throws**: Error if no element found

---

## Advanced Element Access

### Get Element Properties

```javascript
const element = await browser.button('Submit').find()

// Get text
const text = await element.getText()

// Get attribute
const type = await element.getAttribute('type')

// Get CSS property
const color = await element.getCssValue('color')

// Is displayed
const visible = await element.isDisplayed()

// Is enabled
const enabled = await element.isEnabled()
```

---

### Element State Checks

Use built-in state checking methods.

```javascript
// Check visibility
await browser.button('Submit').is.visible()
await browser.button('Submit').is.not.visible()
await browser.button('Submit').should.be.visible()
await browser.button('Submit').should.not.be.visible()

// Check enabled state
await browser.button('Submit').is.enabled()
await browser.button('Submit').is.disabled()

// Check if element exists
await browser.element('special-box').is.present()
```

---

## Clearing Selector Stack

The selector stack is automatically cleared after `find()` or `findAll()`, but you can manually clear it:

```javascript
await browser.button('Submit').clear()
```

---

## Common Patterns

### Pattern 1: Login Form with Spatial Context

```javascript
// Fields are typically organized: labels on left, inputs on right
const loginForm = browser.form('Login')

await browser
  .textbox('Email')
  .within.dialog('Sign In')
  .write('user@example.com')

await browser.textbox('Password').within.dialog('Sign In').write('password123')

await browser.button('Sign In').within.dialog('Sign In').click()
```

### Pattern 2: Multi-Section Form

```javascript
// Personal information section
await browser
  .textbox('First Name')
  .below.heading('Personal Information')
  .write('John')

// Contact information section
await browser
  .textbox('Email')
  .below.heading('Contact Information')
  .write('john@example.com')
```

### Pattern 3: Table Row Operations

```javascript
// Find all rows and perform action on specific one
const rows = await browser.table('Products').findAll()

// Interact with elements in first row
await browser.button('Edit').within.element(rows[0]).click()
```

### Pattern 4: Dialog Confirmation

```javascript
// Verify dialog appears
await browser.dialog('Delete Item').should.be.visible()

// Interact with elements inside
await browser.button('Confirm').within.dialog('Delete Item').click()

// Verify result
await browser.paragraph('Deleted successfully').should.be.visible()
```

---

## Performance Tips

1. **Use spatial filters** - Narrows search scope significantly
2. **Be specific with text** - "Email Address" better than "Email"
3. **Use semantic types** - `textbox()` faster than `element()`
4. **Combine conditions** - `.within.dialog()` reduces elements to search
5. **Set custom timeouts** - Use shorter timeout for elements you know should be there quickly

---

## Troubleshooting

| Issue                        | Solution                                                                  |
| ---------------------------- | ------------------------------------------------------------------------- |
| Element not found            | Check text exactly matches, try trimming spaces, use partial text         |
| Multiple elements match      | Add spatial filter or more specific text                                  |
| Elements in iframe not found | Framework handles automatically; if not, try `.within.element('iframe')`  |
| Search timeout               | Element may not exist; verify on page, increase timeout if loading slowly |
| Stale element error          | Don't store elements; query them each time                                |

---

## Related Skills

- [Browser Control](browser.instructions.md) - Navigation and page management
- [Element Interactions](element-interactions.instructions.md) - Interact with found elements
- [Form Handling](form-handling.instructions.md) - Specialized form operations
