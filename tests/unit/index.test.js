import WebBrowser from '../../index.js'

describe('Main Export', () => {
  describe('WebBrowser class', () => {
    it('should export WebBrowser class correctly', () => {
      expect(WebBrowser).toBeDefined()
      expect(typeof WebBrowser).toBe('function')
    })

    it('should be instantiable', () => {
      const browser = new WebBrowser()
      expect(browser).toBeInstanceOf(WebBrowser)
    })
  })
})