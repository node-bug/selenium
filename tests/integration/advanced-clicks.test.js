import WebBrowser from '../../index.js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const fixturePath = join(__dirname, '../fixtures/clicks.html');
const fixtureUrl = 'file://' + fixturePath;

describe('WebBrowser Advanced Click Integration Tests', () => {
  let browser;

  beforeAll(async () => {
    browser = new WebBrowser();
    await browser.start();
  });

  afterAll(async () => {
    await browser.close();
  });

  test('should perform standard click', async () => {
    await browser.goto(fixtureUrl);
    const initialCount = await browser.element('Standard Click Me').get.text();
    await browser.element('Standard Click Me').click();
    const newCount = await browser.element('Standard Click Me').get.text();
    expect(parseInt(newCount)).toBe(parseInt(initialCount) + 1);
  });

  test('should perform double click', async () => {
    await browser.goto(fixtureUrl);
    const initialCount = await browser.element('Double Click Me').get.text();
    await browser.element('Double Click Me').doubleClick();
    const newCount = await browser.element('Double Click Me').get.text();
    expect(parseInt(newCount)).toBe(parseInt(initialCount) + 1);
  });

  test('should perform triple click', async () => {
    await browser.goto(fixtureUrl);
    // Triple click on a text field to select all text
    await browser.textbox('Triple click to select all this text').tripleClick();
  });

  test('should perform multiple clicks', async () => {
    await browser.goto(fixtureUrl);
    const initialCount = await browser.element('Click Me Multiple Times').get.text();
    await browser.element('Click Me Multiple Times').multipleClick(3);
    const newCount = await browser.element('Click Me Multiple Times').get.text();
    expect(parseInt(newCount)).toBe(parseInt(initialCount) + 3);
  });

  test('should perform long press', async () => {
    await browser.goto(fixtureUrl);
    const initialCount = await browser.element('Long Presses:').get.text();
    await browser.element('Long Press Me').longPress(600);
    const newCount = await browser.element('Long Presses:').get.text();
    expect(parseInt(newCount)).toBe(parseInt(initialCount) + 1);
  });

  test('should perform right click (context click)', async () => {
    await browser.goto(fixtureUrl);
    const initialCount = await browser.element('Right Clicks:').get.text();
    await browser.element('Right Click Me').rightClick();
    const newCount = await browser.element('Right Clicks:').get.text();
    expect(parseInt(newCount)).toBe(parseInt(initialCount) + 1);
  });

  test('should perform middle click', async () => {
    await browser.goto(fixtureUrl);
    const initialCount = await browser.element('Middle Clicks:').get.text();
    await browser.element('Middle Click Me').middleClick();
    const newCount = await browser.element('Middle Clicks:').get.text();
    expect(parseInt(newCount)).toBe(parseInt(initialCount) + 1);
  });

  test('should perform coordinate-based click', async () => {
    await browser.goto(fixtureUrl);
    // Click at coordinates (10, 10) relative to the element
    // This verifies the coordinate-based click operation completes without error
    await browser.element('Coordinate-based Click').click(10, 10);
  });

  test('should perform click with modifiers', async () => {
    await browser.goto(fixtureUrl);
    const initialCtrlCount = await browser.element('Ctrl Clicks:').get.text();
    const initialShiftAltCount = await browser.element('Shift+Alt Clicks:').get.text();
    
    // Ctrl+Click
    await browser.element('Ctrl+Click / Shift+Alt+Click').ctrl.click();
    // Shift+Alt+Click
    await browser.element('Ctrl+Click / Shift+Alt+Click').shift.alt.click();
    
    const newCtrlCount = await browser.element('Ctrl Clicks:').get.text();
    const newShiftAltCount = await browser.element('Shift+Alt Clicks:').get.text();
    expect(parseInt(newCtrlCount)).toBe(parseInt(initialCtrlCount) + 1);
    expect(parseInt(newShiftAltCount)).toBe(parseInt(initialShiftAltCount) + 1);
  });

  test('should perform hover', async () => {
    await browser.goto(fixtureUrl);
    const initialCount = await browser.element('Hover Count:').get.text();
    await browser.element('Hover Over Me').hover();
    const newCount = await browser.element('Hover Count:').get.text();
    expect(parseInt(newCount)).toBe(parseInt(initialCount) + 1);
  });

  test('should handle click out of bounds error', async () => {
    await browser.goto(fixtureUrl);
    const element = browser.element('Coordinate-based Click');
    
    // Try to click far outside the element's bounds to trigger the error in _clicker
    await expect(element.click(10000, 10000)).rejects.toThrow('Click out of bounds');
  });
});
