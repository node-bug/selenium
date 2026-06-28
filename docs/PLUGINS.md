# Plugin System

WebBrowser supports runtime extension through plugins. External npm packages can extend functionality without modifying the core library.

## Plugin Types

### 1. Object Plugin

```javascript
browser.use({
  name: 'my-plugin',
  wrap: 'screenshot', // Auto-wrap methods for hooks
  hooks: {
    beforeScreenshot: (data) => {
      /* modify screenshot options */
    },
    afterScreenshot: ({ dataUrl, width, height }) => {
      /* process screenshot result object */
    },
  },
  extend: (browser) => ({
    customMethod: () => {
      /* custom functionality */
    },
  }),
})
```

### 2. Factory Function Plugin

```javascript
browser.use((browser, options) => ({
  name: 'dynamic-plugin',
  wrap: ['click', 'screenshot'], // Wrap multiple methods
  hooks: {
    beforeClick: (data) => {
      /* intercept clicks */
    },
  },
  extend: () => ({
    dynamicMethod: () => {},
  }),
}))
```

## Extension Points

### wrap

Specify methods to automatically wrap with hooks. Hooks will be named `beforeMethodName` and `afterMethodName`:

```javascript
browser.use({
  name: 'my-plugin',
  wrap: ['screenshot', 'click', 'goto'], // Can be string or array
  hooks: {
    beforeScreenshot: (data) => {
      /* ... */
    },
    afterScreenshot: ({ dataUrl, width, height }) => {
      /* ... */
    },
    beforeClick: (args) => {
      /* ... */
    },
    afterClick: (result) => {
      /* ... */
    },
  },
})
```

### Extend

Add custom methods to the browser instance:

```javascript
browser.use({
  name: 'custom-methods',
  extend: (browser) => ({
    waitForAnimation: async () => {
      /* custom wait logic */
    },
    highlightElement: async (selector) => {
      /* visual debugging */
    },
  }),
})

// Now available:
await browser.waitForAnimation()
await browser.highlightElement('Submit Button')
```

### Middleware

Wrap existing methods with before/after logic:

```javascript
browser.use({
  name: 'logging-plugin',
  middleware: {
    before: {
      click: (args) => {
        console.log(`Clicking: ${args[0]}`)
        return args
      },
    },
    after: {
      click: (result) => {
        console.log('Click completed')
        return result
      },
    },
  },
})
```

## Plugin Manager API

Access the plugin manager through `browser.plugins`:

```javascript
// Get all registered plugins
const plugins = browser.plugins.getPlugins()

// Get a specific plugin by name
const myPlugin = browser.plugins.getPlugin('my-plugin')

// Unregister a plugin
browser.plugins.unregister('my-plugin')
```

## Creating External Plugins

### package.json

```json
{
  "name": "webbrowser-screenshot-comparison",
  "peerDependencies": {
    "@nodebug/selenium": "^5.0.0"
  }
}
```

### Example Plugin Structure

See `examples/screenshot-comparison-plugin.js` for a complete implementation of an external plugin that adds visual regression testing capabilities.

```javascript
// my-webbrowser-plugin.js
module.exports = {
  name: 'screenshot-enhancer',
  wrap: ['screenshot'],
  hooks: {
    beforeScreenshot: (options) => {
      // Add timestamp to screenshot filename
      options.timestamp = Date.now()
      return options
    },
    afterScreenshot: ({ dataUrl, width, height }) => {
      // Add watermark or process the screenshot result object
      return processScreenshot({ dataUrl, width, height })
    },
  },
  extend: (browser) => ({
    compareScreenshots: async (before, after) => {
      // Custom comparison logic
      return compareImages(before, after)
    },
  }),
}
```

## Complete External Plugin Example

The `examples/screenshot-comparison-plugin.js` file demonstrates a full-featured external plugin that adds visual regression testing capabilities:

