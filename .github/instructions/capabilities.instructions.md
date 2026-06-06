---
name: 'Cross-Browser Configuration Skill'
description: 'Configure and launch Chrome, Firefox, Safari, and Edge browsers'
applies:
  [
    'app/capabilities/chrome.js',
    'app/capabilities/firefox.js',
    'app/capabilities/safari.js',
    'app/capabilities/preferences.js',
  ]
examples:
  - 'Configure Chrome with options'
  - 'Set up Firefox for testing'
  - 'Configure Safari automation'
  - 'Set browser capabilities'
  - 'Control headless mode'
---

# Cross-Browser Configuration Skill

## Overview

WebBrowser supports multiple browsers with consistent API across all. This skill covers configuring and setting up Chrome, Firefox, Safari, and Edge.

## Configuration

### Config File Location

Create `.config/selenium.json` in your project root:

```json
{
  "browser": "chrome",
  "headless": false,
  "timeout": 30,
  "baseUrl": "https://example.com",
  "window": {
    "width": 1920,
    "height": 1080
  }
}
```

---

## Browser Selection

### Chrome Configuration

Chrome is the default browser.

```json
{
  "browser": "chrome",
  "headless": false,
  "chromeOptions": {
    "excludeSwitches": ["enable-automation"],
    "useAutomationExtension": false
  }
}
```

**Chrome-specific options**:

- `headless` - Run without GUI (true/false)
- `args` - Chrome command-line arguments
- `prefs` - Chrome preferences
- `excludeSwitches` - Disable specific Chrome features
- `useAutomationExtension` - Disable automation extension

**Common Chrome arguments**:

- `--headless` - Headless mode
- `--no-sandbox` - Disable sandbox (use with caution)
- `--disable-gpu` - Disable GPU
- `--start-maximized` - Start maximized
- `--window-size=1920,1080` - Set window size
- `--proxy-server=` - Set proxy

---

### Firefox Configuration

```json
{
  "browser": "firefox",
  "headless": false,
  "firefoxOptions": {
    "args": ["--width=1920", "--height=1080"]
  }
}
```

**Firefox-specific options**:

- `headless` - Headless mode
- `args` - Firefox command-line arguments
- `prefs` - Firefox preferences

**Common Firefox arguments**:

- `--headless` - Headless mode
- `--start-maximized` - Start maximized
- `--width=1920` - Set width
- `--height=1080` - Set height
- `--profile=/path` - Use specific profile

---

### Safari Configuration

```json
{
  "browser": "safari"
}
```

**Notes**:

- Safari requires macOS
- Limited customization options
- Must be available in system PATH
- Technology preview for automation

---

### Edge Configuration

```json
{
  "browser": "edge",
  "headless": false
}
```

**Edge-specific options**:

- Similar to Chrome (uses Chromium)
- Same command-line arguments as Chrome

---

## Common Configuration Options

### Headless Mode

Run browser without GUI (faster, good for CI/CD):

```json
{
  "browser": "chrome",
  "headless": true
}
```

**When to use**:

- CI/CD pipelines
- Server environments
- Performance testing
- Parallel test runs

---

### Window Size

Set browser window dimensions:

```json
{
  "window": {
    "width": 1920,
    "height": 1080
  }
}
```

**Responsive testing sizes**:

```json
{
  "window": {
    "width": 375,
    "height": 667
  }
}
```

---

### Timeout

Set default wait timeout in seconds:

```json
{
  "timeout": 30
}
```

**When to adjust**:

- Increase for slow servers (60+)
- Decrease for fast tests (5-10)

---

### Base URL

Set default base URL for relative navigation:

```json
{
  "baseUrl": "https://example.com"
}
```

**Usage in code**:

```javascript
// Instead of full URL
await browser.goto('https://example.com/login')

// Use relative path
await browser.goto('/login')
```

---

### Downloads Directory

Configure where files are downloaded:

```json
{
  "downloadDir": "./downloads"
}
```

---

## Environment-Specific Configuration

### Development

```json
{
  "browser": "chrome",
  "headless": false,
  "timeout": 30,
  "window": { "width": 1920, "height": 1080 }
}
```

### CI/CD Pipeline

```json
{
  "browser": "chrome",
  "headless": true,
  "timeout": 60,
  "chromeOptions": {
    "args": ["--no-sandbox", "--disable-gpu"]
  }
}
```

### Performance Testing

```json
{
  "browser": "chrome",
  "headless": true,
  "timeout": 45,
  "chromeOptions": {
    "prefs": {
      "profile.managed_default_content_settings.images": 2
    }
  }
}
```

---

## Advanced Options

### Chrome User Agent

Override user agent string:

```json
{
  "browser": "chrome",
  "chromeOptions": {
    "args": ["--user-agent=Mozilla/5.0 (Custom)"]
  }
}
```

---

### Disable Images (Performance)

Disable image loading to speed up tests:

