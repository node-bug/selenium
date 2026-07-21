import { describe, beforeAll, afterAll, test, expect } from 'vitest';
import WebBrowser from '../../index.js';

describe('Parent Within Keyword', () => {
  let browser;

  beforeAll(async () => {
    browser = new WebBrowser();
    await browser.start();
    await browser.goto(`file://${process.cwd()}/tests/fixtures/shadow-dom.html`);
  });

  afterAll(async () => {
    await browser.close();
  });

  test('should find button within parent container using DOM containment', async () => {
    // The "Save Changes" button is a DOM descendant of the toolbar "Buttons Panel"
    // Using .within.parent should find it via DOM.contains() rather than spatial bounding-box
    const result = await browser
      .button('Save Changes')
      .within
      .parent
      .toolbar('Buttons Panel')
      .find();

    expect(result).toBeDefined();
  });

  test('should find deeply nested button within parent container', async () => {
    // The "Deep Nested Action" button is a deep DOM descendant of the "Buttons Panel" toolbar
    const result = await browser
      .button('Deep Nested Action')
      .within
      .parent
      .toolbar('Buttons Panel')
      .find();

    expect(result).toBeDefined();
  });

  test('should find textbox within parent container using DOM containment', async () => {
    // The name input is a DOM descendant of the "Form Panel" toolbar
    const result = await browser
      .textbox('Enter your name')
      .within
      .parent
      .toolbar('Form Panel')
      .find();

    expect(result).toBeDefined();
  });

  test('should throw when element is not a DOM descendant of reference', async () => {
    // "Save Changes" button is NOT a DOM descendant of the "Separate Panel" toolbar
    await expect(
      browser
        .button('Save Changes')
        .within
        .parent
        .toolbar('Separate Panel')
        .find()
    ).rejects.toThrow();
  });

  test('should work with findAll using parent flag for checkboxes', async () => {
    // Find all checkboxes within the "Options Panel" toolbar via DOM containment
    const results = await browser
      .checkbox()
      .within
      .parent
      .toolbar('Options Panel')
      .findAll();

    expect(Array.isArray(results)).toBe(true);
    expect(results.length).toBeGreaterThanOrEqual(2);
  });

  test('should work with findAll using parent flag for radio buttons', async () => {
    // Find all radio buttons within the "Options Panel" toolbar via DOM containment
    const results = await browser
      .radio()
      .within
      .parent
      .toolbar('Options Panel')
      .findAll();

    expect(Array.isArray(results)).toBe(true);
    expect(results.length).toBeGreaterThanOrEqual(2);
  });

  test('should still use spatial filtering without parent flag (regression)', async () => {
    // Without .parent, .within should still use bounding-box spatial filtering
    const result = await browser
      .button('Save Changes')
      .within
      .toolbar('Buttons Panel')
      .find();

    expect(result).toBeDefined();
  });
});