```javascript
import WebBrowser from '@nodebug/selenium'
import screenshotComparison from 'webbrowser-screenshot-comparison'

const browser = new WebBrowser()
await browser.start()

// Register external plugin - NO CORE MODIFICATIONS NEEDED
browser.use(screenshotComparison, { threshold: 0.01 })

// Use extended functionality
await browser.goto('https://example.com')
const result = await browser.get.screenshot({
  baseline: './baselines/home.png',
})
console.log(result.comparison.match) // true/false
```

## Hook Signatures

### Before Hooks

Receive the arguments that would be passed to the wrapped method:

- `beforeClick`: receives `[element, options]`
- `beforeScreenshot`: receives `[options]`
- `beforeGoto`: receives `[url]`

### After Hooks

Receive the result returned by the wrapped method:

- `afterClick`: receives the click result
- `afterScreenshot`: receives the screenshot result object `{ dataUrl, width, height }`
- `afterGoto`: receives the navigation result

### Important Notes

1. Hooks can modify and return values to affect subsequent hooks or the original method call
2. Returning `null` or `undefined` from a before hook will use the original arguments
3. Hooks are executed in the order plugins were registered
4. If a hook throws an error, it will be caught and logged, but won't stop other hooks from executing
5. External plugins should declare `@nodebug/selenium` as a peerDependency in their package.json
6. Plugins can optionally lazy-load dependencies to avoid requiring users to install packages they don't use

WebBrowser supports runtime extension through plugins. External npm packages can extend functionality without modifying the core library.

## Plugin Types

### 1. Object Plugin

```javascript
browser.use({
  name: 'my-plugin',
  wrap: 'screenshot', // Auto-wrap methods for hooks
  hooks: {
    beforeScreenshot: (data) => {
      /* modify screenshot options */
    },
    afterScreenshot: ({ dataUrl, width, height }) => {
      /* process screenshot result object */
    },
  },
  extend: (browser) => ({
    customMethod: () => {
      /* custom functionality */
    },
  }),
})
```

### 2. Factory Function Plugin

```javascript
browser.use((browser, options) => ({
  name: 'dynamic-plugin',
  wrap: ['click', 'screenshot'], // Wrap multiple methods
  hooks: {
    beforeClick: (data) => {
      /* intercept clicks */
    },
  },
  extend: () => ({
    dynamicMethod: () => {},
  }),
}))
```

## Extension Points

### wrap

Specify methods to automatically wrap with hooks. Hooks will be named `beforeMethodName` and `afterMethodName`:

```javascript
browser.use({
  name: 'my-plugin',
  wrap: ['screenshot', 'click', 'goto'], // Can be string or array
  hooks: {
    beforeScreenshot: (data) => {
      /* ... */
    },
    afterScreenshot: ({ dataUrl, width, height }) => {
      /* ... */
    },
    beforeClick: (args) => {
      /* ... */
    },
    afterClick: (result) => {
      /* ... */
    },
  },
})
```

### Extend

Add custom methods to the browser instance:

```javascript
browser.use({
  name: 'custom-methods',
  extend: (browser) => ({
    waitForAnimation: async () => {
      /* custom wait logic */
    },
    highlightElement: async (selector) => {
      /* visual debugging */
    },
  }),
})

// Now available:
await browser.waitForAnimation()
await browser.highlightElement('Submit Button')
```

### Middleware

Wrap existing methods with before/after logic:

```javascript
browser.use({
  name: 'logging-plugin',
  middleware: {
    before: {
      click: (args) => {
        console.log(`Clicking: ${args[0]}`)
        return args
      },
    },
    after: {
      click: (result) => {
        console.log('Click completed')
        return result
      },
    },
  },
})
```

## Plugin Manager API

Access the plugin manager through `browser.plugins`:

```javascript
// Get all registered plugins
const plugins = browser.plugins.getPlugins()

// Get a specific plugin by name
const myPlugin = browser.plugins.getPlugin('my-plugin')

// Unregister a plugin
browser.plugins.unregister('my-plugin')
```

## Creating External Plugins

### package.json

