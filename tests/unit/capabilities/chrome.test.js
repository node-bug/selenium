import Chrome from '../../../app/capabilities/chrome.js'
import { Capabilities } from 'selenium-webdriver'

describe('Chrome', () => {
  let chrome

  beforeEach(() => {
    chrome = new Chrome()
  })

  test('should create Chrome capabilities with default settings', () => {
    const capabilities = chrome.capabilities
    
    expect(capabilities).toBeInstanceOf(Capabilities)
    
    const chromeOptions = capabilities.get('goog:chromeOptions')
    expect(chromeOptions).toBeDefined()
    
    expect(chromeOptions.args).toContain('--force-device-scale-factor=1')
    expect(chromeOptions.args).toContain('--disable-extensions')
    expect(chromeOptions.args).toContain('--disable-gpu')
    expect(chromeOptions.args).toContain('--disable-notifications')
    expect(chromeOptions.args).toContain('--no-sandbox')
    expect(chromeOptions.args).toContain('--disable-dev-shm-usage')
    expect(chromeOptions.args).toContain('--disable-blink-features=AutomationControlled')
    expect(chromeOptions.args).toContain('--no-first-run')
    expect(chromeOptions.args).toContain('--headless=new')
    expect(chromeOptions.excludeSwitches).toContain('enable-automation')
  })

  test('should set pageLoadStrategy to normal', () => {
    const capabilities = chrome.capabilities
    
    expect(capabilities.get('pageLoadStrategy')).toBe('normal')
  })

  test('should return the same capabilities instance on subsequent calls', () => {
    const firstCapabilities = chrome.capabilities
    const secondCapabilities = chrome.capabilities
    
    expect(firstCapabilities).toStrictEqual(secondCapabilities)
  })
})