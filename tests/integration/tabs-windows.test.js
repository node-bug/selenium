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
    const fixturePath = `file://${process.cwd()}/tests/fixtures/forms.html`;
    await browser.goto(fixturePath);
    await browser.tab().new();
    await browser.goto(fixturePath);
    
    const url1 = await browser.tab(0).get.url();
    const url2 = await browser.tab(1).get.url();
    
    expect(url1).toContain('forms.html');
    expect(url2).toContain('forms.html');
    
    await browser.tab(1).close();
    await browser.tab(0).switch();
  });

  test('should handle window management', async () => {
    const fixturePath = `file://${process.cwd()}/tests/fixtures/forms.html`;
    await browser.goto(fixturePath);
    
    // Store initial window handle/title for later verification
    const initialTitle = await browser.window().get.title();
    
    // Open new window
    await browser.window().new();
    
    // Switch to new window and verify
    await browser.window(1).switch();
    await browser.goto(fixturePath);
    const url1 = await browser.tab().get.url();
    expect(url1).toContain('forms.html');
    
    // Switch back to first window
    await browser.window(0).switch();
    await browser.goto(fixturePath);
    const url0 = await browser.tab().get.url();
    expect(url0).toContain('forms.html');
    
    // Close second window
    await browser.window(1).close();
    
    // Switch back to first window and verify we're on the right page
    await browser.window(0).switch();
    await browser.goto(fixturePath); // Ensure we're on the right page
    const currentTitle = await browser.window().get.title();
    expect(currentTitle).toBe(initialTitle);
  });
});