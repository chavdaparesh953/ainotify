/**
 * Normalizes store URL strings by removing protocols (http/https),
 * trailing slashes, leading/trailing whitespace, and converting to lowercase.
 * Example: 'https://My-Shop.myshopify.com/' -> 'my-shop.myshopify.com'
 * @param {string} url
 * @returns {string}
 */
export function normalizeStoreUrl(url) {
  if (!url || typeof url !== 'string') return '';
  return url
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, '')
    .replace(/\/+$/, '');
}

export default {
  normalizeStoreUrl,
};
