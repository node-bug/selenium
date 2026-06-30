# @nodebug/selenium — WebBrowser

## Project Overview

A fluent JavaScript library for browser automation with **human-like element location strategy**. Write tests and automation scripts that read like user instructions, powered by Selenium WebDriver.

**Repository**: `@nodebug/selenium` on npm
**Version**: 5.2.7
**Node**: >= 24
**Module System**: ESM-only (`"type": "module"`)

## Architecture

Fluent builder pattern with a selector stack pipeline:

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

User writes: `await browser.button('Submit').below.element('Form').click()`
System does:

1. Build a selector stack describing "button labeled 'Submit', positioned below something labeled 'Form'"
2. Inject ElementFinder into browser
3. Locate the element using semantic + spatial logic
4. Execute the click via Selenium WebDriver
5. Clear the stack

## Directory Structure

```
selenium/
├── index.js                           # Main WebBrowser class (extends Browser)
├── demo.js                            # Interactive demo script
├── package.json                       # ESM, Node >= 24, Vitest tooling
├── vitest.config.js                   # Test configuration
├── eslint.config.js                   # Linting configuration
├── AGENTS.md                          # Agent directory and selection guide
│
├── app/                               # Core application modules
│   ├── messenger.js                   # Message formatting for logging
│   ├── plugin-manager.js              # Plugin system
│   │
│   ├── browser/                       # Browser session management
│   │   ├── index.js                   # Base Browser class
│   │   ├── alerts.js                  # Alert/dialog handling
│   │   ├── tab.js                     # Tab management
│   │   ├── window.js                  # Window management
│   │   └── browser-target.js          # Target element abstraction
│   │
│   ├── capabilities/                  # Browser capabilities
│   │   ├── index.js                   # Capabilities factory
│   │   ├── chrome.js                  # Chrome configuration
│   │   ├── firefox.js                 # Firefox configuration
│   │   ├── safari.js                  # Safari configuration
│   │   └── preferences.js             # Browser preferences
│   │
│   ├── command-delegates/             # Action execution delegates
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
│   │
│   └── elements/                      # Element finding & selection
│       ├── locator-strategy.js        # Core element finding logic
│       ├── selector-stack-builder.js  # Stack builder utilities
│       ├── spatial-filters.js         # Spatial filter functions
│       └── spatial-selection.js       # Spatial relationship logic
│
├── tests/                             # Vitest test suite
│   ├── fixtures/                      # HTML test pages
│   │   ├── demo-page.html
│   │   ├── forms.html
│   │   ├── dropdowns.html
│   │   ├── spatial-test.html
│   │   ├── shadow-dom.html
│   │   └── ...
│   │
│   ├── unit/                          # Unit tests with mocks
│   │   ├── browser/                   # Browser module tests
│   │   ├── capabilities/              # Capability tests
│   │   ├── command-delegates/         # Delegate tests
│   │   └── elements/                  # Element finding tests
│   │
│   └── integration/                   # Real browser Selenium tests
│       ├── element-retrieval.test.js
│       ├── spatial-selectors.test.js
│       ├── form-elements.test.js
│       └── ...
│
├── docs/                              # Documentation
│   ├── ENGINEERING.md                 # Technical reference for AI agents
│   ├── CONCEPTS.md                    # Core concepts and patterns
│   ├── SELECTORS.md                   # Element selection strategies
│   ├── INTERACTIONS.md                # User interactions
│   ├── FORMS.md                       # Form handling
│   └── ...
│
└── examples/                          # Usage examples
```

## Core Concepts

### Fluent API Pattern

Method calls build a selector stack before execution:

```javascript
// Pattern: Intermediate → Intermediate → Terminal
await browser
  .button('Submit') // Intermediate: Push to stack
  .below // Intermediate: Add spatial filter
  .element('Form') // Intermediate: Add anchor reference
  .click() // Terminal: Execute and clear stack
```

### Two-Step Operation Model

