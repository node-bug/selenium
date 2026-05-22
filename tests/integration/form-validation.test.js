import WebBrowser from '../../index.js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const fixturePath = join(__dirname, '../fixtures/demo-page.html');
const fixtureUrl = 'file://' + fixturePath;

describe('WebBrowser Form Validation Tests', () => {
  let browser;

  beforeEach(async () => {
    browser = new WebBrowser();
    await browser.start();
  });

  afterEach(async () => {
    await browser.close();
  });

  test('should handle complex form validation', async () => {
    await browser.goto(fixtureUrl);
    
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
