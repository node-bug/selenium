# Window Management

Multi-window browser operations. See [API Reference](API-REFERENCE.md#window-management) for complete method signatures and [Core Concepts](CONCEPTS.md#window-vs-tab-management) for window vs tab differences.

## Overview

Windows are separate browser instances with independent contexts. Use window operations to open, switch between, and manage multiple windows.

## Quick Examples

```javascript
// Open new window
await browser.window().new()

// Switch to window by title
await browser.window('Google').switch()

// Switch to window by index
await browser.window(0).switch()

// Get window URL and title
const url = await browser.window().get.url()
const title = await browser.window().get.title()

// Window management
await browser.window().maximize()
await browser.window().minimize()
await browser.window().fullscreen()

// Close window
await browser.window().close()

// Check if displayed
const displayed = await browser.window('Title').isDisplayed()
```

## Patterns

### Multi-Window Workflow

```javascript
// Original window
await browser.goto('https://example.com')

// Open new window
await browser.window().new()

// Navigate in new window
await browser.goto('https://other.com')

// Switch between windows
await browser.window('Example').switch()
await browser.window('Other').switch()

// Get info from window
const url = await browser.window('Example').get.url()
```

### Window by Index

```javascript
// Windows are indexed by creation order (0, 1, 2, ...)
await browser.window(0).switch()    // First window
await browser.window(1).switch()    // Second window
```

## Full API Reference

See [Window Management API](API-REFERENCE.md#window-management)

