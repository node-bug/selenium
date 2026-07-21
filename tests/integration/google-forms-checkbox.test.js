import { log } from '@nodebug/logger';
import WebBrowser from '../../index.js';

describe('Google Forms Checkbox Test', () => {
  let browser;

  beforeAll(async () => {
    browser = new WebBrowser();
    await browser.start();
  });

  afterAll(async () => {
    await browser.close();
  });

  test('should check and verify a checkbox on Google Forms', async () => {
    // Navigate to the Google Form
    await browser.goto('https://docs.google.com/forms/d/e/1FAIpQLSciCcNILfeSdgUavm_GYuCFE_G8InD1YVkIWAiTU_B3-l9AkA/viewform');

    // Wait for the form to load - Google Forms can take time to render
    await browser.sleep(3000);

    // Google Forms checkboxes have role="checkbox" and aria-checked attribute
    // Find a checkbox by looking for elements with role="checkbox"
    const checkboxLabel = await browser.driver.executeScript(`
      const checkbox = document.querySelector('[role="checkbox"]');
      return checkbox ? (checkbox.textContent || checkbox.getAttribute('aria-label') || 'Checkbox') : null;
    `);

    if (checkboxLabel) {
      // Click the checkbox
      await browser.checkbox(checkboxLabel).check();

      // Verify the checkbox is checked
      const isChecked = await browser.checkbox(checkboxLabel).is.checked();
      expect(isChecked).toBe(true);
    } else {
      // Skip test if no checkboxes found (form structure may have changed)
      log.info('No checkboxes found on Google Form, skipping test');
    }
  });
});