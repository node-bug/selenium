---
name: 'Plugin System Skill'
description: 'Extend framework with custom plugins and hooks at runtime'
applies: ['app/plugin-manager.js']
examples:
  - 'Register custom plugins'
  - 'Add hooks (beforeClick, afterTypeText)'
  - 'Extend browser with custom methods'
  - 'Intercept interactions'
---

# Plugin System Skill

## Overview

WebBrowser includes a plugin system for extending functionality at runtime without modifying core code. Plugins can:

- Add custom methods to browser instance
- Hook into interaction lifecycle
- Intercept and modify data
- Add custom capabilities

## Basic Plugin Structure

### Plugin Object Format

```javascript
const myPlugin = {
  name: 'my-plugin',

  // Optional: Lifecycle hooks
  hooks: {
    beforeClick: (data) => data,
    afterTypeText: (data) => data,
    onError: (error) => {},
  },

  // Optional: Extend browser with new methods
  extend: (browser) => ({
    customMethod: () => {
      /* ... */
    },
    anotherMethod: () => {
      /* ... */
    },
  }),
}
```

---

## Registering Plugins

### Register a Plugin

```javascript
import WebBrowser from '@nodebug/selenium'

const browser = new WebBrowser()

// Register plugin
browser.use(myPlugin)

// Start browser (plugin is active)
await browser.start()
```

**Returns**: Browser instance for chaining  
**When to use**: Before `start()` is called

---

### Register with Options

Pass options to plugin:

```javascript
browser.use(myPlugin, {
  logLevel: 'debug',
  customOption: 'value',
})
```

**When to use**: When plugin needs configuration

---

## Plugin Types

### Type 1: Object Plugin

Static plugin definition:

```javascript
const loggerPlugin = {
  name: 'logger',

  hooks: {
    beforeClick: (data) => {
      console.log('Clicking:', data.element)
      return data
    },

    afterTypeText: (data) => {
      console.log('Typed:', data.text)
      return data
    },
  },
}

browser.use(loggerPlugin)
```

---

### Type 2: Factory Function Plugin

Dynamic plugin creation:

```javascript
const createTimerPlugin = (browser, options) => {
  const { threshold = 1000 } = options

  return {
    name: 'timer',

    hooks: {
      beforeClick: (data) => {
        data.startTime = Date.now()
        return data
      },

      afterClick: (data) => {
        const duration = Date.now() - data.startTime
        if (duration > threshold) {
          console.warn(`Click took ${duration}ms`)
        }
        return data
      },
    },
  }
}

browser.use(createTimerPlugin, { threshold: 500 })
```

---

## Available Hooks

### Element Interaction Hooks

#### `beforeClick(data)`

Called before element is clicked.

```javascript
hooks: {
  beforeClick: (data) => {
    console.log('About to click:', data.element)
    // Modify data if needed
    return data
  }
}
```

**Data object**:

```javascript
{
  element: WebElement,      // The element being clicked
  coordinates: { x, y },    // Click coordinates
  modifier: { alt, shift }  // Modifier keys
}
```

**Return**: Modified data object

---

#### `afterClick(data)`

Called after element is clicked.

```javascript
hooks: {
  afterClick: (data) => {
    console.log('Clicked successfully')
    return data
  }
}
```

---

#### `beforeTypeText(data)`

Called before text is typed.

```javascript
hooks: {
  beforeTypeText: (data) => {
    console.log('About to type:', data.text)
    return data
  }
}
```

**Data object**:

```javascript
{
  element: WebElement,
  text: string,
  clearFirst: boolean
}
```

---

#### `afterTypeText(data)`

Called after text is typed.

```javascript
hooks: {
  afterTypeText: (data) => {
    console.log('Typed:', data.text)
    return data
  }
}
```

---

#### `beforeDrag(data)`

Called before drag operation.

```javascript
hooks: {
  beforeDrag: (data) => {
    console.log('Dragging to:', data.target)
    return data
  }
}
```

---

#### `afterDrag(data)`

Called after drag operation.

```javascript
hooks: {
  afterDrag: (data) => {
    console.log('Drag completed')
    return data
  }
}
```

---

### Error Handling

#### `onError(error)`

Called when any error occurs.

```javascript
hooks: {
  onError: (error) => {
    console.error('Framework error:', error)
    // Can throw to prevent further execution
    // Or return to allow continuation
  }
}
```

---

### Session Hooks

#### `beforeStart(data)`

Called before browser starts.

```javascript
hooks: {
  beforeStart: (data) => {
    console.log('Starting browser...')
    return data
  }
}
```

---

#### `afterStart(data)`

Called after browser starts.

```javascript
hooks: {
  afterStart: (data) => {
    console.log('Browser started successfully')
    return data
  }
}
```

---

#### `beforeClose(data)`

Called before browser closes.

```javascript
hooks: {
  beforeClose: (data) => {
    console.log('Closing browser...')
    return data
  }
}
```

---

#### `afterClose(data)`

Called after browser closes.

```javascript
hooks: {
  afterClose: (data) => {
    console.log('Browser closed')
    return data
  }
}
```

---

## Extending Browser

Add custom methods to browser instance:

### Basic Extension

```javascript
const myPlugin = {
  name: 'custom-methods',

  extend: (browser) => ({
    // Custom method added to browser
    customMethod: async () => {
      console.log('Custom method called')
    },

    // Access browser methods
    getPageStats: async () => {
      const title = await browser.getTitle()
      const url = await browser.currentUrl()
      return { title, url }
    },
  }),
}

browser.use(myPlugin)
await browser.start()

// Now available on browser instance
await browser.customMethod()
const stats = await browser.getPageStats()
```

---

### Chainable Methods

Make extended methods return browser for chaining:

