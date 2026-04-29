# Interactions: Clicks, Input, and Navigation

Complete guide to user interactions including clicks, text input, keyboard navigation, and drag-drop.

## Quick Reference

```javascript
// Clicks
await browser.button('Submit').click()
await browser.element('text').doubleClick()
await browser.element('menu').rightClick()
await browser.element('button').longPress(2000)

// Text input
await browser.textbox('Email').write('user@example.com')
await browser.textbox('Email').clear()
await browser.textbox('Email').overwrite('new@example.com')
await browser.textbox('Search').type('query') // Character by character

// Keyboard
await browser.press('Enter')
await browser.left(5) // Press left arrow 5 times
await browser.up() // Press up arrow once

// Hover & Focus
await browser.element('menu').hover()
await browser.textbox('Email').focus()

// File operations
await browser.file('Resume').upload('/path/to/resume.pdf')
```

## Click Operations

### Standard Click

```javascript
await browser.button('Submit').click()
```

**Returns**: `Promise<boolean>`

Supports modifier keys via chaining:

```javascript
await browser.button('link').ctrl.click() // Ctrl+click
await browser.element('item').shift.alt.click() // Shift+Alt+click
await browser.link('Open').meta.click() // Cmd/Win+click
```

### Click at Coordinates

Click at specific pixel coordinates:

```javascript
await browser.element('menu').click(100, 200)
```

**Parameters**:

- `x` (number): X coordinate
- `y` (number): Y coordinate

### Double Click

Select all text or trigger double-click handlers:

```javascript
await browser.element('text').doubleClick()
```

### Right Click (Context Menu)

Trigger context menu:

```javascript
await browser.element('menu').rightClick()
```

### Middle Click

```javascript
await browser.element('target').middleClick()
```

### Triple Click

Select all text in a field:

```javascript
await browser.element('text').tripleClick()
```

### Long Press / Hold

Long press element for specified duration:

```javascript
await browser.element('button').longPress() // 1 second default
await browser.element('button').longPress(3000) // 3 seconds
```

**Parameters**:

- `duration` (number, optional): Milliseconds (default: 1000)

### Multiple Clicks

Click an element multiple times:

```javascript
await browser.element('button').multipleClick(5) // Click 5 times
```

**Parameters**:

- `times` (number, optional): Number of clicks (default: 2)

### Hover

Move mouse over element to trigger hover effects:

```javascript
await browser.element('menu').hover()
await browser.button('dropdown').hover()
```

## Text Input Operations

### write(text)

Enter text without clearing existing content:

```javascript
await browser.textbox('Email').write('user@example.com')
await browser.element('bio').write('My bio text')
```

Works with:

- Text inputs
- Textareas
- Content-editable elements

**Returns**: `Promise<boolean>`

### clear()

Remove all text from a field:

```javascript
await browser.textbox('Email').clear()
```

**Returns**: `Promise<boolean>`

### overwrite(text)

Clear existing text and write new text:

```javascript
// Useful for fields with validation or default values
await browser.textbox('Email').overwrite('newemail@example.com')
```

**Parameters**:

- `text` (string): New text to write

**Returns**: `Promise<boolean>`

### type(text)

Type character-by-character on focused element (simulates real keystrokes):

```javascript
// Basic typing
await browser.textbox('Username').type('johndoe')

// Type with modifiers
await browser.shift.type('abc') // Types 'ABC'
await browser.ctrl.type('a') // Ctrl+a
await browser.ctrl.shift.type('abc') // Ctrl+Shift held
await browser.alt.type('abc') // Alt held
await browser.meta.type('abc') // Cmd (Mac) / Win held
```

**Use `type()` when**:

- Triggering character-by-character validation
- Testing real-time autocomplete
- Simulating realistic user typing

**Use `write()` when**:

- Just entering text
- Performance matters
- No character-by-character logic

### focus()

Set focus on an element:

```javascript
await browser.textbox('Email').focus()
await browser.element('textarea').focus()
```

