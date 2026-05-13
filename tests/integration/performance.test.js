import WebBrowser from '../../index.js';

describe('WebBrowser Performance Tests', () => {
  let browser;

  beforeEach(async () => {
    browser = new WebBrowser();
    await browser.start();
  });

  afterEach(async () => {
    await browser.close();
  });

  test('should measure page load performance', async () => {
    const startTime = Date.now();
    await browser.goto('https://seleniumbase.io/demo_page');
    const endTime = Date.now();
    const loadTime = endTime - startTime;

    // Log performance metrics
    console.log(`Page load time: ${loadTime}ms`);
    expect(loadTime).toBeLessThan(10000); // Should load within 10 seconds
  });

  test('should measure page refresh performance', async () => {
    await browser.goto('https://seleniumbase.io/demo_page');

    const startTime = Date.now();
    await browser.refresh();
    const endTime = Date.now();
    const refreshTime = endTime - startTime;

    console.log(`Page refresh time: ${refreshTime}ms`);
    expect(refreshTime).toBeLessThan(10000);
  });
});