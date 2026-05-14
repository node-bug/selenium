import WebBrowser from '../../index.js';

describe('Advanced Dropdown Interactions Integration Tests', () => {
  let browser;

  beforeAll(async () => {
    browser = new WebBrowser();
    await browser.start();
    await browser.goto(`file://${process.cwd()}/tests/fixtures/dropdowns-advanced.html`);
  });

  afterAll(async () => {
    await browser.close();
  });

  // ========================================
  // 3. Searchable/Autocomplete Dropdown Tests
  // ========================================

  describe('Searchable Dropdown', () => {
    test('should filter and select from searchable dropdown', async () => {
      await browser.textbox('Type to search...').overwrite('Can');
      await browser.element('Canada').click();
      
      const value = await browser.textbox('Type to search...').get.value();
      expect(value).toBe('Canada');
    });

    test('should filter with partial match', async () => {
      await browser.textbox('Type to search...').overwrite('Ja');
      await browser.element('Japan').click();
      
      const value = await browser.textbox('Type to search...').get.value();
      expect(value).toBe('Japan');
    });
  });

  // ========================================
  // 4. Multi-select with Tags Tests
  // ========================================

  describe('Multi-select Tags', () => {
    test('should add tag by clicking button', async () => {
      await browser.button('JavaScript').click();
      
      const tags = await browser.element('tag').findAll();
      expect(tags.length).toBeGreaterThan(0);
    });

    test('should add multiple tags', async () => {
      await browser.button('Python').click();
      
      const tags = await browser.element('tag').findAll();
      expect(tags.length).toBeGreaterThan(1);
    });

    test('should remove tag by clicking remove button', async () => {
      const tagsBefore = await browser.element('tag').findAll();
      const removeButtons = await browser.element('×').findAll();
      if (removeButtons.length > 0) {
        await removeButtons[0].click();
      }
      
      const tagsAfter = await browser.element('tag').findAll();
      expect(tagsAfter.length).toBe(tagsBefore.length - 1);
    });
  });
});