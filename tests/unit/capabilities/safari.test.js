import Safari from '../../../app/capabilities/safari.js'
import { Capabilities } from 'selenium-webdriver'

describe('Safari', () => {
  let safari

  beforeEach(() => {
    safari = new Safari()
  })

  test('should create Safari capabilities with default settings', () => {
    const capabilities = safari.capabilities
    
    expect(capabilities).toBeInstanceOf(Capabilities)
    
    const safariOptions = capabilities.get('safari:options')
    expect(safariOptions).toBeDefined()
    
    // Verify browser name is set to safari
    expect(capabilities.get('browserName')).toBe('safari')
  })

  test('should set pageLoadStrategy to normal', () => {
    const capabilities = safari.capabilities
    
    expect(capabilities.get('pageLoadStrategy')).toBe('normal')
  })

  test('should return the same capabilities instance on subsequent calls', () => {
    const firstCapabilities = safari.capabilities
    const secondCapabilities = safari.capabilities
    
    expect(firstCapabilities).toStrictEqual(secondCapabilities)
  })
})