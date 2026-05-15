import WebBrowser from '../../index.js';

describe('Element State Integration Tests', () => {
  let browser;

  beforeAll(async () => {
    browser = new WebBrowser();
    await browser.start();
    await browser.goto(`file://${process.cwd()}/tests/fixtures/element-state.html`);
  });

  afterAll(async () => {
    await browser.close();
  });

  test('should assert element is not visible', async () => {
    await browser.element('NonExistentElement').should.not.be.visible();
  });

  test('should check enabled/disabled state', async () => {
    const isDisabled = await browser.button('Click Me').is.disabled();
    expect(typeof isDisabled).toBe('boolean');
    
    const isEnabled = await browser.button('Click Me').is.enabled();
    expect(typeof isEnabled).toBe('boolean');
    
    await browser.button('Click Me').should.be.enabled();
  });

  test('should check checkbox not checked state', async () => {
    const isNotChecked = await browser.checkbox('CheckBox').is.not.checked();
    expect(typeof isNotChecked).toBe('boolean');
    
    await browser.checkbox('CheckBox').should.not.be.checked();
  });

  test('should check pre-checked checkbox state', async () => {
    const isChecked = await browser.checkbox('Pre-Check Box').is.checked();
    expect(typeof isChecked).toBe('boolean');
    expect(isChecked).toBe(true);
    
    await browser.checkbox('Pre-Check Box').should.be.checked();
  });

  test('should assert radio button set/not set', async () => {
    await browser.radio('RadioButton 1').should.be.set();
    await browser.radio('RadioButton 2').should.not.be.set();
  });
});
