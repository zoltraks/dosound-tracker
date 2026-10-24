# Documentation Style

This document is the central source of truth for documentation style in this
project. It applies to every file under `docs/` and to the project Markdown
documents at the repository root and under `public/`.

## Documentation Style

- Write short sentences.
- Use explicit line breaks.
- One idea per paragraph. Do not group unrelated thoughts in the same paragraph.
- **Blank lines**: never put more than one blank line between sections or blocks. Avoid two or more consecutive blank lines.
- **Language**: all project documentation must be written in English. This applies to every file under `docs/`.
- **Lists**: prefer bullet points (`-`) over numbering. Avoid numbering unless the order is strictly required for technical correctness. Put exactly one blank line before and after lists of items.
- **Procedures**: do not use numbered lists for complex procedures with code blocks. Instead end the introductory sentence with a dot, use a bold heading for each step on its own line, put exactly one empty line before the step description or code, and put exactly one empty line after the step content.
- Use standard ASCII characters.
- Keep section names short. Do not put qualifiers in section names using parentheses. Put qualifiers like "mandatory" or "do not repeat" as sentences in the section body instead.
- **Heading hierarchy**: use H2 (`##`) for major sections and H3 (`###`) for subsections. For emphasis on non-heading text, use bold on its own line.
- **Flattened structure**: use H2 for all major sections under the main H1. Avoid deeply nested hierarchies beyond H3. Stick to the existing heading levels of the document being modified.
- **Horizontal dividers**: do not use `---` anywhere in documents. Separate sections using headings only.
- **Headings**: avoid using colons in headings.

## Internal Document References

When referencing other documents within the same `docs/` directory, do not include the `docs/` prefix. Use only the filename.

Examples:

- GOOD: "See `SPECIFICATION.md` for details".
- GOOD: "Defined in `ARCHITECTURE.md`".
- BAD: "See `docs/SPECIFICATION.md` for details".
- BAD: "Defined in `docs/ARCHITECTURE.md`".

## Markdown Tables

- Keep them readable as plain text.
- **Proactive formatting**: when editing any document in markdown format, check and fix markdown table alignment and documentation style compliance, even for tables not directly edited.
- **Cell descriptions**: use short, telegraphic noun phrases. Never start with "A", "An", or "The". Avoid full sentences in table cells.
- **Column widths**: calculate the column width as the maximum character width of all cells in that column, including the header cell. Include all Markdown formatting characters in the width measurement.
- **Cell padding**: pad every cell with trailing spaces so it matches the column width. Empty cells must also be padded. Do not pad beyond the column width. Never truncate cell contents. Content must be aligned left. Do not use `:---` or `---:`.
- **Delimiters**: use one space after the leading pipe and one space before the trailing pipe. Do not add extra spaces around the pipes beyond the single required space.
- **Separator row**: place the separator line immediately after the header row. Use a run of `W` contiguous hyphens between the usual one-space delimiters, where `W` is the calculated column width - the separator row then spans the same inner width as the cells.
- **Pipes**: all vertical pipes (`|`) must be vertically aligned. A row starts with a single `|` followed by a space - a `||` opener introduces an empty leading column and is malformed.
- **Visual indicators**: use `✓` for affirmative or available features and `✗` for negative or unavailable features.
- **Trailing whitespace**: no line may end with spaces or tabs - trailing whitespace is always a defect, inside and outside tables.

## Formatting Rules

- Put code, commands, file names, and paths in backticks.
- **Code blocks**: always use three backticks. No indentation; the block starts at the very beginning of the line. Mandatory spacing: exactly one blank line before and after the block.

## API Design Documentation

- **Component structure**: group components by feature or domain.
- **Table format**: use tables to list props and methods.
- **Parameter tables**: use columns `Name`, `Type`, `Required`, and `Description`.
- **Error consistency**: document standard error handling patterns.

## Generated Documents

Documents produced from templates (`docs/template/`) and generated records (reviews, assessments, plans, lessons) obey the same rules as hand-written documents. A generated document is checked against this style before delivery - pattern-matching the template's look is not a substitute for the rules.
