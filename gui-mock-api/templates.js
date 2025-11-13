import Handlebars from 'handlebars';

const templateCache = new Map();

function compileTemplate(source) {
  const key = String(source ?? '');
  if (!key) {
    return () => '';
  }

  if (!templateCache.has(key)) {
    templateCache.set(key, Handlebars.compile(key));
  }

  return templateCache.get(key);
}

export function renderTemplate(source, data) {
  const template = compileTemplate(source);
  return template(data || {});
}

export default {
  compileTemplate,
  renderTemplate
};
