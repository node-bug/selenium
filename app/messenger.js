import { log } from '@nodebug/logger';

// 1. Define action templates using a Lookup Map
const ACTION_MAP = {
  find: () => 'Finding ',
  click: () => 'Clicking on ',
  doubleclick: () => 'Double clicking on ',
  rightclick: () => 'Right clicking on ',
  middleclick: () => 'Middle clicking on ',
  tripleclick: () => 'Triple clicking on ',
  longpress: () => 'Long pressing on ',
  focus: () => 'Focussing on ',
  scroll: () => 'Scrolling into view ',
  drag: () => 'Dragging ',
  drop: () => 'Dropping on ',
  hover: () => 'Hovering on ',
  write: (a) => `Writing '${a.data}' into `,
  clear: () => 'Clearing text in ',
  overwrite: (a) => `Clearing and writing text '${a.data}' into `,
  press: (a) => `Pressing key '${a.data}' in `,
  type: (a) => `Typing '${a.data}' into `,
  select: (a) => `Selecting '${a.data}' from `,
  waitVisibility: () => 'Waiting for ',
  waitInvisibility: () => 'Waiting for ',
  check: () => 'Checking ',
  uncheck: () => 'Unchecking ',
  on: () => 'Setting ',
  off: () => 'Setting ',
  screenshot: () => 'Capturing screenshot of ',
  getText: () => 'Getting text of selected option from ',
  getValue: () => 'Getting value of selected option from ',
  getAttribute: (a) => `Getting attribute '${a.data}' of `,
  hide: () => 'Hiding all matching ',
  unhide: () => 'Unhiding all matching ',
  upload: (a) => `Uploading file at path '${a.data}' to `,
  isVisible: () => 'Validating if ',
  isNotVisible: () => 'Validating if ',
  shouldBeVisible: () => 'Validating that ',
  shouldNotBeVisible: () => 'Validating that ',
  isDisabled: () => 'Validating if ',
  isEnabled: () => 'Validating if ',
  shouldBeDisabled: () => 'Validating that ',
  shouldBeEnabled: () => 'Validating that ',
  isChecked: () => 'Validating if ',
  isNotChecked: () => 'Validating if ',
  shouldBeChecked: () => 'Validating that ',
  shouldNotBeChecked: () => 'Validating that ',
  isSet: () => 'Validating if ',
  isNotSet: () => 'Validating if ',
  shouldBeSet: () => 'Validating that ',
  shouldNotBeSet: () => 'Validating that ',
  isOn: () => 'Validating if ',
  isOff: () => 'Validating if ',
  shouldBeOn: () => 'Validating that ',
  shouldBeOff: () => 'Validating that ',
  isSelected: (a) => `Validating if option '${a.data}' in `,
  isNotSelected: (a) => `Validating if option '${a.data}' in `,
  shouldBeSelected: (a) => `Validating that option '${a.data}' in `,
  shouldNotBeSelected: (a) => `Validating that option '${a.data}' in `,
};

// 2. Define valid element types
const ELEMENT_TYPES = new Set([
  'link', 'navigation', 'heading', 'button', 'checkbox',
  'radio', 'slider', 'dropdown', 'textbox', 'file', 'list',
  'listitem', 'menu', 'menuitem', 'toolbar', 'dialog',
  'row', 'column', 'image', 'element', 'switch'
]);

/**
 * Builds a descriptive log message based on action and element stack
 */
