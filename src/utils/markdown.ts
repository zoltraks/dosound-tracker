export const escapeHtml = (str: string): string => {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
};

const applyInlineFormatting = (text: string): string => {
  const escaped = escapeHtml(text);

  const withLinks = escaped.replace(/\bhttps?:\/\/[^\s<]+/g, (url) => {
    return `<a href="${url}" target="_blank" rel="noreferrer">${url}</a>`;
  });

  // Bold **text**
  const withBold = withLinks.replace(/\*\*(.+?)\*\*/g, '<strong class="markdown-strong">$1</strong>');
  return withBold.replace(/\*(.+?)\*/g, '<em>$1</em>');
};

const renderInlineMarkdown = (text: string): string => {
  // Handle inline code spans first so that we don't apply link/bold/italic
  // formatting inside code. Supports single or multiple backticks, requiring
  // the same number of backticks on both sides.
  const codePattern = /(`+)([^`]+?)\1/g;
  let result = '';
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  // Walk through all code spans in the original text.
  while ((match = codePattern.exec(text)) !== null) {
    const [fullMatch, , codeContent] = match;

    // Text before this code span: apply normal inline formatting.
    if (match.index > lastIndex) {
      const nonCode = text.slice(lastIndex, match.index);
      result += applyInlineFormatting(nonCode);
    }

    // Code span itself: only escape HTML and wrap in <code> with a
    // dedicated class so CSS can style it differently in light/dark themes.
    const escapedCode = escapeHtml(codeContent);
    result += `<code class="inline-code">${escapedCode}</code>`;

    lastIndex = match.index + fullMatch.length;
  }

  // Remaining text after the last code span.
  if (lastIndex < text.length) {
    const remaining = text.slice(lastIndex);
    result += applyInlineFormatting(remaining);
  }

  return result;
};

const parseTableRow = (line: string): string[] => {
  const trimmed = line.trim();
  const withoutOuterPipes = trimmed.replace(/^\|/, '').replace(/\|$/, '');
  return withoutOuterPipes.split('|').map(cell => cell.trim());
};

const parseTableAlignment = (cell: string): 'left' | 'right' | 'center' | null => {
  const trimmed = cell.trim();
  const starts = trimmed.startsWith(':');
  const ends = trimmed.endsWith(':');
  if (starts && ends) return 'center';
  if (ends) return 'right';
  if (starts) return 'left';
  return null;
};

const isTableSeparatorLine = (line: string): boolean => {
  if (!line.includes('-')) return false;
  const cells = parseTableRow(line);
  if (cells.length === 0) return false;
  return cells.every(cell => /^:?-{3,}:?$/.test(cell.trim()));
};

export const renderMarkdown = (md: string): string => {
  const lines = md.split('\n');
  const html: string[] = [];
  let inList = false;
  let inCodeBlock = false;
  let codeBlockLang = '';
  let codeLines: string[] = [];

  const closeList = () => {
    if (inList) {
      html.push('</ul>');
      inList = false;
    }
  };

  for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
    const rawLine = lines[lineIndex] ?? '';
    const line = rawLine.trimEnd();
    const trimmed = line.trim();
    if (trimmed.startsWith('```')) {
      if (!inCodeBlock) {
        closeList();
        inCodeBlock = true;
        codeBlockLang = trimmed.slice(3).trim();
        codeLines = [];
      } else {
        const langClass = codeBlockLang
          ? ` class="language-${escapeHtml(codeBlockLang)}"`
          : '';
        const codeHtml = codeLines
          .map((codeLine) => escapeHtml(codeLine))
          .join('\n');
        html.push(`<pre><code${langClass}>${codeHtml}</code></pre>`);
        inCodeBlock = false;
        codeBlockLang = '';
        codeLines = [];
      }
      continue;
    }

    if (inCodeBlock) {
      codeLines.push(line);
      continue;
    }

    const nextLine = (lineIndex + 1 < lines.length) ? (lines[lineIndex + 1] ?? '').trimEnd() : '';
    const nextTrimmed = nextLine.trim();
    if (trimmed && trimmed.includes('|') && isTableSeparatorLine(nextTrimmed)) {
      closeList();

      const headerCells = parseTableRow(trimmed);
      const separatorCells = parseTableRow(nextTrimmed);
      const alignments = separatorCells.map(parseTableAlignment);

      html.push('<table>');
      html.push('<thead>');
      html.push('<tr>');

      for (let cellIndex = 0; cellIndex < headerCells.length; cellIndex++) {
        const content = renderInlineMarkdown(headerCells[cellIndex] ?? '');
        const align = alignments[cellIndex] ? ` style="text-align: ${alignments[cellIndex]}"` : '';
        html.push(`<th${align}>${content}</th>`);
      }

      html.push('</tr>');
      html.push('</thead>');
      html.push('<tbody>');

      lineIndex += 2;
      while (lineIndex < lines.length) {
        const bodyRaw = (lines[lineIndex] ?? '').trimEnd();
        const bodyTrimmed = bodyRaw.trim();
        if (!bodyTrimmed) {
          break;
        }
        if (!bodyTrimmed.includes('|')) {
          break;
        }

        const rowCells = parseTableRow(bodyTrimmed);
        html.push('<tr>');
        for (let cellIndex = 0; cellIndex < headerCells.length; cellIndex++) {
          const content = renderInlineMarkdown(rowCells[cellIndex] ?? '');
          const align = alignments[cellIndex] ? ` style="text-align: ${alignments[cellIndex]}"` : '';
          html.push(`<td${align}>${content}</td>`);
        }
        html.push('</tr>');
        lineIndex++;
      }

      html.push('</tbody>');
      html.push('</table>');
      lineIndex -= 1;
      continue;
    }

    if (!trimmed) {
      closeList();
      continue;
    }

    if (/^-{3,}$/.test(trimmed)) {
      closeList();
      html.push('<hr />');
      continue;
    }

    if (line.startsWith('### ')) {
      closeList();
      const text = line.slice(4).trim();
      const cleaned = text.replace(/\s*#+\s*$/, '').trim();
      html.push(`<h3>${escapeHtml(cleaned)}</h3>`);
      continue;
    }

    if (line.startsWith('## ')) {
      closeList();
      const text = line.slice(3).trim();
      html.push(`<h2>${escapeHtml(text)}</h2>`);
      continue;
    }

    if (line.startsWith('# ')) {
      closeList();
      const text = line.slice(2).trim();
      html.push(`<h1>${escapeHtml(text)}</h1>`);
      continue;
    }

    if (line.startsWith('- ')) {
      if (!inList) {
        html.push('<ul>');
        inList = true;
      }
      const text = line.slice(2).trim();
      html.push(`<li>${renderInlineMarkdown(text)}</li>`);
      continue;
    }

    closeList();
    html.push(`<p>${renderInlineMarkdown(line)}</p>`);
  }

  if (inCodeBlock) {
    const langClass = codeBlockLang
      ? ` class="language-${escapeHtml(codeBlockLang)}"`
      : '';
    const codeHtml = codeLines
      .map((codeLine) => escapeHtml(codeLine))
      .join('\n');
    html.push(`<pre><code${langClass}>${codeHtml}</code></pre>`);
  }

  closeList();
  return html.join('\n');
};
