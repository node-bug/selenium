import WebBrowser from '../../index.js';

describe('Dropdown Operations Integration Tests', () => {
  let browser;

  beforeAll(async () => {
    browser = new WebBrowser();
    await browser.start();
    await browser.goto('https://seleniumbase.io/demo_page');
  });

  afterAll(async () => {
    await browser.close();
  });

  test('should get dropdown value', async () => {
      const value = await browser.dropdown('Dropdown').get.value();
      expect(typeof value).toBe('string');
    
  });

  test('should check if option is selected', async () => {
    
      const isSelected = await browser.dropdown('Dropdown').option('Option 1').is.selected();
      expect(typeof isSelected).toBe('boolean');
      
      const isNotSelected = await browser.dropdown('Dropdown').option('Option 2').is.not.selected();
      expect(typeof isNotSelected).toBe('boolean');
    
  });

  test('should assert option is not selected', async () => {
      await browser.dropdown('Dropdown').option('NonExistent').should.not.be.selected();
    
  });
});
