import Firefox from '../../../app/capabilities/firefox.js'

describe('Firefox Capabilities', () => {
  let firefox

  beforeEach(() => {
    firefox = new Firefox()
  })

  describe('constructor', () => {
    it('should initialize with correct capabilities', () => {
      expect(firefox).toBeInstanceOf(Firefox)
      expect(firefox.capabilities).toBeDefined()
    })
  })

  describe('capabilities property', () => {
    it('should return a capabilities object', () => {
      const capabilities = firefox.capabilities
      expect(capabilities).toBeDefined()
      // Just verify it's an object
      expect(typeof capabilities).toBe('object')
    })
  })
})