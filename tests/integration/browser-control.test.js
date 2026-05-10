import WebBrowser from '../../index.js';

describe('Browser Control Integration Tests', () => {
  let browser;

  beforeAll(async () => {
    browser = new WebBrowser();
    await browser.start();
  });

  afterAll(async () => {
    await browser.close();
  });

  test('should navigate to a URL using goto()', async () => {
    const success = await browser.goto('https://www.google.com');
    expect(success).toBe(true);
  });

  test('should set browser window size using setSize()', async () => {
    const size = { width: 1024, height: 768 };
    const success = await browser.setSize(size);
    expect(success).toBe(true);
  });

  test('should sleep for a specified duration', async () => {
    const start = Date.now();
    await browser.sleep(500);
    const end = Date.now();
    expect(end - start).toBeGreaterThanOrEqual(500);
  });

  test('should return actions instance', () => {
    const actions = browser.actions();
    expect(actions).toBeDefined();
    expect(typeof actions).toBe('object');
  });
});
