# Browser Management

Session lifecycle and browser selection. See [Configuration](CONFIGURATION.md) for setup options.

## Starting a Browser Session

```javascript
import WebBrowser from '@nodebug/selenium'

const browser = new WebBrowser()
await browser.start()
```

The `start()` method initializes a new browser session based on configuration.

## Stopping a Browser Session

```javascript
await browser.close()
```

The library automatically handles cleanup on process termination (SIGINT, SIGTERM).

## Browser Selection

The browser type cannot be set programmatically. Instead, configure it via (in priority order):

1. **Command-line arguments**
   ```bash
   node script.js --browser=firefox
   ```

2. **Environment variables**
   ```bash
   export browser=firefox
   node script.js
   ```

3. **Configuration file** (`.config/selenium.json`)
   ```json
   { "browser": "chrome" }
   ```

See [Configuration Guide](CONFIGURATION.md) for all options.

## Browser Lifecycle

```javascript
// 1. Create instance
const browser = new WebBrowser()

// 2. Start session
await browser.start()

// 3. Perform operations
await browser.goto('https://example.com')
// ... more operations ...

// 4. Close session
await browser.close()
```

The library handles cleanup automatically when:
- `close()` is explicitly called
- Process exits (SIGINT, SIGTERM)
- Uncaught exceptions occur

## Complete Example

```javascript
import WebBrowser from '@nodebug/selenium'

async function main() {
  const browser = new WebBrowser()

  try {
    // Start
    await browser.start()

    // Use
    await browser.goto('https://example.com')
    await browser.button('Submit').click()

    // Close
    await browser.close()
  } catch (error) {
    console.error('Error:', error.message)
    await browser.close()  // Cleanup on error
  }
}

main()
```

## Configuration

See [Configuration Guide](CONFIGURATION.md) for:
- Setting browser type
- Headless mode
- Incognito/private mode
- Window dimensions
- Custom browser options
- Selenium Grid hub URL
- Downloads path

## See Also

- [Configuration](CONFIGURATION.md) - Browser and session configuration
- [API Reference](API-REFERENCE.md#browser-control) - Browser control methods

