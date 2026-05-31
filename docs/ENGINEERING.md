# Engineering Reference

Complete technical reference for developing, maintaining, and extending the WebBrowser (selenium) repository.

## Table of Contents

- [Architecture Overview](#architecture-overview)
- [Core Patterns](#core-patterns)
- [Module Structure](#module-structure)
- [Selector Stack Architecture](#selector-stack-architecture)
- [Delegate Pattern](#delegate-pattern)
- [Spatial Selection System](#spatial-selection-system)
- [Element Finding Pipeline](#element-finding-pipeline)
- [Testing Strategy](#testing-strategy)
- [Development Guidelines](#development-guidelines)
- [Extending the Library](#extending-the-library)
- [Common Pitfalls](#common-pitfalls)

---

## Architecture Overview

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        WebBrowser (index.js)                     │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                    Selector Stack                         │  │
│  │  [element, location, element, action, ...]                 │  │
│  └───────────────────────────────────────────────────────────┘  │
│                              │                                  │
│                              ▼                                  │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                  LocatorStrategy                          │  │
│  │  - Injects ElementFinder script                           │  │
│  │  - Cross-frame element discovery                         │  │
│  │  - Spatial filtering                                     │  │
│  └───────────────────────────────────────────────────────────┘  │
│                              │                                  │
│                              ▼                                  │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                   Delegates                             │  │
│  │  ClickDelegate, InputDelegate, VisibilityDelegate, etc.    │  │
│  └───────────────────────────────────────────────────────────┘  │
│                              │                                  │
│                              ▼                                  │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                 Selenium WebDriver                       │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

### Key Dependencies

| Package                           | Version | Purpose                              |
| --------------------------------- | ------- | ------------------------------------ |
| `selenium-webdriver`              | 4.43.0  | Core WebDriver implementation        |
| `@nodebug/browser-element-finder` | ^1.1.5  | Element discovery and matching logic |
| `@nodebug/config`                 | ^2.1.4  | Configuration management             |
| `@nodebug/logger`                 | ^1.1.5  | Logging utilities                    |

---

## Core Patterns

### 1. Fluent API Pattern

The library uses a fluent builder pattern where method calls build a selector stack before execution.

```javascript
// Pattern: Intermediate → Intermediate → Terminal
await browser
  .button('Submit') // Intermediate: Push to stack
  .below // Intermediate: Add spatial filter
  .element('Form') // Intermediate: Add anchor reference
  .click() // Terminal: Execute and clear stack
```

**Key Rules:**

- Intermediate methods return `this` (the WebBrowser instance) for chaining
- Terminal methods perform actions and clear the stack
- Stack is an array of selector descriptors

### 2. Two-Step Operation Model

| Type             | Behavior                                            | Examples                                                                           |
| ---------------- | --------------------------------------------------- | ---------------------------------------------------------------------------------- |
| **Intermediate** | Build selector stack, return `browser` for chaining | `element()`, `button()`, `below`, `within`, `exact`, `at.index()`                  |
| **Terminal**     | Execute action, clear stack, return value           | `click()`, `write()`, `is.visible()`, `should.be.visible()`, `find()`, `findAll()` |

### 3. Namespace Pattern

Complex operations use nested accessors for organized API:

```javascript
// get namespace
await browser.element('input').get.text()
await browser.element('input').get.value()
await browser.element('input').get.attribute('placeholder')
await browser.element('input').get.screenshot()

// should namespace (assertions)
await browser.button('Submit').should.be.visible()
await browser.button('Submit').should.be.enabled()
await browser.checkbox('Agree').should.be.checked()

// is namespace (conditionals)
await browser.button('Submit').is.visible()
await browser.button('Submit').is.enabled()
await browser.checkbox('Agree').is.checked()
```

---

## Module Structure

### Directory Layout

```
selenium/
├── index.js                           # Main WebBrowser class (extends Browser)
├── app/
│   ├── messenger.js                   # Message formatting for logging
│   ├── browser/
│   │   ├── index.js                   # Base Browser class
│   │   ├── alerts.js                  # Alert handling
│   │   ├── tab.js                     # Tab management
│   │   ├── window.js                  # Window management
│   │   └── browser-target.js          # Target element abstraction
│   ├── capabilities/
│   │   ├── index.js                   # Capabilities factory
│   │   ├── chrome.js                  # Chrome capabilities
│   │   ├── firefox.js                 # Firefox capabilities
│   │   ├── safari.js                  # Safari capabilities
│   │   └── preferences.js             # Browser preferences
│   ├── command-delegates/
│   │   ├── base-delegate.js           # Shared delegate functionality
│   │   ├── click-delegate.js          # Click operations
│   │   ├── input-delegate.js          # Text input operations
│   │   ├── visibility-delegate.js     # Visibility/scroll operations
│   │   ├── checkbox-delegate.js       # Checkbox operations
│   │   ├── radio-delegate.js          # Radio button operations
│   │   ├── select-delegate.js         # Dropdown operations
│   │   ├── switch-delegate.js         # Switch/toggle operations
│   │   ├── slider-delegate.js         # Slider operations
│   │   └── drag-drop-delegate.js      # Drag and drop operations
│   └── elements/
│       ├── locator-strategy.js        # Core element finding logic
│       ├── selector-stack-builder.js  # Stack builder utilities
│       ├── spatial-filters.js       # Spatial filter functions
│       └── spatial-selection.js       # Spatial relationship logic
├── tests/
│   ├── fixtures/                      # HTML test fixtures
│   ├── integration/                   # Integration tests
│   └── unit/                          # Unit tests
└── docs/                              # Documentation
```

---

## Selector Stack Architecture

### Stack Item Types

Each item in the selector stack has a `type` property:

| Type        | Properties                                          | Purpose                        |
| ----------- | --------------------------------------------------- | ------------------------------ |
| `element`   | `id`, `exact`, `hidden`, `index`, `matches`, `type` | Element selector descriptor    |
| `location`  | `located`, `exactly`                                | Spatial relationship filter    |
| `condition` | `operator`                                          | Logical operator (`or`)        |
| `action`    | `perform`                                           | Action marker (`drag`, `onto`) |

### Stack Item Structure

```javascript
// Element selector
{
  type: 'button',           // Element type
  id: 'Submit',             // Text/attribute to match
  exact: false,             // Exact matching flag
  hidden: false,            // Include hidden elements
  index: false,             // 1-based index (false = first match)
  matches: []               // Populated during resolution
}

// Location filter
{
  type: 'location',
  located: 'below',         // Spatial relationship
  exactly: false            // Strict alignment
}

// OR condition
{
  type: 'condition',
  operator: 'or'
}
```

### Stack Resolution Flow

```
1. User builds stack via method chaining
2. Terminal operation calls _finder()
3. _finder() calls getDescriptions() to split OR conditions
4. LocatorStrategy.find() resolves each stack segment
5. Stack is cleared after execution
```

---

## Delegate Pattern

### Base Delegate

All delegates extend `BaseDelegate` which provides:

```javascript
// BaseDelegate methods available to all delegates
withErrorHandling(action, operation, options) // Standardized error handling
getPlatformName() // Get normalized platform name
getModifiers() // Get active modifiers from browser._tempMods
hasModifiers() // Check if modifiers are active
pressModifiers(actions, platformName) // Press modifier keys
releaseModifiers(actions, platformName) // Release modifier keys
withModifiers(operation) // Execute with modifiers held
resetModifiers() // Reset browser._tempMods
findElement() // Find element via browser._finder()
```

### Delegate Responsibilities

| Delegate             | Methods                                                                                                                   | Purpose                         |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------- | ------------------------------- |
| `ClickDelegate`      | `click()`, `doubleClick()`, `rightClick()`, `middleClick()`, `tripleClick()`, `longPress()`, `multipleClick()`, `hover()` | Mouse interactions              |
| `InputDelegate`      | `write()`, `clear()`, `overwrite()`, `focus()`, `press()`, `type()`, `left()`, `right()`, `up()`, `down()`                | Keyboard/text input             |
| `VisibilityDelegate` | `_isVisible()`, `_isEnabled()`, `_isDisabled()`, `_isNotVisible()`, `hide()`, `unhide()`, `scroll`                        | Visibility checks and scrolling |
| `CheckboxDelegate`   | `check()`, `uncheck()`, `_isChecked()`                                                                                    | Checkbox state                  |
| `RadioDelegate`      | `_isSet()`                                                                                                                | Radio button state              |
| `SelectDelegate`     | `option()`, `select()`, `getOptions()`, `getSelectedOptions()`, `_hasOption()`, `_isSelected()`                           | Dropdown operations             |
| `SwitchDelegate`     | `on()`, `off()`, `_isOn()`                                                                                                | Toggle switch operations        |
| `SliderDelegate`     | `slide` accessor                                                                                                          | Slider control                  |
| `DragDropDelegate`   | `perform()`                                                                                                               | Drag and drop operations        |

---

## Spatial Selection System

### Spatial Relationships

| Relationship | Condition                              | With `exactly`                |
| ------------ | -------------------------------------- | ----------------------------- |
| `above`      | `candidate.bottom <= reference.top`    | Horizontal alignment required |
| `below`      | `candidate.top >= reference.bottom`    | Horizontal alignment required |
| `toLeftOf`   | `candidate.right <= reference.left`    | Vertical alignment required   |
| `toRightOf`  | `candidate.left >= reference.right`    | Vertical alignment required   |
| `within`     | Midpoint inside reference bounding box | N/A                           |
| `near`       | Vertical overlap within 100px          | N/A                           |

### Spatial Filter Configuration

```javascript
const DEFAULT_CONFIG = {
  alignmentBuffer: 5, // Pixels for alignment check
  proximityDistance: 100, // Pixels for 'near' relationship
}
```

### Spatial Selection Flow

```
1. User specifies spatial relationship: .below.element('anchor')
2. Stack contains: [target, location, anchor]
3. LocatorStrategy.find() resolves anchor first
4. relativeSearch() filters candidates by spatial relationship
5. Bounding boxes are compared for position matching
```

---

## Element Finding Pipeline

### 1. ElementFinder Injection

The `LocatorStrategy` injects `@nodebug/browser-element-finder` script into the browser context once per session.

```javascript
// In locator-strategy.js
async _injectElementFinder() {
  const scriptContent = await readFile(elementFinderPath, 'utf8');
  await this.driver.executeScript(`
    ${scriptContent}
    window.ElementFinder = ElementFinder;
  `);
}
```

### 2. Cross-Frame Discovery

Elements are found across frames in order:

1. Main frame (frameIndex = -1)
2. Child frames (0 to frameCount - 1)

### 3. Attribute Priority Order

Elements are matched by searching attributes in priority:

1. Text content
2. Placeholder
3. Value
4. Test IDs (`data-tid`, `data-testid`, `data-test-id`, `id`, `resource-id`, `data-id`)
5. Name
6. ARIA label
7. CSS class
8. Tooltip (`title`, `hint`, `tooltip`)
9. Image attributes (`alt`, `src`)

### 4. Resolution Process

```javascript
// Simplified flow in _finder()
async _finder(t = null) {
  const stacks = this.getDescriptions();  // Split OR conditions
  const timeout = t ?? (selenium.timeout * 1000);
  const endTime = Date.now() + timeout;

  while (Date.now() < endTime) {
    for (const currentStack of stacks) {
      try {
        locator = await this.locatorStrategy.find(currentStack);
        if (locator) return locator;
      } catch (err) {
        if (err instanceof ReferenceError) throw err;
        continue;
      }
    }
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  throw new Error('Element not found after timeout');
}
```

---

## Testing Strategy

### Test Structure

```
tests/
├── fixtures/                    # Static HTML files for testing
│   ├── forms.html              # Form elements
│   ├── dropdowns.html          # Dropdown elements
│   ├── spatial-test.html       # Spatial positioning tests
│   └── ...                     # Other test pages
├── integration/                # End-to-end tests with real browser
│   ├── element-retrieval.test.js
│   ├── element-selection.test.js
│   ├── spatial-selectors.test.js
│   └── ...
└── unit/                     # Unit tests with mocks
    └── index.test.js
```

### Test Configuration

```javascript
// vitest.config.js
export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.test.js'],
    testTimeout: 100000,
    globals: true,
    forceExit: true,
    pool: 'threads',
    isolate: true,
    minThreads: 1,
    maxThreads: 1,
    teardownTimeout: 10000,
  },
})
```

### Test Patterns

**Integration Test Setup:**

```javascript
describe('Feature Tests', () => {
  let browser

  beforeAll(async () => {
    browser = new WebBrowser()
    await browser.start()
    await browser.goto(`file://${process.cwd()}/tests/fixtures/forms.html`)
  })

  afterAll(async () => {
    await browser.close()
  })

  test('should perform action', async () => {
    await browser.textbox('Email').write('test@example.com')
    const value = await browser.textbox('Email').get.value()
    expect(value).toBe('test@example.com')
  })
})
```

**Unit Test with Mocks:**

```javascript
// Mock delegates and dependencies
vi.mock('@nodebug/logger', () => ({
  log: { info: vi.fn(), error: vi.fn() },
}))

// Test stack building without browser
test('should build correct stack', () => {
  const browser = new WebBrowser()
  browser.button('Submit').below.element('Form')
  expect(browser.stack).toEqual([
    {
      type: 'button',
      id: 'Submit',
      exact: false,
      hidden: false,
      index: false,
      matches: [],
    },
    { type: 'location', located: 'below' },
    {
      type: 'element',
      id: 'Form',
      exact: false,
      hidden: false,
      index: false,
      matches: [],
    },
  ])
})
```

---

## Development Guidelines

### Code Style

1. **Use ES Modules** - All files use `.js` extension with `type: "module"` in package.json
2. **Private Fields** - Use `#` prefix for private class fields
3. **Async/Await** - Always use async/await for WebDriver operations
4. **Error Handling** - Use `handleError()` for consistent error messages
5. **Logging** - Use `@nodebug/logger` for all log output

### Adding New Element Types

Element types are defined in `@nodebug/browser-element-finder/element-definitions.json`. To add a new type:

1. Add definition to the external package (or extend locally)
2. The type is automatically available via dynamic property:

```javascript
// In constructor
Object.keys(ELEMENT_DEFINITIONS).forEach((type) => {
  this[type] = (data) => {
    return this.#typefixer(data, type)
  }
})
```

### Adding New Delegates

1. Create new delegate file in `app/command-delegates/`
2. Extend `BaseDelegate`
3. Add private field in `index.js` constructor
4. Add public method or accessor

```javascript
// In index.js
import { NewDelegate } from './command-delegates/new-delegate.js'

class WebBrowser extends Browser {
  #newDelegate

  constructor() {
    super()
    this.#newDelegate = new NewDelegate(this)
  }

  async newAction() {
    return await this.#newDelegate.newAction()
  }
}
```

### Adding New Spatial Relationships

1. Add filter function in `spatial-filters.js`
2. Add to `validLocations` array in `spatial-selection.js`
3. Add getter in `index.js`:

```javascript
get nextTo() { this.#pushLocation('nextTo'); return this; }
```

---

## Extending the Library

### Adding a New Terminal Operation

```javascript
// Example: Adding a 'highlight' method
async highlight() {
  this.message = messenger({ stack: this.stack, action: 'highlight' });
  try {
    const locator = await this._finder();
    await this.driver.executeScript(
      'arguments[0].style.border = "2px solid red";',
      locator
    );
  } catch (err) {
    this.handleError(err, 'highlighting element');
  } finally {
    this.stack = [];
  }
  return true;
}
```

### Adding a New Namespace Accessor

```javascript
// Example: Adding 'assert' namespace
get assert() {
  return {
    visible: async (t = null) => {
      this.message = messenger({ stack: this.stack, action: 'assertVisible' });
      const test = await this.#visibilityDelegate._isVisible(t);
      if (!test) {
        throw new Error('Element should be visible');
      }
    },
  };
}
```

### Adding New Keyboard Actions

```javascript
// In InputDelegate
async pageUp(count = 1) {
  for (let i = 0; i < count; i++) {
    await this.browser.press('pageUp');
  }
  return true;
}
```

---

## Common Pitfalls

### 1. Stack Pollution

**Problem:** Calling terminal operation without proper chaining

```javascript
// WRONG - Stack not cleared properly
await browser.button('Submit').click()
await browser.button('Cancel').click() // May use stale stack
```

**Solution:** Stack is always cleared in finally block, but be explicit:

```javascript
// RIGHT
await browser.button('Submit').click()
await browser.button('Cancel').click()
```

### 2. Modifier Key Timing

**Problem:** Modifiers not released before next action

```javascript
// WRONG - Modifiers persist
await browser.ctrl.press('a')
await browser.press('c') // Still has ctrl pressed
```

**Solution:** Modifiers are auto-reset after each action

### 3. Spatial Filter Order

**Problem:** Wrong order in spatial chaining

```javascript
// WRONG - Terminal operation breaks chain
await browser.button('Delete').click().below.element('Actions')
```

**Solution:** Position filters before terminal operation

```javascript
// RIGHT
await browser.button('Delete').below.element('Actions').click()
```

### 4. OR Condition Usage

**Problem:** OR condition with incompatible types

```javascript
// WRONG - OR splits stack, each segment must be valid
await browser.button('Save').or.textbox('Email').click()
```

**Solution:** Each OR segment should be a complete selector

```javascript
// RIGHT
await browser.button('Save').or.button('Submit').click()
```

### 5. Hidden Element Handling

**Problem:** Hidden elements not found by default

```javascript
// WRONG - Hidden checkbox won't be found
await browser.checkbox('Hidden').check()
```

**Solution:** Use `hidden` modifier

```javascript
// RIGHT
await browser.hidden.checkbox('Hidden').check()
```

---

## Debugging

### Enable Debug Mode

Set `debug: true` in configuration to enable verbose logging:

```javascript
// In locator-strategy.js
get debug() { return selenium.debug ?? false; }
```

### Common Debug Patterns

```javascript
// Check stack state
console.log(browser.stack)

// Verify element found
const element = await browser.button('Submit').find()
console.log('Found element:', element)

// Check bounding box for spatial issues
const elements = await browser.element('item').findAll()
console.log(
  'Bounding boxes:',
  elements.map((e) => e.boundingBox),
)
```

---

## Configuration

### Config Structure

```json
{
  "browser": "chrome",
  "headless": false,
  "timeout": 10,
  "width": 1280,
  "height": 800,
  "hub": null,
  "debug": false
}
```

### Accessing Config

```javascript
import config from '@nodebug/config'
const selenium = config('selenium')
```

---

## API Quick Reference

### Browser Lifecycle

| Method      | Returns            | Description                           |
| ----------- | ------------------ | ------------------------------------- |
| `start()`   | `Promise<void>`    | Initialize WebDriver session          |
| `close()`   | `Promise<boolean>` | Cleanup and quit session              |
| `goto(url)` | `Promise<boolean>` | Navigate to URL                       |
| `refresh()` | `Promise<void>`    | Refresh current page                  |
| `reset()`   | `Promise<void>`    | Clear cookies, storage, close windows |

### Element Selection

| Method         | Returns                 | Description                |
| -------------- | ----------------------- | -------------------------- |
| `element(id)`  | `WebBrowser`            | Generic element selector   |
| `button(id)`   | `WebBrowser`            | Button selector            |
| `textbox(id)`  | `WebBrowser`            | Text input selector        |
| `checkbox(id)` | `WebBrowser`            | Checkbox selector          |
| `dropdown(id)` | `WebBrowser`            | Dropdown selector          |
| `find()`       | `Promise<WebElement>`   | Find single element        |
| `findAll()`    | `Promise<WebElement[]>` | Find all matching elements |

### Spatial Filters

| Method                 | Description                          |
| ---------------------- | ------------------------------------ |
| `.above.element()`     | Element above anchor                 |
| `.below.element()`     | Element below anchor                 |
| `.toLeftOf.element()`  | Element left of anchor               |
| `.toRightOf.element()` | Element right of anchor              |
| `.within.element()`    | Element inside container             |
| `.near.element()`      | Element near anchor                  |
| `.exactly`             | Strict alignment for spatial filters |

### Modifiers

| Modifier                   | Key                      |
| -------------------------- | ------------------------ |
| `ctrl` / `control`         | Control key              |
| `shift`                    | Shift key                |
| `alt`                      | Alt key                  |
| `meta` / `command` / `win` | Meta/Command/Windows key |

---

## Related Documentation

- [Core Concepts](CONCEPTS.md) - Understanding the library patterns
- [Selectors Guide](SELECTORS.md) - Element selection strategies
- [Interactions Guide](INTERACTIONS.md) - User interactions
- [Forms Guide](FORMS.md) - Form handling
- [Browser Guide](BROWSER.md) - Session and window management
- [Advanced Guide](ADVANCED.md) - Complex patterns and techniques
- [API Reference](API-REFERENCE.md) - Complete method documentation