| Type             | Behavior                                            | Examples                                                                           |
| ---------------- | --------------------------------------------------- | ---------------------------------------------------------------------------------- |
| **Intermediate** | Build selector stack, return `browser` for chaining | `element()`, `button()`, `below`, `within`, `exact`, `at.index()`                  |
| **Terminal**     | Execute action, clear stack, return value           | `click()`, `write()`, `is.visible()`, `should.be.visible()`, `find()`, `findAll()` |

### Namespace Pattern

Complex operations use nested accessors:

```javascript
// get namespace
await browser.element('input').get.text()
await browser.element('input').get.value()

// should namespace (assertions)
await browser.button('Submit').should.be.visible()
await browser.checkbox('Agree').should.be.checked()

// is namespace (conditionals)
if (await browser.button('Submit').is.visible()) {
  /* ... */
}
```

### Element Type System

Element types are dynamically registered from `@nodebug/browser-element-finder`:

```javascript
// In WebBrowser constructor
Object.keys(ELEMENT_DEFINITIONS).forEach((type) => {
  this[type] = (data) => this.#typefixer(data, type)
})
```

**Supported types**: `button`, `checkbox`, `switch`, `slider`, `radio`, `dropdown`, `textbox`, `link`, `heading`, `navigation`, `dialog`, `table`, `row`, `column`, `cell`, `image`, `file`, `list`, `listitem`, `menu`, `menuitem`, `toolbar`, `element`, etc.

### Spatial Selection System

| Relationship | Condition                          |
| ------------ | ---------------------------------- |
| `above`      | Element positioned above anchor    |
| `below`      | Element positioned below anchor    |
| `toLeftOf`   | Element positioned left of anchor  |
| `toRightOf`  | Element positioned right of anchor |
| `within`     | Element inside container           |
| `near`       | Element near anchor (within 100px) |

### Delegate Pattern

All actions are delegated to specialized classes:

```javascript
// In WebBrowser constructor
this.#clickDelegate = new ClickDelegate(this)
this.#inputDelegate = new InputDelegate(this)
this.#visibilityDelegate = new VisibilityDelegate(this)
// ... etc
```

| Delegate             | Purpose                         |
| -------------------- | ------------------------------- |
| `ClickDelegate`      | Mouse interactions              |
| `InputDelegate`      | Keyboard/text input             |
| `VisibilityDelegate` | Visibility checks and scrolling |
| `CheckboxDelegate`   | Checkbox state                  |
| `RadioDelegate`      | Radio button state              |
| `SelectDelegate`     | Dropdown operations             |
| `SwitchDelegate`     | Toggle switch operations        |
| `SliderDelegate`     | Slider control                  |
| `DragDropDelegate`   | Drag and drop operations        |

### Plugin System

Extend browser functionality at runtime:

```javascript
browser.use({
  name: 'my-plugin',
  hooks: { beforeClick: (data) => data },
  extend: (browser) => ({ customMethod: () => {} }),
})
```

## Key Dependencies

| Package                           | Purpose                              |
| --------------------------------- | ------------------------------------ |
| `selenium-webdriver`              | Core WebDriver implementation        |
| `@nodebug/browser-element-finder` | Element discovery and matching logic |
| `@nodebug/config`                 | Configuration management             |
| `@nodebug/logger`                 | Logging utilities                    |

## Development Commands

```bash
npm install                 # Install dependencies
npm test                    # Run all tests (unit + integration)
npm run test:coverage       # Run with v8 coverage report
npm run lint                # ESLint check
```

### Test Configuration

- **Vitest** with single-thread execution (`minThreads: 1`, `maxThreads: 1`) for proper browser cleanup
- Integration tests use real Chrome browser via Selenium
- Unit tests use mocks for dependencies
- Test timeout: 100000 ms
- Force exit to ensure browser cleanup

## Code Conventions

### Module System

**ESM-only.** All files use `import`/`export`.

