# Input Operations

Text input and element focus operations. See [API Reference](API-REFERENCE.md#element-interaction) for complete method signatures.

## Quick Examples

```javascript
// Write text
await browser.textbox('Email').write('user@example.com')

// Type character-by-character
await browser.textbox('Email').type('user@example.com')

// Type with modifiers
await browser.ctrl.type('a')

// Clear text
await browser.textbox('Email').clear()

// Clear and write new text
await browser.textbox('Email').overwrite('new@example.com')

// Set focus
await browser.textbox('Email').focus()
```

## Operations

### write(text)

Enter text into an input field or content-editable element. If the field, textarea or content-editable element was not empty, does not clear but adds text to it.

Works with:

- Text inputs
- Textareas
- Content-editable elements

```javascript
await browser.textbox('Username').write('johndoe')
await browser.element('bio').write('My biography...')
```

**Returns**: `Promise<boolean>`

### clear()

Clear text from an input field.

```javascript
await browser.textbox('Email').clear()
await browser.element('search').clear()
```

**Returns**: `Promise<boolean>`

### overwrite(text)

Clear existing text and enter new text (useful for fields with validation or default values).

```javascript
await browser.textbox('Email').overwrite('newemail@example.com')
```

**Returns**: `Promise<boolean>`

### focus()

Set focus on an element.

```javascript
await browser.textbox('Email').focus()
await browser.element('textarea').focus()
```

**Returns**: `Promise<boolean>`

### type(text)

Type a string character-by-character on the currently focused element. Each character is sent individually via Selenium's Actions API, with optional modifier keys held during the entire sequence. This is a terminal operation — the stack is cleared after execution.

Unlike `write()`, which sends the entire string at once, `type()` simulates real keystrokes by sending each character sequentially. This is useful for:

- Triggering real-time validation or autocomplete
- Testing character-by-character input handling
- Simulating realistic user typing behavior

```javascript
// Basic typing
await browser.textbox('Username').type('johndoe')

// Type with modifier keys
await browser.shift.type('abc') // Types 'ABC' (Shift held during typing)
await browser.ctrl.type('a') // Ctrl+a
await browser.ctrl.shift.type('abc') // Ctrl+Shift held during typing
await browser.alt.type('abc') // Alt held during typing
await browser.meta.type('abc') // Cmd held (Mac) / Win held (Windows)
```

**Parameters**:

- `text` (string): The string to type character by character

**Returns**: `Promise<boolean>`

## Usage Patterns

### Form Fill

```javascript
await browser.textbox('First Name').write('John')
await browser.textbox('Last Name').write('Doe')
await browser.textbox('Email').write('john@example.com')
await browser.button('Submit').click()
```

### Clear and Replace

```javascript
// Replace existing value
await browser.textbox('Email').clear()
await browser.textbox('Email').write('newemail@example.com')

// Or use overwrite as shortcut
await browser.textbox('Email').overwrite('newemail@example.com')
```

### Focus and Type

```javascript
await browser.textbox('Search').focus()
await browser.textbox('Search').write('my query')
```

### Keyboard Keys

Press keyboard keys on the currently focused element:

```javascript
// Press a single key
await browser.press('Enter')
await browser.press('Tab')
await browser.press('Escape')

// Press with modifier keys
await browser.ctrl.press('c') // Ctrl+C
await browser.ctrl.shift.press('c') // Ctrl+Shift+C
await browser.alt.press('Tab') // Alt+Tab
await browser.meta.press('w') // Cmd+W on Mac

// Arrow key convenience methods
await browser.left() // Press left arrow once
await browser.left(5) // Press left arrow 5 times
await browser.right(3) // Press right arrow 3 times
await browser.up(2) // Press up arrow 2 times
await browser.down(4) // Press down arrow 4 times
```

### Navigation with Arrow Keys

Navigate through form fields or dropdown menus:

```javascript
// Navigate through a dropdown
await browser.combobox('Country').click()
await browser.down(5) // Move down 5 items
await browser.press('Enter') // Select item

// Navigate form fields
await browser.textbox('First Name').write('John')
await browser.press('Tab') // Move to next field
await browser.textbox('Last Name').write('Doe')
```

## Full API Reference

See [Input Operations API](API-REFERENCE.md#element-interaction)
