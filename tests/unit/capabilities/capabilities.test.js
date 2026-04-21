import Chrome from '../../../app/capabilities/chrome.js';
import Firefox from '../../../app/capabilities/firefox.js';
import Safari from '../../../app/capabilities/safari.js';
import BrowserCapabilities from '../../../app/capabilities/index.js';

describe('Chrome Capabilities', () => {
  let chrome;

  beforeEach(() => {
    chrome = new Chrome();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('capabilities getter', () => {
    it('should return chrome capabilities', () => {
      expect(chrome.capabilities).toBeDefined();
      expect(chrome.capabilities).toHaveProperty('browserName', 'chrome');
    });
  });
});

describe('Firefox Capabilities', () => {
  let firefox;

  beforeEach(() => {
    firefox = new Firefox();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('capabilities getter', () => {
    it('should return firefox capabilities', () => {
      expect(firefox.capabilities).toBeDefined();
      expect(firefox.capabilities).toHaveProperty('browserName', 'firefox');
    });
  });
});

describe('Safari Capabilities', () => {
  let safari;

  beforeEach(() => {
    safari = new Safari();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('capabilities getter', () => {
    it('should return safari capabilities', () => {
      expect(safari.capabilities).toBeDefined();
      expect(safari.capabilities).toHaveProperty('browserName', 'safari');
    });
  });
});

describe('Browser Capabilities Factory', () => {
  describe('capabilities function', () => {
    it('should return Chrome capabilities by default', () => {
      const caps = BrowserCapabilities();
      expect(caps).toBeDefined();
    });

    it('should return Firefox capabilities when specified', () => {
      const caps = BrowserCapabilities({ browser: 'firefox' });
      expect(caps).toBeDefined();
    });

    it('should return Safari capabilities when specified', () => {
      const caps = BrowserCapabilities({ browser: 'safari' });
      expect(caps).toBeDefined();
    });

    it('should return error for unsupported browser', () => {
      const result = BrowserCapabilities({ browser: 'edge' });
      expect(result).toBeInstanceOf(Error);
    });
  });
});
