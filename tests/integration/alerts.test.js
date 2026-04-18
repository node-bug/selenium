/**
 * Integration tests for Alert functionality
 * These tests require a real browser to be installed and running
 */
import WebBrowser from '../../index.js'
import { log } from '@nodebug/logger'

describe('Alert Integration Tests', () => {
  let browser

  beforeAll(async () => {
    browser = new WebBrowser()
    await browser.start()
  }, 30000)

  afterAll(async () => {
    if (browser) {
      try {
        await browser.close()
      } catch (err) {
        log.error(`Error closing browser: ${err.message}`)
      }
    }
  }, 10000)

  it('should handle alert visibility', async () => {
    // This is a structural test - actual alert interaction would require
    // a real browser with a page that triggers alerts
    expect(browser).toBeDefined()
    expect(browser.alert).toBeDefined()
    
    // Test that alert method returns an Alert instance
    const alertInstance = browser.alert()
    expect(alertInstance).toBeDefined()
  }, 10000)

  it('should support fluent interface with alert methods', async () => {
    // Test fluent interface
    const alertInstance = browser.alert('Test Text')
    expect(alertInstance).toBeDefined()
    expect(alertInstance._targetText).toBe('Test Text')
    
    // Test method chaining
    const chained = alertInstance.with()
    expect(chained).toBe(alertInstance)
  }, 10000)
})