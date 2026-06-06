---
name: 'Form Handling Skill'
description: 'Specialized methods for form operations including input, selection, validation'
applies:
  [
    'app/command-delegates/checkbox-delegate.js',
    'app/command-delegates/radio-delegate.js',
    'app/command-delegates/select-delegate.js',
    'app/command-delegates/input-delegate.js',
  ]
examples:
  - 'Fill text inputs and textareas'
  - 'Check and uncheck checkboxes'
  - 'Select radio buttons'
  - 'Choose dropdown options'
  - 'Adjust sliders'
  - 'Validate form states'
---

# Form Handling Skill

## Overview

Specialized methods for working with form elements. Each form element type has optimized methods for interaction and validation.

## Text Input

### Textbox Operations

#### `write(text)`

Type text into a textbox, clearing first.

```javascript
await browser.textbox('Email Address').write('user@example.com')
```

**Returns**: `Promise<void>`  
**Behavior**: Focus field → Clear → Type  
**When to use**: Fill text input

---

#### `append(text)`

Append text to existing content.

```javascript
await browser.textbox('Comments').append(' (URGENT)')
```

**Returns**: `Promise<void>`  
**When to use**: Add to existing text

---

#### `clear()`

Clear the textbox.

```javascript
await browser.textbox('Search').clear()
```

**Returns**: `Promise<void>`

---

#### `getText()`

Get text from textbox.

```javascript
const email = await browser.textbox('Email').get.text()
```

**Returns**: `Promise<string>`

---

#### `is.empty()`

Check if textbox is empty.

```javascript
if (await browser.textbox('Optional Field').is.empty()) {
  // Field is empty
}
```

**Returns**: `Promise<boolean>`

---

#### `is.focused()`

Check if textbox has focus.

```javascript
const focused = await browser.textbox('Email').is.focused()
```

**Returns**: `Promise<boolean>`

---

### Textarea Operations

Same methods as textbox:

```javascript
// Write to textarea
await browser.textarea('Comments').write('This is a longer comment...')

// Clear
await browser.textarea('Comments').clear()

// Get text
const text = await browser.textarea('Comments').get.text()
```

---

## Checkbox Operations

### Check/Uncheck

#### `check()`

Check a checkbox.

```javascript
await browser.checkbox('I agree to terms').check()
```

**Returns**: `Promise<void>`  
**Throws**: Error if checkbox not found or disabled  
**When to use**: Enable checkbox option

---

#### `uncheck()`

Uncheck a checkbox.

```javascript
await browser.checkbox('Subscribe to newsletter').uncheck()
```

**Returns**: `Promise<void>`

---

#### `toggle()`

Toggle checkbox state (check if unchecked, uncheck if checked).

```javascript
await browser.checkbox('Notifications').toggle()
```

**Returns**: `Promise<void>`

---

### Checkbox Verification

#### `is.checked()`

Check if checkbox is currently checked.

```javascript
if (await browser.checkbox('I agree').is.checked()) {
  console.log('User agreed')
}
```

**Returns**: `Promise<boolean>`

---

#### `should.be.checked()`

Assert checkbox is checked.

```javascript
await browser.checkbox('I agree').should.be.checked()
```

**Throws**: Error if not checked

---

#### `should.not.be.checked()`

Assert checkbox is not checked.

```javascript
await browser.checkbox('Newsletter').should.not.be.checked()
```

**Throws**: Error if checked

---

## Radio Button Operations

### Select/Unselect

#### `select()`

Select a radio button.

```javascript
await browser.radio('Option 1').select()
```

**Returns**: `Promise<void>`  
**When to use**: Select this radio button option

---

#### `unselect()`

Unselect a radio button.

```javascript
await browser.radio('Option 1').unselect()
```

**Returns**: `Promise<void>`  
**When to use**: Deselect radio button

---

### Radio Verification

#### `is.selected()`

Check if radio button is selected.

```javascript
if (await browser.radio('Option 1').is.selected()) {
  console.log('Option 1 is selected')
}
```

**Returns**: `Promise<boolean>`

---

#### `should.be.selected()`

Assert radio button is selected.

```javascript
await browser.radio('Standard Shipping').should.be.selected()
```

**Throws**: Error if not selected

---

## Dropdown/Select Operations

### Selection Methods

