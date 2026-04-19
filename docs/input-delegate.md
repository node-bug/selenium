# Input Delegate

The InputDelegate class handles all input-related operations for the WebBrowser library. It provides methods for typing text, focusing elements, clearing input fields, and overwriting text in input fields.

## Methods

### write(value)

Enter text into an input field or content-editable element.

Writes text to an input field, textarea, or content-editable element. Handles both standard form fields and custom content-editable elements.

**Parameters:**

- `value` (string) - Text to enter

**Returns:**

- `Promise<boolean>` - True if successful

**Example:**

```javascript
await browser.element('username').write('myusername')
await browser.textbox('search').write('query')
```

### focus()

Sets focus on an element using JavaScript.

**Returns:**

- `Promise<boolean>` - True if successful

**Example:**

```javascript
await browser.textbox('username').focus()
await browser.element('input').focus()
```

### clear()

Clears text from an input field or content-editable element.

Clears text from input fields, textareas, or content-editable elements. Uses keyboard shortcuts as fallback for complex cases.

**Returns:**

- `Promise<boolean>` - True if successful

**Example:**

```javascript
await browser.textbox('username').clear()
await browser.element('search').clear()
```

### overwrite(value)

Overwrites text in an input field.

Clears existing text and enters new text. Useful for form fields that may have default values or validation that prevents direct entry.

**Parameters:**

- `value` (string) - Text to overwrite with

**Returns:**

- `Promise<boolean>` - True if successful

**Example:**

```javascript
await browser.textbox('username').overwrite('newvalue')
```

## Usage

The InputDelegate methods are automatically available through the WebBrowser class and do not need to be accessed directly. All input operations should be performed through the WebBrowser instance.
