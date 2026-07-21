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
    const { dataUrl, width, height } = await browser.element('Single-line Text').get.screenshot();
    expect(typeof dataUrl).toBe('string');
    expect(dataUrl.startsWith('iVBORw0KGgo')).toBe(true);
    expect(typeof width).toBe('number');
    expect(typeof height).toBe('number');
  });

  test('should capture full page screenshot when no element is specified', async () => {
    browser.stack = []; // Clear stack
    const { dataUrl, width, height } = await browser.get.screenshot();
    expect(typeof dataUrl).toBe('string');
    expect(dataUrl.startsWith('iVBORw0KGgo')).toBe(true);
    expect(typeof width).toBe('number');
    expect(typeof height).toBe('number');
  });

  test('should expose injectElementFinder that makes window.ElementFinder available', async () => {
    await browser.injectElementFinder();
    const injected = await browser.driver.executeScript(
      'return typeof window.ElementFinder'
    );
    expect(injected).toBe('object');

    // And it can be used directly for raw discovery
    const result = await browser.driver.executeScript(
      'return window.ElementFinder.findProbableElements("textbox", "Single-line Text")'
    );
    expect(result).toBeDefined();
    expect(Array.isArray(result.elements)).toBe(true);
    expect(result.elements.length).toBeGreaterThan(0);
  });
});
