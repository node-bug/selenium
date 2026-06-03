import WebBrowser from '../../index.js';

describe('Google Forms Radio Button Test', () => {
  let browser;

  beforeAll(async () => {
    browser = new WebBrowser();
    await browser.start();
  });

  afterAll(async () => {
    await browser.close();
  });

  test('should set and verify Peru radio button on Google Forms', async () => {
    // Navigate to the Google Form
    await browser.goto('https://docs.google.com/forms/d/e/1FAIpQLSciCcNILfeSdgUavm_GYuCFE_G8InD1YVkIWAiTU_B3-l9AkA/viewform');

    // Wait for the form to load - Google Forms can take time to render
    await browser.sleep(3000);

    // Wait for the Peru radio button to be visible
    await browser.radio('Peru').should.be.visible();

    // Click the Peru radio button
    await browser.radio('Peru').click();

    // Verify the radio button is set
    const isSet = await browser.radio('Peru').is.set();
    expect(isSet).toBe(true);
  });
});