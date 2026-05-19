import WebBrowser from '../../index.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const fixturePath = path.join(__dirname, '../fixtures/spatial-test.html');
const fileUrl = `file://${fixturePath}`;

describe('WebBrowser Spatial Selectors Tests', () => {
  let browser;

  beforeAll(async () => {
    browser = new WebBrowser();
    await browser.start();
  });

  afterAll(async () => {
    await browser.close();
  });

  test('should find element below another element', async () => {
    await browser.goto(fileUrl);
    await browser
      .element('Center Element')
      .below.element('Top Edge')
      .should.be.visible();
  });

  test('should find element above another element', async () => {
    await browser.goto(fileUrl);
    // "Top Edge" is above "Center Element"
    await browser
      .element('Top Edge')
      .above.element('Center Element')
      .should.be.visible();
  });

  test('should find element to the left of another element', async () => {
    await browser.goto(fileUrl);
    // "Left Edge" is to the left of "Center Element"
    await browser
      .element('Left Edge')
      .toLeftOf.element('Center Element')
      .should.be.visible();
  });

  test('should find element to the right of another element', async () => {
    await browser.goto(fileUrl);
    // "Center Element" is to the right of "Left Edge"
    await browser
      .element('Center Element')
      .toRightOf.element('Left Edge')
      .should.be.visible();
  });

  test('should find element near another element', async () => {
    await browser.goto(fileUrl);
    // "Top Left Corner" is near "Top Edge" (both in top area)
    await browser
      .element('Top Left Corner')
      .near.element('Top Edge')
      .should.be.visible();
  });

  test('should chain multiple spatial references', async () => {
    await browser.goto(fileUrl);
    // "Center Element" is below "Top Edge" and to the right of "Left Edge"
    await browser
      .element('Center Element')
      .below.element('Top Edge')
      .toRightOf.element('Left Edge')
      .should.be.visible();
  });

  test('should work with exact matching in spatial context', async () => {
    await browser.goto(fileUrl);
    // Test exact matching combined with spatial selectors
    // "Center Element" is below "Top Edge"
    await browser
      .exact.element('Center Element')
      .below.element('Top Edge')
      .should.be.visible();
  });

  test('should find element exactly above another element with alignment', async () => {
    await browser.goto(fileUrl);
    // "Top Left Corner" and "Top Right Corner" are both exactly above "Left Edge" and "Right Edge" respectively
    // For this test, we check that Top Left Corner is exactly above Left Edge (vertically aligned)
    await browser
      .element('Top Left Corner')
      .exactly.above.element('Left Edge')
      .should.be.visible();
  });

  test('should find element exactly below another element with alignment', async () => {
    await browser.goto(fileUrl);
    // "Bottom Left Corner" is exactly below "Left Edge"
    await browser
      .element('Bottom Left Corner')
      .exactly.below.element('Left Edge')
      .should.be.visible();
  });

  test('should find element exactly to the left of another element with alignment', async () => {
    await browser.goto(fileUrl);
    // "Top Left Corner" is exactly to the left of "Top Right Corner" (both aligned horizontally at top)
    await browser
      .element('Top Left Corner')
      .exactly.toLeftOf.element('Top Right Corner')
      .should.be.visible();
  });

  test('should find element exactly to the right of another element with alignment', async () => {
    await browser.goto(fileUrl);
    // "Right Edge" is exactly to the right of "Left Edge" (both at top: 50%)
    await browser
      .element('Right Edge')
      .exactly.toRightOf.element('Left Edge')
      .should.be.visible();
    await expect(
      browser
        .element('Top Right Corner')
        .exactly.toRightOf.element('Left Edge')
        .should.be.visible()
    ).rejects.toThrow();
  });

  test('should find element within another element', async () => {
    await browser.goto(fileUrl);
    // "Within Item" is within "Within Container"
    // First verify both elements exist independently
    await browser.element('Within Container').should.be.visible();
    await browser.element('Within Item').should.be.visible();
    // Now test the within relationship
    await browser
      .element('Within Item')
      .within.element('Within Container')
      .should.be.visible();
  });

  // Negative tests - spatial relationships that should fail
  describe('Negative tests - invalid spatial relationships', () => {
    test('should throw error when element is not above reference', async () => {
      await browser.goto(fileUrl);
      // Right Edge is at top: 50%, Left Edge is at top: 50% - they're at same vertical position
      // Right Edge is NOT above Left Edge
      await expect(
        browser
          .element('Right Edge')
          .above.element('Left Edge')
          .should.be.visible()
      ).rejects.toThrow();
    });

    test('should throw error when element is not below reference', async () => {
      await browser.goto(fileUrl);
      // Top Edge is at top: 10px, Bottom Edge is at bottom: 10px
      // Top Edge is NOT below Bottom Edge
      await expect(
        browser
          .element('Top Edge')
          .below.element('Bottom Edge')
          .should.be.visible()
      ).rejects.toThrow();
    });

    test('should throw error when element is not to the left of reference', async () => {
      await browser.goto(fileUrl);
      // Left Edge is at left: 10px, Right Edge is at right: 10px
      // Left Edge is NOT to the right of Right Edge
      await expect(
        browser
          .element('Left Edge')
          .toRightOf.element('Right Edge')
          .should.be.visible()
      ).rejects.toThrow();
    });

    test('should throw error when element is not to the right of reference', async () => {
      await browser.goto(fileUrl);
      // Bottom Right Corner is at bottom: 10px, Top Left Corner is at top: 10px
      // Bottom Right Corner is NOT to the left of Top Left Corner (it's below and to the right)
      await expect(
        browser
          .element('Bottom Right Corner')
          .toLeftOf.element('Top Left Corner')
          .should.be.visible()
      ).rejects.toThrow();
    });

    test('should throw error when element is not within container', async () => {
      await browser.goto(fileUrl);
      // Center Element is not within Within Container
      await expect(
        browser
          .element('Center Element')
          .within.element('Within Container')
          .should.be.visible()
      ).rejects.toThrow();
    });

    test('should throw error when element is not near reference', async () => {
      await browser.goto(fileUrl);
      // Top Edge is at top: 10px, Bottom Edge is at bottom: 10px
      // They are far apart vertically (more than 100px threshold)
      await expect(
        browser
          .element('Top Edge')
          .near.element('Bottom Edge')
          .should.be.visible()
      ).rejects.toThrow();
    });

    test('should throw error for exactly above when not aligned', async () => {
      await browser.goto(fileUrl);
      // Top Left Corner is at left: 10px, Top Right Corner is at right: 10px
      // Top Left Corner is NOT exactly above Top Right Corner (they're at same vertical position)
      await expect(
        browser
          .element('Top Left Corner')
          .exactly.above.element('Top Right Corner')
          .should.be.visible()
      ).rejects.toThrow();
    });

    test('should throw error for exactly below when not aligned', async () => {
      await browser.goto(fileUrl);
      // Bottom Left Corner is at left: 10px, Bottom Right Corner is at right: 10px
      // Bottom Left Corner is NOT exactly below Bottom Right Corner (they're at same vertical position)
      await expect(
        browser
          .element('Bottom Left Corner')
          .exactly.below.element('Bottom Right Corner')
          .should.be.visible()
      ).rejects.toThrow();
    });

    test('should throw error for exactly toRightOf when not vertically aligned', async () => {
      await browser.goto(fileUrl);
      // Top Right Corner is at top: 10px, Left Edge is at top: 50%
      // Top Right Corner is NOT vertically aligned with Left Edge
      await expect(
        browser
          .element('Top Right Corner')
          .exactly.toRightOf.element('Left Edge')
          .should.be.visible()
      ).rejects.toThrow();
    });

    test('should throw error for exactly toLeftOf when not vertically aligned', async () => {
      await browser.goto(fileUrl);
      // Top Left Corner is at top: 10px, Right Edge is at top: 50%
      // Top Left Corner is NOT vertically aligned with Right Edge
      await expect(
        browser
          .element('Top Left Corner')
          .exactly.toLeftOf.element('Right Edge')
          .should.be.visible()
      ).rejects.toThrow();
    });

    test('should throw error for exactly above when horizontally not aligned', async () => {
      await browser.goto(fileUrl);
      // Left Edge is at left: 10px, Top Edge is at left: 50% (centered)
      // Left Edge is NOT horizontally aligned with Top Edge
      await expect(
        browser
          .element('Left Edge')
          .exactly.above.element('Top Edge')
          .should.be.visible()
      ).rejects.toThrow();
    });

    test('should throw error for exactly below when horizontally not aligned', async () => {
      await browser.goto(fileUrl);
      // Right Edge is at right: 10px, Bottom Edge is at left: 50% (centered)
      // Right Edge is NOT horizontally aligned with Bottom Edge
      await expect(
        browser
          .element('Right Edge')
          .exactly.below.element('Bottom Edge')
          .should.be.visible()
      ).rejects.toThrow();
    });

    test('should throw error for exactly toRightOf with misaligned corners', async () => {
      await browser.goto(fileUrl);
      // Bottom Left Corner is at bottom: 10px, Top Right Corner is at top: 10px
      // NOT vertically aligned (bottom vs top), so exact alignment fails
      await expect(
        browser
          .element('Bottom Left Corner')
          .exactly.toRightOf.element('Top Right Corner')
          .should.be.visible()
      ).rejects.toThrow();
    });

    test('should throw error for exactly toLeftOf with misaligned corners', async () => {
      await browser.goto(fileUrl);
      // Bottom Right Corner is at bottom: 10px, Top Left Corner is at top: 10px
      // NOT vertically aligned (bottom vs top), so exact alignment fails
      await expect(
        browser
          .element('Bottom Right Corner')
          .exactly.toLeftOf.element('Top Left Corner')
          .should.be.visible()
      ).rejects.toThrow();
    });

    // Negative tests for exactly keyword - element is in position but not exactly aligned
    test('should throw error when element is above but not exactly above (horizontal misalignment)', async () => {
      await browser.goto(fileUrl);
      // Top Edge is above Center Element (both at top area)
      // But Top Edge is NOT exactly above Center Element (Top Edge is at top: 10px, Center Element is at top: 50%)
      await expect(
        browser
          .element('Top Edge')
          .exactly.above.element('Center Element')
          .should.be.visible()
      ).rejects.toThrow();
    });

    test('should throw error when element is below but not exactly below (horizontal misalignment)', async () => {
      await browser.goto(fileUrl);
      // Bottom Left Corner is below Left Edge but NOT exactly below (it's at same vertical position)
      await expect(
        browser
          .element('Bottom Left Corner')
          .exactly.below.element('Right Edge')
          .should.be.visible()
      ).rejects.toThrow();
    });

    test('should throw error when element is to the left but not exactly to the left (vertical misalignment)', async () => {
      await browser.goto(fileUrl);
      // Top Left Corner is to the left of Top Right Corner but NOT exactly to the left of Right Edge
      await expect(
        browser
          .element('Top Left Corner')
          .exactly.toLeftOf.element('Right Edge')
          .should.be.visible()
      ).rejects.toThrow();
    });

    test('should throw error when element is to the right but not exactly to the right (vertical misalignment)', async () => {
      await browser.goto(fileUrl);
      // Top Right Corner is to the right of Top Left Corner but NOT exactly to the right of Left Edge
      await expect(
        browser
          .element('Top Right Corner')
          .exactly.toRightOf.element('Left Edge')
          .should.be.visible()
      ).rejects.toThrow();
    });
  });
});