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
      row: `//*[(${str})]/ancestor-or-self::tr/td`,
      column: `//td[count(//*[(${str})]/ancestor-or-self::th/preceding-sibling::th) + 1]`,
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
      row: `//*[self::tr]`,
      column: `//*[self::th]`,
      element: `//*`,
    }
  }
}
test
module.exports = Selectors
