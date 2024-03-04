const { log } = require('@nodebug/logger')

function messenger(a) {
  let message = ''

  if (a.action === 'find') {
    message = 'Finding '
  } else if (a.action === 'click') {
    message = 'Clicking on '
  } else if (a.action === 'doubleclick') {
    message = 'Double clicking on '
  } else if (a.action === 'rightclick') {
    message = 'Right clicking on '
  } else if (a.action === 'focus') {
    message = `Focussing on `
  } else if (a.action === 'scroll') {
    message = `Scrolling into view `
  } else if (a.action === 'drag') {
    message = `Dragging `
  } else if (a.action === 'drop') {
    message = `Dropping on `
  } else if (a.action === 'hover') {
    message = `Hovering on `
  } else if (a.action === 'write') {
    message = `Writing '${a.data}' into `
  } else if (a.action === 'clear') {
    message = `Clearing text in `
  } else if (a.action === 'overwrite') {
    message = `Overwriting with '${a.data}' in `
  } else if (a.action === 'select') {
    message = `Selecting '${a.data}' from dropdown `
  } else if (
    a.action === 'isVisible' ||
    a.action === 'isDisabled' ||
    a.action === 'isChecked' ||
    a.action === 'isNotChecked'
  ) {
    message = `Validating `
  } else if (a.action === 'waitVisibility' || a.action === 'waitInvisibility') {
    message = `Waiting for `
  } else if (a.action === 'check') {
    message = `Checking `
  } else if (a.action === 'uncheck') {
    message = `Unchecking `
  } else if (a.action === 'screenshot') {
    message = `Capturing screenshot of `
  } else if (a.action === 'getText') {
    message = `Getting text of `
  } else if (a.action === 'getAttribute') {
    message = `Getting attribute '${a.data}' of `
  } else if (a.action === 'hide') {
    message = `Hiding all matching `
  } else if (a.action === 'unhide') {
    message = `Unhiding all matching `
  } else if (a.action === 'upload') {
    message = `Uploading file at path '${a.data}' to `
  }
  for (let i = 0; i < a.stack.length; i++) {
    const obj = a.stack[i]
    if (
      [
        'element',
        'radio',
        'checkbox',
        'textbox',
        'button',
        'row',
        'column',
        'toolbar',
        'link',
        'dialog',
        'file',
      ].includes(obj.type)
    ) {
      if (obj.exact) {
        message += 'exact '
      }
      if (obj.hidden) {
        message += 'hidden '
      }
      message += `${obj.type} '${obj.id}' `
      if (obj.index) {
        message += `of index '${obj.index}' `
      }
    } else if (obj.type === 'location') {
      message += `located `
      if (obj.exactly === true) {
        message += `exactly `
      }
      message += `'${obj.located}' `
    } else if (obj.type === 'condition') {
      message += `'${obj.operator}' `
    }
  }
  if (a.action === 'isVisible') {
    message += `is visible`
  } else if (a.action === 'waitVisibility') {
    message += `to be visible`
  } else if (a.action === 'waitInvisibility') {
    message += `to not be visible`
  } else if (a.action === 'isDisabled') {
    message += `is disabled`
  } else if (a.action === 'isChecked') {
    message += `is checked`
  } else if (a.action === 'isNotChecked') {
    message += `is not checked`
  } else if (a.action === 'click') {
    if (a.x !== null && a.y !== null) {
      message += `at location x:${a.x} y:${a.y}`
    }
  }

  log.info(message)
  return message
}

module.exports = messenger