#### `selectByText(text)`

Select option by visible text.

```javascript
await browser.dropdown('Country').selectByText('United States')
```

**Parameters**:

- `text` (string): Visible option text

**Returns**: `Promise<void>`  
**When to use**: Most common - select by what user sees

---

#### `selectByValue(value)`

Select option by value attribute.

```javascript
await browser.dropdown('Country Code').selectByValue('US')
```

**Parameters**:

- `value` (string): Option value attribute

**Returns**: `Promise<void>`  
**When to use**: When text doesn't match value

---

#### `selectByIndex(index)`

Select option by position.

```javascript
await browser.dropdown('Month').selectByIndex(0) // First option
```

**Parameters**:

- `index` (number): 0-based position

**Returns**: `Promise<void>`  
**When to use**: When position is known

---

### Dropdown Verification

#### `getSelectedOption()`

Get currently selected option text.

```javascript
const selected = await browser.dropdown('Country').getSelectedOption()
console.log(selected) // 'United States'
```

**Returns**: `Promise<string>`

---

#### `getSelectedValue()`

Get currently selected option value.

```javascript
const value = await browser.dropdown('Country').getSelectedValue()
console.log(value) // 'US'
```

**Returns**: `Promise<string>`

---

#### `getOptions()`

Get all available options as array.

```javascript
const options = await browser.dropdown('Country').getOptions()
console.log(options) // ['United States', 'Canada', 'Mexico', ...]
```

**Returns**: `Promise<Array<string>>`  
**When to use**: See all choices, validate options

---

#### `getOptionCount()`

Get number of available options.

```javascript
const count = await browser.dropdown('Items').getOptionCount()
```

**Returns**: `Promise<number>`

---

#### `is.selectedByText(text)`

Check if specific option is selected.

```javascript
const isSelected = await browser
  .dropdown('Shipping')
  .is.selectedByText('Express')
```

**Returns**: `Promise<boolean>`

---

### Dropdown State

#### `is.disabled()`

Check if dropdown is disabled.

```javascript
if (await browser.dropdown('Options').is.disabled()) {
  console.log('Dropdown is disabled')
}
```

**Returns**: `Promise<boolean>`

---

#### `should.have.options(expectedOptions)`

Assert dropdown contains expected options.

```javascript
await browser
  .dropdown('Priority')
  .should.have.options(['Low', 'Medium', 'High'])
```

**Parameters**:

- `expectedOptions` (array): Expected option texts

**Returns**: `Promise<void>`  
**Throws**: Error if options don't match

---

## Multi-Select Operations

For select elements with `multiple` attribute:

#### `selectMultiple(texts)`

Select multiple options.

```javascript
await browser.element('categories').selectMultiple(['Sports', 'News', 'Tech'])
```

**Parameters**:

- `texts` (array): Texts to select

**Returns**: `Promise<void>`

---

#### `getSelectedOptions()`

Get all selected options.

```javascript
const selected = await browser.element('tags').getSelectedOptions()
console.log(selected) // ['Option1', 'Option2', ...]
```

**Returns**: `Promise<Array<string>>`

---

## Slider Operations

### `setValue(value)`

Set slider to specific value.

```javascript
await browser.slider('Volume').setValue(75)
```

**Parameters**:

- `value` (number): Value to set

**Returns**: `Promise<void>`  
**When to use**: Set slider position

---

### `getValue()`

Get current slider value.

```javascript
const volume = await browser.slider('Volume').getValue()
```

**Returns**: `Promise<number>`

---

### `getMin()`

Get slider minimum value.

```javascript
const min = await browser.slider('Age').getMin()
```

**Returns**: `Promise<number>`

---

### `getMax()`

Get slider maximum value.

```javascript
const max = await browser.slider('Age').getMax()
```

**Returns**: `Promise<number>`

---

### `increment()`

Increase slider value by 1.

```javascript
await browser.slider('Quantity').increment()
```

**Returns**: `Promise<void>`

---

### `decrement()`

Decrease slider value by 1.

```javascript
await browser.slider('Quantity').decrement()
```

**Returns**: `Promise<void>`

---

## Form Submission

### `submit()`

Submit the form.

```javascript
await browser.form('Login').submit()
```

**Returns**: `Promise<void>`  
**Behavior**: Finds form and calls submit()  
**When to use**: Instead of clicking submit button

