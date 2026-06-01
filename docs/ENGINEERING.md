# Engineering Reference & AI Agent Guidance

Complete technical reference for developing, maintaining, and extending the WebBrowser (selenium) repository. **This document is designed as a guidance resource for AI agents and developers working on repository improvements.**

## Quick Links for AI Agents

- **[Architecture for Agents](#architecture-for-agents)** - Start here to understand system design
- **[Module Decision Trees](#module-decision-trees)** - Where to make changes
- **[AI Development Workflow](#ai-development-workflow)** - Step-by-step guidance for agents
- **[Common Patterns & Anti-Patterns](#common-patterns--anti-patterns)** - Do's and don'ts
- **[Integration Points](#integration-points)** - Where to hook new features

## Table of Contents

- [Architecture for Agents](#architecture-for-agents)
- [Core Patterns](#core-patterns)
- [Module Structure](#module-structure)
- [Selector Stack Architecture](#selector-stack-architecture)
- [Delegate Pattern](#delegate-pattern)
- [Spatial Selection System](#spatial-selection-system)
- [Element Finding Pipeline](#element-finding-pipeline)
- [Module Decision Trees](#module-decision-trees)
- [AI Development Workflow](#ai-development-workflow)
- [Common Patterns & Anti-Patterns](#common-patterns--anti-patterns)
- [Integration Points](#integration-points)
- [Testing Strategy](#testing-strategy)
- [Debugging Guide for Agents](#debugging-guide-for-agents)
- [Common Pitfalls](#common-pitfalls)

---

## Architecture for Agents

### What is WebBrowser?

WebBrowser is a **fluent browser automation library** that converts user-like actions into Selenium WebDriver commands. The core mission: **make test code as readable as natural English**.

### Why This Architecture?

```
User writes:  await browser.button('Submit').below.element('Form').click()
System does:
  1. Build a selector stack describing: "button labeled 'Submit', positioned below something labeled 'Form'"
  2. Inject ElementFinder into browser
  3. Locate the element using semantic + spatial logic
  4. Execute the click via Selenium WebDriver
  5. Clear the stack
```

### Key Insight for Agents

Every user action flows through this pipeline:

```
Fluent API Method → Selector Stack → LocatorStrategy → Delegates → WebDriver
```

Understanding this flow is essential for:

- Adding new features (hook into correct layer)
- Debugging failures (trace through pipeline)
- Performance optimization (reduce stack operations)

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

## Module Decision Trees

**For AI Agents: Use these decision trees to determine where to implement changes.**

### "I want to add a new action (e.g., `screenshot()`, `hover()`)"

```
Is it a mouse action?
  → Yes: Use ClickDelegate (app/command-delegates/click-delegate.js)
  → No:
    Is it text/keyboard input?
      → Yes: Use InputDelegate (app/command-delegates/input-delegate.js)
      → No:
        Is it visibility/scrolling?
          → Yes: Use VisibilityDelegate
          → No:
            Is it form-specific (checkbox/radio/select/switch/slider)?
              → Yes: Use appropriate delegate (CheckboxDelegate, etc.)
              → No:
                Is it drag/drop?
                  → Yes: Use DragDropDelegate
                  → No: Create new delegate or extend existing
```

### "I want to add a new element type (e.g., `tag()`, `heading()`)"

```
Check @nodebug/browser-element-finder package:
  1. Is the type already defined there?
     → Yes: Already available via dynamic property
     → No: Add to element-definitions.json in that package
  2. Add XPath/selector logic in element-definitions
  3. Test with existing tests (no WebBrowser changes needed)
```

### "I want to add a new spatial relationship (e.g., `diagonal()`, `aligned()`)"

```
1. Create filter function in app/elements/spatial-filters.js
2. Add to validLocations array in app/elements/spatial-selection.js
3. Add getter in app/browser/index.js:
   get newRelation() { this.#pushLocation('newRelation'); return this; }
4. Add tests in tests/integration/spatial-selectors.test.js
```

### "I want to add a new configuration option"

```
1. Add to .config/selenium.json schema
2. Update @nodebug/config package
3. Document in docs/CONFIGURATION.md
4. Access via: import config from '@nodebug/config'
```

---

## AI Development Workflow

**Step-by-step guide for AI agents implementing features or fixes.**

### 1. Understand the Request

Ask yourself:

- [ ] What user-facing behavior should change?
- [ ] Which layer needs modification (API, stack, locator, delegate, WebDriver)?
- [ ] What's the impact scope (single file, multiple files, external packages)?
- [ ] Are there existing tests to reference?

### 2. Locate Relevant Code

```bash
# Element selection → app/browser/index.js
# Stack building → app/elements/selector-stack-builder.js
# Element finding → app/elements/locator-strategy.js
# Spatial logic → app/elements/spatial-selection.js
# Specific actions → app/command-delegates/[action]-delegate.js
```

### 3. Trace the Flow

For any user call like `await browser.button('Submit').click()`:

1. **Constructor**: Set up delegates in WebBrowser constructor
2. **Intermediate**: `button('Submit')` → calls `#typefixer()` → pushes to stack
3. **Terminal**: `click()` → calls `#visibilityDelegate.click()` → clears stack
4. **Verify**: Check that stack is empty after terminal operation

### 4. Write Tests First

```javascript
// tests/integration/my-feature.test.js
describe('My Feature', () => {
  let browser

  beforeAll(async () => {
    browser = new WebBrowser()
    await browser.start()
    await browser.goto(`file://${process.cwd()}/tests/fixtures/my-feature.html`)
  })

  afterAll(async () => {
    await browser.close()
  })

  test('should do X when Y happens', async () => {
    await browser.button('Action').myNewFeature()
    expect(await browser.element('Result').is.visible()).toBe(true)
  })
})
```

### 5. Implement Feature

- Follow existing delegate patterns
- Use error handling from BaseDelegate
- Clear the stack in finally block
- Return appropriate value (boolean, string, WebElement[], etc.)

### 6. Test Coverage

- Unit tests for stack building
- Integration tests with real browser
- Cross-browser validation (Chrome, Firefox, Safari)
- Edge case handling (hidden elements, dynamic content, etc.)

---

## Common Patterns & Anti-Patterns

### ✅ DO: Follow Delegate Pattern

```javascript
// In delegate
async newAction() {
  return await this.withErrorHandling(async () => {
    const element = await this.findElement()
    await element.perform()
    return true
  }, 'performing new action')
}
```

### ❌ DON'T: Direct WebDriver Calls

```javascript
// WRONG
const elements = await this.driver.findElements(By.css('button'))

// RIGHT
const elements = await this.browser._finder()
```

### ✅ DO: Use Stack Cleanly

```javascript
// WRONG - Stack not cleared
async badMethod() {
  const element = await this._finder()
  return element
}

// RIGHT - Stack cleared in finally
async goodMethod() {
  this.message = messenger({ stack: this.stack, action: 'myAction' })
  try {
    const locator = await this._finder()
    // Do something
    return result
  } finally {
    this.stack = []
  }
}
```

### ✅ DO: Use Meaningful Error Messages

```javascript
// WRONG
throw new Error('Element not found')

// RIGHT
this.handleError(err, 'clicking Submit button below Form')
```

### ❌ DON'T: Block on Selector Stack

```javascript
// WRONG - Creates multiple stacks
await browser.button('Save').click()
browser.button('Cancel').click() // Separate operation

// RIGHT - Each operation independent
await browser.button('Save').click()
await browser.button('Cancel').click()
```

---

## Integration Points

**Hook your new features into these integration points.**

### 1. ElementFinder Integration

When adding new element types or search strategies:

```javascript
// Add to @nodebug/browser-element-finder
// File: element-definitions.json
{
  "myElementType": {
    "xpaths": ["//my-element"],
    "searchAttributes": ["data-my-attr"]
  }
}
```

### 2. Configuration Integration

New config options flow through @nodebug/config:

```javascript
// Access in code
const myOption = config('selenium').myOption
```

### 3. Logging Integration

Use @nodebug/logger for all output:

```javascript
import { log } from '@nodebug/logger'
log.info('Operation completed')
log.error('Operation failed', error)
```

### 4. Capability Integration

Browser capabilities defined in `app/capabilities/`:

```javascript
// app/capabilities/my-browser.js
export function getCapabilities(config) {
  return {
    // capability options
  }
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

## Debugging Guide for Agents

**Systematic approach to fixing issues in the repository.**

### Test Failure Diagnosis

**When a test fails, follow this tree:**

```
Test fails with "Element not found"
├─ Is element actually in DOM?
│  ├─ No → Add to fixture or fix test data
│  └─ Yes → Continue
├─ Is element hidden?
│  ├─ Yes → Add .hidden modifier or fix visibility
│  └─ No → Continue
├─ Is text matching correct?
│  ├─ No → Use .exact modifier or fix text
│  └─ Yes → Continue
├─ Is spatial filter correct?
│  ├─ No → Check bounding box with findAll()
│  └─ Yes → Continue
└─ Enable debug logging and check cross-frame search

Test fails with "Timeout"
├─ Is element dynamic (loaded via AJAX)?
│  ├─ Yes → Wait for visibility with should.be.visible(t)
│  └─ No → Continue
├─ Is element behind modal/overlay?
│  ├─ Yes → Close modal first
│  └─ No → Continue
└─ Increase timeout in config or test-specific timeout

Test fails with "Stale element"
├─ Did page reload/navigate?
│  ├─ Yes → Re-query element after navigation
│  └─ No → Continue
├─ Was element removed from DOM?
│  ├─ Yes → Wait for new element to appear
│  └─ No → Continue
└─ Check for dynamic content updates

Test fails with "Permission denied" or "Cross-origin"
├─ Is using file:// protocol?
│  ├─ Yes → That's expected; use local HTML fixtures
│  └─ No → Continue
├─ Is cross-origin frame?
│  ├─ Yes → Check app/browser/browser-target.js for frame handling
│  └─ No → Check capabilities security settings
```

### Stack Inspection

```javascript
// In any method, inspect stack before/after
console.log('Stack before:', JSON.stringify(browser.stack, null, 2))

// Check stack structure
const lastItem = browser.stack[browser.stack.length - 1]
console.log('Last item type:', lastItem.type)
console.log('Last item data:', lastItem.id)
```

### Element Finding Debugging

```javascript
// Find all candidates (useful for debugging)
const allMatches = await browser.button('Submit').findAll()
console.log(`Found ${allMatches.length} matching elements`)

// Check bounding box (useful for spatial issues)
const element = await browser.button('Submit').find()
console.log('Bounding box:', await element.getBoundingBox())

// Check if hidden
const isVis = await browser.button('Submit').is.visible()
console.log('Is visible:', isVis)
```

### Cross-Frame Debugging

```javascript
// Enable debug logging in config
{ "debug": true }

// Check frame count
const frames = await browser.driver.findElements(By.css('iframe'))
console.log(`Found ${frames.length} frames`)

// Verify ElementFinder injection
const injected = await browser.driver.executeScript(
  'return typeof window.ElementFinder'
)
console.log('ElementFinder injected:', injected)
```

### Performance Debugging

```javascript
// Measure element finding time
console.time('Finding element')
const element = await browser.button('Submit').find()
console.timeEnd('Finding element')

// Check if multiple frames are searched unnecessarily
// Look for frame switching logs in debug mode
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
