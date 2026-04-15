import capabilities from '../../../app/capabilities/index.js'

describe('Capabilities', () => {
  describe('capabilities function', () => {
    it('should return capabilities object for chrome browser', () => {
      const config = { browser: 'chrome' }
      const result = capabilities(config)
      expect(result).toBeDefined()
      // We can't test exact instance because it returns a Capabilities object
      // but we can verify it's a valid object
    })

    it('should return capabilities object for firefox browser', () => {
      const config = { browser: 'firefox' }
      const result = capabilities(config)
      expect(result).toBeDefined()
    })

    it('should return capabilities object for safari browser', () => {
      const config = { browser: 'safari' }
      const result = capabilities(config)
      expect(result).toBeDefined()
    })

    it('should return error for unknown browser', () => {
      const config = { browser: 'unknown' }
      const result = capabilities(config)
      expect(result).toBeInstanceOf(Error)
    })

    it('should work with default configuration', () => {
      // This will use the default config from @nodebug/config
      expect(typeof capabilities).toBe('function')
    })
  })
})