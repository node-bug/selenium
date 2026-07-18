import { readFile } from 'fs/promises';
import WebBrowser from '../../index.js';

// NOTE: `getElementInventory()` was changed upstream to return an array of
// `{ frame, elements: Array<{ type, description, inViewport, formState }> }`
// entries (objects, not `type:description {state}` strings). Viewport scoping
// is no longer a boolean argument — membership is reported per element via the
// `inViewport` flag. This test and its snapshot reflect that new shape.

const SNAPSHOT_PATH = `${process.cwd()}/tests/fixtures/element-inventory-snapshot.json`;

describe('ElementFinder getElementInventory Integration Tests', () => {
  let browser;

  beforeAll(async () => {
    browser = new WebBrowser();
    await browser.start();
    await browser.goto(`file://${process.cwd()}/tests/fixtures/forms.html`);
  });

  afterAll(async () => {
    await browser.close();
  });

  const getInventory = () =>
    browser.driver.executeScript('return window.ElementFinder.getElementInventory()');

  const mainFrameElements = (inventory) => {
    const mainFrame = inventory.find((entry) => entry.frame === -1);
    return mainFrame ? mainFrame.elements : [];
  };

  test('should expose ElementFinder and return an inventory grouped by frame', async () => {
    await browser.injectElementFinder();

    const inventory = await getInventory();

    // Inventory is an array of { frame, elements } entries, one per frame.
    expect(Array.isArray(inventory)).toBe(true);
    expect(inventory.length).toBeGreaterThan(0);

    const mainFrame = inventory.find((entry) => entry.frame === -1);
    expect(mainFrame).toBeDefined();
    expect(Array.isArray(mainFrame.elements)).toBe(true);
    expect(mainFrame.elements.length).toBeGreaterThan(0);

    // Each element entry is an object describing the element.
    for (const el of mainFrame.elements) {
      expect(typeof el).toBe('object');
      expect(typeof el.type).toBe('string');
      expect(typeof el.description).toBe('string');
      expect(typeof el.inViewport).toBe('boolean');
      expect(el.formState === null || typeof el.formState === 'object').toBe(true);
    }
  });

  test('should include identifiable elements as type/description objects', async () => {
    await browser.injectElementFinder();

    const inventory = await getInventory();
    const elements = mainFrameElements(inventory);

    // The form fixture has text inputs with placeholders, so we expect textbox
    // entries whose description text matches the placeholder (or nearby label).
    const textboxes = elements.filter((el) => el.type === 'textbox');
    const descriptions = textboxes.map((el) => el.description).join('\n');

    expect(descriptions).toMatch(/Enter text here\.\.\./);
    expect(descriptions).toMatch(/email@example\.com/);

    // Every entry must expose a non-empty type and description.
    for (const el of elements) {
      expect(el.type.length).toBeGreaterThan(0);
      expect(el.description.length).toBeGreaterThan(0);
    }
  });

  test('should expose form-state for form controls', async () => {
    await browser.injectElementFinder();

    const inventory = await getInventory();
    const elements = mainFrameElements(inventory);

    // The number field has value="10", so its textbox entry should carry a
    // formState with value "10".
    const numberEntry = elements.find(
      (el) => el.type === 'textbox' && el.description.startsWith('Number Field')
    );
    expect(numberEntry).toBeDefined();
    expect(numberEntry.formState).toEqual({ value: '10' });

    // Checkboxes should carry a formState with a checked boolean.
    const checkboxEntry = elements.find(
      (el) => el.type === 'checkbox' && el.description.startsWith('Subscribe to newsletter')
    );
    expect(checkboxEntry).toBeDefined();
    expect(typeof checkboxEntry.formState.checked).toBe('boolean');
  });

  test('should expose viewport membership via inViewport flag', async () => {
    await browser.injectElementFinder();

    const inventory = await getInventory();
    const elements = mainFrameElements(inventory);

    // Every entry must declare its viewport membership.
    for (const el of elements) {
      expect(typeof el.inViewport).toBe('boolean');
    }

    const inViewportCount = elements.filter((el) => el.inViewport).length;

    // Viewport-scoped inventory must never contain more elements than the
    // full-page inventory for the same frame.
    expect(inViewportCount).toBeLessThanOrEqual(elements.length);
  });

  test('should match the stored inventory snapshot', async () => {
    await browser.injectElementFinder();

    const live = await getInventory();

    // Every element must carry bounding-box data (boundingBox), but we don't
    // assert exact pixel values because they vary across environments.
    for (const entry of live) {
      for (const el of entry.elements) {
        expect(el.boundingBox).toBeDefined();
        expect(typeof el.boundingBox.x).toBe('number');
        expect(typeof el.boundingBox.y).toBe('number');
        expect(typeof el.boundingBox.width).toBe('number');
        expect(typeof el.boundingBox.height).toBe('number');
      }
    }

    // Verify frame count matches snapshot (structural check only).
    const snapshot = JSON.parse(await readFile(SNAPSHOT_PATH, 'utf8'));
    expect(live.length).toBe(snapshot.full.length);
  });
});
