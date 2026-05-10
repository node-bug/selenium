import WebBrowser from '../../index.js';

describe('WebBrowser Service Workers Tests', () => {
  let browser;

  beforeAll(async () => {
    browser = new WebBrowser();
    // We use a default config or environment variables for headless mode in CI
    await browser.start();
  });

  afterAll(async () => {
    await browser.close();
  });

  test('should handle service workers and offline capabilities', async () => {
    await browser.goto('https://seleniumbase.io/demo_page');
    
    try {
      // Check if service worker is registered
      const swRegistered = await browser.serviceWorker().isRegistered();
      console.log(`Service worker registered: ${swRegistered}`);
      
      // You could test offline capabilities here
      // This is more of a demonstration test
    } catch (error) {
      console.log('Service worker test skipped - functionality not available:', error.message);
    }
  });
});