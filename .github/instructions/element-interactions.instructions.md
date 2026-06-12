---
name: 'Element Interactions Skill'
description: 'Click, type, drag, hover, keyboard, and other interaction methods'
applies:
  [
    'app/command-delegates/click-delegate.js',
    'app/command-delegates/input-delegate.js',
    'app/command-delegates/visibility-delegate.js',
    'app/command-delegates/drag-drop-delegate.js',
  ]
examples:
  - 'Click buttons and links'
  - 'Type text into fields'
  - 'Drag and drop elements'
  - 'Keyboard navigation'
  - 'File uploads'
---

# Element Interactions Skill

## Overview

After finding an element, use these methods to interact with it. Supports clicks, typing, dragging, hovering, keyboard navigation, and more.

## Click Operations

### `click(x, y)`

Click an element.

```javascript
// Standard click
await browser.button('Submit').click()

// Click with coordinates (offset from element center)
await browser.element('box').click(10, 20)
```

**Returns**: `Promise<void>`  
**Throws**: Error if element not found or not clickable  
**When to use**: Buttons, links, clickable elements

---

### `doubleClick()`

Double-click an element.

```javascript
await browser.element('item').doubleClick()
```

**Returns**: `Promise<void>`  
**When to use**: Double-click to edit, select text

---

### `rightClick()`

Right-click (context menu).

```javascript
await browser.element('option').rightClick()
```

**Returns**: `Promise<void>`  
**When to use**: Context menus, right-click actions

---

### `tripleClick()`

Triple-click to select all text in field.

```javascript
await browser.textbox('Name').tripleClick()
```

**Returns**: `Promise<void>`  
**When to use**: Select all text for replacement

---

## Text Input

### `write(text)`

Type text into an input field.

```javascript
await browser.textbox('Email').write('user@example.com')
```

**Parameters**:

- `text` (string): Text to type

**Returns**: `Promise<void>`  
**Behavior**: Clears field first, then types  
**When to use**: Text input

**Note**: For fields that auto-complete, typing may be slow to allow autocomplete to trigger. Adjust speed if needed.

---

### `sendKeys(keys)`

Send keyboard keys.

```javascript
// Send special keys
await browser.textbox('Search').sendKeys(Key.ENTER)
await browser.textbox('Code').sendKeys(Key.TAB)

// Combine with modifiers
await browser.sendKeys([Key.CONTROL, 'a']) // Select all
```

**Parameters**:

- `keys` (string|array): Key names from selenium-webdriver Key enum

**Returns**: `Promise<void>`  
**When to use**: Send special keys, keyboard shortcuts

---

### `clear()`

Clear text from an input field.

```javascript
await browser.textbox('Search').clear()
```

**Returns**: `Promise<void>`  
**When to use**: Clear field before typing

---

### `typeCharByChar(text, delayMs)`

Type text slowly, character by character.

```javascript
// Type with 100ms delay between characters
await browser.textbox('Code').typeCharByChar('pass1234', 100)
```

**Parameters**:

- `text` (string): Text to type
- `delayMs` (number): Delay between each character in milliseconds

**Returns**: `Promise<void>`  
**When to use**: Slow typing for animations or inputs that require time to process

---

### `paste(text)`

Paste text into field (using clipboard).

```javascript
await browser.textbox('Code').paste('import React from "react"')
```

**Parameters**:

- `text` (string): Text to paste

**Returns**: `Promise<void>`  
**When to use**: Paste code, formatted text

---

## Mouse Actions

### `hover()`

Hover over an element.

```javascript
await browser.element('dropdown-trigger').hover()
```

**Returns**: `Promise<void>`  
**Behavior**: Moves mouse to element, may trigger hover effects  
**When to use**: Trigger hover menus, tooltips

---

### `moveTo(x, y)`

Move mouse to absolute coordinates.

```javascript
await browser.moveTo(500, 300)
```

**Parameters**:

- `x` (number): X coordinate
- `y` (number): Y coordinate

**Returns**: `Promise<void>`  
**When to use**: Move to specific position on page

