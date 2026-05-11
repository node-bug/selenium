import { jest } from '@jest/globals';
import WebBrowser from '../../index.js';

describe('Switch Index Test', () => {
  let browser;

  beforeAll(async () => {
    browser = new WebBrowser();
    await browser.start();
  });

  afterAll(async () => {
    await browser.close();
  });

  test('should handle switch elements by index', async () => {
    await browser.goto('https://www.w3schools.com/howto/howto_css_switch.asp');
    
    // Try to dismiss cookie banner if present (may not always appear)
    try {
      await browser.button('Decline').click();
    } catch {
      // Cookie banner not present, continue
    }
    
    // Test switch functionality with real toggle switches
    // Turn switch on
    await browser.switch(1).on();
    expect(await browser.switch(1).is.on()).toBe(true);
  });
});
