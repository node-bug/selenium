# Examples

This directory contains working examples demonstrating various features of the @nodebug/selenium library.

## Available Examples

### 1. JavaScript Alerts Example

**File:** `javascript-alerts-example.js`

Demonstrates how to interact with JavaScript alerts, confirmations, and prompts.

```bash
node examples/javascript-alerts-example.js
```

### 2. Tab Management Example

**File:** `tab-management-example.js`

Shows how to manage browser tabs including opening, switching, and closing tabs.

```bash
node examples/tab-management-example.js
```

### 3. Window Management Example

**File:** `window-management-example.js`

Demonstrates window management features like resizing, maximizing, and getting window information.

```bash
node examples/window-management-example.js
```

### 4. Form Interaction Example

**File:** `form-interaction-example.js`

Shows various form interaction techniques including text input, checkboxes, radio buttons, dropdowns, and buttons.

```bash
node examples/form-interaction-example.js
```

### 5. Drag and Drop Example

**File:** `drag-and-drop-example.js`

Demonstrates drag and drop functionality using the fluent API.

```bash
node examples/drag-and-drop-example.js
```

### 6. File Upload Example

**File:** `file-upload-example.js`

Shows how to upload files using file input elements.

```bash
node examples/file-upload-example.js
```

### 7. Spatial Positioning Example

**File:** `spatial-positioning-example.js`

Demonstrates spatial/relative element positioning features like finding elements above, below, to the left, to the right, within, and near other elements.

```bash
node examples/spatial-positioning-example.js
```

## Running Examples

All examples follow the same pattern:

1. Create a WebBrowser instance
2. Start the browser with `browser.start()`
3. Perform actions using the browser API
4. Close the browser with `browser.close()`
5. Handle errors appropriately

## Best Practices

- Always call `browser.close()` when done to clean up resources
- Use try-catch blocks to handle errors
- Use explicit waits (`isDisplayed()`) instead of `sleep()` when possible
- Use descriptive element selectors for better maintainability

## Customizing Examples

You can modify the examples to suit your needs:

- Change the URLs to test different websites
- Add more test cases
- Combine features from different examples
- Adjust timeouts and delays as needed

## Creating Your Own Examples

To create your own example:

1. Copy an existing example file as a template
2. Modify the test logic to demonstrate your specific use case
3. Add appropriate comments and documentation
4. Test your example to ensure it works correctly

## Troubleshooting

If an example doesn't work:

1. Check that you have the required dependencies installed
2. Verify that the browser is properly installed
3. Check the error messages for specific issues
4. Try running a different example to isolate the problem
5. Consult the [API documentation](../API.md) for usage details