---

## Drag and Drop

### `dragTo(targetElement)`

Drag element to another element.

```javascript
const source = await browser.element('item').find()
await browser.element('item').dragTo(targetElement)
```

**Parameters**:

- `targetElement` (WebElement): Where to drag to

**Returns**: `Promise<void>`  
**When to use**: Drag and drop interactions

---

### `drag(offsetX, offsetY)`

Drag element by offset.

```javascript
// Drag 100px right, 50px down
await browser.element('slider').drag(100, 50)
```

**Parameters**:

- `offsetX` (number): Pixels to move horizontally
- `offsetY` (number): Pixels to move vertically

**Returns**: `Promise<void>`  
**When to use**: Drag by relative distance

---

## Keyboard Navigation

### `pressKey(key)`

Press a single key.

```javascript
await browser.pressKey('Escape') // Close dialog
await browser.pressKey('Enter') // Submit
await browser.pressKey('Tab') // Next field
```

**Parameters**:

- `key` (string): Key name (Escape, Enter, Tab, ArrowUp, ArrowDown, etc.)

**Returns**: `Promise<void>`  
**When to use**: Single key press without typing text

---

### `pressKeyWithModifiers(key, modifiers)`

Press key with modifiers (Shift, Control, Alt, Meta).

```javascript
// Ctrl+A to select all
await browser.pressKeyWithModifiers('a', { control: true })

// Ctrl+C to copy
await browser.pressKeyWithModifiers('c', { control: true })

// Shift+Tab to go back
await browser.pressKeyWithModifiers('Tab', { shift: true })
```

**Parameters**:

- `key` (string): Key to press
- `modifiers` (object):
  - `shift` (bool): Shift key
  - `control` (bool): Control/Cmd key
  - `alt` (bool): Alt/Option key
  - `meta` (bool): Meta key

**Returns**: `Promise<void>`  
**When to use**: Keyboard shortcuts, hotkeys

---

### `tabTo(element)`

Tab to next element and verify focus.

```javascript
const nextField = await browser.textbox('Phone').find()
await browser.tabTo(nextField)
```

**Parameters**:

- `element` (WebElement): Element to tab to

**Returns**: `Promise<void>`  
**When to use**: Tab navigation, verify focus order

---

## File Operations

### `uploadFile(filePath)`

Upload a file to file input element.

```javascript
await browser.element('file-input').uploadFile('/path/to/file.txt')
```

**Parameters**:

- `filePath` (string): Absolute path to file

**Returns**: `Promise<void>`  
**When to use**: File upload inputs

---

### `uploadFiles(filePaths)`

Upload multiple files.

```javascript
await browser
  .element('file-input')
  .uploadFiles(['/path/to/file1.txt', '/path/to/file2.txt'])
```

**Parameters**:

- `filePaths` (array): Array of file paths

**Returns**: `Promise<void>`  
**When to use**: Multi-file upload

---

## Element State

### `isVisible()`

Check if element is visible.

```javascript
const visible = await browser.button('Submit').is.visible()
```

**Returns**: `Promise<boolean>`  
**When to use**: Verify element visibility

---

### `isEnabled()`

Check if element is enabled.

```javascript
const enabled = await browser.button('Submit').is.enabled()
```

**Returns**: `Promise<boolean>`  
**When to use**: Verify element is clickable

---

### `isPresent()`

Check if element exists on page.

```javascript
const exists = await browser.element('special-box').is.present()
```

**Returns**: `Promise<boolean>`  
**When to use**: Verify element presence

---

## Element Properties

### `getText()`

Get element's text content.

```javascript
const text = await browser.button('Submit').get.text()
```

**Returns**: `Promise<string>`  
**When to use**: Get text, verify message

---

### `getAttribute(name)`

Get element attribute value.

```javascript
const href = await browser.link('Home').getAttribute('href')
const id = await browser.element('box').getAttribute('id')
```

**Parameters**:

- `name` (string): Attribute name

**Returns**: `Promise<string>`  
**When to use**: Get attributes like href, src, title, etc.

