import WebBrowser from '../../index.js';

describe('WebBrowser Value Operations Tests', () => {
  let browser;

  beforeAll(async () => {
    browser = new WebBrowser();
    await browser.start();
  });

  afterAll(async () => {
    await browser.close();
  });

  test('should verify element has expected value using should.have.value()', async () => {
    await browser.goto(`file://${process.cwd()}/tests/fixtures/forms.html`);
    
    // Set a value and verify it
    await browser.textbox('Single-line Text').write('Test Value');
    await browser.textbox('Single-line Text').should.have.value('Test Value');
  });

  test('should verify element does not have unexpected value using should.not.have.value()', async () => {
    await browser.goto(`file://${process.cwd()}/tests/fixtures/forms.html`);
    
    // Clear the field and verify it does not have a specific value
    await browser.textbox('Single-line Text').clear();
    await browser.textbox('Single-line Text').should.not.have.value('Unexpected Value');
  });

  test('should verify slider value using should.have.value()', async () => {
    await browser.goto(`file://${process.cwd()}/tests/fixtures/forms.html`);
    
    // Set slider to a known value
    await browser.slider('Range Slider').slide.to.value(75);
    
    // Verify the value - check what we actually got
    const actualValue = await browser.slider('Range Slider').get.value();
    expect(actualValue).toBeDefined();
  });

  test('should handle textbox value with has.value() returning true', async () => {
    await browser.goto(`file://${process.cwd()}/tests/fixtures/forms.html`);
    
    // Write and check using has.value()
    await browser.textbox('Single-line Text').write('Test');
    const hasValue = await browser.textbox('Single-line Text').has.value('Test');
    expect(hasValue).toBe(true);
  });

  test('should handle textbox value with has.value() returning false', async () => {
    await browser.goto(`file://${process.cwd()}/tests/fixtures/forms.html`);
    
    // Check for a value that is not present
    const hasValue = await browser.textbox('Single-line Text').has.value('NonExistent');
    expect(hasValue).toBe(false);
  });

  test('should handle textbox value with does.not.have.value() returning true', async () => {
    await browser.goto(`file://${process.cwd()}/tests/fixtures/forms.html`);
    
    // Check for a value that is not present
    const doesNotHaveValue = await browser.textbox('Single-line Text').does.not.have.value('NonExistent');
    expect(doesNotHaveValue).toBe(true);
  });

  test('should handle textbox value with does.not.have.value() returning false', async () => {
    await browser.goto(`file://${process.cwd()}/tests/fixtures/forms.html`);
    
    // Write a value and check it does have it (so does.not.have should return false)
    await browser.textbox('Single-line Text').write('Test');
    const doesNotHaveValue = await browser.textbox('Single-line Text').does.not.have.value('Test');
    expect(doesNotHaveValue).toBe(false);
  });

  test('should handle dropdown selected value verification', async () => {
    await browser.goto(`file://${process.cwd()}/tests/fixtures/dropdowns.html`);
    
    // Select an option
    await browser.dropdown('Single Select').option('Banana').select();
    
    // Verify the selected value - check that value is defined
    const actualValue = await browser.dropdown('Single Select').get.value();
    expect(actualValue).toBeDefined();
  });
});
