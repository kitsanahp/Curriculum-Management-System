import DOMPurify from 'dompurify';

// Sanitize HTML from untrusted sources (DOCX/PDF conversions, diff output)
// before rendering with v-html. Keeps safe formatting tags; strips scripts,
// javascript: URLs, and inline event handlers.
export function sanitizeHtml(dirty) {
  if (!dirty) return '';
  return DOMPurify.sanitize(dirty, {
    // Keep all standard document-formatting tags mammoth can produce
    ALLOWED_TAGS: [
      'p', 'br', 'b', 'strong', 'i', 'em', 'u', 's', 'del', 'ins',
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'ul', 'ol', 'li',
      'table', 'thead', 'tbody', 'tfoot', 'tr', 'th', 'td',
      'a', 'img', 'span', 'div',
      'blockquote', 'pre', 'code',
      'sup', 'sub',
    ],
    ALLOWED_ATTR: [
      'href', 'src', 'alt', 'title',
      'rowspan', 'colspan',
      'class', 'style', 'id',
      // htmldiff-js diff markers
      'data-annotation-id', 'data-index',
    ],
    // Block javascript: data: and vbscript: URLs in href/src
    ALLOW_DATA_ATTR: false,
    FORCE_BODY: true,
  });
}
