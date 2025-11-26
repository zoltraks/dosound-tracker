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
  // Bold **text**
  return escaped.replace(/\*\*(.+?)\*\*/g, '<b>$1</b>');
};

export const renderMarkdown = (md: string): string => {
  const lines = md.split('\n');
  const html: string[] = [];
  let inList = false;

  const closeList = () => {
    if (inList) {
      html.push('</ul>');
      inList = false;
    }
  };

  for (const rawLine of lines) {
    const line = rawLine.trimEnd();

    if (!line.trim()) {
      closeList();
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

  closeList();
  return html.join('\n');
};
