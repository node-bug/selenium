import WebBrowser from '../../index.js';

describe('Element State Integration Tests', () => {
  let browser;

  beforeAll(async () => {
    browser = new WebBrowser();
    await browser.start();
    await browser.goto('https://seleniumbase.io/demo_page');
  });

  afterAll(async () => {
    await browser.close();
  });

  test('should assert element is not visible', async () => {
    await browser.element('NonExistentElement').should.not.be.visible();
  });

  test('should check enabled/disabled state', async () => {
    const isEnabled = await browser.element('Text Input Field').is.enabled();
    expect(typeof isEnabled).toBe('boolean');
    
    await browser.element('Text Input Field').should.be.enabled();
  });
});
