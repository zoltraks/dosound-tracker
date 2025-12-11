export const escapeHtml = (str: string): string => {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
};

const renderInlineMarkdown = (text: string): string => {
  const escaped = escapeHtml(text);

  const withLinks = escaped.replace(/\bhttps?:\/\/[^\s<]+/g, (url) => {
    return `<a href="${url}" target="_blank" rel="noreferrer">${url}</a>`;
  });

  // Bold **text**
  const withBold = withLinks.replace(/\*\*(.+?)\*\*/g, '<b>$1</b>');
  return withBold.replace(/\*(.+?)\*/g, '<em>$1</em>');
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
