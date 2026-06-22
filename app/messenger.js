import { log } from '@nodebug/logger';
import ELEMENT_DEFINITIONS from '@nodebug/browser-element-finder/element-definitions.json' with { type: 'json' };

// 1. Define action templates using a Lookup Map
const ACTION_MAP = {
  find: () => 'Finding ',
  click: () => 'Clicking on ',
  doubleclick: () => 'Double clicking on ',
  rightclick: () => 'Right clicking on ',
  middleclick: () => 'Middle clicking on ',
  tripleclick: () => 'Triple clicking on ',
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
  set: (a) => `Setting '${a.data}' to `,
  slide: (a) => `Sliding to value ${a.data} `,
  waitVisibility: () => 'Waiting for ',
  waitInvisibility: () => 'Waiting for ',
  check: () => 'Checking ',
  uncheck: () => 'Unchecking ',
  on: () => 'Setting ',
  off: () => 'Setting ',
  screenshot: () => 'Capturing screenshot of ',
  getText: () => 'Getting text of ',
  getValue: () => 'Getting value of ',
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
  hasValue: () => 'Validating if ', 
  hasText: () => 'Validating if ',
  doesNotHaveValue: () => 'Validating if ',
  doesNotHaveText: () => 'Validating if ',
  shouldHaveValue: () => 'Validating that ',
  shouldHaveText: () => 'Validating that ',
  shouldNotHaveValue: () => 'Validating that ',
  shouldNotHaveText: () => 'Validating that ',
  hasOption: () => `Validating if `,
  doesNotHaveOption: () => `Validating if `,
  shouldHaveOption: () => `Validating that `,
  shouldNotHaveOption: () => `Validating that `,
  getOptions: () => 'Getting options from ',
  getSelectedOptions: () => 'Getting selected options from ',
};

// 2. Define valid element types
const ELEMENT_TYPES = new Set(Object.keys(ELEMENT_DEFINITIONS));

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
      const onscreen = obj.onscreen ? 'onscreen ' : '';
      const atIndex = obj.index ? `at index '${obj.index}' ` : '';
      // When id is empty or numeric, skip quoting the id
      const idPart = obj.id ? (/^\d+$/.test(obj.id) ? `at index '${obj.id}' ` : `'${obj.id}' `) : '';
      return `${exact}${hidden}${onscreen}${obj.type} ${idPart}${atIndex}`;
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
    slide: (a) => { return ` to value ${a.data}` },
    hasOption: (a) => ` has option '${a.data}'`,
    doesNotHaveOption: (a) => ` does not have option '${a.data}'`,
    shouldHaveOption: (a) => ` has option '${a.data}'`,
    shouldNotHaveOption: (a) => ` does not have option '${a.data}'`,
    isSelected: ` is selected`,
    isNotSelected: ` is not selected`,
    shouldBeSelected: ` should be selected`,
    shouldNotBeSelected: ` should not be selected`,
    on: ' to ON',
    off: ' to OFF',
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
    hasValue: ' has value',
    hasText: ' has text',
    doesNotHaveValue: ' does not have value',
    doesNotHaveText: ' does not have text',
    shouldHaveValue: ' should have value',
    shouldHaveText: ' should have text',
    shouldNotHaveValue: ' should not have value',
    shouldNotHaveText: ' should not have text',
  };

  if (suffixes[a.action]) {
    const suffixEntry = suffixes[a.action];
    message += (typeof suffixEntry === 'function') ? suffixEntry(a) : suffixEntry;
  }

  log.info(message);
  return message;
}