```json
{
  "name": "webbrowser-screenshot-comparison",
  "peerDependencies": {
    "@nodebug/selenium": "^5.0.0"
  }
}
```

### Example Plugin Structure

```javascript
// my-webbrowser-plugin.js
module.exports = {
  name: 'screenshot-enhancer',
  wrap: ['screenshot'],
  hooks: {
    beforeScreenshot: (options) => {
      // Add timestamp to screenshot filename
      options.timestamp = Date.now()
      return options
    },
    afterScreenshot: ({ dataUrl, width, height }) => {
      // Add watermark or process the screenshot result object
      return processScreenshot({ dataUrl, width, height })
    },
  },
  extend: (browser) => ({
    compareScreenshots: async (before, after) => {
      // Custom comparison logic
      return compareImages(before, after)
    },
  }),
}
```

## Hook Signatures

### Before Hooks

Receive the arguments that would be passed to the wrapped method:

- `beforeClick`: receives `[element, options]`
- `beforeScreenshot`: receives `[options]`
- `beforeGoto`: receives `[url]`

### After Hooks

Receive the result returned by the wrapped method:

- `afterClick`: receives the click result
- `afterScreenshot`: receives the screenshot result object `{ dataUrl, width, height }`
- `afterGoto`: receives the navigation result

### Important Notes

1. Hooks can modify and return values to affect subsequent hooks or the original method call
2. Returning `null` or `undefined` from a before hook will use the original arguments
3. Hooks are executed in the order plugins were registered
4. If a hook throws an error, it will be caught and logged, but won't stop other hooks from executing

WebBrowser supports runtime extension through plugins. External npm packages can extend functionality without modifying the core library.

## Plugin Types

### 1. Object Plugin

```javascript
browser.use({
  name: 'my-plugin',
  wrap: 'screenshot', // Auto-wrap methods for hooks
  hooks: {
    beforeScreenshot: (data) => {
      /* modify screenshot options */
    },
    afterScreenshot: ({ dataUrl, width, height }) => {
      /* process screenshot result object */
    },
  },
  extend: (browser) => ({
    customMethod: () => {
      /* custom functionality */
    },
  }),
})
```

### 2. Factory Function Plugin

```javascript
browser.use((browser, options) => ({
  name: 'dynamic-plugin',
  wrap: ['click', 'screenshot'], // Wrap multiple methods
  hooks: {
    beforeClick: (data) => {
      /* intercept clicks */
    },
  },
  extend: () => ({
    dynamicMethod: () => {},
  }),
}))
```

## Extension Points

### wrap

Specify methods to automatically wrap with hooks. Hooks will be named `beforeMethodName` and `afterMethodName`:

```javascript
browser.use({
  name: 'my-plugin',
  wrap: ['screenshot', 'click', 'goto'], // Can be string or array
  hooks: {
    beforeScreenshot: (data) => {
      /* ... */
    },
    afterScreenshot: ({ dataUrl, width, height }) => {
      /* ... */
    },
    beforeClick: (args) => {
      /* ... */
    },
    afterClick: (result) => {
      /* ... */
    },
  },
})
```

### Extend

Add custom methods to the browser instance:

```javascript
browser.use({
  name: 'custom-methods',
  extend: (browser) => ({
    waitForAnimation: async () => {
      /* custom wait logic */
    },
    highlightElement: async (selector) => {
      /* visual debugging */
    },
  }),
})

// Now available:
await browser.waitForAnimation()
await browser.highlightElement('Submit Button')
```

### Middleware

Wrap existing methods with before/after logic:

```javascript
browser.use({
  name: 'logging-plugin',
  middleware: {
    before: {
      click: (args) => {
        console.log(`Clicking: ${args[0]}`)
        return args
      },
    },
    after: {
      click: (result) => {
        console.log('Click completed')
        return result
      },
    },
  },
})
```

## Plugin Manager API

Access the plugin manager through `browser.plugins`:

