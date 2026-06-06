---
name: 'WebBrowser Framework'
description: 'Human-like browser automation framework for web testing and scraping'
version: '5.2.7'
keywords: ['selenium', 'automation', 'web-testing', 'browser', 'webdriver']
---

# WebBrowser Framework Instructions

## Overview

WebBrowser is a fluent JavaScript library for browser automation using Selenium WebDriver. It provides semantic element selection, spatial filtering, and a human-readable API designed for both humans and AI agents.

**Key Strength**: Find elements the way humans think about them, not how the DOM is structured.

```javascript
// Instead of: driver.findElement(By.css('input[type="email"]'))
// Use this: await browser.textbox('Email').write('user@example.com')

// With spatial context:
await browser
  .textbox('Email')
  .below.element('Personal Info')
  .write('user@example.com')
```

## Core Capabilities

### 1. **Browser Session Management**

- Start/close browser instances
- Navigate to URLs
- Multi-tab and multi-window support
- Back/forward navigation
- Page refresh

**Skill**: [Browser Control](../app/browser/.instructions.md)

### 2. **Semantic Element Finding**

- 20+ element types: button, textbox, checkbox, dropdown, dialog, table, heading, link, etc.
- Find elements by visible text, placeholder, labels, test IDs, ARIA labels
- Automatic iframe detection and traversal
- Element prioritization strategy

**Skill**: [Element Finding](../app/elements/.instructions.md)

### 3. **Rich Interactions**

- Click, double-click, right-click
- Type text, clear fields
- Hover, drag-and-drop
- Keyboard navigation (Tab, Enter, Escape, etc.)
- File uploads
- Alert handling (accept, dismiss, write text)

**Skill**: [Element Interactions](../app/command-delegates/.instructions.md)

### 4. **Form Operations**

- Text input and textarea
- Checkboxes (check, uncheck)
- Radio buttons (select)
- Dropdowns (select by text, value, or index)
- Sliders (set value)
- Multi-select handling

**Skill**: [Form Handling](../app/command-delegates/form-handling.instructions.md)

### 5. **Spatial Context**

Locate elements by their position relative to other elements:

- `above`, `below`, `toLeftOf`, `toRightOf`
- `near` (proximity)
- `within` (contained by parent)
- Combine multiple spatial conditions

```javascript
await browser
  .button('Save')
  .below.element('Form Title')
  .within.dialog('Confirm')
  .click()
```

### 6. **State Verification**

- Visibility checks
- Enabled/disabled state
- Element presence
- Text content validation
- Attribute checking

### 7. **Cross-Browser Support**

- Chrome (default)
- Firefox
- Safari
- Edge

**Skill**: [Cross-Browser Configuration](../app/capabilities/.instructions.md)

### 8. **Plugin System**

- Extend framework at runtime
- Custom hooks (beforeClick, afterTypeText, etc.)
- Add new methods to browser instance

**Skill**: [Plugin System](../app/plugin-manager.instructions.md)

## Quick Start for Agents

### 1. Initialize Browser

```javascript
import WebBrowser from '@nodebug/selenium'

const browser = new WebBrowser()
await browser.start()
```

### 2. Navigate

```javascript
await browser.goto('https://example.com')
```

### 3. Interact

```javascript
// Find and interact with elements
await browser.textbox('Email').write('user@email.com')
await browser.button('Submit').click()
await browser.heading('Success').should.be.visible()
```

### 4. Close

```javascript
await browser.close()
```

## Common Patterns

### Pattern 1: Login Flow

```javascript
await browser.textbox('Email').write('user@example.com')
await browser.textbox('Password').write('password123')
await browser.checkbox('Remember me').check()
await browser.button('Sign In').click()
await browser.heading('Dashboard').should.be.visible()
```

### Pattern 2: Form with Spatial Context

```javascript
// "Fill the email field below the 'Contact Information' section"
await browser
  .textbox('Email')
  .below.heading('Contact Information')
  .write('contact@example.com')
```

### Pattern 3: Multi-Step Dialog