**Returns**: `Promise<boolean>`

## Keyboard Navigation

### press(key)

Press a keyboard key on focused element:

```javascript
await browser.press('Enter')
await browser.press('Tab')
await browser.press('Escape')
await browser.press('a') // Press letter 'a'
```

**With modifiers**:

```javascript
await browser.ctrl.press('c') // Ctrl+C
await browser.ctrl.shift.press('c') // Ctrl+Shift+C
await browser.alt.press('Tab') // Alt+Tab
await browser.meta.press('w') // Cmd+W (Mac) or Win+W
```

### Arrow Keys

Convenient methods for arrow key navigation:

```javascript
await browser.left() // Press left arrow once
await browser.left(5) // Press left arrow 5 times
await browser.right(3) // Press right arrow 3 times
await browser.up() // Press up arrow once
await browser.down(2) // Press down arrow 2 times
```

**Parameters**:

- `count` (number, optional): Number of presses (default: 1)

**Use cases**:

- Navigate dropdown options
- Move cursor in text field
- Scroll page content

## Hover Interactions

### hover()

Trigger hover effects:

```javascript
await browser.element('menu').hover()
await browser.button('dropdown').hover()
```

**Returns**: `Promise<boolean>`

```javascript
// Wait for hover menu to appear
await browser.element('menu').hover()
await browser.element('Submenu Option').click()
```

## File Operations

### upload(filePath)

Upload a file to file input element:

```javascript
await browser.file('Resume').upload('/path/to/resume.pdf')
await browser.file('Document').upload('/home/user/file.docx')
```

**Parameters**:

- `filePath` (string): Absolute path to file

**Returns**: `Promise<boolean>`

**Works with**:

- `<input type="file">` elements
- Any element matching file selector

## Drag and Drop

### Initiating Drag

```javascript
await browser.element('draggable').drag()
```

### Dropping onto Target

```javascript
await browser.element('draggable').drag().onto().element('dropzone').drop()
```

**Full example**:

```javascript
await browser.element('Item').drag().onto().element('Target').drop()
```

## Modifier Key Chaining

Use modifier keys with any click or keyboard operation:

```javascript
// Click with modifiers
await browser.link('Open').ctrl.click() // Ctrl+Click
await browser.element('item').shift.click() // Shift+Click
await browser.element('item').alt.click() // Alt+Click
await browser.element('item').meta.click() // Cmd/Win+Click

// Combine modifiers
await browser.element('item').ctrl.shift.click() // Ctrl+Shift+Click

// Type with modifiers
await browser.ctrl.type('a') // Select all
await browser.shift.type('abc') // Shift held

// Press with modifiers
await browser.alt.press('Tab') // Alt+Tab
await browser.ctrl.shift.press('Esc') // Ctrl+Shift+Esc
```

Modifiers are **automatically released** after the operation.

## Common Patterns

### Clear and Fill

```javascript
await browser.textbox('Email').clear().write('new@example.com')
```

### Type with Validation

```javascript
// Triggers character-by-character validation
await browser.textbox('Password').focus()
await browser.type('MyPassword123!')
```

### Double-Click to Select

```javascript
await browser.element('paragraph').doubleClick()
```

### Right-Click Menu

```javascript
await browser.element('item').rightClick()
await browser.element('Delete').click()
```

### File Upload

```javascript
await browser.file('Attachment').upload('./document.pdf')
```

### Keyboard Shortcuts

```javascript
// Select all
await browser.ctrl.press('a')

// Copy
await browser.ctrl.press('c')

// Paste
await browser.ctrl.press('v')

// Undo
await browser.ctrl.press('z')
```

## See Also

- [API Reference - Click Operations](API-REFERENCE.md#element-interaction) - Complete method signatures
- [API Reference - Input Operations](API-REFERENCE.md#element-interaction) - Text input methods
- [Core Concepts](CONCEPTS.md) - Operation types and patterns
