/**
 * Integration tests for the SeleniumBase demo page
 * Tests various features available on the demo page
 */

import WebBrowser from '../../index.js';

describe('SeleniumBase Demo Page Integration Tests', () => {
  let browser;

  beforeEach(async () => {
    browser = new WebBrowser();
    await browser.start();
    await browser.goto('https://seleniumbase.io/demo_page');
    // Wait for page to load
    await new Promise(resolve => setTimeout(resolve, 2000));
  });

  afterEach(async () => {
    if (browser) {
      await browser.close();
    }
  });

  describe('Text Input and Textarea', () => {
    it('should be able to enter text into text input field', async () => {
      const testText = 'Hello World';
      await browser.element('myTextInput').write(testText);
      const text = await browser.element('myTextInput').get.text();
      expect(text).toBe(testText);
    });

    it('should be able to enter text into textarea', async () => {
      const testText = 'This is a textarea test\nWith multiple lines';
      await browser.element('myTextarea').write(testText);
      const text = await browser.element('myTextarea').get.text();
      expect(text).toBe(testText);
    });

    it('should be able to clear text from input field', async () => {
      await browser.element('myTextInput').write('Test text');
      await browser.element('myTextInput').clear();
      const text = await browser.element('myTextInput').get.text();
      expect(text).toBe('');
    });
  });

  describe('Button Interaction', () => {
    it('should be able to click on buttons', async () => {
      await browser.button('Click Me (Green)').click();
      // The button click should not throw an error
      expect(true).toBe(true);
    });
  });

  describe('Checkbox and Radio Button', () => {
    it('should be able to check and uncheck checkboxes', async () => {
      await browser.checkbox('myCheckbox').check();
      const isChecked = await browser.checkbox('myCheckbox').isChecked();
      expect(isChecked).toBe(true);
      
      await browser.checkbox('myCheckbox').uncheck();
      const isUnchecked = await browser.checkbox('myCheckbox').isChecked();
      expect(isUnchecked).toBe(false);
    });
  });

  describe('Dropdown Selection', () => {
    it('should be able to select options from dropdown', async () => {
      await browser.element('mySelect').select('Set to 75%');
      const selectedValue = await browser.element('mySelect').get.value();
      expect(selectedValue).toBe('75');
    });
  });

  describe('Slider Control', () => {
    it('should be able to set slider value', async () => {
      await browser.element('mySlider').set(75);
      const sliderValue = await browser.element('mySlider').get.value();
      expect(sliderValue).toBe('75');
    });
  });

  describe('Element Visibility and State', () => {
    it('should be able to check element visibility', async () => {
      const isVisible = await browser.element('myTextInput').isVisible();
      expect(isVisible).toBe(true);
    });

    it('should be able to check element is displayed', async () => {
      await browser.element('myTextInput').isDisplayed();
      // Should not throw an error
      expect(true).toBe(true);
    });
  });

  describe('Attribute and Text Retrieval', () => {
    it('should be able to get element attributes', async () => {
      const placeholder = await browser.element('myTextInput').get.attribute('placeholder');
      expect(placeholder).toBe('Enter text here...');
    });

    it('should be able to get element text content', async () => {
      const text = await browser.element('myTextInput').get.text();
      expect(typeof text).toBe('string');
    });
  });

  describe('Navigation and Window Management', () => {
    it('should be able to refresh the page', async () => {
      await browser.refresh();
      // Should not throw an error
      expect(true).toBe(true);
    });
  });

  describe('Image and Link Interaction', () => {
    it('should be able to click on images', async () => {
      await browser.image('myImage').click();
      // Should not throw an error
      expect(true).toBe(true);
    });
  });
});