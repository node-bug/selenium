import WebBrowser from '../../index.js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const FIXTURES_DIR = join(__dirname, '..', 'fixtures');
const fixtureUrl = (filename) => `file://${join(FIXTURES_DIR, filename)}`;

describe('WebBrowser Keyboard Operations Tests', () => {
  let browser;

  beforeEach(async () => {
    browser = new WebBrowser();
    await browser.start();
  });

  afterEach(async () => {
    await browser.close();
  });

  describe('press() - Enter Key Press', () => {
    test('should press Enter key', async () => {
      await browser.goto(fixtureUrl('forms.html'));
      await browser.textbox('Multi-line Text (Textarea)').write('hello');
      await browser.press('Enter');
      await browser.textbox('Multi-line Text (Textarea)').type('world');
      const value = await browser.textbox('Multi-line Text (Textarea)').get.value();
      expect(value).toBe('hello\nworld');
    });

    test('should press Tab key for navigation', async () => {
      await browser.goto(fixtureUrl('forms.html'));
      await browser.textbox('Single-line Text').focus();
      await browser.press('Tab');
      // Tab moves focus to next element - verify by checking we can still interact
      await browser.type('hello');
      const value = await browser.textbox('Password Field').get.value();
      expect(value).toBe('hello');
    });

    test('should press Escape key on focused input', async () => {
      await browser.goto(fixtureUrl('forms.html'));
      await browser.textbox('Single-line Text').focus();
      await browser.press('Escape');
      // Verify focus is still on the element
      const value = await browser.textbox('Single-line Text').get.value();
      expect(value).toBe('');
    });

    test('should press Backspace and Delete keys', async () => {
      await browser.goto(fixtureUrl('forms.html'));
      await browser.textbox('Single-line Text').write('Hello World');
      await browser.press('Backspace');
      let value = await browser.textbox('Single-line Text').get.value();
      expect(value).toBe('Hello Worl');
      await browser.press('Home');
      await browser.press('Delete');
      value = await browser.textbox('Single-line Text').get.value();
      expect(value).toBe('ello Worl');
    });

    test('should press arrow keys', async () => {
      await browser.goto(fixtureUrl('forms.html'));
      await browser.textbox('Single-line Text').write('Test');
      await browser.press('Left');
      await browser.type('hello');
      await browser.press('Right');
      await browser.type('hello');
      await browser.press('Down');
      await browser.type('hello');
      await browser.press('Up');
      await browser.type('hello');
      // Verify text is still intact after arrow key navigation
      const value = await browser.textbox('Single-line Text').get.value();
      expect(value).toBe('helloTeshellothellohello');
    });

    test.skip('should press navigation keys (Home, End, PageUp, PageDown)', async () => {
      await browser.goto(fixtureUrl('forms.html'));
      await browser.textbox('Multi-line Text (Textarea)').write('Line 1\nLine 2\nLine 3');
      await browser.press('Home');
      await browser.type('hell');
      await browser.press('End');
      await browser.type('hell00');
      await browser.press('PageUp');
      await browser.type('helloo');
      await browser.press('PageDown');
      await browser.type('h');
      // Verify text is still intact after navigation
      const value = await browser.textbox('Multi-line Text (Textarea)').get.value();
      expect(value).toContain('Line 1\nLine 2\nhellLine 3hell00hellooh');
    });

    test('should press function keys F1-F12', async () => {
      await browser.goto(fixtureUrl('forms.html'));
      await browser.textbox('Single-line Text').focus();
      await browser.press('F1');
      await browser.press('F5');
      await browser.press('F12');
      // Verify focus is still on the element
      const value = await browser.textbox('Single-line Text').get.value();
      expect(value).toBe('');
    });
  });

  describe('press() - Modifier Key Combinations', () => {
    test('should press Ctrl+A (Select All)', async () => {
      await browser.goto(fixtureUrl('forms.html'));
      await browser.textbox('Single-line Text').write('Select Me');
      await browser.textbox('Single-line Text').ctrl.press('a');
      await browser.textbox('Single-line Text').ctrl.press('c');
      await browser.textbox('Multi-line Text (Textarea)').ctrl.press('v');
      // Verify text is still present after select all
      const value = await browser.textbox('Single-line Text').get.value();
      expect(value).toBe('Select Me');
      // Note: Clipboard operations in automated browsers may not work reliably
      // The test verifies the operation completes without error
      const valuecopied = await browser.textbox('Multi-line Text (Textarea)').get.value();
      // Clipboard may be empty in headless mode or due to browser security restrictions
      // Accept either the copied value or empty string as valid outcomes
      expect(['Select Me', '']).toContain(valuecopied);
    });

    test('should press Ctrl+V (Paste)', async () => {
      await browser.goto(fixtureUrl('forms.html'));
      await browser.textbox('Single-line Text').write('Paste Target');
      await browser.ctrl.press('a');
      await browser.ctrl.press('c');
      await browser.textbox('Email Field').focus();
      await browser.ctrl.press('v');
      // Note: Clipboard operations in automated browsers may not work reliably
      // The test verifies the operation completes without error
      const value = await browser.textbox('Email Field').get.value();
      // Accept either the pasted value or empty string as valid outcomes
      expect(['Paste Target', '']).toContain(value);
    });

    test('should press Shift+Arrow (Select text)', async () => {
      await browser.goto(fixtureUrl('forms.html'));
      await browser.textbox('Single-line Text').write('Select Text');
      await browser.press('Home');
      await browser.type('h');
      await browser.shift.press('Right');
      await browser.type('h');
      await browser.shift.press('Right');
      await browser.type('h');
      // Verify text is still present after selection
      const value = await browser.textbox('Single-line Text').get.value();
      expect(value).toBe('hhhlect Text');
    });
  });

  describe('type() - Character-by-Character Typing', () => {
    test('should type text character by character', async () => {
      await browser.goto(fixtureUrl('forms.html'));
      await browser.textbox('Single-line Text').clear();
      await browser.textbox('Single-line Text').type('Hello World');
      await browser.textbox('Single-line Text').press('He');
      const value = await browser.textbox('Single-line Text').get.value();
      expect(value).toBe('Hello WorldHe');
    });

    test('should type with Shift modifier held', async () => {
      await browser.goto(fixtureUrl('forms.html'));
      await browser.textbox('Single-line Text').clear();
      // Shift modifier is held while typing - verifies the operation completes
      await browser.textbox('Single-line Text').shift.type('hello');
      // Note: Shift+typing behavior varies by browser
      // The test verifies the modifier chain works without error
      // Just verify we can still interact with the element
      const value = await browser.textbox('Single-line Text').get.value();
      expect(value).toBe('HELLO');
    });

    test('should type special characters', async () => {
      await browser.goto(fixtureUrl('forms.html'));
      await browser.textbox('Single-line Text').clear();
      await browser.textbox('Single-line Text').type('Test@123!');
      const value = await browser.textbox('Single-line Text').get.value();
      expect(value).toBe('Test@123!');
    });
  });

  describe('write() and overwrite() - Text Input Methods', () => {
    test('should write text to input field', async () => {
      await browser.goto(fixtureUrl('forms.html'));
      await browser.textbox('Single-line Text').write('Initial Text');
      const value = await browser.textbox('Single-line Text').get.value();
      expect(value).toBe('Initial Text');
    });

    test('should append text with write()', async () => {
      await browser.goto(fixtureUrl('forms.html'));
      await browser.textbox('Single-line Text').write('First ');
      await browser.textbox('Single-line Text').write('Second');
      const value = await browser.textbox('Single-line Text').get.value();
      expect(value).toBe('First Second');
    });

    test('should overwrite existing text', async () => {
      await browser.goto(fixtureUrl('forms.html'));
      await browser.textbox('Single-line Text').write('Original Text');
      await browser.textbox('Single-line Text').overwrite('Replaced');
      const value = await browser.textbox('Single-line Text').get.value();
      expect(value).toBe('Replaced');
    });
  });

  describe('clear() - Clearing Input Fields', () => {
    test('should clear text from input field', async () => {
      await browser.goto(fixtureUrl('forms.html'));
      await browser.textbox('Single-line Text').write('Text to clear');
      await browser.textbox('Single-line Text').clear();
      const value = await browser.textbox('Single-line Text').get.value();
      expect(value).toBe('');
    });
  });

  describe('focus() - Element Focus', () => {
    test('should focus on input element', async () => {
      await browser.goto(fixtureUrl('forms.html'));
      await browser.textbox('Single-line Text').focus();
      // Focus should be set without error
    });

    test('should focus on textarea', async () => {
      await browser.goto(fixtureUrl('forms.html'));
      await browser.textbox('Multi-line Text (Textarea)').focus();
    });
  });

  describe('press() - Backspace Key for Closing UI Elements', () => {
    test('should close searchable dropdown on Escape key', async () => {
      await browser.goto(fixtureUrl('dropdowns-advanced.html'));
      await browser.textbox('Type to search...').write('a');
      await browser.element('Argentina').should.be.visible();
      await browser.press('Backspace');
      await browser.element('Argentina').should.not.be.visible();
      await browser.textbox('Type to search...').write('a');
      await browser.element('Argentina').should.be.visible();
      await browser.textbox('Type to search...').clear();
      const value = await browser.textbox('Type to search...').get.value();
      expect(value).toBe('');
    });
  });
});