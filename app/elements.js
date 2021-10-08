const { By, withTagName } = require('selenium-webdriver')

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
  'role',
]

function WebElement(webdriver) {
  const driver = webdriver

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
    // if (obj.index) {
    //   selector = `(${selector})[${obj.index}]`
    // }

    return By.xpath(selector)
  }

  function getSelectorForRow(obj) {
    let selector = ''
    let t = ''
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
    if (obj.table !== undefined) {
      attributes.forEach((attribute) => {
        t += `contains(@${attribute},${transform(obj.table)}) or `
      })
      t += `contains(normalize-space(.),${transform(obj.table)}) `
      selector = `//table[${t}]/tbody/tr[(.${selector})]` // additional for row
    } else {
      selector = `//tbody/tr[(.${selector})]` // additional for row
    }

    // if (obj.index) {
    //   selector = `(${selector})[${obj.index}]`
    // }

    return By.xpath(selector)
  }

  function getSelectorForColumn(obj) {
    let selector = ''
    let t = ''
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
    if (obj.table !== undefined) {
      attributes.forEach((attribute) => {
        t += `contains(@${attribute},${transform(obj.table)}) or `
      })
      t += `contains(normalize-space(.),${transform(obj.table)}) `
      selector = `//table[${t}]/tbody/tr/*[count(//table[${t}]/thead//th${selector}/preceding-sibling::th)+1]`
      // additional for column
    } else {
      selector = `//tbody/tr/*[count(//thead//th${selector}/preceding-sibling::th)+1]`
      // additional for column
    }
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

  async function getRect(element) {
    const rect = await driver.executeScript(
      'return arguments[0].getBoundingClientRect();',
      element,
    )
    return {
      element,
      rect,
    }
  }

  async function findChildElements(parent, childData) {
    const c = []
    await driver.switchTo().defaultContent()
    if (parent.element.frame >= 0) {
      await driver.switchTo().frame(parent.element.frame)
    }

    const selector = toSelector(childData)
    selector.value = `.${selector.value}`
    const elements = await parent.element.findElements(selector)
    if (elements.length > 0) {
      for (let j = 0; j < elements.length; j++) {
        elements[j].frame = parent.element.frame
      }
      const matches = await Promise.all(
        elements.map((element) => getRect(element)),
      )
      c.push(...matches.filter((e) => e.rect.height > 0 && e.rect.width > 0))
    }

    return c
  }

  async function findElements(elementData) {
    const c = []
    await driver.switchTo().defaultContent()
    const frames = await driver.findElements(
      By.xpath('//iframe[not(contains(@style,"display: none;"))]'),
    )

    /* eslint-disable no-await-in-loop */
    for (let i = -1; i < frames.length; i++) {
      if (i > -1) {
        await driver.switchTo().frame(i)
      }
      const elements = await driver.findElements(toSelector(elementData))
      if (elements.length > 0) {
        for (let j = 0; j < elements.length; j++) {
          elements[j].frame = i
        }
        const matches = await Promise.all(
          elements.map((element) => getRect(element)),
        )
        c.push(...matches.filter((e) => e.rect.height > 0 && e.rect.width > 0))
      }
    }
    /* eslint-enable no-await-in-loop */

    return c
  }

  async function relativeSearch(item, rel, relativeElement) {
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
          if (item.type === 'element') {
            const matches = await findChildElements(relativeElement, item)
            if (matches.length > 0) {
              // eslint-disable-next-line no-param-reassign
              item.matches = matches
            }
          }
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
    return elementData
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
      write += `self::input[not(@type='radio' or @type='checkbox' or @type='submit' or @type='file')] or `
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
    }

    if (matches.length > 0) {
      ;[locator] = matches
    }
    return locator
  }

  async function resolveElements(stack) {
    const items = []

    /* eslint-disable no-await-in-loop */
    // eslint-disable-next-line no-restricted-syntax
    for (let i = 0; i < stack.length; i++) {
      const item = { ...stack[i] }
      if (
        [
          'element',
          'radio',
          'checkbox',
          'button',
          'textbox',
          'row',
          'column',
        ].includes(item.type) &&
        item.matches.length < 1
      ) {
        item.matches = await findElements(item)
      }
      items.push(item)
    }
    /* eslint-enable no-await-in-loop */
    return items
  }

  async function find(stack, action = null) {
    const data = await resolveElements(stack)

    let element = null
    /* eslint-disable no-await-in-loop */
    for (let i = data.length - 1; i > -1; i--) {
      const item = data[i]
      if (
        [
          'element',
          'radio',
          'checkbox',
          'button',
          'textbox',
          'row',
          'column',
        ].includes(item.type)
      ) {
        const results = await relativeSearch(item)
        if (item.index !== false) {
          element = results[item.index - 1]
        } else {
          ;[element] = results
        }
        if ([undefined, null, ''].includes(element)) {
          throw new ReferenceError(
            `'${item.id}' has no matching elements on page.`,
          )
        }
      }
      if (item.type === 'location') {
        i -= 1
        const results = await relativeSearch(data[i], item, element)
        if (data[i].index !== false) {
          element = results[data[i].index - 1]
        } else {
          ;[element] = results
        }
        if ([undefined, null, ''].includes(element)) {
          throw new ReferenceError(
            `'${data[i].id}' ${item.located} '${
              data[i + 2].id
            }' has no matching elements on page.`,
          )
        }
      }
    }
    /* eslint-enable no-await-in-loop */

    await driver.switchTo().defaultContent()
    if (element.element.frame >= 0) {
      await driver.switchTo().frame(element.element.frame)
    }
    if (['write', 'select', 'check'].includes(action)) {
      element = await findActionElement(element, action)
    }
    if (stack[0].type === 'radio') {
      const type = await element.element.getAttribute('type')
      if (type !== 'radio') {
        element.element = await driver.findElement(
          withTagName(`[type=radio]`).near(element.element),
        )
      }
    } else if (stack[0].type === 'textbox') {
      const type = await element.element.getAttribute('type')
      if (!['number', 'text'].includes(type)) {
        element.element = await driver.findElement(
          withTagName(
            `input:not([type=radio], [type=checkbox], [type=submit], [type=file])`,
          ).near(element.element),
        )
      }
    } else if (stack[0].type === 'checkbox') {
      const type = await element.element.getAttribute('type')
      if (type !== 'checkbox') {
        element.element = await driver.findElement(
          withTagName(`[type=checkbox]`).near(element.element),
        )
      }
    } else if (stack[0].type === 'button') {
      const tagName = await element.element.getTagName()
      if (tagName !== 'button') {
        element.element = await driver.findElement(
          withTagName(`button`).near(element.element),
        )
      }
    }
    return element
  }

  async function findAll(stack) {
    const data = await resolveElements(stack)

    let element = null
    /* eslint-disable no-await-in-loop */
    for (let i = data.length - 1; i > -1; i--) {
      const item = data[i]
      if (
        [
          'element',
          'radio',
          'textbox',
          'checkbox',
          'button',
          'row',
          'column',
        ].includes(item.type)
      ) {
        element = await relativeSearch(item)
        if (i !== 0) {
          ;[element] = await relativeSearch(item)
        }
        if ([undefined, null, ''].includes(element)) {
          throw new ReferenceError(
            `'${item.id}' has no matching elements on page.`,
          )
        }
      }
      if (item.type === 'location') {
        i -= 1
        element = await relativeSearch(data[i], item, element)
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
    /* eslint-enable no-await-in-loop */
    return element
  }

  return {
    find,
    findAll,
  }
}

module.exports = WebElement
