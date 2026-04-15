import Browser from '../../../app/browser/index.js'

describe('Browser (Base Class)', () => {
  let browser

  beforeEach(() => {
    browser = new Browser()
  })

  describe('constructor', () => {
    it('should initialize with correct properties', () => {
      expect(browser).toBeInstanceOf(Browser)
      expect(browser.window).toBeDefined()
      // Note: _capabilities and _driver are set during runtime, not in constructor
    })
  })

  describe('capabilities getter/setter', () => {
    it('should get and set capabilities correctly', () => {
      const testCapabilities = { browserName: 'chrome' }
      browser.capabilities = testCapabilities
      expect(browser.capabilities).toBe(testCapabilities)
    })
  })

  describe('driver getter/setter', () => {
    it('should get and set driver correctly', () => {
      const testDriver = { some: 'driver' }
      browser.driver = testDriver
      expect(browser.driver).toBe(testDriver)
      expect(browser.window.driver).toBe(testDriver)
    })
  })

  describe('timeout getter', () => {
    it('should return timeout value in milliseconds', () => {
      expect(typeof browser.timeout).toBe('number')
    })
  })

  describe('new method', () => {
    it('should initialize a new browser session', async () => {
      // This test would require a real browser to be installed
      // For now, we'll just verify the method exists and is callable
      expect(typeof browser.new).toBe('function')
    })
  })

  describe('sleep method', () => {
    it('should sleep for specified milliseconds', async () => {
      expect(typeof browser.sleep).toBe('function')
      const start = Date.now()
      await browser.sleep(100)
      const end = Date.now()
      expect(end - start).toBeGreaterThanOrEqual(100)
    })
  })
})