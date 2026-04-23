# Messenger

The messenger module is responsible for generating descriptive log messages for Selenium actions. It provides a consistent way to log what actions are being performed on elements, making debugging and monitoring easier.

## Overview

The messenger uses a lookup map approach to define action templates and processes element stacks to create human-readable log messages. This approach is more maintainable and extensible than traditional if-else chains.

## Action Templates

The messenger defines templates for various actions using a lookup map. Each action has a corresponding template function that generates the beginning of the log message.

### Supported Actions

- `find`: Finding
- `click`: Clicking on
- `doubleclick`: Double clicking on
- `rightclick`: Right clicking on
- `middleclick`: Middle clicking on
- `tripleclick`: Triple clicking on
- `longpress`: Long pressing on
- `focus`: Focussing on
- `scroll`: Scrolling into view
- `drag`: Dragging
- `drop`: Dropping on
- `hover`: Hovering on
- `write`: Writing 'data' into
- `clear`: Clearing text in
- `overwrite`: Overwriting with 'data' in
- `select`: Selecting 'data' from dropdown
- `isVisible`: Checking
- `isDisabled`: Checking
- `waitVisibility`: Waiting for
- `waitInvisibility`: Waiting for
- `check`: Checking checkbox for
- `uncheck`: Unchecking checkbox for
- `screenshot`: Capturing screenshot of
- `getText`: Getting text of
- `getAttribute`: Getting attribute 'data' of
- `hide`: Hiding all matching
- `unhide`: Unhiding all matching
- `upload`: Uploading file at path 'data' to
- `multipleclick`: Clicking multiple times
- `clickwithmodifier`: Clicking with modifiers

## Element Types

The messenger supports the following element types in the stack:

- `element`
- `radio`
- `checkbox`
- `textbox`
- `button`
- `row`
- `column`
- `toolbar`
- `tab`
- `link`
- `dialog`
- `file`

## Stack Processing

The messenger processes the element stack to build a complete log message. Each stack element is transformed based on its type:

### Element Stack Types

- **Element types**: For element types, it includes exact, hidden, and index information
- **Location**: For location types, it includes exactly and located information
- **Condition**: For condition types, it includes operator information

## Suffixes

Action-specific suffixes are added to the log message for certain actions:

- `isVisible`: " is visible"
- `waitVisibility`: " to be visible"
- `waitInvisibility`: " to not be visible"
- `isDisabled`: " is disabled"
- `click`: Adds coordinates if x and y are provided
- `multipleclick`: Adds number of times if times is provided
- `clickwithmodifier`: Adds modifier information if options are provided

## Usage

The messenger function takes an action object and returns a formatted log message:

```javascript
import messenger from './app/messenger.js';

const action = {
  action: 'click',
  stack: [
    { type: 'element', id: 'submit-button', exact: true },
    { type: 'location', located: 'body' }
  ],
  x: 100,
  y: 200
};

const message = messenger(action);
// Returns: "Clicking on element 'submit-button' exact located 'body' at location x:100 y:200"
```

## Benefits of Lookup Map Approach

This implementation uses a lookup map instead of traditional if-else chains, which provides several advantages:

- **Maintainability**: Easy to add new actions without modifying existing code
- **Readability**: Declarative approach that's easier to understand
- **Performance**: Eliminates unnecessary condition checks
- **Extensibility**: Simple to extend with new element types or action templates