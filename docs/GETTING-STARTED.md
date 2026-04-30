# Getting Started

A quick introduction to WebBrowser automation with practical examples.

## Installation

```bash
npm install @nodebug/selenium
```

## Your First Test

```javascript
import WebBrowser from '@nodebug/selenium'

async function main() {
  const browser = new WebBrowser()

  try {
    // Start browser session
    await browser.start()

    // Navigate to website
    await browser.goto('https://example.com')

    // Find and click a button
    await browser.button('Submit').click()

    // Fill in a text field
    await browser.textbox('Email').write('user@example.com')

    // Check a checkbox
    await browser.checkbox('Remember Me').check()

    // Verify element is visible
    await browser.button('Confirm').should.be.visible()
  } finally {
    // Always close browser
    await browser.close()
  }
}

main().catch(console.error)
```

## Key Concepts

### Element Selection

Find elements by what they say, where they are, or what type they are:

```javascript
// By text (exact or partial match)
await browser.button('Submit').click()

// By type + text (more specific)
await browser.textbox('Email').write('user@example.com')

// By position (below an anchor element)
await browser.textbox('Password').below.textbox('Email').write('secret')

// By multiple alternatives
await browser.button('Save').or.button('Apply').click()
```

### Two Operation Types

**Intermediate operations** chain together (return `browser`):

```javascript
.button('Submit')    // Intermediate
.below             // Intermediate
.element('Form')     // Intermediate
```

**Terminal operations** execute actions (return values or reset):

```javascript
.click()             // Terminal - executes action
.write('text')       // Terminal - executes action
.is.visible()        // Terminal - returns boolean
```

### Method Chaining Pattern

```javascript
await browser
  .button('Delete') // Select element
  .below // Add position filter
  .element('Actions') // Set anchor
  .click() // Execute action
```

## Common Tasks

### Working with Forms

```javascript
// Fill and submit a form
await browser.textbox('Username').write('john_doe')
await browser.textbox('Password').write('secretpass')
await browser.checkbox('Remember Me').check()
await browser.button('Login').click()
```

### Handling Dropdowns

```javascript
// Select an option from dropdown
await browser.dropdown('Country').option('United States').select()

// Get currently selected value
const selected = await browser.dropdown('Country').get.text()
```

### Managing Visibility

```javascript
// Check if element exists
if (await browser.element('LoadingSpinner').is.visible()) {
  // Wait for it to disappear
  await browser.element('LoadingSpinner').should.not.be.visible(10000)
}

// Wait for element to appear
await browser.button('Submit').should.be.visible(5000)
```

### Multiple Windows/Tabs

```javascript
// Open new tab
await browser.tab().new()

// Switch between tabs
await browser.tab(0).switch() // First tab
await browser.tab(1).switch() // Second tab

// Open new window
await browser.window().new()

// Switch windows
await browser.window('Title').switch()
```

### Alert Handling

```javascript
// Check and handle alert
if (await browser.alert().is.visible()) {
  const text = await browser.alert().get.text()
  console.log('Alert:', text)
  await browser.alert().accept()
}
```

## Documentation Structure

- **[Core Concepts](CONCEPTS.md)** - Operations, locator strategy, element types
- **[Selectors Guide](SELECTORS.md)** - Element selection patterns and spatial references
- **[Interactions Guide](INTERACTIONS.md)** - Click, input, and hover operations
- **[Forms Guide](FORMS.md)** - Checkboxes, switches, dropdowns
- **[Browser Guide](BROWSER.md)** - Navigation, windows, tabs, configuration
- **[Advanced Guide](ADVANCED.md)** - Alerts, advanced patterns
- **[API Reference](API-REFERENCE.md)** - Complete method signatures
- **[Configuration](CONFIGURATION.md)** - Browser setup options

## Next Steps

1. Read [Core Concepts](CONCEPTS.md) to understand the fundamentals
2. Explore [Selectors Guide](SELECTORS.md) for element targeting strategies
3. Check [API Reference](API-REFERENCE.md) for specific methods
4. See [Configuration](CONFIGURATION.md) for browser setup

## Browser Lifecycle

```javascript
// 1. Create instance
const browser = new WebBrowser()

// 2. Start session
await browser.start()

// 3. Perform operations
await browser.goto('https://example.com')
// ... your tests ...

// 4. Close session
await browser.close()
```

The library automatically handles cleanup when:

- `close()` is called explicitly
- Process exits (SIGINT, SIGTERM)
- Uncaught exceptions occur

## Configuration

Configure browser behavior via `.config/selenium.json`, environment variables, or command-line:

```json
{
  "browser": "chrome",
  "headless": true,
  "timeout": 30,
  "downloadsPath": "./downloads"
}
```

See [Configuration](CONFIGURATION.md) for all options.

## Need Help?

- Check [API Reference](API-REFERENCE.md) for method signatures
- Review example patterns in relevant guide (Selectors, Interactions, Forms, etc.)
- See [Core Concepts](CONCEPTS.md) for architectural understanding
