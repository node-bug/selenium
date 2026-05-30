import WebBrowser from '../../index.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const fixturePath = path.join(__dirname, '../fixtures/forms.html');

describe('WebBrowser Input Slider Control Tests', () => {
  let browser;

  beforeAll(async () => {
    browser = new WebBrowser();
    await browser.start();
  });

  afterAll(async () => {
    await browser.close();
  });

  test('should click on the slider element', async () => {
    await browser.goto(`file://${fixturePath}`);

    // Click on the slider control
    await browser.element('50').click();

    // Verify interaction was successful
    const text = await browser.element('50').get.text();
    expect(text).toBeDefined();
  });

  test('should retrieve slider and progress bar values', async () => {
    await browser.goto(`file://${fixturePath}`);

    // Get the slider value
    const sliderValue = await browser.element('50').get.text();
    expect(typeof sliderValue).toBe('string');
    expect(sliderValue).toBe('50');

    // Get the progress bar value - use text matching
    const progressBarValue = await browser.element('Progress Bar:').get.text();
    expect(progressBarValue).toBeDefined();
    expect(progressBarValue).toContain('50%');
  });

  test('should verify slider control is present', async () => {
    await browser.goto(`file://${fixturePath}`);

    // Verify the slider element is present
    await browser.element('Range Slider').should.be.visible();

    // Verify progress bar is present
    await browser.element('Progress Bar').should.be.visible();
  });

  test('should use slider delegate to set value', async () => {
    await browser.goto(`file://${fixturePath}`);

    // Use the new slider delegate to set a value
    await browser.slider('50').slide.to.value(75);

    // Verify the value was set
    const sliderValue = await browser.slider('50').get.value();
    expect(typeof sliderValue).toBe('string');
    // The slider value should be close to the target value (within 5 units due to rounding)
    const numericValue = parseFloat(sliderValue);
    expect(numericValue).toBeGreaterThanOrEqual(70);
    expect(numericValue).toBeLessThanOrEqual(80);
    console.log('Slider value after set:', sliderValue);
  });

  test('should verify stepped slider control is present', async () => {
    await browser.goto(`file://${fixturePath}`);

    // Verify the stepped slider element is present
    await browser.element('Stepped Slider').should.be.visible();
  });

  test('should retrieve stepped slider value', async () => {
    await browser.goto(`file://${fixturePath}`);

    // Get the stepped slider value (initial value is 25)
    const sliderValue = await browser.element('25').get.text();
    expect(typeof sliderValue).toBe('string');
    expect(sliderValue).toBe('25');
  });

  test('should use slider delegate to set value on stepped slider', async () => {
    await browser.goto(`file://${fixturePath}`);

    // Use the slider delegate to set a value on the stepped slider
    await browser.slider('25').slide.to.value(60);

    // Verify the value was set (should be a multiple of 5 due to step="5")
    const sliderValue = await browser.slider('25').get.value();
    expect(typeof sliderValue).toBe('string');
    const numericValue = parseFloat(sliderValue);
    // Value should be close to 60 and a multiple of 5
    expect(numericValue).toBeGreaterThanOrEqual(55);
    expect(numericValue).toBeLessThanOrEqual(65);
    console.log('Stepped slider value after set:', sliderValue);
  });

  test('should throw error when value exceeds slider max', async () => {
    await browser.goto(`file://${fixturePath}`);

    // Try to set a value above the max (100) - should throw
    await expect(browser.slider('50').slide.to.value(150)).rejects.toThrow(
      'Target value 150 is outside slider range [0, 100]'
    );
  });

  test('should throw error when value is below slider min', async () => {
    await browser.goto(`file://${fixturePath}`);

    // Try to set a value below the min (0) - should throw
    await expect(browser.slider('50').slide.to.value(-50)).rejects.toThrow(
      'Target value -50 is outside slider range [0, 100]'
    );
  });

  test('should throw error when value does not align with slider step', async () => {
    await browser.goto(`file://${fixturePath}`);

    // Stepped slider has step="5", so 73 is not valid (not a multiple of 5)
    await expect(browser.slider('25').slide.to.value(73)).rejects.toThrow(
      'Target value 73 is not aligned with slider step 5'
    );
  });

  test('should accept value that aligns with slider step', async () => {
    await browser.goto(`file://${fixturePath}`);

    // Stepped slider has step="5", so 65 is valid (65 = 25 + 4*10, wait let me check)
    // Actually 65 = 25 + 8*5, so it's valid
    await browser.slider('25').slide.to.value(65);

    const sliderValue = await browser.slider('25').get.value();
    expect(parseFloat(sliderValue)).toBe(65);
  });

  test('should throw error when value is not a number', async () => {
    await browser.goto(`file://${fixturePath}`);

    // Try to set a non-numeric value
    await expect(browser.slider('50').slide.to.value('abc')).rejects.toThrow(
      "Target value 'abc' is not a valid number"
    );
  });

  test('should throw error when value is null', async () => {
    await browser.goto(`file://${fixturePath}`);

    // Try to set null - this throws a different error because null is checked before NaN
    await expect(browser.slider('50').slide.to.value(null)).rejects.toThrow(
      'Target value to set was not provided'
    );
  });
});
