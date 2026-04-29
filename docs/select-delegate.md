# Dropdown / Select Operations

Selecting options from dropdown elements. Supports both native `<select>` elements and custom combobox widgets (`role="combobox"`). See [API Reference](API-REFERENCE.md#element-interaction) for complete method signatures.

## Quick Examples

```javascript
// Select by visible text (partial match)
await browser.dropdown('Country').option('United').select()

// Select by value
await browser.dropdown('Volume').option('25%').select()

// Select by index (1-based)
await browser.dropdown('Country').option(1).select()

// Get currently selected option
const text = await browser.dropdown('Country').get.text()
const value = await browser.dropdown('Country').get.value()
console.log(text) // "United States"
console.log(value) // "us"

// Assert an option is selected
await browser.dropdown('Country').option('United States').isSelected()
```

## Operations

### `.option(value)`

Sets the option value for subsequent operations. This is the first step in the chaining pattern.

```javascript
// By text (partial match)
await browser.dropdown('Country').option('United')

// By value (partial match)
await browser.dropdown('Volume').option('25%')

// By 1-based index
await browser.dropdown('Country').option(1)
```

**Parameters**:

- `value` (string|number): Text, value, or 1-based index of the option

**Returns**: `void` (sets internal state for chaining)

**Notes**:

- If `value` is a positive number, it will be treated as a 1-based index
- The option value is automatically cleared after `.select()`, `.get.text()`, `.get.value()` or `.isSelected()` completes

---

### `.select()`

Select the option specified by `.option()` from a dropdown or combobox.

```javascript
// By text (partial match)
await browser.dropdown('Country').option('United').select()

// By value (partial match)
await browser.dropdown('Volume').option('25%').select()

// By 1-based index
await browser.dropdown('Country').option(1).select()
```

**Parameters**: None (uses the value set by `.option()`)

**Returns**: `Promise<boolean>` - `true` if successful

**Throws**: `Error` if `.option()` was not called before `.select()`

**Matching behavior** (for native `<select>` elements):

1. If option is a number → selects by 1-based index
2. If option is a string → tries exact text match, then exact value match, then partial match against both text and value

**Element types supported**:

- Native `<select>` elements
- Custom combobox widgets (`role="combobox"`)

---

### `.getSelectedOption()`

Get the currently selected option from a dropdown.

```javascript
const selected = await browser.dropdown('Country').getSelectedOption()
console.log(selected.text) // "United States"
console.log(selected.value) // "us"
```

**Parameters**: None

**Returns**: `Promise<Object>` - An object with `text` and `value` properties

**Notes**:

- For native `<select>`: returns the selected option's text and value attributes
- For combobox widgets: returns the currently displayed text as both `text` and `value`
- Returns `{text: '', value: ''}` if no option is selected or an error occurs

---

### `.isSelected()`

Assert that the option specified by `.option()` is currently selected.

```javascript
// Assert by text
await browser.dropdown('Country').option('United States').isSelected()

// Assert by value
await browser.dropdown('Volume').option('25%').isSelected()

// Assert by index
await browser.dropdown('Country').option(1).isSelected()
```

**Parameters**: None (uses the value set by `.option()`)

**Returns**: `Promise<boolean>` - `true` if the option is selected

**Throws**: `Error` if the option is not selected or `.option()` was not called

**Matching behavior**:

- For native `<select>`: compares against the selected option's text and value attributes
- For combobox widgets: compares against the displayed text using partial match
- Index checking verifies if the option at the specified position is the selected one

---

## Dropdown Types

### Native `<select>` Elements

Standard HTML select elements are handled using Selenium's built-in `Select` class:

```javascript
await browser.dropdown('Country').select('United States')
await browser.dropdown('Size').select(2) // Second option
```

### Custom Combobox Widgets

Custom dropdowns with `role="combobox"` are handled by clicking the trigger to open the dropdown, then finding and clicking the matching option:

```javascript
await browser.dropdown('Theme').select('Dark')
await browser.dropdown('Language').select('English')
```

Option elements are detected using these selectors (in order):

- `*[role*="option"]`
- `*[class*="option"]`
- `<li>` elements
- `<div>`, `<span>`, or `<li>` elements

---

## Selection Strategies

### By Text

```javascript
// Partial text match (case-insensitive)
await browser.dropdown('Country').select('United') // Matches "United States", "United Kingdom", etc.
```

### By Value

```javascript
// Partial value match (case-insensitive)
await browser.dropdown('Volume').select('25%') // Matches value="25%"
```

### By Index

```javascript
// 1-based index
await browser.dropdown('Country').select(1) // First option
await browser.dropdown('Country').select(3) // Third option
```

---

## Error Handling

The operation throws an error if:

- The dropdown element cannot be found
- The option is not found after trying all matching strategies
- The index is out of range

```javascript
try {
  await browser.dropdown('Country').select('NonExistent')
} catch (err) {
  console.error('Selection failed:', err.message)
}
```

## See Also

- [Element Types](element-types.md) - `dropdown` selector overview
- [API Reference](API-REFERENCE.md#element-interaction) - Complete method signatures
- [Locator Strategy](locator-strategy.md) - How dropdown elements are matched
