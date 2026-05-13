import WebBrowser from '../../index.js';

describe('WebBrowser Form Validation Tests', () => {
  let browser;

  beforeEach(async () => {
    browser = new WebBrowser();
    // We use a default config or environment variables for headless mode in CI
    await browser.start();
  });

  afterEach(async () => {
    await browser.close();
  });

  test('should handle complex form validation', async () => {
    await browser.goto('https://seleniumbase.io/demo_page');
    
    // Fill out multiple fields
    await browser.textbox('Text Input Field').write('Test User');
    await browser.textbox('Textarea').write('This is a test textarea\nWith multiple lines');
    await browser.checkbox('CheckBox').check();
    await browser.radio('RadioButton 1').click();
    await browser.dropdown('Select Dropdown').option('Set to 50%').select();
    
    // Verify all values
    expect(await browser.textbox('Text Input Field').get.value()).toBe('Test User');
    expect(await browser.textbox('Textarea').get.value()).toContain('This is a test textarea');
    expect(await browser.checkbox('CheckBox').is.checked()).toBe(true);
    expect(await browser.radio('RadioButton 1').is.set()).toBe(true);
    expect(await browser.dropdown('Select Dropdown').get.text()).toContain('Set to 50%');
    
    // Clear form and verify
    await browser.textbox('Text Input Field').clear();
    await browser.textbox('Textarea').clear();
    await browser.checkbox('CheckBox').uncheck();
    await browser.radio('RadioButton 2').click(); // Select different radio
    await browser.dropdown('Select Dropdown').option('Set to 25%').select();
    
    expect(await browser.textbox('Text Input Field').get.value()).toBe('');
    expect(await browser.textbox('Textarea').get.value()).toBe('');
    expect(await browser.checkbox('CheckBox').is.checked()).toBe(false);
    expect(await browser.radio('RadioButton 2').is.set()).toBe(true);
    expect(await browser.dropdown('Select Dropdown').get.text()).toContain('Set to 25%');
  });
});