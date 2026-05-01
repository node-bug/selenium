# Documentation Index

This directory contains comprehensive documentation for the WebBrowser automation library. Use this guide to find what you need.

## 📚 Quick Start

**New to WebBrowser?**
→ Start with [GETTING-STARTED.md](GETTING-STARTED.md) for a quick introduction and first examples.

## 📖 Documentation Structure

### Foundational

| Document                                 | Purpose                               | Best For                   |
| ---------------------------------------- | ------------------------------------- | -------------------------- |
| [GETTING-STARTED.md](GETTING-STARTED.md) | Quick introduction and setup          | First-time users           |
| [CORE-CONCEPTS.md](CONCEPTS.md)          | Fundamental patterns and architecture | Understanding how it works |

### Task-Oriented Guides

| Guide                              | Topics                                          | Use When                       |
| ---------------------------------- | ----------------------------------------------- | ------------------------------ |
| [SELECTORS.md](SELECTORS.md)       | Element selection, locators, spatial references | Finding and targeting elements |
| [INTERACTIONS.md](INTERACTIONS.md) | Clicks, text input, keyboard, drag-drop         | Interacting with elements      |
| [FORMS.md](FORMS.md)               | Checkboxes, switches, radio buttons, dropdowns  | Working with form elements     |
| [BROWSER.md](BROWSER.md)           | Navigation, windows, tabs, configuration        | Managing browser and sessions  |
| [ADVANCED.md](ADVANCED.md)         | Multi-window, multi-tab, alerts                 | Advanced patterns              |

### Reference

| Document                             | Purpose                                 | Use For                     |
| ------------------------------------ | --------------------------------------- | --------------------------- |
| [API-REFERENCE.md](API-REFERENCE.md) | Complete method signatures              | Looking up specific methods |
| [CONFIGURATION.md](CONFIGURATION.md) | Browser setup and configuration options | Configuring WebBrowser      |

## 🎯 By Task

### "How do I..."

#### Element Selection & Finding

