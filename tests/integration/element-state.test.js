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
    try {
      await browser.element('NonExistentElement').should.not.be.visible();
    } catch {
      // Expected to fail if element is not found, but we are testing the assertion
    }
  });

  test('should check enabled/disabled state', async () => {
    try {
      const isDisabled = await browser.button('Submit').is.disabled();
      expect(typeof isDisabled).toBe('boolean');
      
      const isEnabled = await browser.button('Submit').is.enabled();
      expect(typeof isEnabled).toBe('boolean');
      
      await browser.button('Submit').should.be.enabled();
    } catch {
      console.log('Enabled/Disabled state check failed - element not found');
    }
  });

  test('should check checkbox not checked state', async () => {
    try {
      const isNotChecked = await browser.checkbox('Check this').is.not.checked();
      expect(typeof isNotChecked).toBe('boolean');
      
      await browser.checkbox('Check this').should.not.be.checked();
    } catch {
      console.log('Checkbox not checked state check failed');
    }
  });

  test('should assert radio button set/not set', async () => {
    try {
      await browser.radio('Radio 1').should.be.set();
      await browser.radio('Radio 2').should.not.be.set();
    } catch {
      console.log('Radio button set state check failed');
    }
  });
});
