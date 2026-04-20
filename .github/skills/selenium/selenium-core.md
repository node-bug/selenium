# Skill: @nodebug/selenium Core Lifecycle

Handle browser initialization, navigation, and state management.

## Setup & Lifecycle

- Import: `import Browser from '@nodebug/selenium'`
- Initialization: Use `const browser = new Browser()` followed by `await browser.start()` or `await browser.new()`.
- Cleanup: Always use `await browser.close()` to terminate sessions.
- Reset: Use `await browser.reset()` to clear cookies, storage, and close extra windows.

## Navigation Commands

- `await browser.goto(url)`: Navigate to a URL.
- `await browser.refresh()`: Reload page.
- `await browser.back()` / `await browser.forward()`: History navigation.
- `await browser.window().new()`: Open a new browser window.
- `await browser.window(index).switch()`: Switch to a specific window.
- `await browser.window().close()`: Close the current window.
- `await browser.window().get.url()`: Get current window URL.
- `await browser.window('title').get.url()`: Get specific window URL.
- `await browser.tab().get.url()`: Get current tab URL.
- `await browser.tab('title').get.url()`: Get specific tab URL.
- `await browser.window().get.title()`: Get current window title.
- `await browser.window('title').get.title()`: Get specific window title.

## Global Configuration

- Browser type is set via environment variables (`NODE_BROWSER=chrome`), CLI (`--browser=firefox`), or `.config/selenium.json`.
- Default timeouts and headless modes are managed in the JSON config.
- The library supports multiple browser types: Chrome, Firefox, Safari, and Edge.