```javascript
extend: (browser) => ({
  logAction: (message) => {
    console.log(message)
    return browser // Return for chaining
  },

  delay: async (ms) => {
    await browser.wait(ms)
    return browser
  },
})
```

**Usage**:

```javascript
await browser.logAction('Starting test').delay(1000).logAction('Continue test')
```

---

### Accessing Plugin Options

```javascript
const createPlugin = (browser, options) => {
  const { prefix = 'LOG' } = options

  return {
    name: 'configurable',

    extend: (browser) => ({
      log: (message) => {
        console.log(`[${prefix}] ${message}`)
        return browser
      },
    }),
  }
}

browser.use(createPlugin, { prefix: 'DEBUG' })

await browser.log('Test message')
// Output: [DEBUG] Test message
```

---

## Common Patterns

### Pattern 1: Activity Logger

Log all interactions:

```javascript
const activityLogger = {
  name: 'activity-logger',

  hooks: {
    beforeClick: (data) => {
      console.log(`[CLICK] Element found`)
      return data
    },

    beforeTypeText: (data) => {
      console.log(`[TYPE] "${data.text}"`)
      return data
    },

    onError: (error) => {
      console.error(`[ERROR] ${error.message}`)
    },
  },
}

browser.use(activityLogger)
```

---

### Pattern 2: Performance Monitor

Track operation timing:

```javascript
const performanceMonitor = (browser, options = {}) => {
  const { threshold = 1000 } = options
  const timings = {}

  return {
    name: 'performance-monitor',

    hooks: {
      beforeClick: (data) => {
        data.startTime = Date.now()
        return data
      },

      afterClick: (data) => {
        const duration = Date.now() - data.startTime
        if (duration > threshold) {
          console.warn(`Click took ${duration}ms (threshold: ${threshold}ms)`)
        }
        return data
      },
    },

    extend: (browser) => ({
      getTimings: () => timings,
    }),
  }
}

browser.use(performanceMonitor, { threshold: 500 })
```

---

### Pattern 3: Screenshot Capture

Capture screenshots on errors:

```javascript
const screenshotCapture = {
  name: 'screenshot-capture',

  hooks: {
    onError: async (error) => {
      const timestamp = new Date().toISOString()
      const filename = `error-${timestamp}.png`

      // Capture screenshot if browser available
      console.log(`Screenshot saved: ${filename}`)

      // Continue with error
      throw error
    },
  },
}

browser.use(screenshotCapture)
```

---

### Pattern 4: Data Transformer

Modify interaction data:

```javascript
const dataTransformer = {
  name: 'data-transformer',

  hooks: {
    beforeTypeText: (data) => {
      // Trim whitespace from text
      data.text = data.text.trim()

      // Escape special characters
      data.text = data.text.replace(/[<>]/g, '')

      return data
    },
  },
}

browser.use(dataTransformer)
```

---

### Pattern 5: Custom DSL

Add domain-specific methods:

```javascript
const customDSL = {
  name: 'custom-dsl',

  extend: (browser) => ({
    // Login shortcut
    login: async (email, password) => {
      await browser.textbox('Email').write(email)
      await browser.textbox('Password').write(password)
      await browser.button('Sign In').click()
      return browser
    },

    // Logout shortcut
    logout: async () => {
      await browser.button('Menu').click()
      await browser.link('Logout').click()
      return browser
    },
  }),
}

browser.use(customDSL)

// Usage
await browser.login('user@example.com', 'password123')
// ... do stuff ...
await browser.logout()
```

---

### Pattern 6: Retry Logic

Retry failed operations:

```javascript
const retryPlugin = (browser, options = {}) => {
  const { maxRetries = 3, delayMs = 500 } = options

  return {
    name: 'retry',

    hooks: {
      onError: async (error) => {
        // Could implement retry logic here
        console.log(`Attempt failed, retrying...`)
        await browser.wait(delayMs)
        // Re-throw to propagate error
        throw error
      },
    },
  }
}

browser.use(retryPlugin, { maxRetries: 3, delayMs: 1000 })
```

---

## Best Practices

1. **Meaningful names** - Use descriptive plugin names
2. **Non-destructive hooks** - Always return modified data
3. **Error handling** - Properly handle errors in hooks
4. **Documentation** - Document custom methods and options
5. **Chainable methods** - Return browser for fluent API
6. **Separation of concerns** - Each plugin does one thing
7. **Testing** - Test plugins independently

---

## Advanced Features

### Accessing Plugin Manager

```javascript
const browser = new WebBrowser()

// Get plugins manager
const manager = browser.plugins

// List registered plugins
const plugins = manager.getRegistered()

// Check if plugin is registered
const isRegistered = manager.isRegistered('my-plugin')
```

---

### Lifecycle Management

```javascript
const lifecyclePlugin = {
  name: 'lifecycle',

  hooks: {
    beforeStart: async (data) => {
      console.log('Initializing...')
      return data
    },

    afterStart: async (data) => {
      console.log('Ready to test')
      return data
    },

    beforeClose: async (data) => {
      console.log('Cleaning up...')
      return data
    },
  },
}
```

---

## Troubleshooting

| Issue                       | Solution                                                      |
| --------------------------- | ------------------------------------------------------------- |
| Plugin not registered       | Call `browser.use()` before `browser.start()`                 |
| Custom method not available | Check plugin `extend()` is properly returning object          |
| Hook not firing             | Verify hook name is exact, check hook is called at right time |
| Data not being modified     | Return modified data from hook                                |
| Plugin conflicts            | Use unique plugin names, avoid overriding existing methods    |

---

## Related Resources

- [Framework Architecture](../docs/ENGINEERING.md) - Plugin system design
- [API Reference](../docs/API-REFERENCE.md) - Core methods
- [Browser Control](browser.instructions.md) - Session management
