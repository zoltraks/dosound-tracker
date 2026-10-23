const DEV_ORIGIN = 'http://localhost:8008';

function isAppOrigin(url) {
  return typeof url === 'string' && (url.startsWith('file://') || url.startsWith(DEV_ORIGIN));
}

function isMidiAllowed(permission, url) {
  return permission === 'midi' && isAppOrigin(url);
}

module.exports = { isAppOrigin, isMidiAllowed };
