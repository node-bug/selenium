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
      const isDisabled = await browser.button('Submit').is.disabled();
      expect(typeof isDisabled).toBe('boolean');
      
      const isEnabled = await browser.button('Submit').is.enabled();
      expect(typeof isEnabled).toBe('boolean');
      
      await browser.button('Submit').should.be.enabled();
    
  });

  test('should check checkbox not checked state', async () => {
      const isNotChecked = await browser.checkbox('Check this').is.not.checked();
      expect(typeof isNotChecked).toBe('boolean');
      
      await browser.checkbox('Check this').should.not.be.checked();
    
  });

  test('should assert radio button set/not set', async () => {
      await browser.radio('Radio 1').should.be.set();
      await browser.radio('Radio 2').should.not.be.set();
    
  });

  test('should assert switch state', async () => {
      await browser.goto('https://www.w3schools.com/howto/tryitdemo/howto_try_toggle_switches.htm');
      const switchElement = browser.switch('Toggle switch 1');
      
      await switchElement.on();
      await switchElement.should.be.on();
      
      await switchElement.off();
      await switchElement.should.be.off();
  });
});
