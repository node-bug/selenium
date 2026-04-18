// Direct test of messenger function without importing from index.js
import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import messenger from '../../app/messenger.js';
import {log} from '@nodebug/logger';

jest.unstable_mockModule('@nodebug/logger', () => ({
  log: {
    info: jest.fn() // Create the spy here
  }
}));

describe('Messenger Unit Tests', () => {
  let logSpy;

  beforeEach(() => {
    // Create a spy on the info method of the log object
    // This works even if the module was already loaded
    logSpy = jest.spyOn(log, 'info').mockImplementation(() => {});
  });

  afterEach(() => {
    // Clean up the spy so it doesn't affect other tests
    logSpy.mockRestore();
  });
  
  describe('Action Templates', () => {
    it('should format find action', () => {
      const message = messenger({ stack: [{ type: 'element', id: 'submit' }], action: 'find' });
      expect(message).toContain('Finding ');
      expect(message).toContain('submit');
    });

    it('should format write action', () => {
      const message = messenger({ stack: [{ type: 'element', id: 'username' }], action: 'write', data: 'testuser' });
      expect(message).toContain("Writing 'testuser' into ");
      expect(message).toContain('username');
    });

    it('should format getText action', () => {
      const message = messenger({ stack: [{ type: 'element', id: 'welcome' }], action: 'getText' });
      expect(message).toContain('Getting text of ');
      expect(message).toContain('welcome');
    });

    it('should format getAttribute action', () => {
      const message = messenger({ stack: [{ type: 'element', id: 'link' }], action: 'getAttribute', data: 'href' });
      expect(message).toContain("Getting attribute 'href' of ");
      expect(message).toContain('link');
    });

    it('should format click action', () => {
      const message = messenger({ stack: [{ type: 'element', id: 'button' }], action: 'click' });
      expect(message).toContain('Clicking on ');
      expect(message).toContain('button');
    });

    it('should format click with coordinates', () => {
      const message = messenger({ stack: [{ type: 'element', id: 'button' }], action: 'click', x: 10, y: 20 });
      expect(message).toContain('Clicking on ');
      expect(message).toContain('button');
      expect(message).toContain('at location x:10 y:20');
    });

    it('should format hover action', () => {
      const message = messenger({ stack: [{ type: 'element', id: 'menu' }], action: 'hover' });
      expect(message).toContain('Hovering on ');
      expect(message).toContain('menu');
    });

    it('should format scroll action', () => {
      const message = messenger({ stack: [{ type: 'element', id: 'footer' }], action: 'scroll' });
      expect(message).toContain('Scrolling into view ');
      expect(message).toContain('footer');
    });

    it('should format clear action', () => {
      const message = messenger({ stack: [{ type: 'element', id: 'username' }], action: 'clear' });
      expect(message).toContain('Clearing text in ');
      expect(message).toContain('username');
    });

    it('should format check action', () => {
      const message = messenger({ stack: [{ type: 'element', id: 'agree' }], action: 'check' });
      expect(message).toContain('Checking checkbox for ');
      expect(message).toContain('agree');
    });

    it('should format uncheck action', () => {
      const message = messenger({ stack: [{ type: 'element', id: 'agree' }], action: 'uncheck' });
      expect(message).toContain('Unchecking checkbox for ');
      expect(message).toContain('agree');
    });

    it('should format isVisible action', () => {
      const message = messenger({ stack: [{ type: 'element', id: 'submit' }], action: 'isVisible' });
      expect(message).toContain('Checking ');
      expect(message).toContain('is visible');
      expect(message).toContain('submit');
    });

    it('should format waitVisibility action', () => {
      const message = messenger({ stack: [{ type: 'element', id: 'loading' }], action: 'waitVisibility' });
      expect(message).toContain('Waiting for ');
      expect(message).toContain('to be visible');
      expect(message).toContain('loading');
    });

    it('should format waitInvisibility action', () => {
      const message = messenger({ stack: [{ type: 'element', id: 'modal' }], action: 'waitInvisibility' });
      expect(message).toContain('Waiting for ');
      expect(message).toContain('to not be visible');
      expect(message).toContain('modal');
    });

    it('should format isDisabled action', () => {
      const message = messenger({ stack: [{ type: 'element', id: 'submit' }], action: 'isDisabled' });
      expect(message).toContain('Checking ');
      expect(message).toContain('is disabled');
      expect(message).toContain('submit');
    });

    it('should format screenshot action', () => {
      const message = messenger({ stack: [{ type: 'element', id: 'form' }], action: 'screenshot' });
      expect(message).toContain('Capturing screenshot of ');
      expect(message).toContain('form');
    });

    it('should format upload action', () => {
      const message = messenger({ stack: [{ type: 'element', id: 'upload' }], action: 'upload', data: '/path/to/file.txt' });
      expect(message).toContain("Uploading file at path '/path/to/file.txt' to ");
      expect(message).toContain('upload');
    });

    it('should format focus action', () => {
      const message = messenger({ stack: [{ type: 'element', id: 'input' }], action: 'focus' });
      expect(message).toContain('Focussing on ');
      expect(message).toContain('input');
    });

    it('should format doubleClick action', () => {
      const message = messenger({ stack: [{ type: 'element', id: 'text' }], action: 'doubleclick' });
      expect(message).toContain('Double clicking on ');
      expect(message).toContain('text');
    });

    it('should format rightClick action', () => {
      const message = messenger({ stack: [{ type: 'element', id: 'context-menu' }], action: 'rightclick' });
      expect(message).toContain('Right clicking on ');
      expect(message).toContain('context-menu');
    });

    it('should format hide action', () => {
      const message = messenger({ stack: [{ type: 'element', id: 'ad' }], action: 'hide' });
      expect(message).toContain('Hiding all matching ');
      expect(message).toContain('ad');
    });

    it('should format unhide action', () => {
      const message = messenger({ stack: [{ type: 'element', id: 'popup' }], action: 'unhide' });
      expect(message).toContain('Unhiding all matching ');
      expect(message).toContain('popup');
    });

    it('should format drag action', () => {
      const message = messenger({ stack: [{ type: 'element', id: 'item' }], action: 'drag' });
      expect(message).toContain('Dragging ');
      expect(message).toContain('item');
    });

    it('should format drop action', () => {
      const message = messenger({ stack: [{ type: 'element', id: 'target' }], action: 'drop' });
      expect(message).toContain('Dropping on ');
      expect(message).toContain('target');
    });

    it('should format overwrite action', () => {
      const message = messenger({ stack: [{ type: 'element', id: 'field' }], action: 'overwrite', data: 'new value' });
      expect(message).toContain("Overwriting with 'new value' in ");
      expect(message).toContain('field');
    });

    it('should format select action', () => {
      const message = messenger({ stack: [{ type: 'element', id: 'dropdown' }], action: 'select', data: 'option1' });
      expect(message).toContain("Selecting 'option1' from dropdown ");
      expect(message).toContain('dropdown');
    });
  });

  describe('Stack Processing', () => {
    it('should handle single element', () => {
      const message = messenger({ stack: [{ type: 'element', id: 'test' }], action: 'find' });
      expect(message).toContain('test');
    });

    it('should handle multiple elements', () => {
      const message = messenger({ stack: [
        { type: 'element', id: 'test1' },
        { type: 'element', id: 'test2' }
      ], action: 'find' });
      expect(message).toContain('test1');
      expect(message).toContain('test2');
    });

    it('should handle location', () => {
      const message = messenger({ stack: [{ type: 'location', located: 'css selector' }], action: 'find' });
      expect(message).toContain('located');
      expect(message).toContain('css selector');
    });

    it('should handle condition', () => {
      const message = messenger({ stack: [{ type: 'condition', operator: 'or' }], action: 'find' });
      expect(message).toContain('or');
    });

    it('should handle element with exact flag', () => {
      const message = messenger({ stack: [{ type: 'element', id: 'test', exact: true }], action: 'find' });
      expect(message).toContain("exact element 'test'");
    });

    it('should handle element with hidden flag', () => {
      const message = messenger({ stack: [{ type: 'element', id: 'test', hidden: true }], action: 'find' });
      expect(message).toContain("hidden element 'test'");
    });

    it('should handle element with index', () => {
      const message = messenger({ stack: [{ type: 'element', id: 'test', index: 2 }], action: 'find' });
      expect(message).toContain("of index '2'");
    });

    it('should handle element with both exact and hidden flags', () => {
      const message = messenger({ stack: [{ type: 'element', id: 'test', exact: true, hidden: true }], action: 'find' });
      expect(message).toContain("exact hidden element 'test'");
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty stack', () => {
      const message = messenger({ stack: [], action: 'find' });
      expect(typeof message).toBe('string');
    });

    it('should handle null/undefined data', () => {
      const message = messenger({ stack: [{ type: 'element', id: 'test' }], action: 'find' });
      expect(typeof message).toBe('string');
    });

    it('should handle special characters in data', () => {
      const message = messenger({ stack: [{ type: 'element', id: 'test@#$%' }], action: 'find' });
      expect(message).toContain('test@#$%');
    });

    it('should handle long text', () => {
      const longText = 'a'.repeat(100);
      const message = messenger({ stack: [{ type: 'element', id: longText }], action: 'find' });
      expect(message).toContain(longText);
    });

    it('should handle invalid element type or action', () => {
      const message1 = messenger({ stack: [{ type: 'invalid', id: 'test' }], action: 'find' });
      const message2 = messenger({ stack: [{ type: 'element', id: 'test' }], action: 'invalidAction' });
      expect(typeof message1).toBe('string');
      expect(typeof message2).toBe('string');
    });

    it('should handle null or missing coordinates for click', () => {
      const message = messenger({ stack: [{ type: 'element', id: 'button' }], action: 'click', x: null, y: null });
      expect(message).not.toContain('at location');
    });
  });

  describe('Output Format', () => {
    it('should return string message and not throw errors', () => {
      const message = messenger({ stack: [{ type: 'element', id: 'test' }], action: 'find' });
      expect(typeof message).toBe('string');
      expect(() => messenger({ stack: [], action: 'find' })).not.toThrow();
    });
  });

  describe('Action Templates', () => {
    const testStack = [{ type: 'element', id: 'target' }];

    it('should format simple actions correctly', () => {
      const actions = [
        { action: 'find', expected: 'Finding' },
        { action: 'click', expected: 'Clicking on' },
        { action: 'doubleclick', expected: 'Double clicking on' },
        { action: 'rightclick', expected: 'Right clicking on' },
        { action: 'focus', expected: 'Focussing on' },
        { action: 'scroll', expected: 'Scrolling into view' },
        { action: 'hover', expected: 'Hovering on' },
        { action: 'clear', expected: 'Clearing text in' },
        { action: 'check', expected: 'Checking checkbox for' },
        { action: 'uncheck', expected: 'Unchecking checkbox for' },
        { action: 'screenshot', expected: 'Capturing screenshot of' },
        { action: 'getText', expected: 'Getting text of' },
        { action: 'hide', expected: 'Hiding all matching' },
        { action: 'unhide', expected: 'Unhiding all matching' },
      ];

      actions.forEach(({ action, expected }) => {
        const message = messenger({ stack: testStack, action });
        expect(message).toContain(expected);
      });
    });

    it('should format actions with data (write, select, upload, etc)', () => {
      expect(messenger({ action: 'write', data: 'foo', stack: testStack }))
        .toContain("Writing 'foo' into");
      
      expect(messenger({ action: 'overwrite', data: 'bar', stack: testStack }))
        .toContain("Overwriting with 'bar' in");

      expect(messenger({ action: 'select', data: 'opt1', stack: testStack }))
        .toContain("Selecting 'opt1' from dropdown");

      expect(messenger({ action: 'getAttribute', data: 'href', stack: testStack }))
        .toContain("Getting attribute 'href' of");

      expect(messenger({ action: 'upload', data: '/path/file', stack: testStack }))
        .toContain("Uploading file at path '/path/file' to");
    });
  });

  describe('Stack Processing & Element Types', () => {
    it('should support all valid element types from ELEMENT_TYPES', () => {
      const types = [
        'element', 'radio', 'checkbox', 'textbox', 'button', 
        'row', 'column', 'toolbar', 'tab', 'link', 'dialog', 'file'
      ];
      types.forEach(type => {
        const message = messenger({ stack: [{ type, id: 'my-id' }], action: 'find' });
        expect(message).toContain(`${type} 'my-id'`);
      });
    });

    it('should handle element flags (exact, hidden, index)', () => {
      const stack = [{ type: 'element', id: 'user', exact: true, hidden: true, index: 5 }];
      const message = messenger({ stack, action: 'find' });
      expect(message).toBe("Finding exact hidden element 'user' of index '5'");
    });

    it('should handle location with exactly flag', () => {
      const stack = [{ type: 'location', located: 'Submit', exactly: true }];
      const message = messenger({ stack, action: 'find' });
      expect(message).toContain("located exactly 'Submit'");
    });

    it('should handle condition types', () => {
      const stack = [{ type: 'condition', operator: 'or' }];
      const message = messenger({ stack, action: 'find' });
      expect(message).toContain("'or'");
    });

    it('should handle complex multi-part stacks', () => {
      const stack = [
        { type: 'condition', operator: 'and' },
        { type: 'element', id: 'parent' },
        { type: 'location', located: '.child' }
      ];
      const message = messenger({ stack, action: 'click' });
      expect(message).toBe("Clicking on 'and' element 'parent' located '.child'");
    });
  });

  describe('Suffixes and Edge Cases', () => {
    it('should append correct suffixes for state checks', () => {
      const stack = [{ type: 'element', id: 'btn' }];
      expect(messenger({ action: 'isVisible', stack })).toContain('btn\' is visible');
      expect(messenger({ action: 'isDisabled', stack })).toContain('btn\' is disabled');
      expect(messenger({ action: 'waitVisibility', stack })).toContain('btn\' to be visible');
      expect(messenger({ action: 'waitInvisibility', stack })).toContain('btn\' to not be visible');
    });

    it('should include coordinates even if they are 0', () => {
      const message = messenger({ 
        action: 'click', 
        stack: [{ type: 'element', id: 'btn' }], 
        x: 0, 
        y: 0 
      });
      expect(message).toContain('at location x:0 y:0');
    });

    it('should NOT include coordinates if they are null or undefined', () => {
      const message = messenger({ 
        action: 'click', 
        stack: [{ type: 'element', id: 'btn' }], 
        x: null, 
        y: undefined 
      });
      expect(message).not.toContain('at location');
    });

    it('should handle invalid actions gracefully', () => {
      const message = messenger({ action: 'nonExistent', stack: [] });
      expect(typeof message).toBe('string');
      expect(logSpy).toHaveBeenCalledWith(message);
    });

    it('should handle invalid stack types by returning empty string for that part', () => {
      const message = messenger({ 
        action: 'find', 
        stack: [{ type: 'ghost', id: 'hidden' }] 
      });
      // Should just be the action prefix "Finding " with no stack part
      expect(message.trim()).toBe('Finding');
    });
  });

  describe('Integration & Logger', () => {
    it('should log the final message to the info channel', () => {
      const payload = { action: 'find', stack: [{ type: 'element', id: 'test' }] };
      const message = messenger(payload);
      expect(logSpy).toHaveBeenCalledWith(message);
    });

    it('should not throw on empty stack', () => {
      expect(() => messenger({ action: 'find', stack: [] })).not.toThrow();
    });
  });
});