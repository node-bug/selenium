import messenger from '../../app/messenger.js';

describe('messenger', () => {

  test('should generate message for basic click action', () => {
    const action = {
      action: 'click',
      stack: [
        { type: 'element', id: 'submit-button', exact: true }
      ]
    };

    const result = messenger(action);
    expect(result).toBe("Clicking on exact element 'submit-button'");
  });

  test('should generate message for write action with data', () => {
    const action = {
      action: 'write',
      data: 'test value',
      stack: [
        { type: 'textbox', id: 'username' }
      ]
    };

    const result = messenger(action);
    expect(result).toBe("Writing 'test value' into textbox 'username'");
  });

  test('should generate message for multiple elements in stack', () => {
    const action = {
      action: 'click',
      stack: [
        { type: 'button', id: 'save' },
        { type: 'element', id: 'form' }
      ]
    };

    const result = messenger(action);
    expect(result).toBe("Clicking on button 'save' element 'form'");
  });

  test('should handle element with exact flag', () => {
    const action = {
      action: 'click',
      stack: [
        { type: 'element', id: 'menu-item', exact: true }
      ]
    };

    const result = messenger(action);
    expect(result).toBe("Clicking on exact element 'menu-item'");
  });

  test('should handle element with hidden flag', () => {
    const action = {
      action: 'click',
      stack: [
        { type: 'element', id: 'hidden-div', hidden: true }
      ]
    };

    const result = messenger(action);
    expect(result).toBe("Clicking on hidden element 'hidden-div'");
  });

  test('should handle element with index', () => {
    const action = {
      action: 'click',
      stack: [
        { type: 'element', id: 'list-item', index: 2 }
      ]
    };

    const result = messenger(action);
    expect(result).toBe("Clicking on element 'list-item' of index '2'");
  });

  test('should handle location type in stack', () => {
    const action = {
      action: 'click',
      stack: [
        { type: 'location', located: 'top-left', exactly: true }
      ]
    };

    const result = messenger(action);
    expect(result).toBe("Clicking on located exactly 'top-left'");
  });

  test('should handle condition type in stack', () => {
    const action = {
      action: 'isVisible',
      stack: [
        { type: 'condition', operator: 'exists' }
      ]
    };

    const result = messenger(action);
    expect(result).toBe("Checking 'exists' is visible");
  });

  test('should handle isVisible action with suffix', () => {
    const action = {
      action: 'isVisible',
      stack: [
        { type: 'element', id: 'message' }
      ]
    };

    const result = messenger(action);
    expect(result).toBe("Checking element 'message' is visible");
  });

  test('should handle waitVisibility action with suffix', () => {
    const action = {
      action: 'waitVisibility',
      stack: [
        { type: 'element', id: 'modal' }
      ]
    };

    const result = messenger(action);
    expect(result).toBe("Waiting for element 'modal' to be visible");
  });

  test('should handle waitInvisibility action with suffix', () => {
    const action = {
      action: 'waitInvisibility',
      stack: [
        { type: 'element', id: 'popup' }
      ]
    };

    const result = messenger(action);
    expect(result).toBe("Waiting for element 'popup' to not be visible");
  });

  test('should handle isDisabled action with suffix', () => {
    const action = {
      action: 'isDisabled',
      stack: [
        { type: 'button', id: 'submit' }
      ]
    };

    const result = messenger(action);
    expect(result).toBe("Checking button 'submit' is disabled");
  });

  test('should handle click with coordinates', () => {
    const action = {
      action: 'click',
      x: 100,
      y: 200,
      stack: [
        { type: 'element', id: 'canvas' }
      ]
    };

    const result = messenger(action);
    expect(result).toBe("Clicking on element 'canvas' at location x:100 y:200");
  });

  test('should handle multipleclick with times', () => {
    const action = {
      action: 'click',
      times: 3,
      stack: [
        { type: 'element', id: 'button' }
      ]
    };

    const result = messenger(action);
    expect(result).toBe("Clicking on element 'button' 3 times");
  });

  test('should handle unknown action gracefully', () => {
    const action = {
      action: 'unknownAction',
      stack: [
        { type: 'element', id: 'test' }
      ]
    };

    const result = messenger(action);
    expect(result).toBe("element 'test'");
  });

  test('should handle empty stack', () => {
    const action = {
      action: 'click',
      stack: []
    };

    const result = messenger(action);
    expect(result).toBe("Clicking on ");
  });

  test('should handle complex stack with multiple element types', () => {
    const action = {
      action: 'click',
      stack: [
        { type: 'button', id: 'save' },
        { type: 'element', id: 'form', exact: true, hidden: true },
        { type: 'location', located: 'center' }
      ]
    };

    const result = messenger(action);
    expect(result).toBe("Clicking on button 'save' exact hidden element 'form' located 'center'");
  });

  test('should handle different element types', () => {
    const action = {
      action: 'click',
      stack: [
        { type: 'checkbox', id: 'agree' },
        { type: 'radio', id: 'male' },
        { type: 'textbox', id: 'name' },
        { type: 'file', id: 'document' }
      ]
    };

    const result = messenger(action);
    expect(result).toBe("Clicking on checkbox 'agree' radio 'male' textbox 'name' file 'document'");
  });

  test('should handle various action types', () => {
    const actions = [
      { action: 'find', expected: 'Finding ' },
      { action: 'doubleclick', expected: 'Double clicking on ' },
      { action: 'rightclick', expected: 'Right clicking on ' },
      { action: 'middleclick', expected: 'Middle clicking on ' },
      { action: 'tripleclick', expected: 'Triple clicking on ' },
      { action: 'longpress', expected: 'Long pressing on ' },
      { action: 'focus', expected: 'Focussing on ' },
      { action: 'scroll', expected: 'Scrolling into view ' },
      { action: 'drag', expected: 'Dragging ' },
      { action: 'drop', expected: 'Dropping on ' },
      { action: 'hover', expected: 'Hovering on ' },
      { action: 'clear', expected: 'Clearing text in ' },
      { action: 'select', expected: 'Selecting ' },
      { action: 'check', expected: 'Checking checkbox ' },
      { action: 'uncheck', expected: 'Unchecking checkbox ' },
      { action: 'screenshot', expected: 'Capturing screenshot of ' },
      { action: 'getText', expected: 'Getting text of ' },
      { action: 'getAttribute', expected: 'Getting attribute ' },
      { action: 'hide', expected: 'Hiding all matching ' },
      { action: 'unhide', expected: 'Unhiding all matching ' },
      { action: 'upload', expected: 'Uploading file at path ' }
    ];

    actions.forEach(({ action, expected }) => {
      const result = messenger({ action, stack: [{ type: 'element', id: 'test' }] });
      expect(result).toContain(expected);
    });
  });

  test('should handle write action with data', () => {
    const action = {
      action: 'write',
      data: 'Hello World',
      stack: [
        { type: 'textbox', id: 'username' }
      ]
    };

    const result = messenger(action);
    expect(result).toBe("Writing 'Hello World' into textbox 'username'");
  });

  test('should handle overwrite action with data', () => {
    const action = {
      action: 'overwrite',
      data: 'New Value',
      stack: [
        { type: 'textbox', id: 'input' }
      ]
    };

    const result = messenger(action);
    expect(result).toBe("Clearing and writing text 'New Value' into textbox 'input'");
  });

  test('should handle getAttribute action with data', () => {
    const action = {
      action: 'getAttribute',
      data: 'class',
      stack: [
        { type: 'element', id: 'button' }
      ]
    };

    const result = messenger(action);
    expect(result).toBe("Getting attribute 'class' of element 'button'");
  });

  test('should handle empty action', () => {
    const action = {
      action: 'unknown',
      stack: []
    };

    const result = messenger(action);
    expect(result).toBe("");
  });

  test('should handle stack with no matching types', () => {
    const action = {
      action: 'click',
      stack: [
        { type: 'unknown', id: 'test' }
      ]
    };

    const result = messenger(action);
    expect(result).toBe("Clicking on ");
  });

  test('should handle multiple elements with same type', () => {
    const action = {
      action: 'click',
      stack: [
        { type: 'element', id: 'first' },
        { type: 'element', id: 'second' },
        { type: 'element', id: 'third' }
      ]
    };

    const result = messenger(action);
    expect(result).toBe("Clicking on element 'first' element 'second' element 'third'");
  });

  test('should handle complex nested stack', () => {
    const action = {
      action: 'click',
      stack: [
        { type: 'button', id: 'save', exact: true },
        { type: 'element', id: 'form', hidden: true },
        { type: 'location', located: 'center', exactly: true },
        { type: 'element', id: 'submit', index: 0 }
      ]
    };

    const result = messenger(action);
    expect(result).toBe("Clicking on exact button 'save' hidden element 'form' located exactly 'center' element 'submit'");
  });
});