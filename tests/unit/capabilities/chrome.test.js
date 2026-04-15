import Chrome from '../../../app/capabilities/chrome.js'

describe('Chrome Capabilities', () => {
  let chrome

  beforeEach(() => {
    chrome = new Chrome()
  })

  describe('constructor', () => {
    it('should initialize with correct capabilities', () => {
      expect(chrome).toBeInstanceOf(Chrome)
      expect(chrome.capabilities).toBeDefined()
    })
  })

  describe('capabilities property', () => {
    it('should have capabilities object', () => {
      const capabilities = chrome.capabilities
      expect(capabilities).toBeDefined()
      // We can't test specific properties since they're created dynamically
      // but we can verify it's an object
      expect(typeof capabilities).toBe('object')
    })
  })
})