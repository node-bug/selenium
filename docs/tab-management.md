# Tab Management

Multi-tab browser operations. See [API Reference](API-REFERENCE.md#tab-management) for complete method signatures and [Core Concepts](CONCEPTS.md#window-vs-tab-management) for window vs tab differences.

## Overview

Tabs are multiple documents within the same window, sharing context. Use tab operations to open, switch between, and manage multiple tabs.

## Quick Examples

```javascript
// Open new tab
await browser.tab().new()

// Switch to tab by index
await browser.tab(0).switch()

// Switch to tab by title
await browser.tab('Google').switch()

// Get tab URL and title
const url = await browser.tab().get.url()
const title = await browser.tab().get.title()

// Check if displayed
const displayed = await browser.tab(0).isDisplayed()

// Close tab
await browser.tab(0).close()
```

## Patterns

### Multi-Tab Workflow

```javascript
// Current tab
await browser.goto('https://example.com')

// Open new tab
await browser.tab().new()

// Navigate in new tab
await browser.goto('https://other.com')

// Switch between tabs
await browser.tab(0).switch()    // Back to first tab
await browser.tab(1).switch()    // To second tab

// Get tab info
const url = await browser.tab(1).get.url()
```

### Tab by Index

```javascript
// Tabs are indexed by creation order (0, 1, 2, ...)
await browser.tab(0).switch()    // First tab
await browser.tab(1).switch()    // Second tab
await browser.tab(0).close()     // Close first tab
```

## Full API Reference

See [Tab Management API](API-REFERENCE.md#tab-management)

