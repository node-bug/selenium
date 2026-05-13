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


    await browser.textbox('username').write('tomsmith');
    await browser.textbox('password').write('SuperSecretPassword!');
    await browser.button('Login').click();

    // Wait for page navigation after login
    await browser.sleep(3000);

    // Verify successful login
    const successMessage = await browser.element('You logged into a secure area!').get.text();
    expect(successMessage).toContain('You logged into a secure area!');

    // Test logout
    await browser.element('Logout').click();
    await browser.sleep(5000);
    const logoutMessage = await browser.element('You logged out').get.text();
    expect(logoutMessage).toContain('You logged out');

  });
});