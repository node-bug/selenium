import WebBrowser from '../../index.js';

describe('WebBrowser Element Retrieval Tests', () => {
  let browser;

  beforeAll(async () => {
    browser = new WebBrowser();
    await browser.start();
    await browser.goto(`file://${process.cwd()}/tests/fixtures/forms.html`);
  });

  afterAll(async () => {
    await browser.close();
  });

  test('should retrieve text and value from elements', async () => {
    // Test text retrieval
    const text = await browser.textbox('Single-line Text').get.text();
    expect(typeof text).toBe('string');

    // Test value retrieval
    await browser.textbox('Single-line Text').write('Hello World');
    const value = await browser.textbox('Single-line Text').get.value();
    expect(value).toBe('Hello World');
  });

  test('should retrieve attributes from elements', async () => {
    const attribute = await browser.textbox('Single-line Text').get.attribute('placeholder');
    expect(attribute).toBe('Enter text here...');
  });

  test('should capture element screenshots', async () => {
    const screenshot = await browser.element('Single-line Text').get.screenshot();
    expect(typeof screenshot).toBe('string');
    expect(screenshot.startsWith('iVBORw0KGgo')).toBe(true);
  });

  test('should capture full page screenshot when no element is specified', async () => {
    browser.stack = []; // Clear stack
    const screenshot = await browser.get.screenshot();
    expect(typeof screenshot).toBe('string');
    expect(screenshot.startsWith('iVBORw0KGgo')).toBe(true);
  });
});
