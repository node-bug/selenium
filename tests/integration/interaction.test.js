import WebBrowser from '../../index.js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const fixturePath = join(__dirname, '../fixtures/demo-page.html');
const fixtureUrl = 'file://' + fixturePath;

describe('WebBrowser Interaction Tests', () => {
  let browser;

  beforeAll(async () => {
    browser = new WebBrowser();
    await browser.start();
  });

  afterAll(async () => {
    await browser.close();
  });

  test('should click the green button', async () => {
    await browser.goto(fixtureUrl);
    await browser.button('Click Me (Green)').click();
    // Since it's a demo page, we might just verify it doesn't throw or check for a result if available
  });

  test('should hover and focus elements', async () => {
    await browser.goto(fixtureUrl);
    await browser.element('Hover Dropdown').hover();
    await browser.element('Text Input Field').focus();
  });

  test('should handle unchecking and radio button state', async () => {
    await browser.goto(fixtureUrl);
    
    // Check then uncheck
    await browser.checkbox('CheckBox').check();
    await browser.checkbox('CheckBox').uncheck();
    expect(await browser.checkbox('CheckBox').is.checked()).toBe(false);
    
    // Radio button verification
    await browser.radio('RadioButton 1').click();
    expect(await browser.radio('RadioButton 1').is.set()).toBe(true);
    await browser.radio('RadioButton 2').click();
    expect(await browser.radio('RadioButton 2').is.set()).toBe(true);
    expect(await browser.radio('RadioButton 1').is.set()).toBe(false);
  });

  test('should interact with iFrame elements', async () => {
    await browser.goto(fixtureUrl);
    // The demo page has a checkbox in an iframe
    // Assuming the framework handles iframe switching automatically or via element search
    await browser.checkbox('CheckBox in iFrame').check();
  });
});