---

### `getCssValue(property)`

Get computed CSS property value.

```javascript
const color = await browser.element('heading').getCssValue('color')
const display = await browser.element('box').getCssValue('display')
```

**Parameters**:

- `property` (string): CSS property name

**Returns**: `Promise<string>`  
**When to use**: Check styling, colors, layout

---

### `getSize()`

Get element width and height.

```javascript
const size = await browser.image('logo').getSize()
console.log(size) // { width: 200, height: 100 }
```

**Returns**: `Promise<{width: number, height: number}>`

---

### `getLocation()`

Get element's position on page.

```javascript
const location = await browser.button('Submit').getLocation()
console.log(location) // { x: 100, y: 200 }
```

**Returns**: `Promise<{x: number, y: number}>`

---

## Assertions

Use assertion methods with fluent syntax.

### `should.be.visible()`

Assert element is visible.

```javascript
await browser.button('Submit').should.be.visible()
```

**Throws**: Error if not visible  
**When to use**: Verify element state in tests

---

### `should.not.be.visible()`

Assert element is not visible.

```javascript
await browser.element('error-message').should.not.be.visible()
```

**Throws**: Error if visible

---

### `is.enabled()`

Check if enabled.

```javascript
await browser.button('Next').is.enabled()
```

**Returns**: `Promise<boolean>`

---

### `is.disabled()`

Check if disabled.

```javascript
await browser.button('Next').is.disabled()
```

**Returns**: `Promise<boolean>`

---

## Common Patterns

### Pattern 1: Fill Form Field

```javascript
// Click to focus
await browser.textbox('Email').click()

// Clear existing content
await browser.textbox('Email').clear()

// Type new content
await browser.textbox('Email').write('new@example.com')

// Or simply:
await browser.textbox('Email').write('new@example.com') // Clears automatically
```

### Pattern 2: Keyboard Navigation

```javascript
// Focus field and navigate with keyboard
await browser.textbox('First Name').click()
await browser.pressKey('Tab') // Move to next field
await browser.write('John')
await browser.pressKey('Tab')
await browser.write('Doe')
```

### Pattern 3: Drag and Drop

```javascript
const source = await browser.element('item').find()
const target = await browser.element('drop-zone').find()
await browser.element('item').dragTo(target)
```

### Pattern 4: Modal Interaction

```javascript
// Click button to open modal
await browser.button('Delete').click()

// Interact inside modal
await browser
  .textbox('Confirm')
  .within.dialog('Delete Confirmation')
  .write('I understand')

// Confirm action
await browser.button('Delete').within.dialog('Delete Confirmation').click()
```

### Pattern 5: File Upload

```javascript
// Single file
await browser.element('photo-upload').uploadFile('/path/to/photo.jpg')

// Multiple files
await browser
  .element('documents')
  .uploadFiles(['/path/to/doc1.pdf', '/path/to/doc2.pdf'])

// Verify upload
await browser.paragraph('Upload successful').should.be.visible()
```

---

## Performance Considerations

1. **Use appropriate delays** - `typeCharByChar()` for slow typing when needed
2. **Chain operations** - Avoid storing elements, re-query when needed
3. **Prefer semantic methods** - `write()` is optimized for text fields
4. **Batch actions** - Group related interactions together

---

## Troubleshooting

| Issue                          | Solution                                                                |
| ------------------------------ | ----------------------------------------------------------------------- |
| Click not working              | Verify element is visible and not obscured, try scroll to element first |
| Text not appearing             | Use `write()` instead of `sendKeys()`, check field is focused           |
| Drag/drop fails                | Ensure target element exists, try slower drag with coordinates          |
| Keyboard shortcuts not working | Verify modifier keys syntax, use `pressKeyWithModifiers()`              |
| File upload fails              | Check file path is absolute, file exists and is readable                |

---

## Related Skills

- [Element Finding](elements.instructions.md) - Find elements first
- [Form Handling](form-handling.instructions.md) - Specialized form operations
- [Browser Control](browser.instructions.md) - Manage page context
