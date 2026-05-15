import WebBrowser from '../../index.js';

describe('Switch Delegate Integration Tests', () => {
  let browser;

  beforeAll(async () => {
    browser = new WebBrowser();
    await browser.start();
    await browser.goto(`file://${process.cwd()}/tests/fixtures/switches.html`);
  });

  afterAll(async () => {
    await browser.close();
  });

  // ========================================
  // 1. Native Checkbox Switch Tests
  // ========================================

  describe('Native Checkbox Switch', () => {
    test('should turn on a native checkbox switch', async () => {
      await browser.switch('Standard Checkbox Switch').on();
      const isOn = await browser.switch('Standard Checkbox Switch').is.on();
      expect(isOn).toBe(true);
    });

    test('should turn off a native checkbox switch', async () => {
      // First turn it on
      await browser.switch('Standard Checkbox Switch').on();
      // Then turn it off
      await browser.switch('Standard Checkbox Switch').off();
      const isOff = await browser.switch('Standard Checkbox Switch').is.off();
      expect(isOff).toBe(true);
    });

    test('should be idempotent when turning on an already-on switch', async () => {
      await browser.switch('Standard Checkbox Switch').on();
      await browser.switch('Standard Checkbox Switch').on(); // Should not throw
      const isOn = await browser.switch('Standard Checkbox Switch').is.on();
      expect(isOn).toBe(true);
    });

    test('should be idempotent when turning off an already-off switch', async () => {
      await browser.switch('Standard Checkbox Switch').off();
      await browser.switch('Standard Checkbox Switch').off(); // Should not throw
      const isOff = await browser.switch('Standard Checkbox Switch').is.off();
      expect(isOff).toBe(true);
    });

    test('should check initial state of native checkbox switch', async () => {
      const isOff = await browser.switch('Standard Checkbox Switch').is.off();
      expect(isOff).toBe(true);
    });
  });

  // ========================================
  // 2. Bare Native Checkbox Tests
  // ========================================

  describe('Bare Native Checkbox', () => {
    test('should turn on a bare native checkbox', async () => {
      await browser.switch('Bare Native Checkbox').on();
      const isOn = await browser.switch('Bare Native Checkbox').is.on();
      expect(isOn).toBe(true);
    });

    test('should turn off a bare native checkbox', async () => {
      await browser.switch('Bare Native Checkbox').off();
      const isOff = await browser.switch('Bare Native Checkbox').is.off();
      expect(isOff).toBe(true);
    });

    test('should toggle bare native checkbox multiple times', async () => {
      await browser.switch('Bare Native Checkbox').on();
      expect(await browser.switch('Bare Native Checkbox').is.on()).toBe(true);
      
      await browser.switch('Bare Native Checkbox').off();
      expect(await browser.switch('Bare Native Checkbox').is.off()).toBe(true);
      
      await browser.switch('Bare Native Checkbox').on();
      expect(await browser.switch('Bare Native Checkbox').is.on()).toBe(true);
    });
  });

  // ========================================
  // 3. ARIA Switch Tests (role="switch")
  // ========================================

  describe('ARIA Switch (role="switch")', () => {
    test('should turn on an ARIA switch', async () => {
      await browser.switch('ARIA Div Switch').on();
      const isOn = await browser.switch('ARIA Div Switch').is.on();
      expect(isOn).toBe(true);
    });

    test('should turn off an ARIA switch', async () => {
      await browser.switch('ARIA Div Switch').off();
      const isOff = await browser.switch('ARIA Div Switch').is.off();
      expect(isOff).toBe(true);
    });

    test('should check initial state of ARIA switch', async () => {
      const isOff = await browser.switch('ARIA Div Switch').is.off();
      expect(isOff).toBe(true);
    });

    test('should toggle ARIA switch multiple times', async () => {
      await browser.switch('ARIA Div Switch').on();
      expect(await browser.switch('ARIA Div Switch').is.on()).toBe(true);
      
      await browser.switch('ARIA Div Switch').off();
      expect(await browser.switch('ARIA Div Switch').is.off()).toBe(true);
      
      await browser.switch('ARIA Div Switch').on();
      expect(await browser.switch('ARIA Div Switch').is.on()).toBe(true);
    });
  });

  // ========================================
  // 4. Button Switch Tests (data-state attribute)
  // ========================================

  describe('Button Switch (data-state attribute)', () => {
    test('should turn on a button switch', async () => {
      await browser.switch('Native Button Switch').on();
      const isOn = await browser.switch('Native Button Switch').is.on();
      expect(isOn).toBe(true);
    });

    test('should turn off a button switch', async () => {
      await browser.switch('Native Button Switch').off();
      const isOff = await browser.switch('Native Button Switch').is.off();
      expect(isOff).toBe(true);
    });

    test('should check initial state of button switch', async () => {
      const isOff = await browser.switch('Native Button Switch').is.off();
      expect(isOff).toBe(true);
    });

    test('should toggle button switch multiple times', async () => {
      await browser.switch('Native Button Switch').on();
      expect(await browser.switch('Native Button Switch').is.on()).toBe(true);
      
      await browser.switch('Native Button Switch').off();
      expect(await browser.switch('Native Button Switch').is.off()).toBe(true);
      
      await browser.switch('Native Button Switch').on();
      expect(await browser.switch('Native Button Switch').is.on()).toBe(true);
    });
  });

  // ========================================
  // 5. Disabled Switch Tests
  // ========================================

  describe('Disabled Switch', () => {
    test('should throw error when trying to turn on a disabled switch', async () => {
      await expect(
        browser.switch('Disabled Control Switch').on()
      ).rejects.toThrow();
    });

    test('should throw error when trying to turn off a disabled switch', async () => {
      await expect(
        browser.switch('Disabled Control Switch').off()
      ).rejects.toThrow();
    });

    test('should verify disabled switch is initially off', async () => {
      const isOff = await browser.switch('Disabled Control Switch').is.off();
      expect(isOff).toBe(true);
    });
  });

  // ========================================
  // 6. Shadow DOM Switch Tests
  // ========================================

  describe('Shadow DOM Switch', () => {
    test('should turn on a switch inside shadow DOM', async () => {
      await browser.switch('Switch inside Shadow DOM (Open)').on();
      const isOn = await browser.switch('Switch inside Shadow DOM (Open)').is.on();
      expect(isOn).toBe(true);
    });

    test('should turn off a switch inside shadow DOM', async () => {
      await browser.switch('Switch inside Shadow DOM (Open)').off();
      const isOff = await browser.switch('Switch inside Shadow DOM (Open)').is.off();
      expect(isOff).toBe(true);
    });

    test('should toggle shadow DOM switch multiple times', async () => {
      await browser.switch('Switch inside Shadow DOM (Open)').on();
      expect(await browser.switch('Switch inside Shadow DOM (Open)').is.on()).toBe(true);
      
      await browser.switch('Switch inside Shadow DOM (Open)').off();
      expect(await browser.switch('Switch inside Shadow DOM (Open)').is.off()).toBe(true);
      
      await browser.switch('Switch inside Shadow DOM (Open)').on();
      expect(await browser.switch('Switch inside Shadow DOM (Open)').is.on()).toBe(true);
    });
  });

  // ========================================
  // 7. iFrame Switch Tests
  // ========================================

  describe('iFrame Switch', () => {
    test('should turn on a switch inside an iframe', async () => {
      await browser.switch('Document Switch Window Node').on();
      const isOn = await browser.switch('Document Switch Window Node').is.on();
      expect(isOn).toBe(true);
    });

    test('should turn off a switch inside an iframe', async () => {
      await browser.switch('Document Switch Window Node').off();
      const isOff = await browser.switch('Document Switch Window Node').is.off();
      expect(isOff).toBe(true);
    });

    test('should toggle iframe switch multiple times', async () => {
      await browser.switch('Document Switch Window Node').on();
      expect(await browser.switch('Document Switch Window Node').is.on()).toBe(true);
      
      await browser.switch('Document Switch Window Node').off();
      expect(await browser.switch('Document Switch Window Node').is.off()).toBe(true);
      
      await browser.switch('Document Switch Window Node').on();
      expect(await browser.switch('Document Switch Window Node').is.on()).toBe(true);
    });
  });

  // ========================================
  // 8. State Verification Tests
  // ========================================

  describe('State Verification', () => {
    test('should correctly report is.on() for on switch', async () => {
      await browser.switch('Standard Checkbox Switch').on();
      expect(await browser.switch('Standard Checkbox Switch').is.on()).toBe(true);
    });

    test('should correctly report is.on() for off switch', async () => {
      await browser.switch('Standard Checkbox Switch').off();
      expect(await browser.switch('Standard Checkbox Switch').is.on()).toBe(false);
    });

    test('should correctly report is.off() for off switch', async () => {
      await browser.switch('Standard Checkbox Switch').off();
      expect(await browser.switch('Standard Checkbox Switch').is.off()).toBe(true);
    });

    test('should correctly report is.off() for on switch', async () => {
      await browser.switch('Standard Checkbox Switch').on();
      expect(await browser.switch('Standard Checkbox Switch').is.off()).toBe(false);
    });
  });

  // ========================================
  // 9. Assertion Tests
  // ========================================

  describe('Assertions', () => {
    test('should pass assertion when switch is on', async () => {
      await browser.switch('Standard Checkbox Switch').on();
      await browser.switch('Standard Checkbox Switch').should.be.on();
    });

    test('should pass assertion when switch is off', async () => {
      await browser.switch('Standard Checkbox Switch').off();
      await browser.switch('Standard Checkbox Switch').should.be.off();
    });

    test('should pass assertion when switch is not on', async () => {
      await browser.switch('Standard Checkbox Switch').off();
      await browser.switch('Standard Checkbox Switch').should.not.be.on();
    });

    test('should pass assertion when switch is not off', async () => {
      await browser.switch('Standard Checkbox Switch').on();
      await browser.switch('Standard Checkbox Switch').should.not.be.off();
    });
  });
});