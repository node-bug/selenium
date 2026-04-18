import { log } from '@nodebug/logger';

// 1. Define action templates using a Lookup Map
const ACTION_MAP = {
  find:              () => 'Finding ',
  click:             () => 'Clicking on ',
  doubleclick:       () => 'Double clicking on ',
  rightclick:        () => 'Right clicking on ',
  focus:             () => 'Focussing on ',
  scroll:            () => 'Scrolling into view ',
  drag:              () => 'Dragging ',
  drop:              () => 'Dropping on ',
  hover:             () => 'Hovering on ',
  write:             (a) => `Writing '${a.data}' into `,
  clear:             () => 'Clearing text in ',
  overwrite:         (a) => `Overwriting with '${a.data}' in `,
  select:            (a) => `Selecting '${a.data}' from dropdown `,
  isVisible:         () => 'Checking ',
  isDisabled:        () => 'Checking ',
  waitVisibility:    () => 'Waiting for ',
  waitInvisibility:  () => 'Waiting for ',
  check:             () => 'Checking checkbox for ',
  uncheck:           () => 'Unchecking checkbox for ',
  screenshot:        () => 'Capturing screenshot of ',
  getText:           () => 'Getting text of ',
  getAttribute:      (a) => `Getting attribute '${a.data}' of `,
  hide:              () => 'Hiding all matching ',
  unhide:            () => 'Unhiding all matching ',
  upload:            (a) => `Uploading file at path '${a.data}' to `,
};

// 2. Define valid element types
const ELEMENT_TYPES = new Set([
  'element', 'radio', 'checkbox', 'textbox', 'button', 
  'row', 'column', 'toolbar', 'tab', 'link', 'dialog', 'file'
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
    isVisible: ' is visible',
    waitVisibility: ' to be visible',
    waitInvisibility: ' to not be visible',
    isDisabled: ' is disabled',
    click: (a.x !== null && a.y !== null && a.x !== undefined && a.y !== undefined) ? ` at location x:${a.x} y:${a.y}` : '',
  };

  if (suffixes[a.action]) {
    message += suffixes[a.action];
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
