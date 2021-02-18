const { By, until } = require('selenium-webdriver')

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

function WebElement(dr) {
  const driver = dr

  function getXPathForElement(obj) {
    let attributecollection = ''
    if (obj.exact) {
      attributes.forEach((attribute) => {
        attributecollection += `@${attribute}='${obj.id}' or `
      })
      attributecollection += `normalize-space(.)='${obj.id}' `
      attributecollection += `and not(.//*[normalize-space(.)='${obj.id}'])`
    } else {
      attributes.forEach((attribute) => {
        attributecollection += `contains(@${attribute},'${obj.id}') or `
      })
      attributecollection += `contains(normalize-space(.),'${obj.id}') `
      attributecollection += `and not(.//*[contains(normalize-space(.),'${obj.id}')])`
    }

    let xpath = `//*[${attributecollection}]`
    if (obj.index) {
      xpath = `(${xpath})[${obj.index}]`
    }
    return xpath
  }

  function getXPathForRow(obj) {
    let attributecollection = ''
    if (obj.exact) {
      attributes.forEach((attribute) => {
        attributecollection += `@${attribute}='${obj.id}' or `
      })
      attributecollection += `normalize-space(.)='${obj.id}' `
    } else {
      attributes.forEach((attribute) => {
        attributecollection += `contains(@${attribute},'${obj.id}') or `
      })
      attributecollection += `contains(normalize-space(.),'${obj.id}') `
    }

    let xpath = `//*[${attributecollection}]`
    xpath = `//tbody/tr[(.${xpath})]`
    if (obj.index) {
      xpath = `(${xpath})[${obj.index}]`
    }
    return xpath
  }

  function getXPathForColumn(obj) {
    let attributecollection = ''
    if (obj.exact) {
      attributes.forEach((attribute) => {
        attributecollection += `@${attribute}='${obj.id}' or `
      })
      attributecollection += `normalize-space(.)='${obj.id}' `
    } else {
      attributes.forEach((attribute) => {
        attributecollection += `contains(@${attribute},'${obj.id}') or `
      })
      attributecollection += `contains(normalize-space(.),'${obj.id}') `
    }

    let xpath = `[${attributecollection}]`
    xpath = `//tbody/tr/*[count(//thead//th${xpath}/preceding-sibling::th)+1]`
    return xpath
  }

  function getXPath(obj) {
    if (obj.type === 'row') {
      return getXPathForRow(obj)
    }
    if (obj.type === 'column') {
      return getXPathForColumn(obj)
    }
    return getXPathForElement(obj)
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
                relativeElement.rect.left <= element.rect.left &&
                relativeElement.rect.right >= element.rect.right
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
                relativeElement.rect.left <= element.rect.left &&
                relativeElement.rect.right >= element.rect.right
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
                relativeElement.rect.top <= element.rect.top &&
                relativeElement.rect.bottom >= element.rect.bottom
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
                relativeElement.rect.top <= element.rect.top &&
                relativeElement.rect.bottom >= element.rect.bottom
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

  async function withProperties(e, action) {
    const locator = {}
    if (![undefined, null, ''].includes(action)) {
      const ce = await e.getAttribute('contenteditable')
      const cep = await e
        .findElement(By.xpath('./..'))
        .getAttribute('contenteditable')
      const ace = (await e.getAttribute('class')).includes('ace_text')
      const acep = (
        await e.findElement(By.xpath('./..')).getAttribute('class')
      ).includes('ace_text')
      locator.editable = ce || cep || ace || acep || null
    }
    locator.element = e
    locator.tagName = await e.getTagName()
    locator.rect = await getRect(e)
    return locator
  }

  async function resolveElements(stack) {
    const promises = stack.map(async (item) => {
      const obj = { ...item }
      if (
        ['element', 'row', 'column'].includes(obj.type) &&
        obj.matches.length < 1
      ) {
        const xpath = getXPath(obj)
        let elements = await driver.findElements(By.xpath(xpath))
        const promisess = elements.map(async (e) => {
          return withProperties(e)
        })
        elements = await Promise.all(promisess)
        obj.matches = elements.filter((e) => e.rect.height > 0)
      }
      return obj
    })
    return Promise.all(promises)
  }

  async function findElements(stack) {
    await driver.switchTo().defaultContent()
    let data = await resolveElements(stack)
    for (let i = 0; i < data.length; i++) {
      /* eslint-disable no-await-in-loop */
      if (
        ['element', 'row', 'column'].includes(data[i].type) &&
        data[i].matches.length < 1
      ) {
        const frames = (await driver.findElements(By.xpath('//iframe'))).length
        for (let frame = 0; frame < frames; frame++) {
          await driver.wait(until.ableToSwitchToFrame(frame))
          data = await resolveElements(data)
        }
        if (data[i].matches.length < 1) {
          throw new ReferenceError(
            `'${data[i].id}' has no matching elements on page.`,
          )
        }
      }
      /* eslint-enable no-await-in-loop */
    }
    return data
  }

  async function findActionElement(lctr, action) {
    let matches = []
    let locator = await withProperties(lctr.element, action)
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
        return withProperties(e, action)
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
          return withProperties(e, action)
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
        return withProperties(e, action)
      })
      matches = await Promise.all(promises)
      matches = matches.filter((e) => e.tagName === 'select')
      if (matches.length < 1) {
        matches = await locator.element.findElements(
          By.xpath('./following::select'),
        )
        const promisess = matches.map(async (e) => {
          return withProperties(e, action)
        })
        matches = await Promise.all(promisess)
        matches = matches.filter((e) => e.tagName === 'select')
      }
    } else if (action === 'check' && locator.tagName !== 'input') {
      matches = await locator.element.findElements(
        By.xpath(`./preceding-sibling::input[@type='checkbox']`),
      )
      const promises = matches.map(async (e) => {
        return withProperties(e, action)
      })
      matches = await Promise.all(promises)
      matches = matches.filter((e) => e.tagName === 'input')
      if (matches.length < 1) {
        matches = await locator.element.findElements(
          By.xpath(`./child::input[@type='checkbox']`),
        )
        const promisess = matches.map(async (e) => {
          return withProperties(e, action)
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
