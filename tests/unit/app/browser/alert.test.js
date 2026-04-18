import Alert from '../../../../app/browser/alerts.js';
import sinon from 'sinon';

describe('Alert Unit Tests', () => {
  let alert;
  let mockDriver;
  let mockAlert;
  let sandbox;

  beforeEach(() => {
    sandbox = sinon.createSandbox();
    mockDriver = {
      wait: sandbox.stub().resolves(),
      sleep: sandbox.stub().resolves(),
      switchTo: sandbox.stub().returns({
        alert: sandbox.stub().returns(mockAlert)
      })
    };

    mockAlert = {
      getText: sandbox.stub().resolves('Test Alert Text'),
      accept: sandbox.stub().resolves(),
      dismiss: sandbox.stub().resolves(),
      sendKeys: sandbox.stub().resolves()
    };

    alert = new Alert(mockDriver);
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe('constructor', () => {
    it('should initialize with driver', () => {
      expect(alert.driver).toBe(mockDriver);
    });

    it('should initialize without driver', () => {
      const newAlert = new Alert();
      expect(newAlert.driver).toBeUndefined();
    });

    it('should allow setting driver', () => {
      const newDriver = { wait: sandbox.stub().resolves() };
      alert.driver = newDriver;
      expect(alert.driver).toBe(newDriver);
    });
  });

  describe('with method', () => {
    it('should return alert instance for chaining', () => {
      const result = alert.with();
      expect(result).toBe(alert);
    });
  });

  describe('text method', () => {
    it('should set target text', () => {
      const result = alert.text('Expected Text');
      expect(result).toBe(alert);
      expect(alert._targetText).toBe('Expected Text');
    });

    it('should allow chaining', () => {
      const result = alert.text('Text').with();
      expect(result).toBe(alert);
    });
  });

  describe('isVisible method', () => {
    it('should return true if alert is present and text matches', async () => {
      mockDriver.wait = sandbox.stub().resolves();
      mockDriver.sleep = sandbox.stub().resolves();
      mockAlert.getText = sandbox.stub().resolves('Expected Text');
      const result = await alert.isVisible();
      expect(result).toBe(true);
    });

    it('should return true if alert is present without target text', async () => {
      mockDriver.wait = sandbox.stub().resolves();
      mockDriver.sleep = sandbox.stub().resolves();
      mockAlert.getText = sandbox.stub().resolves('Any Text');
      const result = await alert.isVisible();
      expect(result).toBe(true);
    });

    it('should return false if alert text does not match target', async () => {
      mockDriver.wait = sandbox.stub().resolves();
      mockDriver.sleep = sandbox.stub().resolves();
      mockAlert.getText = sandbox.stub().resolves('Wrong Text');
      const result = await alert.text('Expected Text').isVisible();
      expect(result).toBe(false);
    });

    it('should return false if alert is not present', async () => {
      mockDriver.wait = sandbox.stub().rejects(new Error('Alert not found'));
      const result = await alert.isVisible();
      expect(result).toBe(false);
    });

    it('should return false if alert times out', async () => {
      mockDriver.wait = sandbox.stub().rejects(new Error('Timeout'));
      const result = await alert.isVisible();
      expect(result).toBe(false);
    });

    it('should store alert instance on success', async () => {
      mockDriver.wait = sandbox.stub().resolves();
      mockDriver.sleep = sandbox.stub().resolves();
      mockAlert.getText = sandbox.stub().resolves('Test Text');
      await alert.isVisible();
      expect(alert.alert).toBe(mockAlert);
    });
  });

  describe('accept method', () => {
    it('should accept alert if visible', async () => {
      mockAlert.accept = sandbox.stub().resolves();
      await alert.accept();
      expect(mockAlert.accept.calledOnce).toBe(true);
    });

    it('should throw error if alert not visible', async () => {
      mockAlert.accept = sandbox.stub().resolves();
      await expect(alert.accept()).rejects.toThrow('No alert present to accept');
    });

    it('should use stored alert instance', async () => {
      mockAlert.accept = sandbox.stub().resolves();
      await alert.accept();
      expect(mockAlert.accept.calledOnce).toBe(true);
    });
  });

  describe('dismiss method', () => {
    it('should dismiss alert if visible', async () => {
      mockAlert.dismiss = sandbox.stub().resolves();
      await alert.dismiss();
      expect(mockAlert.dismiss.calledOnce).toBe(true);
    });

    it('should throw error if alert not visible', async () => {
      mockAlert.dismiss = sandbox.stub().resolves();
      await expect(alert.dismiss()).rejects.toThrow('No alert present to dismiss');
    });

    it('should use stored alert instance', async () => {
      mockAlert.dismiss = sandbox.stub().resolves();
      await alert.dismiss();
      expect(mockAlert.dismiss.calledOnce).toBe(true);
    });
  });

  describe('write method', () => {
    it('should send text to alert', async () => {
      await alert.write('Test Text');
      expect(mockAlert.sendKeys.calledWith('Test Text')).toBe(true);
    });

    it('should check visibility before writing', async () => {
      await alert.write('Test Text');
      expect(mockDriver.wait.calledOnce).toBe(true);
    });

    it('should use stored alert instance', async () => {
      await alert.write('Test Text');
      expect(mockAlert.sendKeys.calledOnce).toBe(true);
    });
  });

  describe('get.text method', () => {
    it('should get alert text', async () => {
      mockAlert.getText = sandbox.stub().resolves('Alert Text');
      const result = await alert.get.text();
      expect(result).toBe('Alert Text');
    });

    it('should check visibility before getting text', async () => {
      await alert.get.text();
      expect(mockDriver.wait.calledOnce).toBe(true);
    });

    it('should use stored alert instance', async () => {
      await alert.get.text();
      expect(mockAlert.getText.calledOnce).toBe(true);
    });
  });

  describe('get property', () => {
    it('should return object with text getter', () => {
      expect(alert.get).toBeDefined();
      expect(typeof alert.get.text).toBe('function');
    });

    it('should return object for chaining', () => {
      const result = alert.get.text();
      expect(result).toBeUndefined();
    });
  });

  describe('edge cases', () => {
    it('should handle empty target text', async () => {
      mockDriver.wait = sandbox.stub().resolves();
      mockDriver.sleep = sandbox.stub().resolves();
      mockAlert.getText = sandbox.stub().resolves('Any Text');
      const result = await alert.text('').isVisible();
      expect(result).toBe(true);
    });

    it('should handle null target text', async () => {
      mockDriver.wait = sandbox.stub().resolves();
      mockDriver.sleep = sandbox.stub().resolves();
      mockAlert.getText = sandbox.stub().resolves('Any Text');
      const result = await alert.text(null).isVisible();
      expect(result).toBe(true);
    });

    it('should handle special characters in target text', async () => {
      mockDriver.wait = sandbox.stub().resolves();
      mockDriver.sleep = sandbox.stub().resolves();
      mockAlert.getText = sandbox.stub().resolves('Test@#$%');
      const result = await alert.text('Test@#$%').isVisible();
      expect(result).toBe(true);
    });

    it('should handle case sensitivity', async () => {
      mockDriver.wait = sandbox.stub().resolves();
      mockDriver.sleep = sandbox.stub().resolves();
      mockAlert.getText = sandbox.stub().resolves('Expected Text');
      const result = await alert.text('expected text').isVisible();
      expect(result).toBe(false);
    });

    it('should handle partial match', async () => {
      mockDriver.wait = sandbox.stub().resolves();
      mockDriver.sleep = sandbox.stub().resolves();
      mockAlert.getText = sandbox.stub().resolves('Expected Text');
      const result = await alert.text('Expected').isVisible();
      expect(result).toBe(true);
    });
  });

  describe('error handling', () => {
    it('should handle errors in isVisible gracefully', async () => {
      mockDriver.wait = sandbox.stub().rejects(new Error('Test Error'));
      const result = await alert.isVisible();
      expect(result).toBe(false);
    });

    it('should handle errors in accept gracefully', async () => {
      mockAlert.accept = sandbox.stub().rejects(new Error('Test Error'));
      await expect(alert.accept()).rejects.toThrow('No alert present to accept');
    });

    it('should handle errors in dismiss gracefully', async () => {
      mockAlert.dismiss = sandbox.stub().rejects(new Error('Test Error'));
      await expect(alert.dismiss()).rejects.toThrow('No alert present to dismiss');
    });

    it('should handle errors in write gracefully', async () => {
      mockAlert.sendKeys = sandbox.stub().rejects(new Error('Test Error'));
      await expect(alert.write('Test')).rejects.toThrow();
    });

    it('should handle errors in get.text gracefully', async () => {
      mockAlert.getText = sandbox.stub().rejects(new Error('Test Error'));
      await expect(alert.get.text()).rejects.toThrow();
    });
  });
});