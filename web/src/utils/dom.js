/**
 * Escape HTML special characters to prevent XSS
 */
export function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Tagged template literal for auto-escaping
 */
export function html(strings, ...values) {
  return strings.reduce((result, string, i) => {
    const val = values[i - 1];
    let escaped = '';
    if (Array.isArray(val)) {
      escaped = val.join('');
    } else if (val !== null && val !== undefined) {
      escaped = escapeHtml(val);
    }
    return result + escaped + string;
  });
}
