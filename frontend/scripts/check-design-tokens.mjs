import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = dirname(fileURLToPath(import.meta.url));
const cssPath = join(rootDir, '..', 'styles.css');
const css = readFileSync(cssPath, 'utf8');
const rootMatch = css.match(/:root\s*\{[\s\S]*?\n\}/);
const rawColorPattern = /#[0-9A-Fa-f]{3,8}|rgba?\([^)]*\)|rgb\([^)]*\)/g;

if (!rootMatch || rootMatch.index === undefined) {
  fail('styles.css is missing the :root design-token block.');
}

const beforeRoot = css.slice(0, rootMatch.index);
const afterRoot = css.slice(rootMatch.index + rootMatch[0].length);
const rawColorsOutsideRoot = [...`${beforeRoot}\n${afterRoot}`.matchAll(rawColorPattern)];

if (rawColorsOutsideRoot.length > 0) {
  const unique = [...new Set(rawColorsOutsideRoot.map((match) => match[0]))].slice(0, 20);
  fail(`Raw color literals must live in :root tokens only. Found: ${unique.join(', ')}`);
}

const requiredTokens = [
  '--background',
  '--surface',
  '--warm-surface',
  '--text',
  '--muted',
  '--border',
  '--primary',
  '--accent',
  '--success',
  '--info',
  '--danger',
  '--control-radius',
  '--panel-radius',
  '--shadow-soft',
  '--shadow-float',
];

const missingTokens = requiredTokens.filter((token) => !rootMatch[0].includes(`${token}:`));
if (missingTokens.length > 0) {
  fail(`Missing required design tokens: ${missingTokens.join(', ')}`);
}

console.log('Design token check passed.');

function fail(message) {
  console.error(message);
  process.exit(1);
}
