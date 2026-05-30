import WebBrowser from '../../index.js';

describe('Form Elements Integration Tests', () => {
  let browser;

  beforeAll(async () => {
    browser = new WebBrowser();
    await browser.start();
    await browser.goto(`file://${process.cwd()}/tests/fixtures/forms.html`);
  });

  afterAll(async () => {
    await browser.close();
  });

  describe('Text-based Inputs', () => {
    test('should interact with single-line text input', async () => {
      await browser.textbox('Single-line Text').write('Hello World');
      const value = await browser.textbox('Single-line Text').get.value();
      expect(value).toBe('Hello World');
    });

    test('should interact with password field', async () => {
      await browser.textbox('Password Field').write('Secret123');
      const value = await browser.textbox('Password Field').get.value();
      expect(value).toBe('Secret123');
    });

    test('should interact with email field', async () => {
      await browser.textbox('Email Field').write('test@example.com');
      const value = await browser.textbox('Email Field').get.value();
      expect(value).toBe('test@example.com');
    });

    test('should interact with number field', async () => {
      await browser.textbox('Number Field').clear();
      await browser.textbox('Number Field').write('42');
      const value = await browser.textbox('Number Field').get.value();
      expect(value).toBe('42');
    });

    test('should interact with textarea', async () => {
      await browser.textbox('Multi-line Text (Textarea)').write('This is a long\nmulti-line text');
      const value = await browser.textbox('Multi-line Text (Textarea)').get.value();
      expect(value).toBe('This is a long\nmulti-line text');
    });
  });

  describe('Checkboxes', () => {
    test('should toggle checkboxes', async () => {
      // Initial state (unchecked)
      const isChecked = await browser.checkbox('Subscribe to newsletter').is.checked();
      expect(isChecked).toBe(false);

      await browser.checkbox('Subscribe to newsletter').check();
      expect(await browser.checkbox('Subscribe to newsletter').is.checked()).toBe(true);

      await browser.checkbox('Subscribe to newsletter').uncheck();
      expect(await browser.checkbox('Subscribe to newsletter').is.checked()).toBe(false);
    });

    test('should detect hidden checkbox as not visible', async () => {
      // Hidden checkbox (display:none) should not be visible - use CSS selector to target the input directly
      expect(await browser.checkbox('#check-hidden').is.visible()).toBe(false);
    });
  });

  describe('Radio Buttons', () => {
    test('should select a radio button', async () => {
      await browser.radio('PayPal').click();
      expect(await browser.radio('PayPal').is.set()).toBe(true);
    });

    test('should change selection between radio buttons in same group', async () => {
      await browser.radio('Credit Card').click();
      expect(await browser.radio('Credit Card').is.set()).toBe(true);

      await browser.radio('PayPal').click();
      expect(await browser.radio('Credit Card').is.set()).toBe(false);
      expect(await browser.radio('PayPal').is.set()).toBe(true);
    });
  });

  describe('Special Inputs', () => {
    test('should interact with color picker', async () => {
      await browser.colorpicker('Color Picker').write('#00ff00');
      const value = await browser.colorpicker('Color Picker').get.value();
      expect(value).toBe('#00ff00');
    });

    test('should interact with range slider', async () => {
      await browser.slider('Range Slider').slide.to.value(75);
      const value = await browser.slider('Range Slider').get.value();
      expect(value).toBe('75');
    });
  });

  describe('Validation and State', () => {
    test('should handle disabled field', async () => {
      expect(await browser.textbox('Disabled Field').is.disabled()).toBe(true);
      await expect(browser.textbox('Disabled Field').write('test')).rejects.toThrow();
    });

    test('should handle read-only field', async () => {
      const value = await browser.textbox('Read-only Field').get.value();
      expect(value).toBe('Read only content');
    });

    test('should trigger validation error on empty required field', async () => {
      // Clear the field first to ensure it's empty
      await browser.textbox('Required Field (HTML5)').clear();

      await browser.button('Submit Form').click();

      // Check the form status message for validation failure
      const status = await browser.element('form-status').get.text();
      expect(status).toContain('Form submission failed');
    });

    test('should submit successfully when required field is filled', async () => {
      await browser.textbox('Required Field (HTML5)').write('Filled');

      await browser.button('Submit Form').click();

      const status = await browser.element('form-status').get.text();
      expect(status).toContain('Form submitted successfully!');
    });
  });
});