```javascript
// Get all registered plugins
const plugins = browser.plugins.getPlugins()

// Get a specific plugin by name
const myPlugin = browser.plugins.getPlugin('my-plugin')

// Unregister a plugin
browser.plugins.unregister('my-plugin')
```

## Creating External Plugins

### package.json

```json
{
  "name": "webbrowser-screenshot-comparison",
  "peerDependencies": {
    "@nodebug/selenium": "^5.0.0"
  }
}
```

### Example Plugin Structure

```javascript
// my-webbrowser-plugin.js
module.exports = {
  name: 'screenshot-enhancer',
  wrap: ['screenshot'],
  hooks: {
    beforeScreenshot: (options) => {
      // Add timestamp to screenshot filename
      options.timestamp = Date.now()
      return options
    },
    afterScreenshot: ({ dataUrl, width, height }) => {
      // Add watermark or process the screenshot result object
      return processScreenshot({ dataUrl, width, height })
    },
  },
  extend: (browser) => ({
    compareScreenshots: async (before, after) => {
      // Custom comparison logic
      return compareImages(before, after)
    },
  }),
}
```

## Hook Signatures

### Before Hooks

Receive the arguments that would be passed to the wrapped method:

- `beforeClick`: receives `[element, options]`
- `beforeScreenshot`: receives `[options]`
- `beforeGoto`: receives `[url]`

### After Hooks

Receive the result returned by the wrapped method:

- `afterClick`: receives the click result
- `afterScreenshot`: receives the screenshot result object `{ dataUrl, width, height }`
- `afterGoto`: receives the navigation result

### Important Notes

1. Hooks can modify and return values to affect subsequent hooks or the original method call
2. Returning `null` or `undefined` from a before hook will use the original arguments
3. Hooks are executed in the order plugins were registered
4. If a hook throws an error, it will be caught and logged, but won't stop other hooks from executing

WebBrowser supports runtime extension through plugins. External npm packages can extend functionality without modifying the core library.

## Plugin Types

### 1. Object Plugin

```javascript
browser.use({
  name: 'my-plugin',
  wrap: 'screenshot', // Auto-wrap methods for hooks
  hooks: {
    beforeScreenshot: (data) => {
      /* modify screenshot options */
    },
    afterScreenshot: ({ dataUrl, width, height }) => {
      /* process screenshot result object */
    },
  },
  extend: (browser) => ({
    customMethod: () => {
      /* custom functionality */
    },
  }),
})
```

### 2. Factory Function Plugin

```javascript
browser.use((browser, options) => ({
  name: 'dynamic-plugin',
  wrap: ['click', 'screenshot'], // Wrap multiple methods
  hooks: {
    beforeClick: (data) => {
      /* intercept clicks */
    },
  },
  extend: () => ({
    dynamicMethod: () => {},
  }),
}))
```

## Extension Points

### wrap

Specify methods to automatically wrap with hooks. Hooks will be named `beforeMethodName` and `afterMethodName`:

```javascript
browser.use({
  name: 'my-plugin',
  wrap: ['screenshot', 'click', 'goto'], // Can be string or array
  hooks: {
    beforeScreenshot: (data) => {
      /* ... */
    },
    afterScreenshot: ({ dataUrl, width, height }) => {
      /* ... */
    },
    beforeClick: (args) => {
      /* ... */
    },
    afterClick: (result) => {
      /* ... */
    },
  },
})
```

### Extend

Add custom methods to the browser instance:

```javascript
browser.use({
  name: 'custom-methods',
  extend: (browser) => ({
    waitForAnimation: async () => {
      /* custom wait logic */
    },
    highlightElement: async (selector) => {
      /* visual debugging */
    },
  }),
})

// Now available:
await browser.waitForAnimation()
await browser.highlightElement('Submit Button')
```

### Middleware

Wrap existing methods with before/after logic:

```javascript
browser.use({
  name: 'logging-plugin',
  middleware: {
    before: {
      click: (args) => {
        console.log(`Clicking: ${args[0]}`)
        return args
      },
    },
    after: {
      click: (result) => {
        console.log('Click completed')
        return result
      },
    },
  },
})
```

