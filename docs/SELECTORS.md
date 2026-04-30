# Selectors: Finding Elements

Comprehensive guide to finding and targeting elements using text, position, and type.

## How Elements Are Found

The library locates elements like humans do:

1. **By what they say** (text, placeholder, label) - primary identifier
2. **By where they are** (position relative to other elements) - spatial context
3. **By what they are** (type, attributes) - semantic meaning

## Element Types

Specify element types to differentiate elements with identical text:

| Type         | Usage                                               |
| ------------ | --------------------------------------------------- |
| `link`       | `browser.link('Home').click()`                      |
| `navigation` | `browser.navigation('Main').click()`                |
| `heading`    | `browser.heading('Title').click()`                  |
| `button`     | `browser.button('Submit').click()`                  |
| `checkbox`   | `browser.checkbox('Subscribe').check()`             |
| `switch`     | `browser.switch('Dark Mode').on()`                  |
| `radio`      | `browser.radio('Male').check()`                     |
| `slider`     | `browser.slider('Volume').set(50)`                  |
| `dropdown`   | `browser.dropdown('Country').option('US').select()` |
| `textbox`    | `browser.textbox('Email').write('...')`             |
| `file`       | `browser.file('Upload').upload('file.txt')`         |
| `list`       | `browser.list('Menu').click()`                      |
| `listitem`   | `browser.listitem('Item').click()`                  |
| `menu`       | `browser.menu('File').click()`                      |
| `menuitem`   | `browser.menuitem('Save').click()`                  |
| `toolbar`    | `browser.toolbar('Format').click()`                 |
| `dialog`     | `browser.dialog('Confirm').click()`                 |
| `row`        | `browser.row('5').click()`                          |
| `column`     | `browser.column('Name').click()`                    |
| `image`      | `browser.image('Logo').click()`                     |
| `element`    | `browser.element('Any').click()` (generic)          |

### When to Use Type-Specific Selectors

Use type-specific when you want to target a specific element type:

```javascript
// Click button specifically (not link with same text)
await browser.button('Next').click()

// Input textbox specifically (not paragraph)
await browser.textbox('Email').write('user@example.com')

// Check checkbox specifically (not radio)
await browser.checkbox('Remember').check()
```

### When to Use Generic element()

Use generic when type doesn't matter or is unknown:

```javascript
await browser.element('Click Me').click()
await browser.element('Logo').hover()
```

## Text-Based Selection

Elements are located by searching attributes in priority order:

1. **Text** - Element's visible text content
2. **Placeholder** - `placeholder` attribute
3. **Value** - `value` attribute
4. **Test IDs** - `data-tid`, `data-testid`, `data-test-id`, `id`, `resource-id`, `data-id`
5. **Name** - `name` attribute
6. **ARIA Label** - `aria-label` attribute
7. **CSS Class** - `class` attribute
8. **Tooltip** - `title`, `hint`, `tooltip` attributes
9. **Image Attributes** - `alt` and `src` attributes

### Examples by Priority

```javascript
// Matches by text (priority 1)
await browser.button('Submit').click()

// Matches by placeholder (priority 2)
await browser.textbox('Enter your email').write('...')

// Matches by value (priority 3)
await browser.textbox('john@example.com').write('...')

// Matches by data-testid (priority 4)
await browser.element('auth-submit').click()

// Matches by name (priority 5)
await browser.element('country').click()

// Matches by aria-label (priority 6)
await browser.link('Go to home').click()

// Matches by class (priority 7)
await browser.element('btn-primary').click()

// Matches by title attribute (priority 9)
await browser.element('User Settings').click()

// Matches by alt text (priority 10)
await browser.image('Logo').click()
```

## Exact vs Partial Matching

By default, text matching is **partial**:

```javascript
// Partial match: matches "Female", "Male", "Female-Plus"
await browser.element('Male').click()

// Won't match "Female" with exact
await browser.exact.element('Male').click()
```

Use `exact` for strict matching:

```javascript
await browser.exact.element('Test').click() // Only "Test"
await browser.textbox('Email').exact.write('') // Partial OK for textbox
```

