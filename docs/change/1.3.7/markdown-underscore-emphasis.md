# Render Underscore Emphasis in the Markdown Viewer

**Type:** Bug fix

## Summary

| Field         | Value                                                                     |
| ------------- | ------------------------------------------------------------------------- |
| Intent        | Render `_italic_` and `__bold__` in the MANUAL/CHANGELOG markdown viewers |
| Key decisions | Word-boundary guards keep `snake_case` identifiers literal; `em` gains a  |
|               | themed `markdown-em` color like `markdown-strong`                         |
| Open risks    | None                                                                      |

## Description

`MANUAL.md` writes "_Real music is made in HEX._" with underscore emphasis,
but `applyInline` in `src/utils/markdown/markdown.ts` only parsed `**bold**`
and `*italic*`, so the line rendered as literal underscores. Emphasis also
carried no class, so it could not be styled separately from body text.

## Implementation

- `src/utils/markdown/markdown.ts` - added `__bold__` and `_italic_`
  replacements with `(?<![_\w])`/`(?![_\w])` guards, and the
  `markdown-em` class on both italic paths.
- `src/App.css` - added `--markdown-em-color` to both themes and an
  `em.markdown-em` rule next to the `markdown-strong` rule.
- `test/utils/markdown/markdown.test.ts` - added two tests covering the
  underscore grammar and the identifier boundary case.

## Outcome

- Verification loop clean: typecheck, lint (0 warnings), format, build,
  and 546 tests all pass.
