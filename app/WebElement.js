const { log } = require('@nodebug/logger')
const { By, until, Condition } = require('selenium-webdriver')

const that = {}

function WebElement(driver, element) {
  const my = {}
  my.driver = driver
  my.name = element.name
  my.byType = element.byType.toLowerCase()
  my.definition = element ? element.definition : null

  function getBy() {
    let byReturn = null
    const type = my.byType.toLowerCase().trim()
    log.debug(`Getting element ${my.name} By: ${type} for ${my.definition}`)
    switch (type) {
      case 'xpath':
        byReturn = By.xpath(my.definition)
        break
      case 'css':
        byReturn = By.css(my.definition)
        break
      case 'id':
        byReturn = By.id(my.definition)
        break
      case 'name':
        byReturn = By.name(my.definition)
        break
      case 'linktext':
        byReturn = By.linkText(my.definition)
        break
      case 'classname':
        byReturn = By.className(my.definition)
        break
      case 'partiallinktext':
        byReturn = By.partialLinkText(my.definition)
        break
      case 'tagname':
        byReturn = By.tagName(my.definition)
        break
      default:
        /* eslint-disable max-len */
        log.error(
          `The data asked to identify the element ${my.name}  by the type ${type} and that type is not valid.  Please review the data and try again.`,
        )
        log.error(
          'Valid types are [xpath, cssSelector, id, name, linkText, partialLinkText, className, tagName]',
        )
      /* eslint-enable max-len */
    }
    return byReturn
  }

  if (my.definition !== null) {
    my.definition = getBy()
  } else {
    log.error(`Please fix. Definition is null for element ${my.name}`)
  }

  that.getWebElement = async () => my.driver.findElement(my.definition)

  that.getWebElements = async () => my.driver.findElements(my.definition)

  that.isDisplayed = async () =>
    my.driver.findElement(my.definition).isDisplayed()

  that.isEnabled = async () => my.driver.findElement(my.definition).isEnabled()

  that.focus = async () =>
    my.driver.executeScript('arguments[0].focus();', await that.getWebElement())

  that.scrollIntoView = async () =>
    my.driver.executeScript(
      'arguments[0].scrollIntoView();',
      await that.getWebElement(),
    )

  that.hide = async () =>
    that
      .getWebElements()
      .then((elements) =>
        elements.forEach((e) =>
          my.driver.executeScript('return arguments[0].style.opacity=0', e),
        ),
      )

  that.unhide = async () =>
    that
      .getWebElements()
      .then((elements) =>
        elements.forEach((e) =>
          my.driver.executeScript('return arguments[0].style.opacity=1', e),
        ),
      )

  that.isPresent = async (timeout) =>
    my.driver.wait(until.elementsLocated(my.definition), timeout)

  that.isNotPresent = async (timeout) =>
    my.driver.wait(
      new Condition(
        `for 0 elements to be located By(${my.byType}, ${my.definition})`,
        // eslint-disable-next-line func-names
        async function () {
          try {
            await that.isPresent(1000)
          } catch (ex) {
            return true
          }
          return false
        },
      ),
      timeout,
    )

  return that
}

module.exports = WebElement