---

## Form Validation

### `validate()`

Validate form fields (browser-level validation).

```javascript
const valid = await browser.form('Registration').validate()
```

**Returns**: `Promise<boolean>`

---

### `getValidationErrors()`

Get form validation error messages.

```javascript
const errors = await browser.form('Login').getValidationErrors()
console.log(errors) // ['Email is required', 'Password is too short']
```

**Returns**: `Promise<Array<string>>`

---

### `is.valid()`

Check if form is valid.

```javascript
if (await browser.form('Contact').is.valid()) {
  console.log('Form is valid')
}
```

**Returns**: `Promise<boolean>`

---

## Common Patterns

### Pattern 1: Complete Registration Form

```javascript
// Text inputs
await browser.textbox('First Name').write('John')
await browser.textbox('Last Name').write('Doe')
await browser.textbox('Email').write('john@example.com')
await browser.textbox('Password').write('SecurePass123!')

// Dropdown
await browser.dropdown('Country').selectByText('United States')
await browser.dropdown('State').selectByText('California')

// Checkboxes
await browser.checkbox('I agree to terms').check()
await browser.checkbox('Subscribe to newsletter').check()

// Radio
await browser.radio('Monthly').select()

// Submit
await browser.button('Register').click()

// Verify
await browser.heading('Welcome').should.be.visible()
```

### Pattern 2: Update User Preferences

```javascript
// Toggle notifications
const notificationsEnabled = await browser
  .checkbox('Email Notifications')
  .is.checked()
if (!notificationsEnabled) {
  await browser.checkbox('Email Notifications').check()
}

// Change frequency
await browser.dropdown('Frequency').selectByText('Weekly')

// Save
await browser.button('Save Preferences').click()
```

### Pattern 3: Multi-Step Form with Validation

```javascript
// Step 1: Personal info
await browser.textbox('Full Name').write('Jane Smith')
await browser.textbox('DOB').write('01/15/1990')

// Validate before proceeding
await browser.form('Step1').should.be.valid()

// Step 2: Address
await browser.textbox('Address').write('123 Main St')
await browser.textbox('City').write('New York')
await browser.dropdown('State').selectByText('NY')

// Final submit
await browser.button('Complete').click()
```

### Pattern 4: Complex Selection

```javascript
// Multiple selections
await browser.dropdown('Primary Interest').selectByText('Technology')
await browser.checkbox('AI').check()
await browser.checkbox('Machine Learning').check()
await browser.checkbox('Data Science').check()

// Verify selections
await browser.dropdown('Primary Interest').is.selectedByText('Technology')
await browser.checkbox('AI').should.be.checked()
```

### Pattern 5: Conditional Form Filling

```javascript
// Check country to determine if state field needed
const country = await browser.dropdown('Country').getSelectedOption()

if (country === 'United States') {
  await browser.dropdown('State').selectByText('Texas')
  await browser.textbox('ZIP Code').write('75001')
} else {
  await browser.textbox('Province').write('Ontario')
  await browser.textbox('Postal Code').write('M1A 1A1')
}
```

---

## Best Practices

1. **Validate after filling** - Use `.is.valid()` or check specific fields
2. **Handle optionals** - Check if optional field exists before filling
3. **Use appropriate methods** - `selectByText()` for user perspective
4. **Chain operations** - Group related field fills
5. **Check state before changing** - Avoid unnecessary toggles
6. **Verify results** - Assert form accepted values

---

## Troubleshooting

| Issue                     | Solution                                                          |
| ------------------------- | ----------------------------------------------------------------- |
| Dropdown won't select     | Use exact text, check for case sensitivity, try `selectByValue()` |
| Checkbox won't check      | Verify element is visible and enabled, check accessibility        |
| Radio button won't select | Verify radio group, check element is enabled                      |
| Form won't submit         | Check validation errors with `getValidationErrors()`              |
| Slider doesn't move       | Use `setValue()` with number in valid range                       |
| Text not appearing        | Clear field first with `.clear()`, check field is focused         |

---

## Related Skills

- [Element Finding](elements.instructions.md) - Find form elements
- [Element Interactions](element-interactions.instructions.md) - General interactions
- [Browser Control](browser.instructions.md) - Navigate between forms
