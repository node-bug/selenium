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
      const value = await browser.dropdown('mySelect').get.value();
      expect(typeof value).toBe('string');
    
  });

  test('should check if option is selected', async () => {
      // "Set to 25%" is the default selected option
      const isSelected = await browser.dropdown('mySelect').option('Set to 25%').is.selected();
      expect(typeof isSelected).toBe('boolean');

      // "Set to 50%" exists but is not selected
      const isNotSelected = await browser.dropdown('mySelect').option('Set to 50%').is.not.selected();
      expect(typeof isNotSelected).toBe('boolean');

    });

    test('should return false when option exists but is not selected', async () => {
      // "Set to 75%" exists in the dropdown but is not selected — should return false
      const result = await browser.dropdown('mySelect').option('Set to 75%').is.selected();
      expect(result).toBe(false);
    });

    test('should return false when option does not exist in dropdown', async () => {
      // NonExistent option should return false (not throw)
      const result = await browser.dropdown('mySelect').option('NonExistentOptionThatDoesNotExist').is.selected();
      expect(result).toBe(false);
    });

    test('should return true when asserting non-existent option should not be selected', async () => {
      // NonExistent option should return true for "is not selected" (not throw)
      const result = await browser.dropdown('mySelect').option('NonExistent').is.not.selected();
      expect(result).toBe(true);
    });

    test('should.be.selected should pass when option is selected', async () => {
      // "Set to 25%" is the default selected option
      await expect(
        browser.dropdown('mySelect').option('Set to 25%').should.be.selected()
      ).resolves.toBeUndefined();
    });

    test('should.be.selected should throw when option is not selected', async () => {
      // "Set to 75%" exists but is not selected
      await expect(
        browser.dropdown('mySelect').option('Set to 75%').should.be.selected()
      ).rejects.toThrow();
    });

    test('should.not.be.selected should pass when option is not selected', async () => {
      // "Set to 75%" exists but is not selected
      await expect(
        browser.dropdown('mySelect').option('Set to 75%').should.not.be.selected()
      ).resolves.toBeUndefined();
    });

    test('should.not.be.selected should throw when option is selected', async () => {
      // "Set to 25%" is the default selected option
      await expect(
        browser.dropdown('mySelect').option('Set to 25%').should.not.be.selected()
      ).rejects.toThrow();
    });
});
