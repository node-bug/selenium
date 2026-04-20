# Skill: @nodebug/selenium Lifecycle & Config

## Initialization

- `await browser.new()` or `await browser.start()` initializes the session.
- **Configuration**: Settings (headless, incognito, proxy, userAgent) are pulled from `.config/selenium.json` or Environment Variables (`browser=firefox`).

## Properties

- **`browser.driver`**: Access the raw Selenium WebDriver instance.
- **`browser.timeout`**: Access the default timeout in ms.
- **`browser.consoleErrors()`**: Retrieve browser console logs for debugging.
- **`browser.reset()`**: Reset the browser session (clear cookies, storage, close extra windows).
- **`browser.close()`**: Close the browser session.

## Configuration File

Create a `.config/selenium.json` file with the desired browser configuration:

```json
{
  "browser": "firefox",
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

## Environment Variables

Set browser type using environment variables:

```bash
export browser=firefox
node your-script.js
```

Or set it directly in the command:

```bash
browser=firefox node your-script.js
```

## Command Line Parameters

Set browser through command line arguments:

```bash
node your-script.js --browser=firefox
```
