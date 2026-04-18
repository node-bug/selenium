import WebBrowser from '../../index.js'

/**
 * Unit tests for WebBrowser class
 * Tests the core functionality and API of the WebBrowser class
 */
describe('WebBrowser Class Unit Tests', () => {
  let browser

  beforeEach(() => {
    browser = new WebBrowser()
  })

  afterEach(() => {
    // Clean up if needed
  })

  describe('Constructor and Initialization', () => {
    it('should create a WebBrowser instance', () => {
      expect(browser).toBeDefined()
      expect(browser).toBeInstanceOf(WebBrowser)
    })

    it('should have core methods available', () => {
      // Test that core methods exist
      expect(typeof browser.start).toBe('function')
      expect(typeof browser.goto).toBe('function')
      expect(typeof browser.element).toBe('function')
      expect(typeof browser.button).toBe('function')
      expect(typeof browser.textbox).toBe('function')
      expect(typeof browser.checkbox).toBe('function')
      expect(typeof browser.write).toBe('function')
      expect(typeof browser.click).toBe('function')
      expect(typeof browser.find).toBe('function')
      expect(typeof browser.clear).toBe('function')
      expect(typeof browser.check).toBe('function')
      expect(typeof browser.uncheck).toBe('function')
      expect(typeof browser.isVisible).toBe('function')
      expect(typeof browser.isDisplayed).toBe('function')
      expect(typeof browser.isNotDisplayed).toBe('function')
      expect(typeof browser.isDisabled).toBe('function')
      expect(typeof browser.hide).toBe('function')
      expect(typeof browser.unhide).toBe('function')
      expect(typeof browser.upload).toBe('function')
      expect(typeof browser.drag).toBe('function')
      expect(typeof browser.onto).toBe('function')
      expect(typeof browser.drop).toBe('function')
    })
  })

  describe('Element Type Methods', () => {
    it('should have all element type methods', () => {
      const elementTypes = [
        'element', 'button', 'radio', 'textbox', 
        'checkbox', 'image', 'toolbar', 'tab', 
        'link', 'dialog', 'file'
      ]
      
      elementTypes.forEach(type => {
        expect(typeof browser[type]).toBe('function')
      })
    })
  })

  describe('Drag and Drop Methods', () => {
    it('should have drag and drop methods', () => {
      expect(typeof browser.drag).toBe('function')
      expect(typeof browser.onto).toBe('function')
      expect(typeof browser.drop).toBe('function')
    })
  })

  describe('Special Methods', () => {
    it('should have special methods for navigation', () => {
      expect(typeof browser.refresh).toBe('function')
      expect(typeof browser.goBack).toBe('function')
      expect(typeof browser.goForward).toBe('function')
      expect(typeof browser.window).toBe('function')
    })
  })
})