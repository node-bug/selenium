# 🌐 WebBrowser

A fluent JavaScript library for browser automation with **human-like element location strategy**. Write tests and automation scripts that read like user instructions, powered by Selenium WebDriver.

## ✨ Why WebBrowser?

**Traditional approach:**

```javascript
await driver
  .findElement(By.css('input[type="email"]'))
  .sendKeys('user@example.com')
```

**WebBrowser approach:**

```javascript
await browser.textbox('Email').write('user@example.com')
```

**Even better with spatial context:**

```javascript
// "Type in the Email field below the Personal Info section"
await browser
  .textbox('Email')
  .below.element('Personal Info')
  .write('user@example.com')
```

**Quick Links**: [Installation](#installation) | [Quick Start](#quick-start) | [Docs](docs/README.md) | [Examples](#examples) | [API Reference](docs/API-REFERENCE.md)

## 🎯 Key Features

- **🎯 Human-like element selection** - Find elements by what they say, where they are, or their type—just like humans
- **🔗 Fluent API** - Chain methods for readable, maintainable code
- **🗺️ Spatial context** - Locate elements by position: `above`, `below`, `toLeftOf`, `toRightOf`, `within`, `near`
- **🎭 Semantic selectors** - 20+ element types: button, textbox, checkbox, dropdown, dialog, table, etc.
- **🏗️ Multi-window/tab support** - Manage multiple browser contexts and tabs seamlessly
- **📍 Smart element prioritization** - Searches text, placeholders, labels, test IDs, ARIA labels automatically
- **⌨️ Rich interactions** - Click, drag, type, hover, keyboard navigation, file uploads, alerts
- **📦 Cross-browser** - Chrome, Firefox, Safari with same code
- **⚙️ Flexible configuration** - JSON config, environment variables, or CLI options
- **🔍 AI-agent friendly** - Clear, readable code that AI can understand and generate

## Installation

```bash
npm install @nodebug/selenium
```

## Quick Start

### 1. Configure Browser

Create `.config/selenium.json`:

```json
{
  "browser": "chrome",
  "headless": false,
  "timeout": 10
}
```

### 2. Write Your First Script

```javascript
import WebBrowser from '@nodebug/selenium'

async function main() {
  const browser = new WebBrowser()

  try {
    await browser.start()
    await browser.goto('https://example.com')

    // Fill login form
    await browser.textbox('Email').write('user@example.com')
    await browser.textbox('Password').write('password123')
    await browser.button('Login').click()

    // Verify success
    await browser.element('Dashboard').should.be.visible()

    console.log('✅ Login successful!')
  } finally {
    await browser.close()
  }
}

main()
```

## 📚 Examples

### Example 1: Login Form

```javascript
// Fill email field
await browser.textbox('Email').write('john@example.com')

// Fill password field below email
await browser.textbox('Password').below.textbox('Email').write('secret')

// Check "Remember me" checkbox
await browser.checkbox('Remember me').check()

// Click login button
await browser.button('Login').click()

// Wait for dashboard to appear
await browser.heading('Welcome').should.be.visible()
```

### Example 2: Form with Dropdown

```javascript
// Fill text field
await browser.textbox('Full Name').write('John Doe')

// Select from dropdown
await browser.dropdown('Country').option('United States').select()

// Check multiple checkboxes
await browser.checkbox('Subscribe').check()
await browser.checkbox('Accept Terms').check()

// Submit form
await browser.button('Register').click()
```

### Example 3: Table Interaction

```javascript
// Find button in specific row
await browser.button('Delete').within.row('John Doe').click()

// Click edit button for row with ID "user-123"
await browser.button('Edit').within.row('user-123').click()

// Get text from column in matching row
const email = await browser.column('Email').within.row('Jane Smith').get.text()
```

### Example 4: Modal Dialog

```javascript
// Fill form inside modal
await browser.textbox('Username').within.dialog('Settings').write('newuser')

// Click save button in modal
await browser.button('Save').within.dialog('Settings').click()

// Verify modal closes
await browser.dialog('Settings').should.not.be.visible()
```

### Example 5: Multiple Tabs

```javascript
// Open new tab
await browser.tab().new()

// Current tab is now the new one
await browser.goto('https://example2.com')

// Switch back to first tab
await browser.tab(0).switch()

// Get URL from first tab
const url = await browser.tab(0).get.url()
```

## 🎯 Core Concepts

### Three Ways to Find Elements

**1. By Type & Text** (most common)

```javascript
await browser.button('Submit').click()
await browser.textbox('Email').write('...')
```

**2. By Position Relative to Others**

```javascript
await browser.button('Delete').below.element('Actions').click()
await browser.textbox('City').toRightOf.textbox('State').write('...')
```

**3. By Attributes** (when text doesn't match)

```javascript
await browser.element('auth-submit').click() // data-testid
await browser.element('user-name').write('...') // id or name
```

### Intermediate vs Terminal Operations

**Build selector with intermediate operations** (no action yet):

```javascript
await browser
  .button('Delete') // Select button
  .below // Add position filter
  .element('Actions') // Add anchor element
  .click() // Execute action (terminal)
```

**Terminal operations** end the chain and execute:

```javascript
.click()          // Execute
.write('text')    // Execute
.should.be.visible()  // Assert and execute
.get.text()       // Get value and execute
```

### Element State Methods

**Check state** (return boolean for conditionals):

```javascript
const isChecked = await browser.checkbox('Subscribe').is.checked()
const isVisible = await browser.element('Item').is.visible()

if (!isVisible) {
  // Do something
}
```

**Assert state** (throw error if assertion fails):

```javascript
await browser.element('Loading').should.not.be.visible()
await browser.button('Submit').should.be.enabled()
```

## 🔗 Spatial References

Find elements by their position—exactly how humans describe them:

| Position    | Example                           |
| ----------- | --------------------------------- |
| `below`     | `button.below.element('Actions')` |
| `above`     | `field.above.heading('Section')`  |
| `toLeftOf`  | `icon.toLeftOf.text('Label')`     |
| `toRightOf` | `field.toRightOf.label('Name')`   |
| `within`    | `button.within.dialog('Confirm')` |
| `near`      | `button.near.text('Help')`        |

## 📖 Documentation Guide

| Document                                      | Purpose                  | Start Here If...                   |
| --------------------------------------------- | ------------------------ | ---------------------------------- |
| [GETTING-STARTED.md](docs/GETTING-STARTED.md) | Introduction & setup     | New to WebBrowser                  |
| [CONCEPTS.md](docs/CONCEPTS.md)               | Architecture & patterns  | Want to understand how it works    |
| [SELECTORS.md](docs/SELECTORS.md)             | Finding elements         | Need element selection help        |
| [INTERACTIONS.md](docs/INTERACTIONS.md)       | Clicks, typing, keyboard | Interacting with elements          |
| [FORMS.md](docs/FORMS.md)                     | Form elements            | Working with checkboxes, dropdowns |
| [BROWSER.md](docs/BROWSER.md)                 | Navigation & windows     | Managing browser sessions          |
| [ADVANCED.md](docs/ADVANCED.md)               | Multi-tab, alerts        | Advanced scenarios                 |
| [CONFIGURATION.md](docs/CONFIGURATION.md)     | Browser setup            | Configuring WebBrowser             |
| [API-REFERENCE.md](docs/API-REFERENCE.md)     | All methods              | Looking up methods                 |

## 🤖 For AI Agents

This library is AI-agent friendly. Key points:

- **Readable syntax** - Code reads like user instructions
- **Clear semantics** - Element types (button, textbox, etc.) are explicit
- **Spatial context** - Relationships between elements are obvious
- **Two operation modes** - Intermediate (build) vs Terminal (execute) are distinct
- **Consistent patterns** - Similar operations across all element types

Example: AI can easily generate this from user instruction "Type email and click submit":

```javascript
await browser.textbox('Email').write('user@example.com')
await browser.button('Submit').click()
```

// Find submit button to the right of cancel
await browser.button('Submit').toRightOf.button('Cancel').click()

// Find element inside a dialog
await browser.textbox('Name').within.dialog('User Settings').write('John')

````

## Documentation

**Start Here:**

- **[Getting Started](docs/GETTING-STARTED.md)** - Installation, first test, quick examples
- **[Documentation Index](docs/README.md)** - Navigate all guides

**Learning Path:**

- **[Core Concepts](docs/CONCEPTS.md)** - Understand operations, element locators, architecture
- **[Selectors Guide](docs/SELECTORS.md)** - Find elements (text, position, type)
- **[Interactions Guide](docs/INTERACTIONS.md)** - Clicks, input, keyboard, drag-drop
- **[Forms Guide](docs/FORMS.md)** - Checkboxes, switches, dropdowns
- **[Browser Guide](docs/BROWSER.md)** - Navigation, windows, tabs, configuration
- **[Advanced Guide](docs/ADVANCED.md)** - Multi-window, multi-tab, alerts

**Reference:**

- **[API Reference](docs/API-REFERENCE.md)** - Complete method signatures
- **[Configuration](docs/CONFIGURATION.md)** - Browser setup options

## Examples

## Browser Support

| Browser | Status             |
| ------- | ------------------ |
| Chrome  | ✅ Fully supported |
| Firefox | ✅ Fully supported |
| Safari  | ✅ Fully supported |

## Best Practices

1. **Use semantic types** - `button()`, `textbox()` vs generic `element()`
2. **Leverage text matching** - Target visible text when possible
3. **Apply spatial context** - Use `within`, `below`, etc. for precise targeting
4. **Check state before acting** - Verify visibility/disabled state before interaction
5. **Chain operations** - Build fluent chains for readability
6. **Use `is.*` for conditionals** - Returns boolean for branching logic
7. **Use `should.*` for assertions** - Throws error on failure (good for tests)

## Common Patterns

### Waiting for Elements (Implicit Waits)

```javascript
// Will wait up to 30 seconds (configured timeout)
await browser.element('Loading').should.not.be.visible()
````

### Form Submission Pattern

```javascript
// Fill form fields
await browser.textbox('Email').write('user@example.com')
await browser.textbox('Password').write('password')
await browser.checkbox('Accept Terms').check()

// Submit and wait for success
await browser.button('Submit').click()
await browser.element('Success Message').should.be.visible()
```

### Conditional Logic

```javascript
// Check state and act accordingly
if (await browser.element('Premium').is.visible()) {
  await browser.button('Upgrade').click()
} else {
  await browser.button('Try Now').click()
}
```

### Table Row Operations

```javascript
// Find and click button in specific row
await browser.button('Edit').within.row('John Doe').click()

// Verify row is deleted
await browser.row('John Doe').should.not.be.visible()
```

## API Quick Reference

**Element Types**: `button`, `textbox`, `checkbox`, `radio`, `dropdown`, `link`, `heading`, `image`, `file`, `dialog`, `row`, `column`, and more

**Actions**: `click()`, `write()`, `check()`, `uncheck()`, `upload()`, `hover()`, `drag()`, `focus()`, `clear()`

**State**: `is.visible()`, `is.enabled()`, `should.be.visible()`, `should.be.disabled()`

**Navigation**: `goto()`, `refresh()`, `goBack()`, `goForward()`

**Windows/Tabs**: `window()`, `tab()`, `alert()`

**Data**: `get.text()`, `get.value()`, `get.attribute()`

**Position**: `above`, `below`, `toLeftOf`, `toRightOf`, `within`, `near`, `or`, `exact`

See [API-REFERENCE.md](docs/API-REFERENCE.md) for complete reference.

## Troubleshooting

**Element not found?** - Check [SELECTORS.md](docs/SELECTORS.md) for matching strategy

**Element found but not clickable?** - Try spatial context: `.within.dialog()`, `.below.element()`

**Timeout waiting for element?** - Increase timeout in config or add `should.be.visible()` explicitly

**Need more help?** - See [docs/README.md](docs/README.md) for complete documentation index

## License

MPL-2.0

## Contributing

Issues and pull requests welcome on [GitHub](https://github.com/node-bug/selenium).
