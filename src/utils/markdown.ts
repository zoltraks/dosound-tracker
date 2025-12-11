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
  const withBold = withLinks.replace(/\*\*(.+?)\*\*/g, '<b>$1<\/b>');
  return withBold.replace(/\*(.+?)\*/g, '<em>$1<\/em>');
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
    const [fullMatch, _ticks, codeContent] = match;

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

  for (const rawLine of lines) {
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

    if (!trimmed) {
      closeList();
      continue;
    }

    if (/^-{3,}$/.test(trimmed)) {
      closeList();
      html.push('<hr />');
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
