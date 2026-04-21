import { jest } from '@jest/globals';

// --- MOCKS (must come before imports) ---
const mockDriver = {
  wait: jest.fn(),
  sleep: jest.fn(),
  switchTo: jest.fn(),
};

const mockAlert = {
  getText: jest.fn(),
  accept: jest.fn(),
  dismiss: jest.fn(),
  sendKeys: jest.fn(),
};

jest.unstable_mockModule('selenium-webdriver', () => ({
  until: {
    alertIsPresent: jest.fn(),
  },
}));

jest.unstable_mockModule('@nodebug/logger', () => ({
  log: {
    info: jest.fn(),
    error: jest.fn(),
  },
}));

// --- IMPORTS (AFTER MOCKS) ---
const { default: Alerts } = await import('../../../app/browser/alerts.js');
const { log } = await import('@nodebug/logger');
const { until } = await import('selenium-webdriver');

describe('Alerts (ESM)', () => {
  let alert;

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup driver behavior
    mockDriver.wait.mockResolvedValue(true);
    mockDriver.sleep.mockResolvedValue();

    mockDriver.switchTo.mockReturnValue({
      alert: jest.fn().mockResolvedValue(mockAlert),
    });

    // Default alert text
    mockAlert.getText.mockResolvedValue('Test Alert');

    alert = new Alerts(mockDriver);
  });

  describe('Constructor', () => {
    test('should create instance with driver', () => {
      expect(alert).toBeInstanceOf(Alerts);
      expect(alert.driver).toBe(mockDriver);
    });
  });

  describe('with()', () => {
    test('returns same instance', () => {
      expect(alert.with()).toBe(alert);
    });
  });

  describe('text()', () => {
    test('sets expected text', () => {
      alert.text('Expected');
      expect(alert._targetText).toBe('Expected');
    });

    test('supports chaining', () => {
      const result = alert.with().text('Expected');
      expect(result).toBe(alert);
    });
  });

  describe('isVisible()', () => {
    test('returns true when alert matches text', async () => {
      mockAlert.getText.mockResolvedValue('Expected Text');

      alert.text('Expected');

      const result = await alert.isVisible();

      expect(result).toBe(true);
      expect(mockDriver.wait).toHaveBeenCalledWith(
        until.alertIsPresent(),
        10000
      );
      expect(mockDriver.sleep).toHaveBeenCalledWith(1000);
      expect(log.info).toHaveBeenCalledWith(
        "Alert with text 'Expected Text' is present"
      );
    });

    test('returns false when text does not match', async () => {
      mockAlert.getText.mockResolvedValue('Wrong Text');

      alert.text('Expected');

      const result = await alert.isVisible();

      expect(result).toBe(false);
      expect(log.info).toHaveBeenCalledWith(
        "Alert found, but text 'Wrong Text' did not match expected text 'Expected'"
      );
    });

    test('returns false when alert not present', async () => {
      mockDriver.wait.mockRejectedValue(new Error('Not found'));

      const result = await alert.isVisible();

      expect(result).toBe(false);
      expect(log.info).toHaveBeenCalledWith(
        'Alert not found or timed out. Error: Not found'
      );
    });

    test('sets alert instance', async () => {
      await alert.isVisible();
      expect(alert.alert).toBe(mockAlert);
    });
  });

  describe('accept()', () => {
    test('accepts alert', async () => {
      await alert.accept();

      expect(mockAlert.accept).toHaveBeenCalled();
      expect(log.info).toHaveBeenCalledWith('Accepting Alert');
    });

    test('throws if no alert', async () => {
      mockDriver.wait.mockRejectedValue(new Error('fail'));

      await expect(alert.accept()).rejects.toThrow(
        'No alert present to accept'
      );
    });
  });

  describe('dismiss()', () => {
    test('dismisses alert', async () => {
      await alert.dismiss();

      expect(mockAlert.dismiss).toHaveBeenCalled();
      expect(log.info).toHaveBeenCalledWith('Dismissing Alert');
    });

    test('throws if no alert', async () => {
      mockDriver.wait.mockRejectedValue(new Error('fail'));

      await expect(alert.dismiss()).rejects.toThrow(
        'No alert present to dismiss'
      );
    });
  });

  describe('write()', () => {
    test('sends keys to alert', async () => {
      await alert.write('Hello');

      expect(mockAlert.sendKeys).toHaveBeenCalledWith('Hello');
      expect(log.info).toHaveBeenCalledWith(
        'Sending keys to alert: Hello'
      );
    });
  });

  describe('get.text', () => {
    test('returns alert text', async () => {
      mockAlert.getText.mockResolvedValue('My Text');

      const text = await alert.get.text();

      expect(text).toBe('My Text');
      expect(mockAlert.getText).toHaveBeenCalled();
    });
  });

  describe('integration', () => {
    test('full flow: write + accept', async () => {
      mockAlert.getText.mockResolvedValue('Enter name');

      await alert.text('Enter').isVisible();
      await alert.write('John');
      await alert.accept();

      expect(mockAlert.sendKeys).toHaveBeenCalledWith('John');
      expect(mockAlert.accept).toHaveBeenCalled();
    });

    test('full flow: dismiss', async () => {
      await alert.dismiss();
      expect(mockAlert.dismiss).toHaveBeenCalled();
    });
  });
});