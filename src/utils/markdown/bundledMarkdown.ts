// Bundled-document fetch allowlist for the markdown rendering sinks.
// Only first-party files bundled with the application may reach a
// dangerouslySetInnerHTML surface; every fetch flows through this module.

const BUNDLED_MARKDOWN_FILES: ReadonlySet<string> = new Set([
  'MESSAGES.md',
  'CHANGELOG.md',
  'MANUAL.md',
]);

const looksLikeHtml = (text: string): boolean => {
  const trimmed = text.trimStart().slice(0, 512).toLowerCase();
  return (
    trimmed.startsWith('<!doctype') ||
    trimmed.startsWith('<html') ||
    trimmed.includes('<script type="module"')
  );
};

export const fetchBundledMarkdown = async (name: string): Promise<string> => {
  if (!BUNDLED_MARKDOWN_FILES.has(name)) {
    throw new Error(`Bundled document not allowed: ${name}`);
  }

  const response = await fetch(name);
  if (!response.ok) {
    throw new Error(`Failed to load ${name}.`);
  }

  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('text/html')) {
    throw new Error(`${name} appears to be HTML, treating as missing.`);
  }

  const text = await response.text();
  if (looksLikeHtml(text)) {
    throw new Error(`${name} appears to be HTML, treating as missing.`);
  }

  return text;
};
