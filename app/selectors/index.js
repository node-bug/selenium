class Selectors {
  get attributes(){
    return [
      'placeholder',
      'value',
      'data-test-id',
      'data-testid',
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
  }

  get transformed() {
    if (this.value.includes("'")) {
      return `concat('${this.value.replace(`'`, `',"'",'`)}')`
    }
    return `'${this.value}'`
  }

  get exactMatcher() {
    let string = ''
    this.attributes.forEach((attribute) => {
      string += `normalize-space(@${attribute})=${this.transformed} or `
    })
    string += `normalize-space(.)=${this.transformed} `
    string += `and not(.//*[normalize-space(.)=${this.transformed}])`
    return string
  }

  get partialMatcher() {
    let string = ''
    this.attributes.forEach((attribute) => {
      string += `contains(normalize-space(@${attribute}),${this.transformed}) or `
    })
    string += `contains(normalize-space(.),${this.transformed}) `
    string += `and not(.//*[contains(normalize-space(.),${this.transformed})])`
    return string
  }

  matcher(attribute, exact = false) {
    this.value = attribute
    this.exact = exact

    if (exact) {
      return this.exactMatcher
    }
    return this.partialMatcher
  }

  static self(tags) {
    return `(${tags.map((tagname) => `self::${tagname}`).join(' or ')})`
  }

  getSelectors(attribute, exact = false) {
    const str = this.matcher(attribute, exact)
    
    return {
      link: `//*[(${str}) and @href]`,
      button: `//*[(${str}) and (@role='button' or @type='button' or @type='submit' or self::button)]`,
      toolbar: `//*[(${str}) and @role='toolbar']`,
      radio: `//*[(${str}) and @role='radio']`,
      textbox: `//*[(${str}) and (@role='textbox' or @type='search' or @type='email' or self::textarea or (self::input and (@type='text' or @type='password')))]`,
      checkbox: `//*[(${str}) and (@role='checkbox' or @type='checkbox')]`,
      image: `//*[(${str}) and self::img]`,
      dialog: `//*[(${str}) and @role='dialog']`,
      file: `//*[(${str}) and (@role='file' or @type='file')]`,
      // row: `//*[(${str})]/ancestor-or-self::*[${Selectors.self(
      //   this.tagnames.cell,
      // )}]`,
      // column: `//*[(${str})]/ancestor-or-self::*[${Selectors.self(
      //   this.tagnames.menuitem,
      // )}]`,
      element: `//*[${str}]`,
    }
  }

  get selectors() {
    return {
      link: `//*[@href]`,
      button: `//*[(@role='button' or @type='button' or @type='submit' or self::button)]`,
      toolbar: `//*[@role='toolbar']`,
      radio: `//*[@role='radio']`,
      textbox: `//*[@role='textbox' or @type='search' or @type='email' or self::textarea or (self::input and (@type='text' or @type='password'))]`,
      checkbox: `//*[@role='checkbox' or @type='checkbox']`,
      image: `//*[self::img]`,
      dialog: `//*[@role='dialog']`,
      file: `//*[@role='file' or @type='file']`,
      // row: `//*[(${str})]/ancestor-or-self::*[${Selectors.self(
      //   this.tagnames.cell,
      // )}]`,
      // column: `//*[(${str})]/ancestor-or-self::*[${Selectors.self(
      //   this.tagnames.menuitem,
      // )}]`,
      element: `//*`,
    }
  }
}

module.exports = Selectors

// function getSelectorForRow(obj) {
//   let selector = ''
//   let t = ''
//   if (obj.exact) {
//     attributes.forEach((attribute) => {
//       selector += `@${attribute}=${transform(obj.id)} or `
//     })
//     selector += `normalize-space(.)=${transform(obj.id)} `
//   } else {
//     attributes.forEach((attribute) => {
//       selector += `contains(@${attribute},${transform(obj.id)}) or `
//     })
//     selector += `contains(normalize-space(.),${transform(obj.id)}) `
//   }

//   selector = `//*[${selector}]`
//   if (obj.table !== undefined) {
//     attributes.forEach((attribute) => {
//       t += `contains(@${attribute},${transform(obj.table)}) or `
//     })
//     t += `contains(normalize-space(.),${transform(obj.table)}) `
//     selector = `//table[${t}]/tbody/tr[(.${selector})]` // additional for row
//   } else {
//     selector = `//tbody/tr[(.${selector})]` // additional for row
//   }
//   return By.xpath(selector)
// }

// function getSelectorForColumn(obj) {
//   let selector = ''
//   let t = ''
//   if (obj.exact) {
//     attributes.forEach((attribute) => {
//       selector += `@${attribute}=${transform(obj.id)} or `
//     })
//     selector += `normalize-space(.)=${transform(obj.id)} `
//   } else {
//     attributes.forEach((attribute) => {
//       selector += `contains(@${attribute},${transform(obj.id)}) or `
//     })
//     selector += `contains(normalize-space(.),${transform(obj.id)}) `
//   }

//   selector = `[${selector}]` // additional for column
//   if (obj.table !== undefined) {
//     attributes.forEach((attribute) => {
//       t += `contains(@${attribute},${transform(obj.table)}) or `
//     })
//     t += `contains(normalize-space(.),${transform(obj.table)}) `
//     selector = `//table[${t}]/tbody/tr/*[count(//table[${t}]/thead//th${selector}/preceding-sibling::th)+1]`
//     // additional for column
//   } else {
//     selector = `//tbody/tr/*[count(//thead//th${selector}/preceding-sibling::th)+1]`
//     // additional for column
//   }
//   return By.xpath(selector)
// }