```javascript
// GOOD
import { log } from '@nodebug/logger';
import config from '@nodebug/config';
export class WebBrowser extends Browser { ... }

// BAD - never use require()
const data = require('./data.json')
```

### Class-Based Architecture (WebBrowser)

Unlike `@nodebug/browser-element-finder`, this library **uses classes**:

```javascript
// GOOD - class with private fields
class WebBrowser extends Browser {
  #message = '';
  #tempMods = { control: false, shift: false, alt: false, meta: false };

  constructor() {
    super();
    this.stack = [];
  }
}

// BAD - don't remove class structure
const webBrowserFactory = () => ({ ... })
```

### Private Fields with `#`

Use `#` prefix for private class fields:

```javascript
class WebBrowser {
  #clickDelegate
  #inputDelegate

  get _tempMods() {
    return { ...this.#tempMods }
  }
}
```

### Async/Await for WebDriver Operations

Always use async/await for browser operations:

```javascript
// GOOD
async click(x = null, y = null) {
  return await this.#clickDelegate.click(x, y);
}

// BAD - don't return promises directly without handling
click() {
  return this.driver.findElement(...);
}
```

### Stack Management

Terminal operations MUST clear the stack in a `finally` block:

```javascript
// GOOD
async find() {
  this.message = messenger({ stack: this.stack, action: 'find' });
  try {
    const locator = await this._finder();
    return locator;
  } catch (err) {
    this.handleError(err, 'finding element');
  } finally {
    this.stack = [];
  }
}

// BAD - stack not cleared on error
async find() {
  const locator = await this._finder();
  this.stack = [];
  return locator;
}
```

### Error Handling

Use `handleError()` for consistent error messages:

```javascript
// GOOD
this.handleError(err, 'clicking Submit button below Form')

// BAD - generic errors
throw new Error('fail')
```

### Logging

Use `@nodebug/logger` for all output:

```javascript
import { log } from '@nodebug/logger'
log.info('Operation completed')
log.error('Operation failed', error)
```

### Configuration

Access via `@nodebug/config`:

```javascript
import config from '@nodebug/config'
const selenium = config('selenium')
// selenium.browser, selenium.headless, selenium.timeout, etc.
```

### Prefer `undefined` over `null`

```javascript
// GOOD
if (parent === null || parent === undefined) {
  parent = document
}

// BAD
const result = null
```

### Early Returns and Reduced Nesting

```javascript
// GOOD
function matchesType(el, type) {
  if (el == null) return false
  const matcher = TYPE_MATCHERS.get(type)
  return matcher ? matcher(el) : false
}
```

### JSDoc Documentation

All public methods should have JSDoc annotations:

```javascript
/**
 * Performs a click on an element.
 *
 * @param {number} [x] - X coordinate for click (optional)
 * @param {number} [y] - Y coordinate for click (optional)
 * @returns {Promise<boolean>} True if successful
 * @example
 * await browser.button('submit').click();
 */
async click(x = null, y = null) { ... }
```

### Testing

- **Unit tests** (`tests/unit/`): Mock-based tests for individual modules
- **Integration tests** (`tests/integration/`): Real Chrome browser via Selenium
- Tests should verify observable outcomes (element counts, properties, actions)
- Use `describe`/`test` blocks with meaningful names

