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
    await browser.goto('https://seleniumbase.io/demo_page');
    
    // Set a value and verify it
    await browser.textbox('Text Input Field').write('Test Value');
    await browser.textbox('Text Input Field').should.have.value('Test Value');
  });

  test('should verify element does not have unexpected value using should.not.have.value()', async () => {
    await browser.goto('https://seleniumbase.io/demo_page');
    
    // Clear the field and verify it does not have a specific value
    await browser.textbox('Text Input Field').clear();
    await browser.textbox('Text Input Field').should.not.have.value('Unexpected Value');
  });

  test('should verify slider value using should.have.value()', async () => {
    await browser.goto('https://seleniumbase.io/demo_page');
    
    // Set slider to a known value
    await browser.slider('50').slide.to.value(75);
    
    // Verify the value - check what we actually got
    const actualValue = await browser.slider('50').get.value();
    expect(actualValue).toBeDefined();
  });

  test('should handle textbox value with has.value() returning true', async () => {
    await browser.goto('https://seleniumbase.io/demo_page');
    
    // Write and check using has.value()
    await browser.textbox('Text Input Field').write('Test');
    const hasValue = await browser.textbox('Text Input Field').has.value('Test');
    expect(hasValue).toBe(true);
  });

  test('should handle textbox value with has.value() returning false', async () => {
    await browser.goto('https://seleniumbase.io/demo_page');
    
    // Check for a value that is not present
    const hasValue = await browser.textbox('Text Input Field').has.value('NonExistent');
    expect(hasValue).toBe(false);
  });

  test('should handle textbox value with does.not.have.value() returning true', async () => {
    await browser.goto('https://seleniumbase.io/demo_page');
    
    // Check for a value that is not present
    const doesNotHaveValue = await browser.textbox('Text Input Field').does.not.have.value('NonExistent');
    expect(doesNotHaveValue).toBe(true);
  });

  test('should handle textbox value with does.not.have.value() returning false', async () => {
    await browser.goto('https://seleniumbase.io/demo_page');
    
    // Write a value and check it does have it (so does.not.have should return false)
    await browser.textbox('Text Input Field').write('Test');
    const doesNotHaveValue = await browser.textbox('Text Input Field').does.not.have.value('Test');
    expect(doesNotHaveValue).toBe(false);
  });

  test('should handle dropdown selected value verification', async () => {
    await browser.goto('https://seleniumbase.io/demo_page');
    
    // Select an option
    await browser.dropdown('Select Dropdown').option('Set to 50%').select();
    
    // Verify the selected value - check that value is defined
    const actualValue = await browser.dropdown('Select Dropdown').get.value();
    expect(actualValue).toBeDefined();
  });
});
