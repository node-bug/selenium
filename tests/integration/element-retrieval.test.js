import WebBrowser from '../../index.js';

describe('WebBrowser Element Retrieval Tests', () => {
  let browser;

  beforeAll(async () => {
    browser = new WebBrowser();
    await browser.start();
  });

  afterAll(async () => {
    await browser.close();
  });

  test('should retrieve text and value from elements', async () => {
    await browser.goto('https://seleniumbase.io/demo_page');
    
    // Test text retrieval
    const text = await browser.textbox('Text Input Field').get.text();
    expect(typeof text).toBe('string');

    // Test value retrieval
    await browser.textbox('Text Input Field').press('Hello World');
    const value = await browser.textbox('Text Input Field').get.value();
    expect(value).toBe('Hello World');
  });

  test('should retrieve attributes from elements', async () => {
    await browser.goto('https://seleniumbase.io/demo_page');
    const attribute = await browser.element('Text Input Field').get.attribute('placeholder');
    expect(attribute).toBeDefined();
  });

  test('should capture element screenshots', async () => {
    await browser.goto('https://seleniumbase.io/demo_page');
    const screenshot = await browser.element('Text Input Field').get.screenshot();
    expect(typeof screenshot).toBe('string');
    expect(screenshot.startsWith('iVBORw0KGgo')).toBe(true);
  });

  test('should capture full page screenshot when no element is specified', async () => {
    await browser.goto('https://seleniumbase.io/demo_page');
    browser.stack = []; // Clear stack
    const screenshot = await browser.get.screenshot();
    expect(typeof screenshot).toBe('string');
    expect(screenshot.startsWith('iVBORw0KGgo')).toBe(true);
  });
});
