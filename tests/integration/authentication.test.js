import WebBrowser from '../../index.js';

describe('WebBrowser Authentication Tests', () => {
  let browser;

  beforeAll(async () => {
    browser = new WebBrowser();
    // We use a default config or environment variables for headless mode in CI
    await browser.start();
  });

  afterAll(async () => {
    await browser.close();
  });

  test('should handle complex user authentication flow', async () => {
    // Using a test authentication page
    await browser.goto('https://the-internet.herokuapp.com/login');


    await browser.element('username').write('tomsmith');
    await browser.element('password').write('SuperSecretPassword!');
    await browser.element('Login').click();

    // Verify successful login
    const successMessage = await browser.element('flash success').get.text();
    expect(successMessage).toContain('You logged into a secure area!');

    // Test logout
    await browser.element('Logout').click();
    const logoutMessage = await browser.element('flash').get.text();
    expect(logoutMessage).toContain('You logged out');

  });
});