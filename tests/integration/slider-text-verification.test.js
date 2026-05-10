import WebBrowser from '../../index.js';

describe('WebBrowser Slider and Text Verification Tests', () => {
  let browser;

  beforeEach(async () => {
    browser = new WebBrowser();
    await browser.start();
    await browser.goto('https://seleniumbase.io/demo_page');
  });

  afterEach(async () => {
    await browser.close();
  });

  test('should verify read-only text field', async () => {
    const value = await browser.element('The Color is Green').get.value();
    expect(value).toBe('The Color is Green');
  });

  test('should verify paragraph text', async () => {
    const text = await browser.element('This Text is Green').get.text();
    expect(text).toBe('This Text is Green');
  });

  test('should interact with the slider', async () => {
    // Assuming the framework has a way to handle sliders or we use a generic element
    await browser.element('50').click(); 
  });
});