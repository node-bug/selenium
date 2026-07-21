import WebBrowser from '../../index.js';

describe('Interactive Elements Integration Tests', () => {
  let browser;

  beforeAll(async () => {
    browser = new WebBrowser();
    await browser.start();
    await browser.goto(`file://${process.cwd()}/tests/fixtures/interactive-elements.html`);
  });

  afterAll(async () => {
    await browser.close();
  });

  test('should interact with links', async () => {
    expect(await browser.link('Enabled Link').is.enabled()).toBe(true);

    const style = await browser.link('Disabled Link (Simulated)').get.attribute('style');
    expect(style).toContain('pointer-events: none');
  });

  test('should not retrieve visibility-hidden elements by default', async () => {
    await expect(
      browser.link('Visibility Hidden Link').find()
    ).rejects.toThrow();

    await expect(
      browser.link('Visibility Hidden Link').findAll()
    ).rejects.toThrow();
  });

  test('should retrieve visibility-hidden elements when hidden modifier is used', async () => {
    const link = await browser.hidden.link('Visibility Hidden Link').find();
    expect(link).toBeDefined();

    const links = await browser.hidden.link('Visibility Hidden Link').findAll();
    expect(links).toHaveLength(1);
  });

  test('should NOT retrieve visibility-hidden elements when hidden modifier is chained AFTER the element', async () => {
    // Per the new rule, exact/hidden/onscreen only apply when placed BEFORE the
    // element type. Chaining `.hidden` after `link(...)` is now a no-op, so the
    // hidden link is not included and the lookup fails like the default case.
    await expect(
      browser.link('Visibility Hidden Link').hidden.find()
    ).rejects.toThrow();

    await expect(
      browser.link('Visibility Hidden Link').hidden.findAll()
    ).rejects.toThrow();
  });

  test('should interact with buttons', async () => {
    expect(await browser.button('Enabled Button').is.enabled()).toBe(true);

    expect(await browser.button('Disabled Button').is.disabled()).toBe(true);

    const ariaDisabled = await browser.button('ARIA Disabled Button').get.attribute('aria-disabled');
    expect(ariaDisabled).toBe('true');
  });

  test('should interact with file inputs', async () => {
    expect(await browser.file(1).is.enabled()).toBe(true);

    expect(await browser.file(2).is.disabled()).toBe(true);
  });

  test('should interact with lists and listitems', async () => {
    await browser.list(1).should.be.visible();

    const text = await browser.listitem('Item 1 (Enabled)').get.text();
    expect(text).toBe('Item 1 (Enabled)');
  });

  test('should interact with menus and menuitems', async () => {
    const menuRole = await browser.menu(1).get.attribute('role');
    expect(menuRole).toBe('menu');

    const menuItemRole = await browser.menuitem('Menu Item 1 (Enabled)').get.attribute('role');
    expect(menuItemRole).toBe('menuitem');
  });

  test('should interact with toolbars', async () => {
    const toolbarRole = await browser.toolbar(1).get.attribute('role');
    expect(toolbarRole).toBe('toolbar');

    expect(await browser.button('Tool 1 (Disabled)').is.disabled()).toBe(true);
  });

  test('should interact with images', async () => {
    const alt = await browser.image('Enabled Image').get.attribute('alt');
    expect(alt).toBe('Enabled Image');
  });

  test('should interact with dialogs', async () => {
    await browser.button('Open Dialog').click();
    await browser.dialog('Test Dialog').should.be.visible();

    const dialogRole = await browser.dialog('Test Dialog').get.attribute('role');
    expect(dialogRole).toBe('dialog');

    await browser.button('Close').click();
    await browser.dialog('Test Dialog').should.not.be.visible();
  });

  describe('Disabled and Hidden Element Interaction Errors', () => {
    test('should throw error when clicking hidden button', async () => {
      // Hidden button (display:none) should not be interactable
      expect(await browser.button('Hidden Button').is.visible()).toBe(false);

      await expect(
        browser.button('Hidden Button').click()
      ).rejects.toThrow();
    });
  });
});
