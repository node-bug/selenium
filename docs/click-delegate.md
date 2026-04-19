# Click Delegate

This document explains the click delegate functionality for handling various click operations on web elements.

## Overview

The ClickDelegate class provides comprehensive click-related functionality for interacting with web elements. It extends basic click operations to include double-clicks, right-clicks, middle-clicks, triple-clicks, long presses, multiple clicks, and modifier key combinations.

## Methods

### click([x, y])

Performs a standard click on an element.

- **Parameters:**
  - `x` (number, optional): X coordinate for click
  - `y` (number, optional): Y coordinate for click
- **Returns:** Promise<boolean> - True if successful
- **Example:**
  ```javascript
  await browser.button('submit').click()
  await browser.element('menu').click(10, 20) // Click at coordinates
  ```

### doubleClick()

Performs a double-click on the element.

- **Returns:** Promise<boolean> - True if successful
- **Example:**
  ```javascript
  await browser.element('text').doubleClick()
  await browser.button('edit').doubleClick()
  ```

### rightClick()

Performs a right-click (context click) on the element.

- **Returns:** Promise<boolean> - True if successful
- **Example:**
  ```javascript
  await browser.element('context-menu').rightClick()
  await browser.button('options').rightClick()
  ```

### middleClick()

Performs a middle-click on the element.

- **Returns:** Promise<boolean> - True if successful
- **Example:**
  ```javascript
  await browser.element('middle-click-target').middleClick()
  await browser.button('tab').middleClick()
  ```

### tripleClick()

Performs a triple-click on the element.

- **Returns:** Promise<boolean> - True if successful
- **Example:**
  ```javascript
  await browser.element('text').tripleClick()
  await browser.button('select').tripleClick()
  ```

### longPress([duration])

Performs a long press click on the element.

- **Parameters:**
  - `duration` (number, optional): Duration of the long press in milliseconds (default: 1000)
- **Returns:** Promise<boolean> - True if successful
- **Example:**
  ```javascript
  await browser.element('long-press-target').longPress() // Default 1000ms
  await browser.button('menu').longPress(2000) // 2 seconds
  ```

### multipleClick(times)

Performs multiple clicks on the element.

- **Parameters:**
  - `times` (number, optional): Number of times to click (default: 2)
- **Returns:** Promise<boolean> - True if successful
- **Example:**
  ```javascript
  await browser.element('button').clickMultiple(3) // Click 3 times
  await browser.button('repeat').clickMultiple(5) // Click 5 times
  ```

### clickWithModifier(options)

Performs a click with modifier keys.

- **Parameters:**
  - `options` (Object, optional): Options for the click
    - `shift` (boolean): Whether to hold shift key
    - `ctrl` (boolean): Whether to hold control key
    - `alt` (boolean): Whether to hold alt key
    - `meta` (boolean): Whether to hold meta key
- **Returns:** Promise<boolean> - True if successful
- **Example:**
  ```javascript
  await browser.element('link').clickWithModifier({ ctrl: true }) // Ctrl+click
  await browser.button('select').clickWithModifier({ shift: true, alt: true }) // Shift+Alt+click
  ```

## Implementation Details

All click methods:

- Use the messenger for logging
- Handle errors appropriately with `handleError`
- Clean up the stack after execution
- Use the existing `_finder()` method to locate elements
- Follow the same documentation style and examples as other methods
