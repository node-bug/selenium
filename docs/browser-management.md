# Browser Management

This document explains how to start and stop browser sessions using the WebBrowser library.

## Starting a Browser Session

To start a new browser session, you need to create a new instance of the `WebBrowser` class and call the `start()` method.

### Basic Usage

```javascript
import WebBrowser from '@nodebug/selenium'

const browser = new WebBrowser()
await browser.start()
```

### Browser Selection

The browser type is determined by configuration and cannot be set programmatically. The browser can be selected using:

1. **Configuration file**: Using `.config/selenium.json`
2. **Environment variables**: Setting `browser` environment variable
3. **Command line parameters**: Passing as Node.js command line arguments

#### Using Configuration File

Create a `.config/selenium.json` file with the desired browser:

```json
{
  "browser": "firefox",
  "headless": true,
  "timeout": 10
}
```

#### Using Environment Variables

Set the browser type using environment variables:

```bash
export browser=firefox
node your-script.js
```

Or set it directly in the command:

```bash
browser=firefox node your-script.js
```

#### Using Command Line Parameters

You can also set the browser through command line arguments when running Node.js:

```bash
node your-script.js --browser=firefox
```

### Browser Options

Additional browser options can be configured in the selenium.json file:

```json
{
  "browser": "chrome",
  "headless": true,
  "timeout": 10,
  "downloadsPath": "./reports/downloads",
  "incognito": false,
  "height": null,
  "width": null,
  "hub": null,
  "goog:chromeOptions": {
    "args": ["--no-sandbox", "--disable-dev-shm-usage"]
  }
}
```

#### Headless Mode

Headless mode allows the browser to run without a graphical user interface. This is useful for running tests in CI/CD environments or when you don't need to see the browser window.

```json
{
  "browser": "chrome",
  "headless": true
}
```

When `headless` is set to `true`, the browser will run in headless mode. This is particularly useful for automated testing.

#### Incognito Mode

Incognito mode provides a private browsing session where no cookies or browsing history are saved.

```json
{
  "browser": "chrome",
  "incognito": true
}
```

When `incognito` is set to `true`, the browser will run in incognito mode, which is useful for testing scenarios where you want to avoid persistent data.

#### Other Configuration Options

- `timeout`: Sets the default timeout in seconds for element operations
- `downloadsPath`: Specifies where downloaded files should be saved
- `height` and `width`: Sets the browser window dimensions
- `hub`: Specifies a Selenium Grid hub URL for distributed testing

## Stopping a Browser Session

To close a browser session, use the `close()` method:

```javascript
import WebBrowser from '@nodebug/selenium'

const browser = new WebBrowser()
await browser.start()

// Do some browser operations...

// Close the browser
await browser.close()
```

## Complete Example

Here's a complete example showing how to start, use, and close a browser session:

```javascript
import WebBrowser from '@nodebug/selenium'

async function example() {
  const browser = new WebBrowser()

  // Start the browser
  await browser.start()

  // Navigate to a page
  await browser.goto('https://example.com')

  // Find and interact with elements
  await browser.element('h1').click()

  // Close the browser
  await browser.close()
}

example()
```

## Browser Lifecycle

The WebBrowser library automatically handles browser lifecycle management:

1. When `start()` is called, it will close any existing session
2. The `close()` method properly closes the browser session and cleans up resources
3. The library also handles cleanup on process termination (SIGINT, SIGTERM, etc.)

## Notes

- The `start()` method is required before performing any browser operations
- The `close()` method should be called to properly clean up browser resources
- The library handles automatic cleanup of sessions when the process exits
