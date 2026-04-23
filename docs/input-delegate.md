# Input Operations

Text input and element focus operations. See [API Reference](API-REFERENCE.md#element-interaction) for complete method signatures.

## Quick Examples

```javascript
// Write text
await browser.textbox('Email').write('user@example.com')

// Clear text
await browser.textbox('Email').clear()

// Clear and write new text
await browser.textbox('Email').overwrite('new@example.com')

// Set focus
await browser.textbox('Email').focus()
```

## Operations

### write(text)
Enter text into an input field or content-editable element.

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

## Full API Reference

See [Input Operations API](API-REFERENCE.md#element-interaction)

