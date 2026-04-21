import Firefox from '../../../app/capabilities/firefox.js'
import { Capabilities } from 'selenium-webdriver'

describe('Firefox', () => {
  let firefox

  beforeEach(() => {
    firefox = new Firefox()
  })

  test('should create Firefox capabilities with default settings', () => {
    const capabilities = firefox.capabilities
    
    expect(capabilities).toBeInstanceOf(Capabilities)
    
    const firefoxOptions = capabilities.get('moz:firefoxOptions')
    expect(firefoxOptions).toBeDefined()
    
    // Verify preferences are set
    expect(firefoxOptions.prefs).toBeDefined()
  })

  test('should set pageLoadStrategy to normal', () => {
    const capabilities = firefox.capabilities
    
    expect(capabilities.get('pageLoadStrategy')).toBe('normal')
  })

  test('should set accept insecure certs to true', () => {
    const capabilities = firefox.capabilities
    
    expect(capabilities.get('acceptInsecureCerts')).toBe(true)
  })

  test('should return the same capabilities instance on subsequent calls', () => {
    const firstCapabilities = firefox.capabilities
    const secondCapabilities = firefox.capabilities
    
    expect(firstCapabilities).toStrictEqual(secondCapabilities)
  })
})