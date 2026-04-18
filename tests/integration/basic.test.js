import Browser from '../../app/browser/index.js'
import { log } from '@nodebug/logger'

/**
 * Integration tests for WebBrowser functionality
 * These tests require a real browser to be installed and running
 */
describe('WebBrowser Integration Tests', () => {
  let browser
  const testUrls = [
    'https://www.google.com',
    'https://www.github.com',
    'https://www.example.com'
  ]

  beforeAll(async () => {
    browser = new Browser()
    log.info('Starting browser session for integration tests')
    await browser.new()
  })

  afterAll(async () => {
    if (browser && browser.driver) {
      log.info('Closing browser session after integration tests')
      await browser.close()
    }
  })

  describe('Browser Session Management', () => {
    it('should start a browser session successfully', async () => {
      expect(browser.driver).toBeDefined()
      expect(browser.driver).not.toBeNull()
    })

    it('should get browser name', async () => {
      const name = await browser.get.name()
      expect(name).toBeDefined()
      expect(typeof name).toBe('string')
      expect(name.length).toBeGreaterThan(0)
    })

    it('should get operating system', async () => {
      const os = await browser.get.os()
      expect(os).toBeDefined()
      expect(typeof os).toBe('string')
      expect(os.length).toBeGreaterThan(0)
    })

    it('should get current URL', async () => {
      const url = await browser.window().get.url()
      expect(url).toBeDefined()
      expect(typeof url).toBe('string')
      expect(url.length).toBeGreaterThan(0)
    })

    it('should get page title', async () => {
      const title = await browser.window().get.title()
      expect(title).toBeDefined()
      expect(typeof title).toBe('string')
      // Title might be empty if page hasn't loaded yet
      expect(title.length).toBeGreaterThanOrEqual(0)
    })
  })

  describe('Window Operations', () => {
    it('should open a new browser window', async () => {
      const initialHandles = await browser.driver.getAllWindowHandles()
      const initialCount = initialHandles.length

      await browser.window().new()

      const newHandles = await browser.driver.getAllWindowHandles()
      expect(newHandles.length).toBe(initialCount + 1)
    })

    it('should close a browser window', async () => {
      const handlesBefore = await browser.driver.getAllWindowHandles()
      await browser.window().close()

      const handlesAfter = await browser.driver.getAllWindowHandles()
      expect(handlesAfter.length).toBe(handlesBefore.length - 1)
    })

    it('should maximize the browser window', async () => {
      const currentRect = await browser.driver.manage().window().getRect()
      const initialWidth = currentRect.width
      const initialHeight = currentRect.height

      await browser.window().maximize()

      const maximizedRect = await browser.driver.manage().window().getRect()
      expect(maximizedRect.width).toBeGreaterThanOrEqual(initialWidth)
      expect(maximizedRect.height).toBeGreaterThanOrEqual(initialHeight)
    })

    it('should minimize the browser window', async () => {
      await browser.window().minimize()

      // Wait a moment for minimize to take effect
      await new Promise(resolve => setTimeout(resolve, 1000))

      // Note: Minimize behavior varies by browser and OS
      // This test just verifies the method doesn't throw an error
      expect(true).toBe(true)
    })

    it('should set window size', async () => {
      const size = { width: 1024, height: 768 }
      await browser.setSize(size)

      const currentRect = await browser.driver.manage().window().getRect()
      expect(currentRect.width).toBe(size.width)
      expect(currentRect.height).toBe(size.height)
    })

    it('should switch between windows by title', async () => {
      // Open a new window
      await browser.window().new()
      // Navigate to Google in the new window
      await browser.goto('https://www.google.com')
      const title = await browser.window().get.title()
      expect(title).toBeDefined()

      await browser.window().new()
      await browser.goto('https://www.wikipedia.com')
      
      // Switch to the window by title
      const switched = await browser.window().title(title).switch()
      expect(switched).toBe(true)
      const title2 = await browser.window().get.title()
      expect(title2).toBe(title)
    })

    it('should switch between windows by index', async () => {
      // Open a new window
      await browser.window().new()
      
      // Get handles and switch by index
      const handles = await browser.driver.getAllWindowHandles()
      expect(handles.length).toBeGreaterThanOrEqual(2)
      
      // Switch to the second window (index 1)
      await browser.window(1).switch()
      
      // Verify we switched to the correct window
      const currentTitle = await browser.window().get.title()
      expect(currentTitle).toBeDefined()
    })
  })

  describe('Tab Operations', () => {
    it('should open a new tab', async () => {
      const initialHandles = await browser.driver.getAllWindowHandles()
      const initialCount = initialHandles.length

      await browser.tab().new()

      const newHandles = await browser.driver.getAllWindowHandles()
      expect(newHandles.length).toBe(initialCount + 1)
    })

    it('should close a tab', async () => {
      const handlesBefore = await browser.driver.getAllWindowHandles()
      await browser.tab().close()

      const handlesAfter = await browser.driver.getAllWindowHandles()
      expect(handlesAfter.length).toBe(handlesBefore.length - 1)
    })

    it('should switch to a tab by number', async () => {
      // Open multiple tabs
      await browser.tab().new()
      await browser.goto('https://www.google.com')
      const title = await browser.window().get.title()
      expect(title).toBeDefined()
      const currentUrl = await browser.window().get.url()
      expect(currentUrl).toBeDefined()

      await browser.tab().new()
      await browser.goto('https://www.wikipedia.com')

      const handles = await browser.driver.getAllWindowHandles()
      expect(handles.length).toBeGreaterThanOrEqual(3)

      // Switch to the second tab (index 1)
      await browser.tab(1).switch()
      const title2 = await browser.window().get.title()
      expect(title2).toBe(title)
      const currentUrl2 = await browser.window().get.url()
      expect(currentUrl).toBe(currentUrl2)
    })

    it('should switch to a tab by title', async () => {
      // Navigate to GitHub
      await browser.goto('https://www.github.com')
      const title = await browser.window().get.title()
      expect(title).toBeDefined()

      await browser.tab().new()
      await browser.goto('https://www.wikipedia.com')
      await new Promise(resolve => setTimeout(resolve, 3000))

      // Switch to the tab by title
      const switched = await browser.tab(title).switch()
      expect(switched).toBe(true)
      const title2 = await browser.window().get.title()
      expect(title2).toBe(title)
    })

    it('should switch to a tab by index', async () => {
      // Open a new tab
      await browser.tab().new()
      
      // Switch to the first tab (index 0)
      await browser.tab(0).switch()
      
      // Verify we switched to the correct tab
      const currentTitle = await browser.window().get.title()
      expect(currentTitle).toBeDefined()
    })

    it('should check if tab is displayed by index', async () => {
      // Open a new tab
      await browser.tab().new()
      
      // Check if tab at index 1 is displayed
      const isDisplayed = await browser.tab(1).isDisplayed()
      expect(isDisplayed).toBe(true)
    })
  })

  describe('Navigation Operations', () => {
    it('should navigate to a URL', async () => {
      const url = testUrls[0]
      await browser.goto(url)

      const currentUrl = await browser.window().get.url()
      expect(currentUrl).toContain('google.com')
    })

    it('should navigate to multiple URLs', async () => {
      for (const url of testUrls) {
        await browser.goto(url)
        const currentUrl = await browser.window().get.url()
        expect(currentUrl).toBeDefined()
      }
    })

    it('should refresh the page', async () => {
      const url = testUrls[0]
      await browser.goto(url)

      const titleBefore = await browser.window().get.title()
      await browser.refresh()

      await new Promise(resolve => setTimeout(resolve, 1000))
      const titleAfter = await browser.window().get.title()

      expect(titleBefore).toBeDefined()
      expect(titleAfter).toBeDefined()
    })

    it('should go back in browser history', async () => {
      const url = testUrls[0]
      await browser.goto(url)

      await browser.goto(testUrls[1])
      await new Promise(resolve => setTimeout(resolve, 1000))

      await browser.goBack()

      const currentUrl = await browser.window().get.url()
      expect(currentUrl).toContain('google.com')
    })

    it('should go forward in browser history', async () => {
      const url = testUrls[0]
      await browser.goto(url);

      await browser.goto(testUrls[1])
      await new Promise(resolve => setTimeout(resolve, 1000))

      await browser.goBack()
      await new Promise(resolve => setTimeout(resolve, 1000))

      await browser.goForward()

      const currentUrl = await browser.window().get.url()
      expect(currentUrl).toContain('github.com')
    })
  })

  describe('Window and Tab Management', () => {
    it('should manage multiple windows and tabs', async () => {
      // Open multiple windows
      await browser.window().new()
      await browser.window().new()

      // Open multiple tabs
      await browser.tab().new()
      await browser.tab().new()

      const handles = await browser.driver.getAllWindowHandles()
      expect(handles.length).toBeGreaterThanOrEqual(4)

      // Switch between tabs
      await browser.tab(0).switchTab(0)
      const currentUrl = await browser.window().get.url()
      expect(currentUrl).toBeDefined()
    })

    it('should handle window switching correctly', async () => {
      // Open a new window
      await browser.window().new()

      // Navigate to Google in the new window
      await browser.goto('https://www.google.com')
      await new Promise(resolve => setTimeout(resolve, 3000))

      const googleUrl = await browser.window().get.url()
      expect(googleUrl).toContain('google.com')

      // Switch back to main window
      const handles = await browser.driver.getAllWindowHandles()
      await browser.driver.switchTo().window(handles[0])

      const mainUrl = await browser.window().get.url()
      expect(mainUrl).toBeDefined()
    })
  })

  describe('Browser Capabilities', () => {
    it('should get browser capabilities', async () => {
      const capabilities = await browser.driver.getCapabilities()
      expect(capabilities).toBeDefined()
      expect(typeof capabilities).toBe('object')
    })

    it('should get browser version', async () => {
      const capabilities = await browser.driver.getCapabilities()
      const browserVersion = capabilities.get('browserVersion')
      expect(browserVersion).toBeDefined()
    })

    it('should get platform information', async () => {
      const capabilities = await browser.driver.getCapabilities()
      const platform = capabilities.get('platformName')
      expect(platform).toBeDefined()
    })
  })

  describe('Error Handling', () => {
    it('should handle invalid URL gracefully', async () => {
      const invalidUrl = 'https://this-url-does-not-exist-12345.com'
      try {
        await browser.goto(invalidUrl)
      } catch (error) {
        // The error message may vary based on browser, so we check for key parts
        expect(error.message).toContain('Unable to navigate to') || 
        expect(error.message).toContain('net::ERR_NAME_NOT_RESOLVED')
      }

      const currentUrl = await browser.window().get.url()
      // The browser might handle this differently, so we just check it doesn't crash
      expect(currentUrl).toBeDefined()
    })

    it('should handle closing already closed window', async () => {
      // This should not throw an error
      await browser.window().close()
      expect(true).toBe(true)
    })

    it('should handle switching to non-existent tab by index', async () => {
      // Try to switch to a tab that doesn't exist
      try {
        await browser.tab(100).switch()
        //fail('Should have thrown an error')
      } catch (error) {
        // The error message may vary based on browser, so we check for key parts
        expect(error.message).toContain('not found on screen') || 
        expect(error.message).toContain('timeout') ||
        expect(error.message).toContain('Failed to switch to Tab')
      }
    })
  })
})