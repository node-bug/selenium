# Configuration

Browser and session configuration using `.config/selenium.json`, environment variables, or command-line arguments.

## Configuration File

Create `.config/selenium.json`:

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

## Configuration Options

### browser
Browser to use. Cannot be set programmatically.

- `"chrome"` (default)
- `"firefox"`
- `"safari"`

```json
{ "browser": "firefox" }
```

### headless
Run in headless mode (no GUI). Useful for CI/CD.

```json
{ "headless": true }
```

**Default**: `false`

### incognito
Private browsing mode (no cookies/history saved).

```json
{ "incognito": true }
```

**Default**: `false`

### timeout
Default timeout in seconds for element operations.

```json
{ "timeout": 10 }
```

**Default**: `30`

### height / width
Browser window dimensions in pixels. `null` = default size.

```json
{
  "width": 1280,
  "height": 800
}
```

**Default**: `null` (driver default)

### downloadsPath
Directory for downloaded files.

```json
{ "downloadsPath": "./reports/downloads" }
```

### hub
Selenium Grid hub URL for distributed testing.

```json
{ "hub": "http://localhost:4444" }
```

**Default**: `null` (local WebDriver)

### Browser-Specific Options

#### Chrome Options
Passed as `goog:chromeOptions`:

```json
{
  "goog:chromeOptions": {
    "args": [
      "--no-sandbox",
      "--disable-dev-shm-usage",
      "--disable-gpu"
    ],
    "prefs": {
      "profile.default_content_settings.popups": 0,
      "download.default_directory": "./reports/downloads"
    }
  }
}
```

#### Firefox Options
Passed as `moz:firefoxOptions`:

```json
{
  "moz:firefoxOptions": {
    "args": ["-width", "1280", "-height", "800"],
    "prefs": {
      "browser.download.folderList": 2,
      "browser.download.manager.showWhenStarting": false
    }
  }
}
```

## Selection Methods

Configuration can be set via (in priority order):

1. **Command-line parameters**
   ```bash
   node script.js --browser=firefox
   ```

2. **Environment variables**
   ```bash
   export browser=firefox
   export headless=true
   node script.js
   ```

3. **Configuration file**
   ```bash
   # Uses .config/selenium.json
   node script.js
   ```

## Usage Examples

### Development (Visible Browser)
```json
{
  "browser": "chrome",
  "headless": false,
  "timeout": 10,
  "width": 1280,
  "height": 800
}
```

### CI/CD Pipeline
```json
{
  "browser": "chrome",
  "headless": true,
  "timeout": 30,
  "goog:chromeOptions": {
    "args": ["--no-sandbox", "--disable-dev-shm-usage"]
  }
}
```

### Testing with Private Session
```json
{
  "browser": "chrome",
  "incognito": true,
  "headless": true,
  "downloadsPath": "./test-downloads"
}
```

### Selenium Grid
```json
{
  "browser": "chrome",
  "hub": "http://selenium-grid:4444",
  "headless": true
}
```

## Code Usage

Access configuration in code:

```javascript
import WebBrowser from '@nodebug/selenium'

const browser = new WebBrowser()
await browser.start()

// Browser respects .config/selenium.json settings
```

Configuration is loaded automatically from `.config/selenium.json`. No programmatic API for browser selection—use configuration file, environment variables, or command-line arguments.
