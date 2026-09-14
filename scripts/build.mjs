import { copyFileSync, cpSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { transform } from 'esbuild';
import { minify } from 'html-minifier-terser';
import { minify as minifyScript } from 'terser';

const source = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const css = source.match(/<style>([\s\S]*?)<\/style>/);
const script = source.match(/<script>([\s\S]*?)<\/script>/);
if (!css || !script) throw new Error('Expected one inline style and script in index.html');

const minifiedCss = await transform(css[1], { loader: 'css', minify: true, target: 'chrome100' });
const minifiedScript = await minifyScript(script[1], { compress: { passes: 3, toplevel: true }, mangle: { toplevel: true, reserved: ['state', 'settings', 'activeView', 'selectedWeek', 'isMobile', 'render', 'parseXlsx', 'parseDocx', 'parseHtml'] }, format: { comments: false } });
const withMinifiedAssets = source
  .replace(css[0], `<style>${minifiedCss.code}</style>`)
  .replace(script[0], `<script>${minifiedScript.code}</script>`)
  .replace(/(<([a-z][\w-]*)\b[^>]*\bdata-i18n="[^"]+"[^>]*>)[^<]*(<\/\2>)/g, '$1$3');
const output = await minify(withMinifiedAssets, {
  collapseWhitespace: true,
  removeComments: true,
  removeAttributeQuotes: true,
  minifyCSS: false,
  minifyJS: false,
});
const bytes = Buffer.byteLength(output, 'utf8');
if (bytes >= 100_000) throw new Error(`Built index.html is ${bytes} bytes; plugin limit is 100,000`);

const destination = new URL('../dist/', import.meta.url);
mkdirSync(destination, { recursive: true });
writeFileSync(new URL('index.html', destination), output);
for (const name of ['manifest.json', 'plugin.js', 'icon.svg', 'course-import-template.csv']) {
  copyFileSync(new URL(`../${name}`, import.meta.url), new URL(name, destination));
}
cpSync(new URL('../i18n/', import.meta.url), new URL('i18n/', destination), { recursive: true });
console.log(`Built dist/index.html: ${bytes} bytes (limit: 100,000)`);
