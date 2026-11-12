const path = require('node:path');
const { fileURLToPath } = require('node:url');

const DEV_ORIGIN = 'http://localhost:8008';
const BUNDLED_INDEX_PATH = path.join(__dirname, '..', 'dist', 'index.html');

function isAppOrigin(url, isPackaged) {
  if (typeof url !== 'string') {
    return false;
  }
  let parsed;
  try {
    parsed = new URL(url);
  } catch {
    return false;
  }
  if (parsed.origin === DEV_ORIGIN) {
    return !isPackaged;
  }
  if (parsed.protocol !== 'file:') {
    return false;
  }
  try {
    return fileURLToPath(parsed) === BUNDLED_INDEX_PATH;
  } catch {
    return false;
  }
}

function isMidiAllowed(permission, url, isPackaged) {
  return permission === 'midi' && isAppOrigin(url, isPackaged);
}

function isExternalHttpUrl(url) {
  return typeof url === 'string' && /^https?:\/\//i.test(url);
}

module.exports = { isAppOrigin, isMidiAllowed, isExternalHttpUrl };