## Spatial References

Locate elements relative to other elements (anchor elements).

### Positioning Keywords

#### below / above

Element's vertical position relative to anchor:

```javascript
// "The password field below the email field"
await browser.textbox('Password').below.textbox('Email').write('secret')

// "The city field above the state field"
await browser.textbox('City').above.textbox('State').write('CA')
```

#### toLeftOf / toRightOf

Element's horizontal position relative to anchor:

```javascript
// "The cancel button to the left of submit"
await browser.button('Cancel').toLeftOf.button('Submit').click()

// "The ok button to the right of cancel"
await browser.button('OK').toRightOf.button('Cancel').click()
```

#### within

Element is contained within another element:

```javascript
// "The save button inside the dialog"
await browser.button('Save').within.dialog('Settings').click()

// "Delete button in the user row"
await browser.button('Delete').within.row('User123').click()
```

#### near

Element is in proximity to another element:

```javascript
// "The info icon near the email field"
await browser.element('Info').near.textbox('Email').hover()
```

### Combining Spatial References

Chain multiple references for precise targeting:

```javascript
// Below Section AND to the right of Label
await browser
  .button('Delete')
  .below.element('Section')
  .toRightOf.element('Label')
  .click()

// Within dialog AND above submit button
await browser
  .textbox('Email')
  .within.dialog('Form')
  .above.button('Submit')
  .write('user@example.com')
```

### Precision with exactly

Use `exactly` for precise positioning (not approximate):

```javascript
// Approximate positioning (within range)
await browser.textbox('Name').below.element('Label').write('John')

// Precise positioning (exact alignment)
await browser.textbox('Name').exactly.below.element('Label').write('John')
```

### Real-World Examples

**Login Form:**

```javascript
// "The password field is below the email field"
await browser.textbox('Password').below.textbox('Email').write('pass123')
```

**Data Table:**

```javascript
// "Delete button in the row with 'User123'"
await browser.button('Delete').within.row('User123').click()
```

**Modal Dialog:**

```javascript
// "The save button inside the user dialog"
await browser.button('Save').within.dialog('User Details').click()
```

**Complex Layout:**

```javascript
// "Cancel button to the left of submit in the footer"
await browser
  .button('Cancel')
  .toLeftOf.button('Submit')
  .within.element('Footer')
  .click()
```

## Multiple Alternatives with or

Target elements with different possible names:

```javascript
// Click either "Checkout" or "Submit" button
await browser.button('Checkout').or.button('Submit').click()

// Check if either button is visible
const visible = await browser.button('Save').or.button('Apply').is.visible()
```

### Selection Priority with or

When using `or`, the **first matching element** is selected:

```javascript
// If both exist, "Save" button is clicked (listed first)
await browser.button('Save').or.button('Apply').click()

// If neither exists, first displayed on screen is selected
await browser.button('NonExistent1').or.button('NonExistent2').click()
```

### Best Practices

```javascript
// Good: Most common first
await browser.button('Next').or.button('Continue').click()

// Good: Reasonable alternatives
await browser.textbox('Email').or.textbox('email_address').write('...')

// Avoid: Too many alternatives
await browser.button('A').or.button('B').or.button('C').or.button('D').click()
```

## Form Label Association

For form elements, the library searches associated `<label>` elements:

```html
<label for="email">Email:</label> <input id="email" type="text" />
```

```javascript
// Matches the label "Email"
await browser.textbox('Email').write('user@example.com')
```

## Finding Multiple Elements

### find() - Single Element

```javascript
const element = await browser.element('text').find()
```

### findAll() - All Matching Elements

```javascript
const elements = await browser.element('text').findAll()
```

## Element Index

When multiple elements share the same name, use `atIndex()`:

```javascript
// First textbox named 'Email'
await browser.textbox('Email').atIndex(0).write('first@example.com')

// Third button named 'Delete'
await browser.button('Delete').atIndex(2).click()
```

## See Also

- [Core Concepts](CONCEPTS.md) - Foundational concepts
- [API Reference](API-REFERENCE.md#element-selection) - Complete method reference