```json
{
  "browser": "chrome",
  "chromeOptions": {
    "prefs": {
      "profile.managed_default_content_settings.images": 2
    }
  }
}
```

---

### Proxy Configuration

Route traffic through proxy:

```json
{
  "browser": "chrome",
  "chromeOptions": {
    "args": ["--proxy-server=http://proxy.company.com:8080"]
  }
}
```

---

### Geolocation

Set browser geolocation:

```json
{
  "browser": "chrome",
  "chromeOptions": {
    "prefs": {
      "profile.default_content_setting_values.geolocation": 1
    }
  }
}
```

---

## Capability Matrix

| Feature      | Chrome | Firefox    | Safari     | Edge |
| ------------ | ------ | ---------- | ---------- | ---- |
| Headless     | ✅     | ✅         | ❌         | ✅   |
| Windows      | ✅     | ✅         | ❌         | ✅   |
| Linux        | ✅     | ✅         | ❌         | ✅   |
| macOS        | ✅     | ✅         | ✅         | ✅   |
| Automation   | ✅     | ✅         | ⚠️ Limited | ✅   |
| Custom prefs | ✅     | ⚠️ Limited | ❌         | ✅   |

---

## Common Patterns

### Pattern 1: Development Setup

```json
{
  "browser": "chrome",
  "headless": false,
  "timeout": 30,
  "window": {
    "width": 1920,
    "height": 1080
  },
  "baseUrl": "http://localhost:3000"
}
```

### Pattern 2: CI/CD Setup

```json
{
  "browser": "chrome",
  "headless": true,
  "timeout": 60,
  "chromeOptions": {
    "args": ["--no-sandbox", "--disable-gpu", "--disable-dev-shm-usage"]
  }
}
```

### Pattern 3: Mobile Testing

```json
{
  "browser": "chrome",
  "headless": true,
  "window": {
    "width": 375,
    "height": 667
  },
  "chromeOptions": {
    "mobileEmulation": {
      "deviceName": "iPhone X"
    }
  }
}
```

### Pattern 4: Multi-Browser

Create separate config files:

- `.config/selenium.chrome.json`
- `.config/selenium.firefox.json`
- `.config/selenium.safari.json`

Then select via environment:

```bash
BROWSER=firefox npm test
```

### Pattern 5: Slow Network

```json
{
  "browser": "chrome",
  "timeout": 60,
  "chromeOptions": {
    "args": ["--enable-automation"]
  }
}
```

---

## Configuration Options Reference

### Chrome Options

```json
{
  "browser": "chrome",
  "chromeOptions": {
    "args": [
      "--headless",
      "--window-size=1920,1080",
      "--no-sandbox",
      "--disable-gpu"
    ],
    "prefs": {
      "download.default_directory": "/path/to/downloads"
    },
    "excludeSwitches": ["enable-automation"],
    "useAutomationExtension": false
  }
}
```

### Firefox Options

```json
{
  "browser": "firefox",
  "firefoxOptions": {
    "args": ["--headless", "--width=1920", "--height=1080"]
  }
}
```

### Common Shared Options

```json
{
  "timeout": 30,
  "baseUrl": "https://example.com",
  "window": {
    "width": 1920,
    "height": 1080
  },
  "headless": false,
  "acceptInsecureCerts": true
}
```

---

## Setting Configuration Programmatically

In code, override config:

```javascript
import config from '@nodebug/config'

// Override browser
const selenium = config('selenium')
selenium.browser = 'firefox'

// Then start browser
const browser = new WebBrowser()
await browser.start()
```

---

## Best Practices

1. **Use config files** - Keep settings in JSON, not hardcoded
2. **CI/CD specific** - Different configs for dev vs CI
3. **Security** - Use headless for CI/CD
4. **Performance** - Disable unnecessary features (images, GPU)
5. **Sandbox safety** - Enable sandbox in secure environments
6. **Cross-browser testing** - Test on multiple browsers
7. **Timeout tuning** - Adjust for your network speed

---

## Troubleshooting

| Issue               | Solution                                              |
| ------------------- | ----------------------------------------------------- |
| Browser won't start | Check browser is installed, PATH is set               |
| Timeout errors      | Increase timeout value in config                      |
| Headless mode fails | Disable certain Chrome features with args             |
| Download issues     | Set downloadDir in config                             |
| Permission denied   | Run with appropriate user privileges, disable sandbox |
| Memory issues       | Enable headless mode, disable images                  |

---

## Environment Variables

Override config with environment variables:

```bash
# Set browser
export SELENIUM_BROWSER=firefox

# Set headless
export SELENIUM_HEADLESS=true

# Set timeout
export SELENIUM_TIMEOUT=60
```

---

## See Also

- [Configuration Guide](../docs/CONFIGURATION.md) - Detailed configuration
- [Browser Control](browser.instructions.md) - Browser operations
- [Engineering Guide](../docs/ENGINEERING.md) - Architecture
