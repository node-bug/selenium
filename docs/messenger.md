# Messenger

Internal log message generation for actions. For most users, this is transparent.

## Overview

The messenger module generates descriptive log messages for browser automation actions. It processes action objects containing type and element stack information to create human-readable logs.

## Message Format

Messages follow the pattern:

```
[Action] [Element Info] [Conditions] [Result/Target]
```

**Examples:**
- "Clicking on button 'Submit'"
- "Writing 'user@example.com' into textbox 'Email'"
- "Waiting for dialog 'Confirm' to be visible"
- "Checking checkbox 'Remember Me'"

## Actions Logged

- Navigation: `find`, `findAll`
- Click variants: `click`, `doubleclick`, `rightclick`, `longpress`, `multipleclick`, `clickwithmodifier`
- Input: `write`, `focus`, `clear`, `overwrite`
- Drag/Drop: `drag`, `drop`
- Interaction: `hover`, `scroll`, `upload`
- State checks: `isVisible`, `isDisabled`, `waitVisibility`, `waitInvisibility`, `check`, `uncheck`
- Data retrieval: `getText`, `getAttribute`, `screenshot`
- Visibility: `hide`, `unhide`

## Element Stack Processing

The messenger processes element references in the selector stack:

- **Element types**: button, checkbox, textbox, link, etc.
- **Locations**: spatial references (above, below, etc.)
- **Conditions**: exact matching, hidden elements, indexes

## Log Output

Logs are emitted during action execution and typically captured by:
- Test framework reporters
- Console output
- Log files configured in your test environment

## Usage in Tests

While the messenger is internal, logs help with:
- Debugging test execution
- Understanding what actions are being performed
- Identifying failures
- Documenting test flow