```javascript
// GOOD - integration test pattern
describe('Form Elements', () => {
  let browser

  beforeAll(async () => {
    browser = new WebBrowser()
    await browser.start()
    await browser.goto(`file://${process.cwd()}/tests/fixtures/forms.html`)
  })

  afterAll(async () => {
    await browser.close()
  })

  test('should fill and submit form', async () => {
    await browser.textbox('Email').write('test@example.com')
    const value = await browser.textbox('Email').get.value()
    expect(value).toBe('test@example.com')
  })
})
```

## Design Patterns

### 1. Fluent Builder Pattern

Method chaining builds selector stack:

```javascript
// Intermediate methods return `this` for chaining
get below() { this.#pushLocation('below'); return this; }

// Terminal methods execute and clear stack
async click() { /* ... */ this.stack = []; return result; }
```

### 2. Delegate Pattern

Actions delegated to specialized classes extending `BaseDelegate`:

```javascript
class ClickDelegate extends BaseDelegate {
  async click(x, y) {
    return await this.withErrorHandling(async () => {
      const element = await this.findElement()
      // ... click logic
    }, 'clicking element')
  }
}
```

### 3. Retry with Timeout

Element finding uses retry loop until timeout:

```javascript
async _finder(t = null) {
  const timeout = t ?? selenium.timeout;
  const endTime = Date.now() + timeout;

  while (Date.now() < endTime) {
    // Try to find element
    await new Promise(resolve => setTimeout(resolve, 100));
  }
}
```

### 4. OR Condition Support

Stack can be split into multiple search descriptions:

```javascript
// browser.button('Save').or.button('Submit').click()
getDescriptions() {
  return this.stack.reduce((acc, curr) => {
    if (curr.type === 'condition' && curr.operator === 'or') {
      acc.push([]);
    } else {
      acc[acc.length - 1].push(curr);
    }
    return acc;
  }, [[]]);
}
```

## Configuration Files

| File                    | Purpose                                          |
| ----------------------- | ------------------------------------------------ |
| `vitest.config.js`      | Single-thread test execution, 100s timeout       |
| `eslint.config.js`      | @eslint/js recommended + prettier                |
| `.config/selenium.json` | Browser config (browser type, headless, timeout) |

## Feature Roadmap

See `docs/TODO.md` for the feature roadmap including:

- Touch & mobile gestures
- Clipboard operations
- Network interception
- Storage & cookie management
- Advanced wait conditions
- And more...

## Key Files for AI Agents

| File                                     | Purpose                  | When to Reference                         |
| ---------------------------------------- | ------------------------ | ----------------------------------------- |
| `index.js`                               | Main WebBrowser class    | Adding new methods, understanding API     |
| `app/browser/index.js`                   | Base Browser class       | Browser lifecycle, session management     |
| `app/elements/locator-strategy.js`       | Core element finding     | Element discovery, cross-frame search     |
| `app/elements/spatial-filters.js`        | Spatial filter functions | Adding new spatial relationships          |
| `app/elements/selector-stack-builder.js` | Stack utilities          | Modifying stack behavior                  |
| `app/command-delegates/base-delegate.js` | Shared delegate logic    | Error handling, modifiers                 |
| `app/command-delegates/*.js`             | Action delegates         | Modifying click/input/visibility behavior |
| `app/capabilities/*.js`                  | Browser capabilities     | Adding browser support                    |
| `app/plugin-manager.js`                  | Plugin system            | Extending plugin functionality            |
| `tests/fixtures/`                        | HTML test pages          | Creating test scenarios                   |
| `tests/integration/`                     | Integration tests        | Adding browser tests                      |
| `docs/ENGINEERING.md`                    | Technical reference      | Understanding architecture                |
| `docs/TODO.md`                           | Feature roadmap          | Planning new features                     |

## Rules for AI Agents

1. **Read `docs/ENGINEERING.md` first** — comprehensive technical reference with decision trees
2. **Follow the delegate pattern** — new actions should use appropriate delegates
3. **Always clear stack in `finally`** — terminal operations must clean up
4. **Use async/await** — all WebDriver operations are asynchronous
5. **Use `@nodebug/logger`** — for all log output, not `console.log`
6. **Access config via `@nodebug/config`** — don't hardcode browser settings
7. **Private fields with `#`** — use private class fields for encapsulation
8. **ESM-only** — use `import`/`export`, never `require()`
9. **Test both unit and integration** — mock-based unit tests + real browser integration tests
10. **Check `docs/TODO.md`** before implementing features that may already be planned
11. **Single-thread tests** — Vitest runs with `maxThreads: 1` for proper browser cleanup
12. **Use `handleError()`** — for consistent error messages in delegates
