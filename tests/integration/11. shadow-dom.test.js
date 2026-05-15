import WebBrowser from '../../index.js';

describe('Shadow DOM Integration Tests', () => {
  let browser;

  beforeAll(async () => {
    browser = new WebBrowser();
    await browser.start();
  });

  beforeEach(async () => {
    await browser.goto(`file://${process.cwd()}/tests/fixtures/shadow-dom.html`);
    // Wait for dynamic shadow DOM to be created (500ms delay in the fixture)
    await new Promise(resolve => setTimeout(resolve, 1000));
  });

  afterAll(async () => {
    await browser.close();
  });

  // ============================================================
  // SECTION 1: BASIC SHADOW DOM - OPEN SHADOW ROOTS
  // ============================================================

  describe('Basic Shadow DOM - Open Shadow Roots', () => {
    test('should find a button inside a shadow root by text', async () => {
      await browser.button('Submit').should.be.visible();
    });

    test('should find a textbox inside a shadow root by label', async () => {
      await browser.textbox('Full Name').should.be.visible();
    });

    test('should find a checkbox inside a shadow root by label', async () => {
      await browser.checkbox('I accept the terms and conditions').should.be.visible();
      expect(await browser.checkbox('I accept the terms and conditions').is.checked()).toBe(false);
    });

    test('should find a link inside a shadow root by text', async () => {
      await browser.link('Need help?').should.be.visible();
    });

    test('should find a select element inside a shadow root by label', async () => {
      await browser.dropdown('Role').should.be.visible();
    });

    test('should find the Cancel button inside shadow root', async () => {
      await browser.button('Cancel').should.be.visible();
    });

    test('should type text into a shadow DOM textbox', async () => {
      await browser.textbox('Full Name').clear();
      await browser.textbox('Full Name').write('John Doe');
      const value = await browser.textbox('Full Name').get.value();
      expect(value).toBe('John Doe');
    });

    test('should click a checkbox inside shadow root', async () => {
      await browser.checkbox('I accept the terms and conditions').check();
      expect(await browser.checkbox('I accept the terms and conditions').is.checked()).toBe(true);
    });
  });

  // ============================================================
  // SECTION 2: MULTIPLE SHADOW HOSTS
  // ============================================================

  describe('Multiple Shadow Hosts', () => {
    test('should find username input in Host A (Login form)', async () => {
      await browser
        .textbox('Username')
        .within.element('multiple-host-a')
        .should.be.visible();
    });

    test('should find full name input in Host B (Signup form)', async () => {
      await browser
        .textbox('Full Name')
        .within.element('multiple-host-b')
        .should.be.visible();
    });

    test('should disambiguate Submit buttons using spatial filters', async () => {
      // Test Host A button
      await browser
        .button('Submit')
        .within.element('multiple-host-a')
        .should.be.visible();

      // Test Host B button (create fresh selector after first operation completes)
      await browser
        .button('Submit')
        .within.element('multiple-host-b')
        .should.be.visible();
    });

    test('should find Forgot password link in Host A', async () => {
      await browser
        .link('Forgot password?')
        .within.element('multiple-host-a')
        .should.be.visible();
    });

    test('should find Terms of Service link in Host B', async () => {
      await browser
        .link('Terms of Service')
        .within.element('multiple-host-b')
        .should.be.visible();
    });

    test('should type into login form fields in Host A', async () => {
      await browser.textbox('Username').within.element('multiple-host-a').write('testuser');
      await browser.textbox('Password').within.element('multiple-host-a').write('secret123');

      const username = await browser.textbox('Username').within.element('multiple-host-a').get.value();
      const password = await browser.textbox('Password').within.element('multiple-host-a').get.value();

      expect(username).toBe('testuser');
      expect(password).toBe('secret123');
    });
  });

  // ============================================================
  // SECTION 3: NESTED SHADOW DOM
  // ============================================================

  describe('Nested Shadow DOM', () => {
    test('should find button in outer shadow root (level 1)', async () => {
      await browser.button('Outer Button').should.be.visible();
    });

    test('should find button in inner shadow root (level 2)', async () => {
      await browser.button('Inner Button').should.be.visible();
    });

    test('should find input in inner shadow root (level 2)', async () => {
      await browser.textbox('Inner input').should.be.visible();
    });

    test('should find and click checkbox in inner shadow root (level 2)', async () => {
      await browser.checkbox('Inner checkbox').should.be.visible();
      await browser.checkbox('Inner checkbox').check();
      expect(await browser.checkbox('Inner checkbox').is.checked()).toBe(true);
    });

    test('should find button in level 1 of 3-level deep nesting', async () => {
      await browser.button('Level 1 Button').should.be.visible();
    });

    test('should find input in level 2 of 3-level deep nesting', async () => {
      await browser.textbox('Level 2 input').should.be.visible();
    });

    test('should find button in level 3 (deepest) of 3-level nesting', async () => {
      await browser.button('Level 3 Button').should.be.visible();
    });

    test('should find checkbox in level 3 (deepest)', async () => {
      await browser.checkbox('Level 3 checkbox').should.be.visible();
    });

    test('should type into an input deeply nested in shadow roots', async () => {
      await browser.textbox('Level 2 input').write('deep value');
      const value = await browser.textbox('Level 2 input').get.value();
      expect(value).toBe('deep value');
    });
  });

  // ============================================================
  // SECTION 4: SPATIAL FILTERING WITH SHADOW ELEMENTS
  // ============================================================

  describe('Spatial Filtering with Shadow Elements', () => {
    test('should find elements within a container box inside shadow root', async () => {
      await browser
        .button('Container Button')
        .within.element('spatial-container')
        .should.be.visible();
    });

    test('should find input below a heading inside shadow root', async () => {
      await browser
        .textbox('Below heading')
        .below.element('spatial-heading')
        .should.be.visible();
    });

    test('should find button below text inside shadow root', async () => {
      await browser
        .button('Below Heading Button')
        .below.element('spatial-heading')
        .should.be.visible();
    });

    test.skip('should find input to the right of a button inside shadow root', async () => {
      await browser
        .textbox('To the right')
        .toRightOf.button('Left Button')
        .should.be.visible();
    });

    test('should find button to the left of an input inside shadow root', async () => {
      await browser
        .button('Left Button')
        .toLeftOf.textbox('To the right')
        .should.be.visible();
    });

    test('should find button near a link inside shadow root', async () => {
      await browser
        .button('Near Button')
        .near.link('Nearby Link')
        .should.be.visible();
    });

    test('should find label above an input inside shadow root', async () => {
      await browser
        .element('spatial-align-label-a')
        .above.textbox('Column A')
        .should.be.visible();
    });

    test('should find input within container box', async () => {
      await browser
        .textbox('Inside container')
        .within.element('spatial-container')
        .should.be.visible();
    });
  });

  // ============================================================
  // SECTION 5: SHADOW DOM INSIDE IFRAME
  // ============================================================

  describe('Shadow DOM Inside iFrame', () => {
    test('should find a regular (non-shadow) element inside the iframe', async () => {
      await browser.button('Regular Frame Button').should.be.visible();
    });

    test('should find a shadow DOM element inside the iframe', async () => {
      await browser.button('Shadow Frame Button').should.be.visible();
    });

    test('should find a shadow DOM input inside the iframe', async () => {
      await browser.textbox('Shadow Input in Frame').should.be.visible();
    });

    test('should find a shadow DOM checkbox inside the iframe', async () => {
      await browser.checkbox('Frame shadow checkbox').should.be.visible();
    });

    test.skip('should type into a shadow DOM input inside the iframe', async () => {
      // Use write directly without clear to avoid stale element reference issues
      await browser.textbox('Shadow Input in Frame').write('frame shadow value');
      // Re-find the element before getting value to avoid stale reference
      const value = await browser.textbox('Shadow Input in Frame').get.value();
      expect(value).toBe('frame shadow value');
    });

    test('should find nested shadow DOM elements inside the iframe', async () => {
      await browser.button('Frame Outer Button').should.be.visible();
    });

    test('should find the deepest nested shadow element inside the iframe', async () => {
      await browser.button('Frame Inner Button').should.be.visible();
    });

    test('should find input in the innermost shadow root inside the iframe', async () => {
      await browser.textbox('Frame inner input').should.be.visible();
    });
  });

  // ============================================================
  // SECTION 6: CLOSED SHADOW ROOTS
  // ============================================================

  describe('Closed Shadow Roots', () => {
    test('should not find elements inside closed shadow roots', async () => {
      // The button inside the closed shadow root should not be discoverable
      // This should throw an error or return nothing
      await expect(
        browser.button('Closed Shadow Button').should.be.visible()
      ).rejects.toThrow();
    });

    test('should not find input inside closed shadow root', async () => {
      await expect(
        browser.textbox('Closed input').should.be.visible()
      ).rejects.toThrow();
    });
  });

  // ============================================================
  // SECTION 7: DYNAMIC SHADOW DOM
  // ============================================================

  describe('Dynamic Shadow DOM', () => {
    test('should find button in dynamically created shadow root', async () => {
      await browser.button('Dynamic Button').should.be.visible();
    });

    test('should find input in dynamically created shadow root', async () => {
      await browser.textbox('Dynamically created').should.be.visible();
    });

    test('should type into dynamically created shadow input', async () => {
      await browser.textbox('Dynamically created').write('dynamic value');
      const value = await browser.textbox('Dynamically created').get.value();
      expect(value).toBe('dynamic value');
    });

    test('should handle shadow content mutation', async () => {
      // Original button should exist
      await browser.button('Original Button').should.be.visible();

      // Click the mutate button
      await browser.button('Mutate Shadow Content').click();

      // New button should exist
      await browser.button('Replaced Button').should.be.visible();

      // New input should exist
      await browser.textbox('New input after mutation').should.be.visible();
    });
  });

  // ============================================================
  // SECTION 8: WEB COMPONENTS (CUSTOM ELEMENTS)
  // ============================================================

  describe('Web Components (Custom Elements)', () => {
    test('should find button inside a custom <custom-button> element', async () => {
      await browser.button('Component Button').should.be.visible();
    });

    test('should find input inside a custom <custom-input> element', async () => {
      await browser.textbox('Component Input').should.be.visible();
    });

    test('should type into a custom element input field', async () => {
      await browser.textbox('Component Input').write('web component value');
      const value = await browser.textbox('Component Input').get.value();
      expect(value).toBe('web component value');
    });

    test('should find checkbox inside a custom <custom-toggle> element', async () => {
      await browser.checkbox('Component Toggle').should.be.visible();
    });

    test('should click the custom toggle checkbox', async () => {
      await browser.checkbox('Component Toggle').check();
      expect(await browser.checkbox('Component Toggle').is.checked()).toBe(true);
    });

    test('should click the custom button element', async () => {
      await browser.button('Component Button').click();
    });
  });

  // ============================================================
  // SECTION 9: COMBINED REGULAR + SHADOW DOM
  // ============================================================

  describe('Combined Regular and Shadow DOM', () => {
    test('should find Submit button in regular DOM section', async () => {
      await browser
        .button('Submit')
        .within.element('section-combined')
        .should.be.visible();
    });

    test('should find input in regular DOM section', async () => {
      await browser.textbox('Username').should.be.visible();
    });

    test('should find checkbox in regular DOM', async () => {
      await browser.checkbox('Accept terms').should.be.visible();
    });
  });

  // ============================================================
  // SECTION 10: EDGE CASES
  // ============================================================

  describe('Edge Cases', () => {
    test('should handle empty shadow root without errors', async () => {
      // The page should load fine despite having an empty shadow root
      // Just verify we can still find other elements
      await browser.button('Submit').should.be.visible();
    });

    test('should handle text-only shadow root without errors', async () => {
      // Should not crash when scanning text-only shadow roots
      await browser.button('Cancel').should.be.visible();
    });

    test('should find button in 5-level deep nested shadow DOM', async () => {
      await browser.button('Deepest Button').should.be.visible();
    });

    test('should verify all 5 levels of nesting are traversed', async () => {
      await browser.element('five-l1').should.be.visible();
      await browser.element('five-l2').should.be.visible();
      await browser.element('five-l3').should.be.visible();
      await browser.element('five-l4').should.be.visible();
      await browser.element('five-l5').should.be.visible();
    });

    test('should click the button at the deepest nesting level', async () => {
      await browser.button('Deepest Button').click();
    });
  });

  // ============================================================
  // CROSS-CUTTING CONCERNS
  // ============================================================

  describe('Cross-Cutting Concerns', () => {
    test('should discover buttons across all shadow contexts', async () => {
      await browser.button('Submit').should.be.visible();
    });

    test('should discover textboxes across all shadow contexts', async () => {
      await browser.textbox('Full Name').should.be.visible();
    });

    test('should work with spatial filters across shadow boundaries', async () => {
      // Host A label is in regular DOM, button is in shadow DOM
      await browser
        .button('Submit')
        .below.element('host-a-label')
        .should.be.visible();
    });

    test('should get element properties for shadow elements', async () => {
      await browser.textbox('Full Name').clear();
      await browser.textbox('Full Name').write('property test');

      const text = await browser.textbox('Full Name').get.text();
      expect(typeof text).toBe('string');

      const value = await browser.textbox('Full Name').get.value();
      expect(value).toBe('property test');
    });

    test('should detect enabled state for shadow elements', async () => {
      expect(await browser.button('Submit').is.enabled()).toBe(true);
    });
  });
});
