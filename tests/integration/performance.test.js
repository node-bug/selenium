import WebBrowser from '../../index.js';

describe('WebBrowser Performance Tests', () => {
  test('should measure page load performance', async () => {
    let browser = new WebBrowser();
    // We use a default config or environment variables for headless mode in CI
    await browser.start();
    const startTime = Date.now();
    await browser.goto('https://seleniumbase.io/demo_page');
    await browser.sleep(1000); // Assuming this method exists or we can implement
    const endTime = Date.now();
    const loadTime = endTime - startTime;

    // Log performance metrics (in real scenario, you might assert against thresholds)
    console.log(`Page load time: ${loadTime}ms`);
    expect(loadTime).toBeLessThan(10000); // Should load within 10 seconds
    await browser.close();
  });
});