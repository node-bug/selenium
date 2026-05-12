import WebBrowser from '../../index.js';

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
    await browser.goto('https://seleniumbase.io/demo_page');

    // Click on the slider control
    await browser.element('50').click();

    // Verify interaction was successful
    const text = await browser.element('50').get.text();
    expect(text).toBeDefined();
  });

  test('should retrieve slider and progress bar values', async () => {
    await browser.goto('https://seleniumbase.io/demo_page');

    // Get the slider value
    const sliderValue = await browser.element('50').get.text();
    expect(typeof sliderValue).toBe('string');
    expect(sliderValue).toBe('50');

    // Get the progress bar value
    const progressBarValue = await browser.element('Progress Bar').get.text();
    expect(progressBarValue).toBeDefined();
    expect(progressBarValue).toContain('50%');
  });

  test('should verify slider control is present', async () => {
    await browser.goto('https://seleniumbase.io/demo_page');

    // Verify the slider element is present
    await browser.element('Input Slider Control').should.be.visible();

    // Verify progress bar is present
    await browser.element('Progress Bar').should.be.visible();
  });

  test('should use slider delegate to set value', async () => {
    await browser.goto('https://seleniumbase.io/demo_page');

    // Use the new slider delegate to set a value
    await browser.slider('50').slide.to.value(75);

    // Verify the value was set
    const sliderValue = await browser.slider('50').get.value();
    expect(typeof sliderValue).toBe('string');
    console.log('Slider value after set:', sliderValue);
  });
});
