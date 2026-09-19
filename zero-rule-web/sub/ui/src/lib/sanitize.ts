import sanitizeHtml from 'sanitize-html';

const allowedTags = sanitizeHtml.defaults.allowedTags.concat(['img', 'figure', 'pre', 'code']);

const allowedAttributes = {
  '*': ['class', 'style', 'data-*', 'width', 'height'],
  a: ['href', 'name', 'target'],
  img: ['src'],
};

const allowedSchemes = ['data', 'http', 'https', 'ftp', 'mailto', 'tel'];

export function sanitizeStrict(input: string | undefined | null) {
  if (!input) return '';
  return sanitizeHtml(input, { allowedTags, allowedAttributes, allowedSchemes });
}

export function sanitize(input: string | undefined | null) {
  if (!input) return '';
  return sanitizeStrict(input);
}

export function sanitizeAllowEvery(input: string | undefined | null) {
  if (!input) return '';
  return sanitizeHtml(input, {
    allowedTags: false,
    allowedAttributes: false,
    allowedSchemes,
  });
}
