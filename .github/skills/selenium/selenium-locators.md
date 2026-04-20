# Skill: @nodebug/selenium Smart Locators

Utilize the high-level "human-like" API for element selection.

## Selector Hierarchy

The library searches for elements in this priority order:

1. Visible Text > 2. Placeholder > 3. Value > 4. Test IDs (data-testid) > 5. Name > 6. ARIA Label.

## Element Types

Use specific methods for semantic elements:

- Buttons: `browser.button('label')`
- Inputs: `browser.textbox('label')`, `browser.checkbox('label')`, `browser.radio('label')`
- Navigation: `browser.link('text')`, `browser.dropdown('label')`
- General: `browser.element('identifier')`
- File inputs: `browser.file('label')`
- Images: `browser.image('label')`
- Tabs: `browser.tab('label')`
- Toolbars: `browser.toolbar('label')`
- Dialogs: `browser.dialog('label')`
- Headings: `browser.heading('label')`
- Sliders: `browser.slider('label')`
- Comboboxes: `browser.combobox('label')`
- Lists: `browser.list('label')`
- List items: `browser.listitem('label')`
- Menus: `browser.menu('label')`

## Advanced Logic

- **Exact Matching**: Use `browser.exact().element('text')` for case-sensitive, full-string matches.
- **Multiple References (OR)**: Chain alternatives with `.or()`.
  _Example:_ `await browser.button('Save').or().button('Submit').click()`
- **Chaining Attributes**: Access properties via `.get`:
  _Example:_ `await browser.element('id').get.text()` or `await browser.element('id').get.attribute('class')`
- **Element State**: Check element state with methods like `.isChecked()`, `.isUnchecked()`, `.isVisible()`, `.isDisabled()`

## Locator Priority

When identifying an element, the library automatically searches in this order:

1. **Text**: Visible text.
2. **Placeholder**: Input placeholders.
3. **Value**: Attribute value.
4. **Test IDs**: `data-tid`, `data-testid`, `data-test-id`.
5. **Aria**: `aria-label`.
6. **Metadata**: Title, Alt, Src.

## Semantic Element Methods

Always prefer specialized methods over `browser.element()`:

- **Buttons**: `browser.button('Submit')`.
- **Text Fields**: `browser.textbox('Email')`.
- **Check/Radio**: `browser.checkbox('Agree')` or `browser.radio('Male')`.
- **Links**: `browser.link('Home')`.
- **Pickers**: `browser.dropdown('Country')` or `browser.file('Upload')`.
- **Images**: `browser.image('Logo')`.
- **Tabs**: `browser.tab('Tab Title')`.
- **Toolbars**: `browser.toolbar('Main Toolbar')`.
- **Dialogs**: `browser.dialog('Confirmation')`.
- **Headings**: `browser.heading('Page Title')`.
- **Sliders**: `browser.slider('Volume')`.
- **Comboboxes**: `browser.combobox('Country')`.
- **Lists**: `browser.list('Shopping List')`.
- **List Items**: `browser.listitem('Item 1')`.
- **Menus**: `browser.menu('File')`.

## Modifier Logic

- **Exact Match**: Use `.exact()` before the element type to prevent partial matches (e.g., matching "Male" but not "Fe**male**").
- **Multiple Options**: Use `.or()` to handle A/B variations in UI.
  - _Example_: `await browser.button('Save').or().button('Apply').click()`.
- **Chaining Attributes**: Access properties via `.get`:
  _Example:_ `await browser.element('id').get.text()` or `await browser.element('id').get.attribute('class')`
- **State Checking**: Check element state with methods like `.isChecked()`, `.isUnchecked()`, `.isVisible()`, `.isDisabled()`
