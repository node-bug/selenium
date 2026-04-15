import Safari from '../../../app/capabilities/safari.js'

describe('Safari Capabilities', () => {
  let safari

  beforeEach(() => {
    safari = new Safari()
  })

  describe('constructor', () => {
    it('should initialize with correct capabilities', () => {
      expect(safari).toBeInstanceOf(Safari)
      expect(safari.capabilities).toBeDefined()
    })
  })

  describe('capabilities property', () => {
    it('should return a capabilities object', () => {
      const capabilities = safari.capabilities
      expect(capabilities).toBeDefined()
      // Just verify it's an object
      expect(typeof capabilities).toBe('object')
    })
  })
})