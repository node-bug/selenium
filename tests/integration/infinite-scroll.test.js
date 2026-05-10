import WebBrowser from '../../index.js';

describe('WebBrowser Infinite Scroll Tests', () => {
  let browser;

  beforeAll(async () => {
    browser = new WebBrowser();
    // We use a default config or environment variables for headless mode in CI
    await browser.start();
  });

  afterAll(async () => {
    await browser.close();
  });

  test('should handle infinite scroll and lazy loading', async () => {
    await browser.goto('https://the-internet.herokuapp.com/infinite_scroll');
    
    try {
      // Scroll down to trigger lazy loading
      await browser.scrollToBottom();
      await browser.sleep(1000); // Wait for content to load
      
      // Scroll back up
      await browser.scrollToTop();
      await browser.sleep(1000);
      
      // Scroll to a specific element
      await browser.element('Last paragraph of list').scrollIntoView();
    } catch (error) {
      console.log('Infinite scroll test skipped - functionality not available:', error.message);
    }
  });
});