```javascript
await browser.button('Delete').click()
await browser.button('Confirm Delete').within.dialog('Confirm Action').click()
await browser.element('Success message').should.be.visible()
```

### Pattern 4: Table Navigation

```javascript
const rows = await browser.table('Users').findAll()
for (const row of rows) {
  await row.link('Edit').click()
  // Perform edits
  await browser.close() // Close edit form
}
```

## Configuration

Create `.config/selenium.json` in your project:

```json
{
  "browser": "chrome",
  "headless": false,
  "timeout": 30,
  "baseUrl": "https://example.com"
}
```

**See**: [Configuration Guide](../docs/CONFIGURATION.md)

## For Agents

### Choosing the Right Element Type

Use semantic methods instead of generic `element()`:

- Text input → `textbox()`
- Clickable → `button()` or `link()`
- Selection → `dropdown()` or `checkbox()`
- Display content → `heading()`, `paragraph()`, `label()`
- Complex → `table()`, `dialog()`, `form()`

### Spatial Filters

When natural language mentions position, use spatial filters:

- "Below the title" → `.below.heading('Title')`
- "In the modal" → `.within.dialog('Modal Title')`
- "To the right of the field" → `.toRightOf.textbox('Field Name')`

### State Assertions

Always verify state after actions:

```javascript
await browser.button('Submit').click()
await browser.heading('Thank You').should.be.visible()
```

### Handling Timeouts

Framework waits for elements with configured timeout (default 30s):

```javascript
// Custom timeout (5 seconds)
await browser.button('Quick Button').find(5000)
```

## Specialized Agents

The framework includes specialized agents for common tasks:

- **Form Filler Agent** - Automated form filling and validation
- **Element Inspector Agent** - Finding and analyzing page elements
- **Test Automation Agent** - Writing test scenarios
- **Web Automation Agent** - General-purpose automation coordinator

**See**: [Agent Directory](AGENTS.md)

## Architecture

- **Browser Control** - Session management, navigation, tabs/windows
- **Element Finding** - Semantic selection with spatial filters
- **Command Delegates** - Specialized handlers for different interaction types
- **Plugin System** - Runtime extensibility
- **Multi-browser Support** - Chrome, Firefox, Safari, Edge

**See**: [Architecture Documentation](../docs/ENGINEERING.md)

## Error Handling

```javascript
try {
  await browser.button('Submit').click()
} catch (error) {
  if (error.message.includes('Element not found')) {
    console.log('Button not visible')
  }
}
```

## Performance Optimization

- Use spatial filters to narrow search scope
- Prefer specific element types over generic `element()`
- Reuse element references when possible
- See [Performance Guide](../performanceoptimise.md)

## Best Practices for Agents

1. **Use semantic methods** - `button()` instead of `element()`
2. **Add spatial context** - Helps disambiguate elements
3. **Verify state** - Use `.should.be.visible()` for assertions
4. **Handle errors** - Wrap interactions in try-catch
5. **Close browser** - Always cleanup with `await browser.close()`
6. **Check timeouts** - Adjust for slow networks/servers

## API Reference

Complete method documentation: [API Reference](../docs/API-REFERENCE.md)

## Skills Directory

- [Browser Control](../app/browser/.instructions.md) - Session and navigation
- [Element Finding](../app/elements/.instructions.md) - Semantic element selection
- [Element Interactions](../app/command-delegates/.instructions.md) - Clicking, typing, etc.
- [Form Handling](../app/command-delegates/form-handling.instructions.md) - Form operations
- [Cross-Browser Setup](../app/capabilities/.instructions.md) - Browser configuration
- [Plugin System](../app/plugin-manager.instructions.md) - Runtime extensibility

## Troubleshooting

- **Element not found** - Check element type, text, or use spatial filters
- **Timeout errors** - Increase timeout, check network, verify element exists
- **Cross-origin issues** - Use `browser.switchToFrame()` for iframes
- **Stale element** - Elements can change; re-query instead of storing references

## Examples

Complete working examples: [Examples Directory](../examples/)

## Contributing

For extending the framework: [Engineering Guide](../docs/ENGINEERING.md)
