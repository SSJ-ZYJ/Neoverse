import { readFile } from 'node:fs/promises';
import { loadNuxt } from 'nuxt/kit';
import postcss, { type AcceptedPlugin } from 'postcss';

// Exercise the production PostCSS pipeline against the actual published UI bundle.
// In particular, Disclosure combines a declaration query with selector() in @supports.
const nuxt = await loadNuxt({ dev: false, ready: false });

try {
  const options = nuxt.options.postcss;
  const names = Object.keys(options.plugins);
  const orderedNames = typeof options.order === 'function' ? options.order(names) : options.order;
  const plugins: AcceptedPlugin[] = [];

  for (const name of orderedNames) {
    const settings = options.plugins[name];
    if (!settings) continue;
    const plugin = await import(name);
    plugins.push((plugin.default ?? plugin)(settings));
  }

  const source = await readFile(new URL(import.meta.resolve('@neoverse-ui/tailwind/index.css')), 'utf8');
  const result = await postcss(plugins).process(source, { from: 'neoverse-ui.css' });
  let hasDisclosureQuery = false;
  result.root.walkAtRules('supports', (rule) => {
    if (rule.params.includes('interpolate-size') && rule.params.includes('selector(::details-content)')) {
      hasDisclosureQuery = true;
    }
  });
  if (!hasDisclosureQuery) throw new Error('Production CSS lost the Disclosure feature query.');

  console.log('Published Neoverse UI CSS passes the production PostCSS pipeline.');
} finally {
  await nuxt.close();
}