- **Find an element by text** → [SELECTORS.md - Text-Based Selection](SELECTORS.md#text-based-selection)
- **Find an element by position** → [SELECTORS.md - Spatial References](SELECTORS.md#spatial-references)
- **Use element types** → [SELECTORS.md - Element Types](SELECTORS.md#element-types)
- **Find multiple elements** → [SELECTORS.md - Finding Multiple Elements](SELECTORS.md#finding-multiple-elements)

#### Interacting with Elements

- **Click an element** → [INTERACTIONS.md - Click Operations](INTERACTIONS.md#click-operations)
- **Enter text** → [INTERACTIONS.md - Text Input](INTERACTIONS.md#text-input-operations)
- **Use keyboard** → [INTERACTIONS.md - Keyboard Navigation](INTERACTIONS.md#keyboard-navigation)
- **Upload files** → [INTERACTIONS.md - File Operations](INTERACTIONS.md#file-operations)
- **Drag and drop** → [INTERACTIONS.md - Drag and Drop](INTERACTIONS.md#drag-and-drop)

#### Working with Forms

- **Check/Uncheck boxes** → [FORMS.md - Checkboxes](FORMS.md#checkboxes)
- **Toggle switches** → [FORMS.md - Switches](FORMS.md#switches)
- **Select radio buttons** → [FORMS.md - Radio Buttons](FORMS.md#radio-buttons)
- **Select dropdowns** → [FORMS.md - Dropdowns](FORMS.md#dropdowns--selects)
- **Fill complete form** → [FORMS.md - Form Validation Patterns](FORMS.md#form-validation-patterns)

#### Browser Management

- **Start/close browser** → [BROWSER.md - Session Lifecycle](BROWSER.md#session-lifecycle)
- **Navigate to URL** → [BROWSER.md - Navigation](BROWSER.md#navigation)
- **Set window size** → [BROWSER.md - Window Management](BROWSER.md#window-management)
- **Configure browser** → [CONFIGURATION.md](CONFIGURATION.md) or [BROWSER.md - Configuration](BROWSER.md#configuration)

#### Advanced Operations

- **Work with multiple tabs** → [ADVANCED.md - Tab Management](ADVANCED.md#tab-management)
- **Work with multiple windows** → [ADVANCED.md - Window Management](ADVANCED.md#window-management)
- **Handle alerts** → [ADVANCED.md - Alert Handling](ADVANCED.md#alert-handling)

#### Visibility & State

- **Wait for element to appear** → [API-REFERENCE.md - should.be.visible()](API-REFERENCE.md#shouldbevisible-timeout)
- **Wait for element to disappear** → [API-REFERENCE.md - should.not.be.visible()](API-REFERENCE.md#shouldnotbevisible-timeout)
- **Check if element is visible** → [API-REFERENCE.md - is.visible()](API-REFERENCE.md#isvisible)
- **Verify checkbox state** → [FORMS.md - is.checked/should.be.checked](FORMS.md#ischecked)

## 🔍 By Concept

### Operations

- **Intermediate vs Terminal** → [CONCEPTS.md - Operations](CONCEPTS.md#operations-intermediate-vs-terminal)
- **Method Chaining** → [CONCEPTS.md - Method Chaining Pattern](CONCEPTS.md#method-chaining-pattern)

### Element Location

- **How elements are found** → [SELECTORS.md - How Elements Are Found](SELECTORS.md#how-elements-are-found)
- **Attribute priority** → [SELECTORS.md - Text-Based Selection](SELECTORS.md#text-based-selection)
- **Spatial context** → [CONCEPTS.md - Spatial Context](CONCEPTS.md#spatial-context-how-elements-are-located)

### Browser Lifecycle

- **Complete lifecycle** → [BROWSER.md - Session Lifecycle](BROWSER.md#session-lifecycle)
- **Error handling** → [BROWSER.md - Complete Lifecycle](BROWSER.md#complete-lifecycle)

## 📋 Document Overview

### GETTING-STARTED.md

- Installation
- Your first test
- Key concepts overview
- Common tasks
- Next steps

### CONCEPTS.md

- Operations (intermediate vs terminal)
- Element locator strategy
- Spatial references
- Multiple references
- Window vs tab management
- Browser lifecycle
- Method chaining pattern

### SELECTORS.md

- How elements are found
- Element types reference
- Text-based selection
- Exact vs partial matching
- Spatial references (all keywords)
- Multiple alternatives with `or`
- Form label association
- Element indexing
- Finding multiple elements

### INTERACTIONS.md

- Click operations (standard, double, right, long press, etc.)
- Click modifiers
- Text input operations
- Keyboard navigation
- Hover interactions
- File operations
- Drag and drop
- Modifier key chaining
- Common patterns

### FORMS.md

- Checkboxes (check, uncheck, is.checked, is.not.checked, should.be.checked, should.not.be.checked)
- Switches (on, off, isOn, isOff)
- Radio buttons (set, is.set, is.not.set, should.be.set, should.not.be.set)
- Dropdowns (option, select, get.text, get.value, isSelected)
- Form validation patterns
- Multi-step forms
- Accessibility

### BROWSER.md

- Session lifecycle (create, start, close)
- Navigation (goto, refresh, back, forward)
- Browser state and reset
- Browser information
- Window management
- Tab management
- Browser selection and configuration
- Common patterns
- Responsive testing

### ADVANCED.md

- Tab management (create, switch, close)
- Window management (create, switch, control, close)
- Alert handling (detect, accept, dismiss, write, by text)
- Multi-window patterns
- Multi-tab patterns
- Alert patterns
- Browser compatibility

### API-REFERENCE.md

- Complete method signatures
- Return types and parameters
- All browser control methods
- All element selection methods
- All interaction methods
- All state validation methods
- All data retrieval methods

### CONFIGURATION.md

- Configuration file format
- Configuration options (browser, headless, timeout, etc.)
- Browser-specific options
- Environment variables
- Command-line arguments
- Selenium Grid configuration

## 🔗 Cross-Reference Guide

### Related Documents

**Element Selection**

- Primary: [SELECTORS.md](SELECTORS.md)
- Related: [CONCEPTS.md - Element Types](CONCEPTS.md#element-types)
- Reference: [API-REFERENCE.md - Element Selection](API-REFERENCE.md#element-selection)

**User Interactions**

- Primary: [INTERACTIONS.md](INTERACTIONS.md)
- Related: [FORMS.md](FORMS.md)
- Reference: [API-REFERENCE.md - Element Interaction](API-REFERENCE.md#element-interaction)

**Browser Control**

- Primary: [BROWSER.md](BROWSER.md)
- Advanced: [ADVANCED.md - Windows & Tabs](ADVANCED.md)
- Config: [CONFIGURATION.md](CONFIGURATION.md)
- Reference: [API-REFERENCE.md - Browser Control](API-REFERENCE.md#browser-control)

## 💡 Learning Paths

### For Beginners

1. [GETTING-STARTED.md](GETTING-STARTED.md) - Get up and running
2. [CONCEPTS.md](CONCEPTS.md) - Understand the architecture
3. [SELECTORS.md](SELECTORS.md) - Learn element selection
4. [INTERACTIONS.md](INTERACTIONS.md) - Learn interactions
5. [FORMS.md](FORMS.md) - Work with forms

### For Intermediate Users

1. [SELECTORS.md - Spatial References](SELECTORS.md#spatial-references) - Advanced selection
2. [BROWSER.md](BROWSER.md) - Browser management
3. [ADVANCED.md](ADVANCED.md) - Multi-window/tab operations
4. [API-REFERENCE.md](API-REFERENCE.md) - Explore all methods

### For Advanced Users

1. [ADVANCED.md](ADVANCED.md) - Complex patterns
2. [API-REFERENCE.md](API-REFERENCE.md) - Complete reference
3. [CONFIGURATION.md](CONFIGURATION.md) - Advanced setup

## 📝 Examples

All documents contain practical examples. Look for:

- **Quick Reference** sections - Copy-paste examples
- **Code blocks** - Runnable examples
- **Patterns** sections - Real-world use cases
- **Quick Examples** - One-liners for common tasks

## 🔑 Key Files for Specific Needs

| Need                | File                                     |
| ------------------- | ---------------------------------------- |
| First test          | [GETTING-STARTED.md](GETTING-STARTED.md) |
| Find element        | [SELECTORS.md](SELECTORS.md)             |
| Click element       | [INTERACTIONS.md](INTERACTIONS.md)       |
| Fill form           | [FORMS.md](FORMS.md)                     |
| Navigate browser    | [BROWSER.md](BROWSER.md)                 |
| Advanced operations | [ADVANCED.md](ADVANCED.md)               |
| Method signature    | [API-REFERENCE.md](API-REFERENCE.md)     |
| Setup browser       | [CONFIGURATION.md](CONFIGURATION.md)     |

## ❓ Frequently Used Methods

For quick lookup of frequently used operations:

```javascript
// Element selection
browser.button('text').click()
browser.textbox('email').write('...')
browser.checkbox('agree').check()
browser.dropdown('country').option('US').select()

// Navigation
browser.goto('url')
browser.refresh()
browser.goBack()

// State checks
element.is.visible()
element.is.disabled()
element.is.enabled()
element.should.be.visible()
element.should.not.be.visible()
element.should.be.disabled()
element.should.be.enabled()

// Multi-window/tab
browser.window().new()
browser.tab().new()
browser.alert().accept()
```

See [API-REFERENCE.md](API-REFERENCE.md) for complete method reference.

---

**Last Updated**: 2026
**Version**: 1.0
