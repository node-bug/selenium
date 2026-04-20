# Skill: @nodebug/selenium Spatial & Contextual References

## Relative Positioning

Use these to find elements based on their layout relative to an "anchor" element:

- **Vertical**: `.above()`, `.below()`.
- **Horizontal**: `.toLeftOf()`, `.toRightOf()`.
- **Diagonal**: `.onRightOf().above()`, `.onLeftOf().below()`.
- **Proximity**: `.near()` for elements that are just "close by".

## Precision & Context

- **The `exactly()` Keyword**: Use this to force strict alignment rather than approximate positioning.
  - _Correct_: `browser.textbox('Name').exactly().below().element('Section')`.
- **The `within()` Keyword**: Narrow the search scope to a specific container (like a table row or a div).
  - _Example_: `browser.button('Delete').within().element('Row1').click()`.

## Chaining Rules

- Order matters: The first reference is often interpreted more loosely than subsequent ones.
- You can mix spatial and contextual references in one chain.
- **Element State**: Chain with state checking methods like `.isVisible()`, `.isChecked()`, `.isDisabled()`.

## Advanced Spatial Operations

- **Multiple References**: Chain with `.or()` to handle variations in UI.
  - _Example_: `browser.button('Save').or().button('Apply').above().element('Form').click()`
- **Nested Context**: Use `.within()` with spatial references.
  - _Example_: `browser.button('Delete').within().element('Table').below().element('Header').click()`
