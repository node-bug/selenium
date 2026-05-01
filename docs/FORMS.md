# Forms: Checkboxes, Switches, and Dropdowns

Complete guide to form element interactions including checkboxes, switches, radio buttons, and dropdown selections.

## Quick Reference

```javascript
// Checkboxes
await browser.checkbox('Subscribe').check()
await browser.checkbox('Subscribe').uncheck()
await browser.checkbox('Subscribe').is.checked()
await browser.checkbox('Subscribe').is.not.checked()
await browser.checkbox('Subscribe').should.be.checked()
await browser.checkbox('Subscribe').should.not.be.checked()

// Switches
await browser.switch('Dark Mode').on()
await browser.switch('Dark Mode').off()
await browser.switch('Dark Mode').isOn()
await browser.switch('Dark Mode').isOff()

// Radio Buttons
await browser.radio('Male').set()
await browser.radio('Male').is.set()
await browser.radio('Male').is.not.set()
await browser.radio('Male').should.be.set()
await browser.radio('Male').should.not.be.set()

// Dropdowns
await browser.dropdown('Country').option('United States').select()
await browser.dropdown('Country').option(1).select()
const selected = await browser.dropdown('Country').get.text()
const value = await browser.dropdown('Country').get.value()
```

## Checkboxes

### check()

Check a checkbox if not already checked:

```javascript
await browser.checkbox('Subscribe').check()
await browser.checkbox('Remember Me').check()
```

**Behavior**:

- If already checked → skips (no action)
- If unchecked → clicks to check
- Falls back to JavaScript click if standard click fails
- Verifies final state

**Returns**: `Promise<boolean>`

**Example**:

```javascript
// Subscribe to newsletter
await browser.checkbox('Subscribe to newsletter').check()
```

### uncheck()

Uncheck a checkbox if not already unchecked:

```javascript
await browser.checkbox('Notifications').uncheck()
```

**Behavior**:

- If already unchecked → skips (no action)
- If checked → clicks to uncheck
- Falls back to JavaScript click if standard click fails
- Verifies final state

**Returns**: `Promise<boolean>`

### is.checked()

Return whether the checkbox is currently checked:

```javascript
const checked = await browser.checkbox('Agree').is.checked()
```

**Returns**: `Promise<boolean>`

**Use when**: You need to read the checkbox state without failing the test

### is.not.checked()

Return whether the checkbox is currently unchecked:

```javascript
const unchecked = await browser.checkbox('Spam Filter').is.not.checked()
```

**Returns**: `Promise<boolean>`

**Use when**: You need to read the checkbox state without failing the test

### should.be.checked()

Assert that checkbox is currently checked:

```javascript
await browser.checkbox('Agree').should.be.checked()
```

**Behavior**:

- If checked → passes
- If unchecked → throws error and **stops execution**

**Throws**: `Error` if checkbox is not checked

**Use when**: You expect checkbox to be checked and want test to fail if it's not

### should.not.be.checked()

Assert that checkbox is currently unchecked:

```javascript
await browser.checkbox('Spam Filter').should.not.be.checked()
```

**Behavior**:

- If unchecked → passes
- If checked → throws error and **stops execution**

**Throws**: `Error` if checkbox is checked

**Use when**: You expect checkbox to be unchecked and want test to fail if it's not

### Checkbox Patterns

**Toggle state**:

```javascript
const isChecked = await browser.checkbox('RememberMe').is.checked()
if (isChecked) {
  await browser.checkbox('RememberMe').uncheck()
} else {
  await browser.checkbox('RememberMe').check()
}
```

**Multiple checkboxes**:

```javascript
// Check multiple items
await browser.checkbox('Email Alerts').check()
await browser.checkbox('SMS Alerts').check()
await browser.checkbox('Push Alerts').check()
```

## Switches

Switches are toggle controls (similar to checkboxes but styled as on/off).

### on()

Turn a switch on:

```javascript
await browser.switch('Dark Mode').on()
await browser.switch('Notifications').on()
```

**Returns**: `Promise<boolean>`

### off()

Turn a switch off:

```javascript
await browser.switch('Dark Mode').off()
```

**Returns**: `Promise<boolean>`

### isOn()

Assert that switch is currently on:

```javascript
await browser.switch('Dark Mode').isOn()
```

**Throws**: Error if switch is off

**Returns**: `Promise<boolean>`

### isOff()

Assert that switch is currently off:

```javascript
await browser.switch('Notifications').isOff()
```

**Throws**: Error if switch is on

**Returns**: `Promise<boolean>`

### Switch Patterns

**Toggle switch**:

```javascript
if (await browser.switch('Feature').is.visible()) {
  if (await browser.switch('Feature').isOn()) {
    await browser.switch('Feature').off()
  } else {
    await browser.switch('Feature').on()
  }
}
```

## Radio Buttons

Radio buttons allow selecting one option from a group.

### set()

Set a radio button:

```javascript
await browser.radio('Male').set()
await browser.radio('Female').set()
await browser.radio('Prefer not to say').set()
```

**Behavior**:

- If already set → skips (no action)
- If not set → clicks to set
- Falls back to JavaScript click if standard click fails
- Verifies final state

**Returns**: `Promise<boolean>`

### is.set()

Return whether the radio button is currently set (selected):

```javascript
const set = await browser.radio('Male').is.set()
```

**Returns**: `Promise<boolean>`

**Use when**: You need to read the radio button state without failing the test

### is.not.set()

Return whether the radio button is currently NOT set (not selected):

