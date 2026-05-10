import WebBrowser from '../../index.js';

describe('WebBrowser Tabs and Windows Tests', () => {
  let browser;

  beforeAll(async () => {
    browser = new WebBrowser();
    // We use a default config or environment variables for headless mode in CI
    await browser.start();
  });

  afterAll(async () => {
    await browser.close();
  });

  test('should manage tabs', async () => {
    await browser.goto('https://seleniumbase.io/demo_page');
    await browser.tab().new();
    await browser.goto('https://example.org');
    
    const url1 = await browser.tab(0).get.url();
    const url2 = await browser.tab(1).get.url();
    
    expect(url1).toContain('seleniumbase.io');
    expect(url2).toContain('example.org');
    
    await browser.tab(1).close();
    await browser.tab(0).switch();
  });

  test('should handle window management', async () => {
    await browser.goto('https://seleniumbase.io/demo_page');
    
    // Store initial window handle/title for later verification
    const initialTitle = await browser.window().get.title();
    
    // Open new window
    await browser.window().new();
    
    // Switch to new window and verify
    await browser.window(1).switch();
    await browser.goto('https://example.org');
    const url1 = await browser.tab().get.url();
    expect(url1).toContain('example.org');
    
    // Switch back to first window
    await browser.window(0).switch();
    await browser.goto('https://seleniumbase.io/demo_page');
    const url0 = await browser.tab().get.url();
    expect(url0).toContain('seleniumbase.io');
    
    // Close second window
    await browser.window(1).close();
    
    // Switch back to first window and verify we're on the right page
    await browser.window(0).switch();
    await browser.goto('https://seleniumbase.io/demo_page'); // Ensure we're on the right page
    const currentTitle = await browser.window().get.title();
    expect(currentTitle).toBe(initialTitle);
  });
});