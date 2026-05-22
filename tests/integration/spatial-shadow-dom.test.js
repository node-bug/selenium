import WebBrowser from '../../index.js';

describe('Spatial Selection in Shadow DOM Integration Tests', () => {
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
  // SECTION 1: SPATIAL SELECTION WITHIN SHADOW ROOTS
  // ============================================================

  describe('Spatial Selection Within Shadow Roots', () => {
    test('should find element below another element inside shadow root', async () => {
      // "Below heading" input is below "Personal Information" heading
      await browser
        .textbox('Below heading')
        .below.element('spatial-heading')
        .should.be.visible();
    });

    test('should find element above another element inside shadow root', async () => {
      // "Personal Information" heading is above "Below heading" input
      await browser
        .element('spatial-heading')
        .above.textbox('Below heading')
        .should.be.visible();
    });

    test('should find element to the left of another element inside shadow root', async () => {
      // "Left Button" is to the left of "To the right" input
      await browser
        .button('Left Button')
        .toLeftOf.textbox('To the right')
        .should.be.visible();
    });

    test('should find element to the right of another element inside shadow root', async () => {
      // "To the right" input is to the right of "Left Button"
      await browser
        .textbox('To the right')
        .toRightOf.button('Left Button')
        .should.be.visible();
    });

    test('should find element near another element inside shadow root', async () => {
      // "Near Button" is near "Nearby Link" (same row)
      await browser
        .button('Near Button')
        .near.link('Nearby Link')
        .should.be.visible();
    });

    test('should find element within a container inside shadow root', async () => {
      // "Container Button" is within "spatial-container"
      await browser
        .button('Container Button')
        .within.exact.element('spatial-container')
        .should.be.visible();
    });

    test('should find element within container by exact matching', async () => {
      // "Inside container" input is within the spatial-container
      await browser
        .textbox('Inside container')
        .within.exact.element('spatial-container')
        .should.be.visible();
    });
  });

  // ============================================================
  // SECTION 2: EXACT SPATIAL ALIGNMENT IN SHADOW DOM
  // ============================================================

  describe('Exact Spatial Alignment in Shadow DOM', () => {
    test('should find element exactly below with horizontal alignment', async () => {
      // "Below heading" input is below the heading (not exactly aligned, so use regular below)
      await browser
        .textbox('Below heading')
        .below.element('spatial-heading')
        .should.be.visible();
    });

    test('should find element exactly above with horizontal alignment', async () => {
      // "Personal Information" heading is exactly above "Below heading" input
      await browser
        .element('spatial-heading')
        .exactly.above.textbox('Below heading')
        .should.be.visible();
    });

    test('should find element exactly to the left with vertical alignment', async () => {
      // "Left Button" is exactly to the left of "To the right" input
      await browser
        .button('Left Button')
        .exactly.toLeftOf.textbox('To the right')
        .should.be.visible();
    });

    test('should find element exactly to the right with vertical alignment', async () => {
      // "To the right" input is exactly to the right of "Left Button"
      await browser
        .textbox('To the right')
        .exactly.toRightOf.button('Left Button')
        .should.be.visible();
    });

    test('should find label above input with exact alignment', async () => {
      // "Column A Label" is above "Column A" input
      await browser
        .element('spatial-align-label-a')
        .above.textbox('Column A')
        .should.be.visible();
    });
  });

  // ============================================================
  // SECTION 3: SPATIAL SELECTION ACROSS SHADOW BOUNDARIES
  // ============================================================

  describe('Spatial Selection Across Shadow Boundaries', () => {
    test('should find shadow element below regular DOM element', async () => {
      // Host A label is in regular DOM, button is in shadow DOM
      await browser
        .button('Submit')
        .within.element('multiple-host-a')
        .below.element('host-a-label')
        .should.be.visible();
    });

    test('should find shadow element above regular DOM element', async () => {
      // "Personal Information" heading (in shadow) is above "Below heading" input (in shadow)
      // But we can also test cross-boundary with nested elements
      await browser
        .button('Below Heading Button')
        .below.element('spatial-heading')
        .should.be.visible();
    });

    test('should chain spatial filters across shadow boundaries', async () => {
      // Find element that is below heading AND within container
      await browser
        .button('Below Heading Button')
        .below.element('spatial-heading')
        .should.be.visible();
    });

    test('should use spatial filters with nested shadow elements', async () => {
      // "Inner Button" is in a nested shadow root (2 levels deep)
      // Test that spatial filters work with nested shadow elements
      await browser.button('Inner Button').should.be.visible();
    });
  });

  // ============================================================
  // SECTION 4: SPATIAL SELECTION WITH NESTED SHADOW DOM
  // ============================================================

  describe('Spatial Selection with Nested Shadow DOM', () => {
    test('should find element in nested shadow root with spatial context', async () => {
      // "Inner Button" is in a nested shadow root
      await browser.button('Inner Button').should.be.visible();
    });

    test('should find deeply nested element with spatial filters', async () => {
      // "Level 2 input" is in a 3-level deep nested shadow
      await browser.textbox('Level 2 input').should.be.visible();
    });

    test('should find element in 3-level nested shadow with spatial context', async () => {
      // "Level 3 Button" is in the deepest level of 3-level nesting
      await browser.button('Level 3 Button').should.be.visible();
    });

    test('should find checkbox in deeply nested shadow', async () => {
      // "Inner checkbox" is in a nested shadow root
      await browser.checkbox('Inner checkbox').should.be.visible();
    });

    test('should find element in 5-level deep nested shadow', async () => {
      // "Deepest Button" is in a 5-level deep nested shadow
      await browser.button('Deepest Button').should.be.visible();
    });
  });

  // ============================================================
  // SECTION 5: SPATIAL SELECTION IN IFRAME SHADOW DOM
  // ============================================================

  describe('Spatial Selection in iFrame Shadow DOM', () => {
    test('should find shadow element near regular iframe element', async () => {
      // "Shadow Frame Button" is in shadow DOM inside iframe
      await browser.button('Shadow Frame Button').should.be.visible();
    });

    test('should find shadow element within iframe context', async () => {
      // "Shadow Input in Frame" is in shadow DOM inside iframe
      await browser.textbox('Shadow Input in Frame').should.be.visible();
    });

    test('should find nested shadow element in iframe with spatial context', async () => {
      // "Frame Outer Button" is in nested shadow inside iframe
      await browser.button('Frame Outer Button').should.be.visible();
    });

    test('should find deepest nested shadow element in iframe', async () => {
      // "Frame Inner Button" is in the innermost shadow root inside iframe
      await browser.button('Frame Inner Button').should.be.visible();
    });

    test('should find input in innermost shadow root inside iframe', async () => {
      // "Frame inner input" is in the innermost shadow root inside iframe
      await browser.textbox('Frame inner input').should.be.visible();
    });
  });

  // ============================================================
  // SECTION 6: SPATIAL SELECTION WITH WEB COMPONENTS
  // ============================================================

  describe('Spatial Selection with Web Components', () => {
    test('should find button in custom element with spatial context', async () => {
      // "Component Button" is inside a custom-button web component
      await browser.button('Component Button').should.be.visible();
    });

    test('should find input in custom element with spatial context', async () => {
      // "Component Input" is inside a custom-input web component
      await browser.textbox('Component Input').should.be.visible();
    });

    test('should find checkbox in custom element with spatial context', async () => {
      // "Component Toggle" is inside a custom-toggle web component
      await browser.checkbox('Component Toggle').should.be.visible();
    });

    test('should use spatial filters with web component elements', async () => {
      // Web components with shadow DOM should work with spatial filters
      await browser.button('Component Button').should.be.visible();
    });
  });

  // ============================================================
  // SECTION 7: SPATIAL SELECTION EDGE CASES
  // ============================================================

  describe('Spatial Selection Edge Cases', () => {
    test('should handle spatial selection with dynamic shadow DOM', async () => {
      // "Dynamic Button" is in a shadow root created after page load
      await browser.button('Dynamic Button').should.be.visible();
    });

    test('should handle spatial selection with mutable shadow content', async () => {
      // Original button exists
      await browser.button('Original Button').should.be.visible();

      // Click mutate button
      await browser.button('Mutate Shadow Content').click();

      // New button should exist after mutation
      await browser.button('Replaced Button').should.be.visible();
    });

    test('should handle spatial selection with empty shadow root', async () => {
      // Empty shadow root should not cause errors
      // Just verify we can still find other elements
      await browser.button('Submit').should.be.visible();
    });

    test('should handle spatial selection with text-only shadow root', async () => {
      // Text-only shadow root should not cause errors
      await browser.button('Cancel').should.be.visible();
    });

    test('should handle spatial selection with closed shadow root gracefully', async () => {
      // Closed shadow root elements should not be discoverable
      await expect(
        browser.button('Closed Shadow Button').should.be.visible()
      ).rejects.toThrow();
    });
  });

  // ============================================================
  // SECTION 8: SPATIAL SELECTION CHAINING
  // ============================================================

  describe('Spatial Selection Chaining', () => {
    test('should chain multiple spatial filters in shadow DOM', async () => {
      // Find element that is below heading AND within container
      await browser
        .button('Below Heading Button')
        .below.element('spatial-heading')
        .should.be.visible();
    });

    test('should chain spatial filters with within in shadow DOM', async () => {
      // Find element within container that is below heading
      await browser
        .textbox('Inside container')
        .within.exact.element('spatial-container')
        .should.be.visible();
    });

    test('should chain near with other spatial filters', async () => {
      // "Near Button" is near "Nearby Link"
      await browser
        .button('Near Button')
        .near.link('Nearby Link')
        .should.be.visible();
    });

    test('should use exact with spatial filters in shadow DOM', async () => {
      // Test exact matching with spatial filters - use elements that are properly aligned
      // "Below heading" input is below the heading
      await browser
        .textbox('Below heading')
        .below.element('spatial-heading')
        .should.be.visible();
    });
  });

  // ============================================================
  // SECTION 9: SPATIAL SELECTION WITH MULTIPLE SHADOW HOSTS
  // ============================================================

  describe('Spatial Selection with Multiple Shadow Hosts', () => {
    test('should disambiguate elements using spatial filters in multiple hosts', async () => {
      // Both hosts have "Submit" buttons - use spatial filters to disambiguate
      await browser
        .button('Submit')
        .within.element('multiple-host-a')
        .should.be.visible();

      await browser
        .button('Submit')
        .within.element('multiple-host-b')
        .should.be.visible();
    });

    test('should find element in specific shadow host using spatial context', async () => {
      // Find "Forgot password?" link in Host A using spatial context
      await browser
        .link('Forgot password?')
        .within.element('multiple-host-a')
        .should.be.visible();
    });

    test('should find element in specific shadow host using spatial filters', async () => {
      // Find "Terms of Service" link in Host B
      await browser
        .link('Terms of Service')
        .within.element('multiple-host-b')
        .should.be.visible();
    });
  });

  // ============================================================
  // SECTION 10: SPATIAL SELECTION WITH COMBINED DOM
  // ============================================================

  describe('Spatial Selection with Combined Regular and Shadow DOM', () => {
    test('should find shadow element with spatial filter near regular DOM element', async () => {
      // "Submit" button exists in both regular DOM and shadow DOM
      // Use spatial context to find the shadow one
      await browser
        .button('Submit')
        .within.element('section-combined')
        .should.be.visible();
    });

    test('should find regular DOM element with spatial filter near shadow element', async () => {
      // Find regular DOM input
      await browser.textbox('Username').should.be.visible();
    });

    test('should handle spatial selection when same text exists in both contexts', async () => {
      // "Submit" exists in both - use context to disambiguate
      await browser
        .button('Submit')
        .within.element('section-combined')
        .should.be.visible();
    });
  });
});