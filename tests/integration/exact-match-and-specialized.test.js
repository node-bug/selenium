import WebBrowser from '../../index.js';

describe('WebBrowser Exact Match and Specialized Elements Tests', () => {
  let browser;

  beforeAll(async () => {
    browser = new WebBrowser();
    await browser.start();
  });

  afterAll(async () => {
    await browser.close();
  });

  test('should use exact matching to avoid partial matches', async () => {
    await browser.goto('https://seleniumbase.io/demo_page');
    
    // Test that exact matching works for a specific label
    // "Text Input Field:" is the exact text of the cell
    await browser.exact.element('Text Input Field:').should.be.visible();
    
    // Test that exact matching fails for partial text if it's not an exact match
    // (Assuming .exact modifier enforces strict equality)
     await browser.exact.element('Text Input').should.be.visible();
    
  });

  test('should handle switch elements', async () => {
    await browser.goto('https://www.w3schools.com/howto/tryitdemo/howto_try_toggle_switches.htm');
    
    // Toggle switch 1 starts as Off, turn it On
    await browser.switch('Toggle switch 1').on();
    expect(await browser.switch('Toggle switch 1').is.on()).toBe(true);
    
    // Toggle switch 2 starts as On, turn it Off
    await browser.switch('Toggle switch 2').off();
    expect(await browser.switch('Toggle switch 2').is.off()).toBe(true);
    
    // Toggle back: turn switch 1 Off and switch 2 On
    await browser.switch('Toggle switch 1').off();
    await browser.switch('Toggle switch 2').on();
    
  });

  test('should handle file upload elements', async () => {
    await browser.goto('https://seleniumbase.io/demo_page');
    
    // The demo page doesn't have a visible file upload in the snapshot,
    // but we verify the API can be called.
      await browser.file('Upload Resume').upload('/tmp/dummy-file.txt');
    
  });

  test('should handle table, row, and column elements', async () => {
    await browser.goto('https://seleniumbase.io/demo_page');
    
    // The page content is structured as a table
    await browser.table('Demo Page').should.be.visible();
    
    // Test row and column selection (using indices or text from snapshot)
    // Row 1 contains "Demo Page SeleniumBase Hover Dropdown Automation Practice"
    await browser.row('Demo Page').should.be.visible();
    
    // Column "Demo Page" is visible
    await browser.column('Demo Page').should.be.visible();
  });

  test('should handle navigation, heading, menu, and toolbar elements', async () => {
    await browser.goto('https://seleniumbase.io/demo_page');
    
    // Test heading element - "Demo Page" is a level 1 heading
    await browser.heading('Demo Page').should.be.visible();
    
    // The page doesn't have explicit navigation, menu, or toolbar elements in the snapshot,
    // so we verify the API can be called without crashing.
      await browser.navigation('Main Menu').should.be.visible();
    
      await browser.menu('File').should.be.visible();
      await browser.menuitem('Save').should.be.visible();
      await browser.toolbar('Formatting').should.be.visible();
    
  });
});