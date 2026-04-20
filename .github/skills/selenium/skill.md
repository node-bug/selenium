---
name: selenium
description: Use this skill when generating browser automation scripts using the @nodebug/selenium library.
---

# @nodebug/selenium

This skill provides documentation for the @nodebug/selenium library, a JavaScript library for browser automation built on top of Selenium WebDriver with a fluent API.

## Overview

The @nodebug/selenium library provides a human-like approach to browser automation with:

- Fluent API for browser automation
- Support for various element types (buttons, textboxes, checkboxes, etc.)
- Element location and manipulation
- Navigation and browser control
- Drag and drop operations
- File upload capabilities
- Visibility and state checks
- Method chaining support
- Human-like element prioritization for text and attributes

## Key Features

- **Element Selection Priority**: The library prioritizes visible text and attributes in a human-like way
- **Smart Locators**: Uses high-level "human-like" API for element selection
- **Command Delegates**: Provides specialized delegates for different actions (click, input, visibility, checkbox)
- **Browser Management**: Comprehensive browser session management with configuration options
- **Spatial References**: Support for relative positioning and contextual references

## Core Lifecycle

### Setup & Lifecycle

- Import: `import Browser from '@nodebug/selenium'`
- Initialization: Use `const browser = new Browser()` followed by `await browser.start()` or `await browser.new()`.
- Cleanup: Always use `await browser.close()` to terminate sessions.
- Reset: Use `await browser.reset()` to clear cookies, storage, and close extra windows.

### Navigation Commands

- `await browser.goto(url)`: Navigate to a URL.
- `await browser.refresh()`: Reload page.
- `await browser.back()` / `await browser.forward()`: History navigation.
- `await browser.window().new()`: Open a new browser window.
- `await browser.window(index).switch()`: Switch to a specific window.
- `await browser.window().close()`: Close the current window.
- `await browser.window().get.url()`: Get current window URL.
- `await browser.window('title').get.url()`: Get specific window URL.
- `await browser.tab().get.url()`: Get current tab URL.
- `await browser.tab('title').get.url()`: Get specific tab URL.
- `await browser.window().get.title()`: Get current window title.
- `await browser.window('title').get.title()`: Get specific window title.

## Global Configuration

- Browser type is set via environment variables (`NODE_BROWSER=chrome`), CLI (`--browser=firefox`), or `.config/selenium.json`.
- Default timeouts and headless modes are managed in the JSON config.
- The library supports multiple browser types: Chrome, Firefox, Safari, and Edge.

## Action API

### Click Delegate

- **Multi-Click**: `.doubleClick()`, `.tripleClick()`, `.clickMultiple(n)`.
- **Mouse Buttons**: `.rightClick()`, `.middleClick()`.
- **Press/Hover**: `.longPress(ms)` (default 1000ms), `.hover()`.
- **Modifiers**: `.clickWithModifier({ ctrl: true, shift: true, alt: true, meta: true })`.

### Input Delegate

- **`.write(text)`**: Standard entry.
- **`.overwrite(text)`**: Clears existing text before typing.
- **`.clear()`**: Removes all text from a field.
- **`.focus()`**: Sets focus on an element.

### Browser & Tab Management

- **Navigation**: `goto(url)`, `refresh()`, `goBack()`, `goForward()`.
- **Tabs**: `browser.tab().new()`, `browser.tab(index).switch()`, `browser.tab().close()`.
- **Windows**: `browser.window().maximize()`, `browser.window().fullscreen()`, `browser.window().new()`.
- **Alerts**: `browser.alert().accept()`, `browser.alert().dismiss()`.
- **Window/Tab Properties**: `browser.window().get.url()`, `browser.window('title').get.url()`, `browser.tab().get.url()`, `browser.tab('title').get.url()`.

### Visibility States

- **Waiters**: `isDisplayed(timeout)`, `isNotDisplayed(timeout)`.
- **State**: `isVisible()`, `isDisabled()`, `isChecked()`.
- **Visuals**: `scroll()`, `hide()` (sets opacity 0), `unhide()`.
- **Element State**: `isUnchecked()`, `isNotChecked()`.

### Element Manipulation

- **Check/Uncheck**: `check()`, `uncheck()`
- **Upload**: `upload(filePath)`
- **Drag & Drop**: `drag()`, `onto(target)`, `drop()`
- **Get Properties**: `get.text()`, `get.value()`, `get.attribute(name)`, `get.url()`, `get.title()`

## Usage Examples

### Basic Navigation Script

```javascript
import Browser from '@nodebug/selenium'

async function demoScript() {
  const browser = new Browser()
  await browser.start()

  try {
    await browser.goto('https://seleniumbase.io/demo_page')
    // Perform actions here
  } finally {
    await browser.close()
  }
}
```

### Element Interaction Script

```javascript
import Browser from '@nodebug/selenium'

async function interactionScript() {
  const browser = new Browser()
  await browser.start()

  try {
    await browser.goto('https://seleniumbase.io/demo_page')

    // Find and interact with elements
    await browser.element('Submit').click()
    await browser.element('Name').write('John Doe')
    await browser.element('Email').write('john@example.com')

    // Wait for element to be displayed
    await browser.element('Confirmation Message').isDisplayed()
  } finally {
    await browser.close()
  }
}
```

### Window and Tab Management

```javascript
import Browser from '@nodebug/selenium'

async function windowManagementScript() {
  const browser = new Browser()
  await browser.start()

  try {
    await browser.goto('https://seleniumbase.io/demo_page')

    // Open new window
    await browser.window().new()

    // Switch to new window
    await browser.window(1).switch()

    // Perform actions in new window
    await browser.goto('https://example.com')

    // Close current window
    await browser.window().close()

    // Switch back to original window
    await browser.window(0).switch()
  } finally {
    await browser.close()
  }
}
```