export default function messenger(a) {
  // Start the message based on action
  const actionFn = ACTION_MAP[a.action];
  let message = actionFn ? actionFn(a) : '';

  // Process the stack
  const stackParts = a.stack.map((obj) => {
    if (ELEMENT_TYPES.has(obj.type)) {
      const exact = obj.exact ? 'exact ' : '';
      const hidden = obj.hidden ? 'hidden ' : '';
      const index = obj.index ? `of index '${obj.index}' ` : '';
      return `${exact}${hidden}${obj.type} '${obj.id}' ${index}`;
    }

    if (obj.type === 'location') {
      const exactly = obj.exactly === true ? 'exactly ' : '';
      return `located ${exactly}'${obj.located}' `;
    }

    if (obj.type === 'condition') {
      return `'${obj.operator}' `;
    }

    return '';
  });

  message += stackParts.join('').trimEnd();

  // Handle Suffixes/Action Specifics
  const suffixes = {
    waitVisibility: ' to be visible',
    waitInvisibility: ' to not be visible',
    click: (a) => {
      let suffix = '';
      if (a.modifiers && a.modifiers.length > 0) {
        suffix += ` with modifiers ${a.modifiers.map(m => m.toUpperCase()).join('+')}`;
      }
      if (a.x !== null && a.y !== null && a.x !== undefined && a.y !== undefined) {
        suffix += ` at location x:${a.x} y:${a.y}`;
      }
      if (a.times !== undefined) {
        suffix += ` ${a.times} times`;
      }
      return suffix || '';
    },
    press: (a) => {
      if (a.modifiers && a.modifiers.length > 0) {
        return ` with modifiers ${a.modifiers.map(m => m.toUpperCase()).join('+')}`;
      }
      return '';
    },
    type: (a) => {
      if (a.modifiers && a.modifiers.length > 0) {
        return ` with modifiers ${a.modifiers.map(m => m.toUpperCase()).join('+')}`;
      }
      return '';
    },
    on: ' to on',
    off: ' to off',
    isVisible: ' is visible',
    isNotVisible: ' is not visible',
    shouldBeVisible: ' is visible',
    shouldNotBeVisible: ' is not visible',
    isDisabled: ' is disabled',
    isEnabled: ' is enabled',
    shouldBeDisabled: ' is disabled',
    shouldBeEnabled: ' is enabled',
    isChecked: ' is checked',
    isNotChecked: ' is not checked',
    shouldBeChecked: ' is checked',
    shouldNotBeChecked: ' is not checked',
    isSet: ' is set',
    isNotSet: ' is not set',
    shouldBeSet: ' is set',
    shouldNotBeSet: ' is not set',
    isOn: ' is ON',
    isOff: ' is OFF',
    shouldBeOn: ' is ON',
    shouldBeOff: ' is OFF',
    isSelected: ` is selected`,
    isNotSelected: ` is not selected`,
    shouldBeSelected: ` is selected`,
    shouldNotBeSelected: ` is not selected`,
  };

  if (suffixes[a.action]) {
    const suffixEntry = suffixes[a.action];
    message += (typeof suffixEntry === 'function') ? suffixEntry(a) : suffixEntry;
  }

  log.info(message);
  return message;
}

/**
 * The "if-else-if" chain is a classic anti-pattern for this type of logic. It is slow to read, hard to maintain, and prone to errors.

To improve this for ESM, we should use a Lookup Map for the actions and Array methods (map, filter, join) for the stack processing. This makes the code declarative rather than procedural.
    * The Lookup Map allows us to easily add new actions without modifying existing code, and the Array methods make it clear how we are transforming the stack into a message.
    * The use of template literals and descriptive variable names also enhances readability.
    * Overall, this refactored version is more maintainable, extensible, and easier to understand at a glance.
    * This approach also eliminates the need for multiple "if-else" statements, reducing the likelihood of bugs and improving performance by avoiding unnecessary condition checks.
    * By centralizing the action templates and using a consistent method for processing the stack, we can ensure that the code is both efficient and easy to extend in the future.
    * In summary, the refactored code is more efficient, easier to read, and maintainable compared to the original "if-else-if" chain, making it a better choice for handling complex logic in an ESM environment.
    * This refactored version is more efficient, easier to read, and maintainable compared to the original "if-else-if" chain, making it a better choice for handling complex logic in an ESM environment.
    
**/
