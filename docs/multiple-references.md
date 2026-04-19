# Multiple References

This document explains how to use multiple references in element selection, allowing for flexible element targeting when elements might have different names but represent the same functionality.

## Using "or" for Multiple Element Names

In certain cases, elements might be expected to have different names but mean the same thing. The library supports using "or" to specify multiple possible names for the same element.

### Example

```javascript
// Click on either "checkout" or "submit" button
await browser.button('checkout').or().button('submit').click()

// Check if either "save" or "apply" button is visible
const isSaveVisible = await browser
  .button('save')
  .or()
  .button('apply')
  .isVisible()
```

## Supported Element Types

This multiple references functionality works with all element types:

```javascript
// Textbox with multiple possible names
await browser
  .textbox('email')
  .or()
  .textbox('user_email')
  .write('user@example.com')

// Checkbox with multiple possible names
await browser.checkbox('remember_me').or().radio('remember').check()

// Link with multiple possible names
await browser.link('home').or().menu('main').click()

// Radio button with multiple possible names
await browser.radio('male').or().radio('m').check()
```

## Best Practices

1. Use multiple references when elements might have different names in different contexts or versions
2. Keep the number of alternatives reasonable to maintain readability
3. Ensure alternatives have the same semantic meaning for consistent behavior
4. When multiple elements are found, the priority is based on the order specified in the command. If elements are already present, the first matching element in the command order is selected. If no elements are present, the first element displayed on the screen is selected.