```javascript
const notSet = await browser.radio('Female').is.not.set()
```

**Returns**: `Promise<boolean>`

**Use when**: You need to read the radio button state without failing the test

### should.be.set()

Assert that a radio button is currently set (selected):

```javascript
await browser.radio('Male').should.be.set()
```

**Behavior**:

- If set → passes
- If not set → throws error and **stops execution**

**Throws**: `Error` if radio button is not set

**Use when**: You expect a radio button to be selected and want the test to fail if it's not

### should.not.be.set()

Assert that a radio button is currently NOT set (not selected):

```javascript
await browser.radio('Female').should.not.be.set()
```

**Behavior**:

- If not set → passes
- If set → throws error and **stops execution**

**Throws**: `Error` if radio button is set

**Use when**: You expect a radio button to be unselected and want the test to fail if it is

### Radio Button Patterns

**Gender selection**:

```javascript
await browser.radio('Female').set()
await browser.radio('Female').should.be.set()
```

**Verifying default state**:

```javascript
// Verify default option is selected
await browser.radio('Standard (5-7 days)').should.be.set()
// Verify other options are not selected
await browser.radio('Express (2-3 days)').should.not.be.set()
```

**Selecting from options**:

```javascript
// Select shipping method
await browser.radio('Express (2-3 days)').set()
await browser.radio('Express (2-3 days)').should.be.set()
await browser.radio('Standard (5-7 days)').should.not.be.set()
```

## Dropdowns / Selects

Select options from native `<select>` elements or custom combobox widgets.

### option(value)

Set the option to select. This is the first step in the selection chain:

```javascript
// By text (partial match)
await browser.dropdown('Country').option('United').select()

// By value (partial match)
await browser.dropdown('Size').option('M').select()

// By 1-based index
await browser.dropdown('Country').option(1).select()
```

**Parameters**:

- `value` (string|number): Option text, value, or 1-based index

**Matching behavior** (for strings):

1. Exact text match
2. Exact value match
3. Partial text match
4. Partial value match

**Note**: The option value is cleared after `.select()`, `.get.text()`, `.get.value()`, or `.isSelected()`

### select()

Select the option specified by `.option()`:

```javascript
// By text
await browser.dropdown('Country').option('United States').select()

// By value
await browser.dropdown('Volume').option('50%').select()

// By index (1-based)
await browser.dropdown('Color').option(1).select()
```

**Returns**: `Promise<boolean>`

**Throws**: Error if `.option()` was not called first

### getSelectedOption()

Get the currently selected option:

```javascript
const selected = await browser.dropdown('Country').getSelectedOption()
console.log(selected.text) // "United States"
console.log(selected.value) // "us"
```

**Returns**: `Promise<{text: string, value: string}>`

### get.text()

Get the visible text of the currently selected option:

```javascript
const text = await browser.dropdown('Country').get.text()
console.log(text) // "United States"
```

**Returns**: `Promise<string>`

### get.value()

Get the value attribute of the currently selected option:

```javascript
const value = await browser.dropdown('Country').get.value()
console.log(value) // "us"
```

**Returns**: `Promise<string>`

### isSelected()

Assert that a specific option is currently selected:

```javascript
await browser.dropdown('Country').option('United States').isSelected()
```

**Throws**: Error if option is not selected

**Returns**: `Promise<boolean>`

### Dropdown Patterns

**Select by text**:

```javascript
await browser.dropdown('Country').option('United States').select()
await browser.dropdown('Country').get.text() // "United States"
```

**Select by value**:

```javascript
await browser.dropdown('Currency').option('USD').select()
```

**Select by index**:

```javascript
// First option
await browser.dropdown('Country').option(1).select()

// Third option
await browser.dropdown('Color').option(3).select()
```

**Conditional selection**:

```javascript
const current = await browser.dropdown('Language').get.text()
if (current !== 'English') {
  await browser.dropdown('Language').option('English').select()
}
```

**Verify selection**:

```javascript
await browser.dropdown('Country').option('Canada').select()
await browser.dropdown('Country').option('Canada').isSelected()
```

## Form Validation Patterns

### Complete Form Submission

```javascript
// Fill form
await browser.textbox('Full Name').write('John Doe')
await browser.textbox('Email').write('john@example.com')
await browser.radio('Male').check()
await browser.checkbox('Accept Terms').check()
await browser.dropdown('Country').option('USA').select()

// Verify and submit
await browser.button('Submit').should.be.visible()
await browser.button('Submit').click()
```

### Multi-Step Form

```javascript
// Step 1
await browser.textbox('First Name').write('John')
await browser.button('Next').click()

// Step 2
await browser.radio('Male').check()
await browser.button('Next').click()

// Step 3
await browser.dropdown('Country').option('USA').select()
await browser.button('Submit').click()
```

### Form Error Handling

```javascript
// Submit form
await browser.button('Submit').click()

// Check for error message
if (await browser.element('Error message').is.visible()) {
  const error = await browser.element('Error message').get.text()
  console.error('Form error:', error)
}
```

## Accessibility Considerations

The library finds form elements by:

- Associated labels (`<label for="id">`)
- Placeholder text
- ARIA labels
- Element text content

This ensures accessibility while maintaining usability.

## See Also

- [API Reference - Form Operations](API-REFERENCE.md#element-interaction) - Complete method signatures
- [Selectors Guide](SELECTORS.md) - Finding form elements
- [Interactions Guide](INTERACTIONS.md) - Click and input operations