## Creating External Plugins

### package.json

```json
{
  "name": "webbrowser-screenshot-comparison",
  "peerDependencies": {
    "@nodebug/selenium": "^5.0.0"
  }
}
```

### Plugin Implementation

```javascript
// index.js
import pixelmatch from 'pixelmatch'
import { PNG } from 'pngjs'
import fs from 'fs'

export default function screenshotComparisonPlugin(browser, options = {}) {
  const { threshold = 0.1, updateBaselines = false } = options

  return {
    name: 'screenshot-comparison',
    wrap: 'screenshot', // Auto-wrap screenshot method for hooks

    hooks: {
      afterScreenshot: async ({ dataUrl, width, height, options }) => {
        if (!options.baseline) return { dataUrl, width, height }

        // Read baseline image
        const baselineBuffer = await fs.promises.readFile(options.baseline)
        const actualBuffer = Buffer.from(dataUrl, 'base64')

        const img1 = PNG.sync.read(baselineBuffer)
        const img2 = PNG.sync.read(actualBuffer)

        // Check dimensions
        if (img1.width !== img2.width || img1.height !== img2.height) {
          return {
            dataUrl,
            width,
            height,
            comparison: {
              match: false,
              reason: 'dimensions-mismatch',
              baseline: { width: img1.width, height: img1.height },
              actual: { width: img2.width, height: img2.height },
            },
          }
        }

        // Compare pixels
        const diff = new PNG({ width: img1.width, height: img1.height })
        const mismatches = pixelmatch(
          img1.data,
          img2.data,
          diff.data,
          img1.width,
          img1.height,
          { threshold: threshold / 255 },
        )

        const result = {
          dataUrl,
          width,
          height,
          comparison: {
            match: mismatches === 0,
            mismatchedPixels: mismatches,
            threshold: mismatches / (img1.width * img1.height),
          },
        }

        // Save diff image if requested
        if (!result.comparison.match && options.saveDiff) {
          const diffPath = options.diffPath || 'screenshot-diff.png'
          await fs.promises.writeFile(diffPath, PNG.sync.write(diff))
          result.comparison.diffPath = diffPath
        }

        // Update baseline if requested
        if (updateBaselines && !result.comparison.match) {
          await fs.promises.writeFile(options.baseline, actualBuffer)
          result.comparison.baselineUpdated = true
        }

        return result
      },
    },

    extend: () => ({
      assertVisual: async (baselinePath, threshold = 0.1) => {
        const screenshot = await browser.get.screenshot()
        const result = await browser.visual.compare(screenshot.dataUrl, {
          baseline: baselinePath,
          threshold,
        })
        if (!result.match) {
          throw new Error(
            `Visual assertion failed: ${result.mismatchedPixels} pixels differ`,
          )
        }
        return result
      },
    }),
  }
}
```

## Usage with External Plugin

```javascript
import WebBrowser from '@nodebug/selenium'
import screenshotComparison from 'webbrowser-screenshot-comparison'

const browser = new WebBrowser()
await browser.start()

// Register external plugin - NO CORE MODIFICATIONS NEEDED
browser.use(screenshotComparison, { threshold: 0.01 })

// Use extended functionality
await browser.goto('https://example.com')
const result = await browser.get.screenshot({
  baseline: './baselines/home.png',
})
console.log(result.comparison.match) // true/false
```

// Register external plugin
browser.use(screenshotComparison, { threshold: 0.01 });

// Use extended functionality
await browser.goto('https://example.com');
const result = await browser.get.screenshot({ baseline: './baselines/home.png' });
console.log(result.comparison.match); // true/false

```

## Available Plugin Methods

### browser.use(plugin, options)
Register a plugin at runtime.

### browser.plugins
Access the plugin manager for advanced operations.

### browser.plugins.getPlugin(name)
Get a specific plugin by name.

### browser.plugins.unregister(name)
Remove a plugin by name.
```
