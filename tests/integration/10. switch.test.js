import WebBrowser from '../../index.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const FIXTURES_DIR = path.resolve(__dirname, '..', 'fixtures');

function fileUrl(filename) {
  return `file://${path.join(FIXTURES_DIR, filename)}`;
}

describe('Switch Integration Tests', () => {
  let browser;

  beforeAll(async () => {
    browser = new WebBrowser();
    await browser.start();
  });

  afterAll(async () => {
    await browser.close();
  });

  describe('Button-style switch (role="switch" with aria-checked)', () => {
    beforeEach(async () => {
      await browser.goto(fileUrl('switches.html'));
    });

    test('should turn switch on and verify state', async () => {
      await browser.switch('Environmental Controls').on();
      expect(await browser.switch('Environmental Controls').is.on()).toBe(true);
      await browser.switch('Environmental Controls').should.be.on();
    });

    test('should turn switch off and verify state', async () => {
      await browser.switch('Environmental Controls').on();
      await browser.switch('Environmental Controls').off();
      expect(await browser.switch('Environmental Controls').is.off()).toBe(true);
      await browser.switch('Environmental Controls').should.be.off();
    });

    test('should be idempotent when already in target state', async () => {
      await browser.switch('Environmental Controls').on();
      await browser.switch('Environmental Controls').on(); // idempotent
      expect(await browser.switch('Environmental Controls').is.on()).toBe(true);

      await browser.switch('Environmental Controls').off();
      await browser.switch('Environmental Controls').off(); // idempotent
      expect(await browser.switch('Environmental Controls').is.off()).toBe(true);
    });

    test('should toggle back and forth multiple times', async () => {
      await browser.switch('Environmental Controls').on();
      expect(await browser.switch('Environmental Controls').is.on()).toBe(true);

      await browser.switch('Environmental Controls').off();
      expect(await browser.switch('Environmental Controls').is.off()).toBe(true);

      await browser.switch('Environmental Controls').on();
      expect(await browser.switch('Environmental Controls').is.on()).toBe(true);
    });
  });

  describe('Label-wrapped checkbox switch', () => {
    beforeEach(async () => {
      await browser.goto(fileUrl('switches.html'));
    });

    test('should turn switch on and verify state', async () => {
      await browser.switch('Accessibility Preferences').on();
      expect(await browser.switch('Accessibility Preferences').is.on()).toBe(true);
      await browser.switch('Accessibility Preferences').should.be.on();
    });

    test('should turn switch off and verify state', async () => {
      await browser.switch('Accessibility Preferences').on();
      await browser.switch('Accessibility Preferences').off();
      expect(await browser.switch('Accessibility Preferences').is.off()).toBe(true);
      await browser.switch('Accessibility Preferences').should.be.off();
    });

    test('should be idempotent when already in target state', async () => {
      await browser.switch('Accessibility Preferences').on();
      await browser.switch('Accessibility Preferences').on(); // idempotent
      expect(await browser.switch('Accessibility Preferences').is.on()).toBe(true);

      await browser.switch('Accessibility Preferences').off();
      await browser.switch('Accessibility Preferences').off(); // idempotent
      expect(await browser.switch('Accessibility Preferences').is.off()).toBe(true);
    });

    test('should toggle back and forth multiple times', async () => {
      await browser.switch('Accessibility Preferences').on();
      expect(await browser.switch('Accessibility Preferences').is.on()).toBe(true);

      await browser.switch('Accessibility Preferences').off();
      expect(await browser.switch('Accessibility Preferences').is.off()).toBe(true);

      await browser.switch('Accessibility Preferences').on();
      expect(await browser.switch('Accessibility Preferences').is.on()).toBe(true);
    });
  });

  describe('Native checkbox switch', () => {
    beforeEach(async () => {
      await browser.goto(fileUrl('switches.html'));
    });

    test('should turn switch on and verify state', async () => {
      await browser.switch('Notifications').on();
      expect(await browser.switch('Notifications').is.on()).toBe(true);
      await browser.switch('Notifications').should.be.on();
    });

    test('should turn switch off and verify state', async () => {
      await browser.switch('Notifications').on();
      await browser.switch('Notifications').off();
      expect(await browser.switch('Notifications').is.off()).toBe(true);
      await browser.switch('Notifications').should.be.off();
    });

    test('should be idempotent when already in target state', async () => {
      await browser.switch('Notifications').on();
      await browser.switch('Notifications').on(); // idempotent
      expect(await browser.switch('Notifications').is.on()).toBe(true);

      await browser.switch('Notifications').off();
      await browser.switch('Notifications').off(); // idempotent
      expect(await browser.switch('Notifications').is.off()).toBe(true);
    });

    test('should toggle back and forth multiple times', async () => {
      await browser.switch('Notifications').on();
      expect(await browser.switch('Notifications').is.on()).toBe(true);

      await browser.switch('Notifications').off();
      expect(await browser.switch('Notifications').is.off()).toBe(true);

      await browser.switch('Notifications').on();
      expect(await browser.switch('Notifications').is.on()).toBe(true);
    });
  });

  describe('Disabled switch', () => {
    beforeEach(async () => {
      await browser.goto(fileUrl('switches.html'));
    });

    test('should handle disabled switch gracefully', async () => {
      // Clicking a disabled switch should throw an error
      await expect(browser.switch('Disabled Switch').on()).rejects.toThrow();
    });
  });

  describe('Switch by index on multiple-switches fixture', () => {
    beforeEach(async () => {
      await browser.goto(fileUrl('switches.html'));
    });

    test('should handle switch elements by index - turn first switch on', async () => {
      // Switch 1 (Dark Mode) starts as off
      await browser.switch(1).on();
      expect(await browser.switch(1).is.on()).toBe(true);
    });

    test('should handle switch elements by index - turn second switch off', async () => {
      // Switch 2 (Notifications) starts as on
      await browser.switch(2).off();
      expect(await browser.switch(2).is.off()).toBe(true);
    });

    test('should toggle multiple switches by index', async () => {
      // Turn on switches 1, 3, 5 (all start as off)
      await browser.switch(1).on();
      await browser.switch(3).on();
      await browser.switch(5).on();

      expect(await browser.switch(1).is.on()).toBe(true);
      expect(await browser.switch(3).is.on()).toBe(true);
      expect(await browser.switch(5).is.on()).toBe(true);

      // Turn off switches 2, 4 (both start as on)
      await browser.switch(2).off();
      await browser.switch(4).off();

      expect(await browser.switch(2).is.off()).toBe(true);
      expect(await browser.switch(4).is.off()).toBe(true);
    });

    test('should toggle all switches on then all off', async () => {
      // Turn all switches on
      for (let i = 1; i <= 5; i++) {
        await browser.switch(i).on();
      }

      // Verify all are on
      for (let i = 1; i <= 5; i++) {
        expect(await browser.switch(i).is.on()).toBe(true);
      }

      // Turn all switches off
      for (let i = 1; i <= 5; i++) {
        await browser.switch(i).off();
      }

      // Verify all are off
      for (let i = 1; i <= 5; i++) {
        expect(await browser.switch(i).is.off()).toBe(true);
      }
    });

    test('should be idempotent when switch is already in target state', async () => {
      // Turn on, then call .on() again — should skip without error
      await browser.switch(1).on();
      await browser.switch(1).on(); // idempotent
      expect(await browser.switch(1).is.on()).toBe(true);

      // Turn off, then call .off() again — should skip without error
      await browser.switch(1).off();
      await browser.switch(1).off(); // idempotent
      expect(await browser.switch(1).is.off()).toBe(true);
    });

    test('should handle out-of-bounds index gracefully', async () => {
      // There are only 5 switches; index 6 should fail gracefully
    expect(await browser.switch(6).on()).rejects.toThrow();
    });
  });
});
