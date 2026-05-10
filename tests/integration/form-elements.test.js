import WebBrowser from '../../index.js';

describe('WebBrowser Form Elements Tests', () => {
  let browser;

  beforeAll(async () => {
    browser = new WebBrowser();
    // We use a default config or environment variables for headless mode in CI
    await browser.start();
  });

  afterAll(async () => {
    await browser.close();
  });

  test('should handle basic text input and verification', async () => {
    await browser.goto('https://seleniumbase.io/demo_page');
    
    // Using the demo page's input fields
    await browser.textbox('Text Input Field').clear();
    await browser.textbox('Text Input Field').write('John');
    
    // Verify the values were written
    const firstName = await browser.textbox('Text Input Field').get.text();
    expect(firstName).toBe('John');
  });

  test('should handle form elements (checkbox, radio, dropdown)', async () => {
    await browser.goto('https://seleniumbase.io/demo_page');
    
    // Checkbox - using generic element to avoid type-matching issues
    await browser.checkbox('CheckBox').check();
    expect(await browser.checkbox('CheckBox').is.checked()).toBe(true);
    
    // Radio button
    await browser.radio('RadioButton 1').set();
    expect(await browser.radio('RadioButton 1').is.set()).toBe(true);
    
    // Dropdown
    await browser.dropdown('Select Dropdown').option('Set to 50%').select();
    await browser.dropdown('Select Dropdown').option('Set to 50%').should.be.selected();
  });
});