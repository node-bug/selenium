# 📚 WebBrowser Documentation

Complete reference for browser automation with WebBrowser. Start with your use case below.

## 🚀 Getting Started (5 minutes)

New to WebBrowser? Start here:

1. **[GETTING-STARTED.md](GETTING-STARTED.md)** - Your first automation script
2. **[CONCEPTS.md](CONCEPTS.md)** - How the library works
3. **[SELECTORS.md](SELECTORS.md)** - Finding elements

## 📖 Documentation by Use Case

### ✏️ "How do I... fill out a form?"

**Basic form filling:**

- Read: [GETTING-STARTED.md](GETTING-STARTED.md) → Example 1
- Read: [SELECTORS.md](SELECTORS.md#text-based-selection) - Find elements
- Read: [INTERACTIONS.md](INTERACTIONS.md#text-input-operations) - Enter text
- See: [FORMS.md](FORMS.md) - Checkboxes, dropdowns

**Example:**

```javascript
await browser.textbox('Email').write('user@example.com')
await browser.checkbox('Subscribe').check()
await browser.dropdown('Country').option('US').select()
await browser.button('Submit').click()
```

---

### 🔍 "How do I... find an element?"

**Element selection guide:**

- Read: [CONCEPTS.md](CONCEPTS.md#element-locator-strategy-human-like-prioritization)
- Read: [SELECTORS.md](SELECTORS.md) - Complete selection guide

**By text (most common):**

```javascript
await browser.button('Submit').click()
```

**By position (when text isn't unique):**

```javascript
await browser.textbox('Password').below.textbox('Email').write('...')
```

**By attribute (when text doesn't match):**

```javascript
await browser.element('auth-submit').click() // by data-testid
```

---

### 🖱️ "How do I... interact with elements?"

- Read: [INTERACTIONS.md](INTERACTIONS.md)

**Common interactions:**

```javascript
await browser.button('Click').click()
await browser.textbox('Name').write('John')
await browser.checkbox('Agree').check()
await browser.link('Home').hover()
await browser.element('File').drag().to(element('Target'))
await browser.file('Upload').upload('/path/file.txt')
```

---

### 📋 "How do I... work with forms (checkboxes, dropdowns, etc.)?"

- Read: [FORMS.md](FORMS.md)

**Checkboxes:**

```javascript
await browser.checkbox('Subscribe').check()
const isChecked = await browser.checkbox('Subscribe').is.checked()
```

**Dropdowns:**

```javascript
await browser.dropdown('Country').option('United States').select()
```

**Radio buttons:**

```javascript
await browser.radio('Option A').set()
```

---

### ✔️ "How do I... check if an element is visible or verify state?"

**Conditionals (return boolean):**

```javascript
if (await browser.element('Item').is.visible()) {
  // Do something
}
```

**Assertions (throw error on failure):**

```javascript
await browser.element('Success').should.be.visible()
await browser.button('Submit').should.be.enabled()
```

---

### 📍 "How do I... find an element by position?"

- Read: [SELECTORS.md#spatial-references](SELECTORS.md#spatial-references)

```javascript
await browser.button('Delete').below.element('Actions').click()
await browser.textbox('City').toRightOf.textbox('State').write('CA')
await browser.link('Home').within.dialog('Modal').click()
```

**Positions:** `above`, `below`, `toLeftOf`, `toRightOf`, `within`, `near`

---

### 🔄 "How do I... work with multiple windows or tabs?"

- Read: [ADVANCED.md](ADVANCED.md#tab-management)
- Read: [ADVANCED.md](ADVANCED.md#window-management)

**Tabs (same window):**

```javascript
await browser.tab().new()
await browser.tab(1).switch()
const url = await browser.tab(0).get.url()
```

**Windows (separate contexts):**

```javascript
await browser.window().new()
await browser.window('Title').switch()
```

---

### 🚨 "How do I... handle alerts and prompts?"

- Read: [ADVANCED.md#alert-handling](ADVANCED.md#alert-handling)

```javascript
if (await browser.alert().is.visible()) {
  await browser.alert().accept()
  // or
  await browser.alert().write('User input').accept()
}
```

---

### 🛠️ "How do I... configure the browser?"

- Read: [CONFIGURATION.md](CONFIGURATION.md)
- Read: [BROWSER.md#configuration](BROWSER.md#configuration)

Create `.config/selenium.json`:

```json
{
  "browser": "chrome",
  "headless": true,
  "timeout": 10,
  "width": 1280,
  "height": 800
}
```

---

### 🌐 "How do I... navigate to URLs?"

- Read: [BROWSER.md#navigation](BROWSER.md#navigation)

```javascript
await browser.goto('https://example.com')
await browser.refresh()
await browser.goBack()
await browser.goForward()
```

---

### 📊 "How do I... interact with tables and rows?"

```javascript
// Click button in specific row
await browser.button('Edit').within.row('John Doe').click()

// Get data from cell
const email = await browser.column('Email').within.row('Jane Smith').get.text()
```

---

## 📚 Complete Documentation

### Foundational (Read These First)

| Document                                 | Topics                                     | Best For               |
| ---------------------------------------- | ------------------------------------------ | ---------------------- |
| [GETTING-STARTED.md](GETTING-STARTED.md) | Setup, first script, basic examples        | New users              |
| [CONCEPTS.md](CONCEPTS.md)               | Architecture, operations, element location | Understanding design   |
| [SELECTORS.md](SELECTORS.md)             | Finding elements, text matching, position  | Element selection help |

### Task-Oriented Guides

| Document                           | Topics                                          | Use When              |
| ---------------------------------- | ----------------------------------------------- | --------------------- |
| [INTERACTIONS.md](INTERACTIONS.md) | Click, type, keyboard, drag, upload             | Working with elements |
| [FORMS.md](FORMS.md)               | Checkboxes, switches, radio, dropdowns, selects | Form interaction      |
| [BROWSER.md](BROWSER.md)           | Navigation, windows, tabs, lifecycle            | Browser management    |
| [ADVANCED.md](ADVANCED.md)         | Multi-tab, multi-window, alerts, patterns       | Complex scenarios     |

### Reference

| Document                             | Purpose                  | Use For                |
| ------------------------------------ | ------------------------ | ---------------------- |
| [API-REFERENCE.md](API-REFERENCE.md) | All methods & signatures | Looking up methods     |
| [CONFIGURATION.md](CONFIGURATION.md) | Browser configuration    | Configuring WebBrowser |

---

## 🎯 Common Questions

**Q: What's the difference between `is.visible()` and `should.be.visible()`?**  
A: `is.*` returns boolean (use in conditionals), `should.*` throws error (use in tests). [Learn more](CONCEPTS.md)

**Q: How do I find elements with duplicate text?**  
A: Use spatial context: `button.below.element()`, or target by position with `atIndex()`. [Examples](SELECTORS.md#spatial-references)

**Q: Can I use XPath or CSS selectors?**  
A: No. WebBrowser uses human-like text matching and spatial context. It's simpler. [How it works](CONCEPTS.md)

**Q: How do I wait for an element?**  
A: Use `should.be.visible()` - it waits up to configured timeout.

**Q: Can I run tests in headless mode?**  
A: Yes. Set `"headless": true` in config. [Configuration](CONFIGURATION.md)

---

## 🤖 For AI Agents

This documentation is designed to be AI-friendly:

- **Clear API** - Methods have consistent naming patterns
- **Readable examples** - Code reads like instructions
- **Task-oriented guides** - Find docs by what you need to do
- **Organized by use case** - Direct routing to relevant guides
- **Explicit element types** - 20+ semantic types (button, textbox, etc.)
- **Spatial relationships** - Position logic is obvious

**For agents: When generating code:**

1. Prefer semantic types: `button()`, `textbox()` over `element()`
2. Use visible text as primary selector
3. Add spatial context when needed: `.within.dialog()`, `.below.element()`
4. Use `should.*` for test assertions, `is.*` for conditionals
5. Follow fluent pattern: intermediate operations chain to terminal operation

---

## 📖 Learning Paths

### Path 1: Complete Beginner (30 minutes)

1. [GETTING-STARTED.md](GETTING-STARTED.md)
2. [CONCEPTS.md](CONCEPTS.md#operations-intermediate-vs-terminal)
3. Run examples in your code editor

### Path 2: Build a Test Suite (1 hour)

1. [GETTING-STARTED.md](GETTING-STARTED.md)
2. [SELECTORS.md](SELECTORS.md)
3. [INTERACTIONS.md](INTERACTIONS.md)
4. [FORMS.md](FORMS.md)

### Path 3: Advanced Patterns (2 hours)

1. [CONCEPTS.md](CONCEPTS.md) - Full understanding
2. [ADVANCED.md](ADVANCED.md) - Multi-window, tabs, alerts
3. [API-REFERENCE.md](API-REFERENCE.md) - All methods
4. [BROWSER.md](BROWSER.md) - Lifecycle patterns

---

## 🔗 Quick Links

**Getting help?**

- Check [CONCEPTS.md](CONCEPTS.md) to understand how it works
- Search [API-REFERENCE.md](API-REFERENCE.md) for specific methods
- See [SELECTORS.md](SELECTORS.md) for element finding help

**Setting up?**

- [CONFIGURATION.md](CONFIGURATION.md) - Configure browser
- [BROWSER.md](BROWSER.md) - Session lifecycle
- [GETTING-STARTED.md](GETTING-STARTED.md) - First script

**Specific tasks?**

- Fill forms → [FORMS.md](FORMS.md)
- Find elements → [SELECTORS.md](SELECTORS.md)
- Interact with elements → [INTERACTIONS.md](INTERACTIONS.md)
- Multiple windows/tabs → [ADVANCED.md](ADVANCED.md)
