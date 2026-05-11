import WebBrowser from '../../index.js';

describe('WebBrowser Advanced Click Integration Tests', () => {
  let browser;

  beforeAll(async () => {
    browser = new WebBrowser();
    await browser.start();
  });

  afterAll(async () => {
    await browser.close();
  });

  test('should perform triple click', async () => {
    await browser.goto('https://seleniumbase.io/demo_page');
    // Triple click on a text field to select all text
    await browser.element('Text Input Field').tripleClick();
  });

  test('should perform multiple clicks', async () => {
    await browser.goto('https://seleniumbase.io/demo_page');
    // Click the green button 3 times
    await browser.element('Click Me (Green)').multipleClick(3);
  });

  test('should perform long press', async () => {
    await browser.goto('https://seleniumbase.io/demo_page');
    // Long press on the green button
    await browser.element('Click Me (Green)').longPress(500);
  });

  test('should perform coordinate-based click', async () => {
    await browser.goto('https://seleniumbase.io/demo_page');
    // Click at coordinates (10, 10) relative to the element
    await browser.element('Click Me (Green)').click(10, 10);
  });

  test('should perform click with modifiers', async () => {
    await browser.goto('https://seleniumbase.io/demo_page');
    // Ctrl+Click on a link (if available) or just test the modifier chain
    // Since we are on a demo page, we'll test the chain on the green button
    await browser.element('Click Me (Green)').ctrl.click();
    await browser.element('Click Me (Green)').shift.alt.click();
  });

  test('should handle click out of bounds error', async () => {
    await browser.goto('https://seleniumbase.io/demo_page');
    const element = browser.element('Click Me (Green)');
    
    // Try to click far outside the element's bounds to trigger the error in _clicker
    await expect(element.click(10000, 10000)).rejects.toThrow('Click out of bounds');
  });
});
