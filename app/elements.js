const { By, Condition } = require('selenium-webdriver')
const { log } = require('@nodebug/logger')

const attributes = [
  'placeholder',
  'value',
  'data-test-id',
  'id',
  'resource-id',
  'name',
  'aria-label',
  'class',
  'hint',
  'title',
  'tooltip',
  'alt',
  'src',
]

function WebElement(webdriver, settings) {
  const driver = webdriver
  const options = settings

  function timeout() {
    return parseInt(options.timeout, 10) * 1000
  }

  function transform(text) {
    let txt
    if (text.includes("'")) {
      txt = `concat('${text.replace(`'`, `',"'",'`)}')`
    } else {
      txt = `'${text}'`
    }
    return txt
  }

  function getSelector(obj) {
    let selector = ''
    if (obj.exact) {
      attributes.forEach((attribute) => {
        selector += `@${attribute}=${transform(obj.id)} or `
      })
      selector += `normalize-space(.)=${transform(obj.id)} `
      selector += `and not(.//*[normalize-space(.)=${transform(obj.id)}])`
    } else {
      attributes.forEach((attribute) => {
        selector += `contains(@${attribute},${transform(obj.id)}) or `
      })
      selector += `contains(normalize-space(.),${transform(obj.id)}) `
      selector += `and not(.//*[contains(normalize-space(.),${transform(
        obj.id,
      )})])`
    }

    selector = `//*[${selector}]`
    if (obj.index) {
      selector = `(${selector})[${obj.index}]`
    }
    log.debug(`Selector::  ${obj.id}`)
    return By.xpath(selector)
  }

  function getSelectorForRow(obj) {
    let selector = ''
    if (obj.exact) {
      attributes.forEach((attribute) => {
        selector += `@${attribute}=${transform(obj.id)} or `
      })
      selector += `normalize-space(.)=${transform(obj.id)} `
    } else {
      attributes.forEach((attribute) => {
        selector += `contains(@${attribute},${transform(obj.id)}) or `
      })
      selector += `contains(normalize-space(.),${transform(obj.id)}) `
    }

    selector = `//*[${selector}]`
    selector = `//tbody/tr[(.${selector})]` // additional for row
    if (obj.index) {
      selector = `(${selector})[${obj.index}]`
    }

    return By.xpath(selector)
  }

  function getSelectorForColumn(obj) {
    let selector = ''
    if (obj.exact) {
      attributes.forEach((attribute) => {
        selector += `@${attribute}=${transform(obj.id)} or `
      })
      selector += `normalize-space(.)=${transform(obj.id)} `
    } else {
      attributes.forEach((attribute) => {
        selector += `contains(@${attribute},${transform(obj.id)}) or `
      })
      selector += `contains(normalize-space(.),${transform(obj.id)}) `
    }

    selector = `[${selector}]` // additional for column
    selector = `//tbody/tr/*[count(//thead//th${selector}/preceding-sibling::th)+1]` // additional for column

    return By.xpath(selector)
  }

  function toSelector(obj) {
    if (obj.type === 'row') {
      return getSelectorForRow(obj)
    }
    if (obj.type === 'column') {
      return getSelectorForColumn(obj)
    }
    return getSelector(obj)
  }

  function relativeSearch(item, rel, relativeElement) {
    if ([undefined, null, ''].includes(rel)) {
      return item.matches
    }
    if ([undefined, null, ''].includes(rel.located)) {
      return item.matches
    }

    let elements
    if (![undefined, null, ''].includes(relativeElement)) {
      switch (rel.located) {
        case 'above':
          if (rel.exactly === true) {
            elements = item.matches.filter((element) => {
              return (
                relativeElement.rect.top >= element.rect.bottom &&
                relativeElement.rect.left - 5 <= element.rect.left &&
                relativeElement.rect.right + 5 >= element.rect.right
              )
            })
          } else {
            elements = item.matches.filter((element) => {
              return relativeElement.rect.top >= element.rect.bottom
            })
          }
          break
        case 'below':
          if (rel.exactly === true) {
            elements = item.matches.filter((element) => {
              return (
                relativeElement.rect.bottom <= element.rect.top &&
                relativeElement.rect.left - 5 <= element.rect.left &&
                relativeElement.rect.right + 5 >= element.rect.right
              )
            })
          } else {
            elements = item.matches.filter((element) => {
              return relativeElement.rect.bottom <= element.rect.top
            })
          }
          break
        case 'toLeftOf':
          if (rel.exactly === true) {
            elements = item.matches.filter((element) => {
              return (
                relativeElement.rect.left >= element.rect.right &&
                relativeElement.rect.top - 5 <= element.rect.top &&
                relativeElement.rect.bottom + 5 >= element.rect.bottom
              )
            })
          } else {
            elements = item.matches.filter((element) => {
              return relativeElement.rect.left >= element.rect.right
            })
          }
          break
        case 'toRightOf':
          if (rel.exactly === true) {
            elements = item.matches.filter((element) => {
              return (
                relativeElement.rect.right <= element.rect.left &&
                relativeElement.rect.top - 5 <= element.rect.top &&
                relativeElement.rect.bottom + 5 >= element.rect.bottom
              )
            })
          } else {
            elements = item.matches.filter((element) => {
              return relativeElement.rect.right <= element.rect.left
            })
          }
          break
        case 'within':
          elements = item.matches.filter((element) => {
            return (
              relativeElement.rect.left <= element.rect.left &&
              relativeElement.rect.right >= element.rect.right &&
              relativeElement.rect.top <= element.rect.top &&
              relativeElement.rect.bottom >= element.rect.bottom
            )
          })
          break
        default:
          throw new ReferenceError(`Location '${rel.located}' is not supported`)
      }
    } else {
      throw new ReferenceError(
        `Location '${rel.located}' cannot be found as relative element is '${relativeElement}'`,
      )
    }

    return elements
  }

  async function getRect(element) {
    return driver.executeScript(
      'return arguments[0].getBoundingClientRect();',
      element,
    )
  }

  async function getElementData(element, action) {
    const elementData = {}
    if (![undefined, null, ''].includes(action)) {
      const ce = await element.getAttribute('contenteditable')
      const cep = await element
        .findElement(By.xpath('./..'))
        .getAttribute('contenteditable')
      const ace = (await element.getAttribute('class')).includes('ace_text')
      const acep = (
        await element.findElement(By.xpath('./..')).getAttribute('class')
      ).includes('ace_text')
      elementData.editable = ce || cep || ace || acep || null
    }
    elementData.element = element
    elementData.tagName = await element.getTagName()
    elementData.rect = await getRect(element)
    return elementData
  }

  async function findElements(stack) {
    const items = []

    /* eslint-disable no-await-in-loop */
    // eslint-disable-next-line no-restricted-syntax
    for await (const item of stack) {
      if (
        ['element', 'row', 'column'].includes(item.type) &&
        item.matches.length < 1
      ) {
        let elements
        await driver.manage().setTimeouts({ implicit: 1000 })
        try {
          await driver.wait(
            new Condition(
              `for element to be invisible. Element is still visible on page.`,
              async function x() {
                await driver.switchTo().defaultContent()
                const frames = await driver.findElements(
                  By.xpath('//iframe[not(contains(@style,"display: none;"))]'),
                )
                // console.log(frames.length)
                for (let i = -1; i < frames.length; i++) {
                  // console.log(i)
                  if (i === -1) {
                    await driver.switchTo().defaultContent()
                  } else {
                    await driver.switchTo().frame(i)
                  }
                  elements = await driver.findElements(toSelector(item))
                  if (elements.length > 0) {
                    return true
                  }
                }
                return false
              },
            ),
            timeout(),
            `'${item.id}' has no matching elements on page.`,
          )
          await driver.manage().setTimeouts({ implicit: timeout() })
        } catch (err) {
          await driver.manage().setTimeouts({ implicit: timeout() })
          throw err
        }

        const matches = []
        // eslint-disable-next-line no-restricted-syntax
        for await (const element of elements) {
          const elementData = await getElementData(element)
          matches.push(elementData)
        }
        item.matches = matches.filter((e) => e.rect.height > 0)
      }

      items.push(item)
    }
    /* eslint-enable no-await-in-loop */

    return items
  }

  async function findActionElement(lctr, action) {
    let matches = []
    let locator = await getElementData(lctr.element, action)
    if (
      action === 'write' &&
      !['input', 'textarea'].includes(locator.tagName) &&
      !locator.editable
    ) {
      let write = `::*[`
      write += `self::input[@type='text' or @type='password'] or `
      write += `self::textarea or `
      write += `self::*[@contenteditable='true'] or `
      write += `self::*[contains(@class,'ace_text')]`
      write += `]`
      matches = await locator.element.findElements(
        By.xpath(`./descendant${write}`),
      )
      const promises = matches.map(async (e) => {
        return getElementData(e, action)
      })
      matches = await Promise.all(promises)
      matches = matches.filter(
        (e) =>
          ['input', 'textarea'].includes(e.tagName) ||
          [true, 'true'].includes(e.editable),
      )
      if (matches.length < 1) {
        matches = await locator.element.findElements(
          By.xpath(`./following${write}`),
        )
        const promisess = matches.map(async (e) => {
          return getElementData(e, action)
        })
        matches = await Promise.all(promisess)
        matches = matches.filter(
          (e) =>
            ['input', 'textarea'].includes(e.tagName) ||
            [true, 'true'].includes(e.editable),
        )
      }
    } else if (action === 'select' && locator.tagName !== 'select') {
      matches = await locator.element.findElements(
        By.xpath('./descendant::select'),
      )
      const promises = matches.map(async (e) => {
        return getElementData(e, action)
      })
      matches = await Promise.all(promises)
      matches = matches.filter((e) => e.tagName === 'select')
      if (matches.length < 1) {
        matches = await locator.element.findElements(
          By.xpath('./following::select'),
        )
        const promisess = matches.map(async (e) => {
          return getElementData(e, action)
        })
        matches = await Promise.all(promisess)
        matches = matches.filter((e) => e.tagName === 'select')
      }
    } else if (action === 'check' && locator.tagName !== 'input') {
      matches = await locator.element.findElements(
        By.xpath(`./preceding-sibling::input[@type='checkbox']`),
      )
      const promises = matches.map(async (e) => {
        return getElementData(e, action)
      })
      matches = await Promise.all(promises)
      matches = matches.filter((e) => e.tagName === 'input')
      if (matches.length < 1) {
        matches = await locator.element.findElements(
          By.xpath(`./child::input[@type='checkbox']`),
        )
        const promisess = matches.map(async (e) => {
          return getElementData(e, action)
        })
        matches = await Promise.all(promisess)
        matches = matches.filter((e) => e.tagName === 'input')
      }
    }

    if (matches.length > 0) {
      ;[locator] = matches
    }
    return locator
  }

  async function find(stack, action) {
    const data = await findElements(stack)

    let element = null
    for (let i = data.length - 1; i > -1; i--) {
      const item = data[i]
      if (['element', 'row', 'column'].includes(item.type)) {
        // eslint-disable-next-line no-await-in-loop
        ;[element] = relativeSearch(item)
        if ([undefined, null, ''].includes(element)) {
          throw new ReferenceError(
            `'${item.id}' has no matching elements on page.`,
          )
        }
      }
      if (item.type === 'location') {
        i -= 1
        // eslint-disable-next-line no-await-in-loop
        ;[element] = relativeSearch(data[i], item, element)
        if ([undefined, null, ''].includes(element)) {
          throw new ReferenceError(
            `'${data[i].id}' ${item.located} '${
              data[i + 2].id
            }' has no matching elements on page.`,
          )
        }
      }
      // await driver.executeScript("arguments[0].setAttribute('style', 'background: blue; border: 2px solid red;');", element.element);
    }

    if (['write', 'select', 'check'].includes(action)) {
      element = await findActionElement(element, action)
    }
    return element
  }

  async function findAll(stack) {
    const data = await findElements(stack)

    let element = null
    for (let i = data.length - 1; i > -1; i--) {
      const item = data[i]
      if (['element', 'row', 'column'].includes(item.type)) {
        // eslint-disable-next-line no-await-in-loop
        element = relativeSearch(item)
        if (i !== 0) {
          ;[element] = relativeSearch(item)
        }
        if ([undefined, null, ''].includes(element)) {
          throw new ReferenceError(
            `'${item.id}' has no matching elements on page.`,
          )
        }
      }
      if (item.type === 'location') {
        i -= 1
        // eslint-disable-next-line no-await-in-loop
        element = relativeSearch(data[i], item, element)
        if (i !== 0) {
          ;[element] = element
        }
        if ([undefined, null, ''].includes(element)) {
          throw new ReferenceError(
            `'${data[i].id}' ${item.located} '${
              data[i + 2].id
            }' has no matching elements on page.`,
          )
        }
      }
      // await driver.executeScript("arguments[0].setAttribute('style', 'background: blue; border: 2px solid red;');", element.element);
    }
    return element
  }

  return {
    find,
    findAll,
  }
}

module.exports = WebElement
