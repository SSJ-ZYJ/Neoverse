import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';

const appRoot = path.resolve('app');
const sourceExtensions = new Set(['.vue', '.css', '.ts']);

type Rule = {
  id: string;
  pattern: RegExp;
  message: string;
};

const rules: Rule[] = [
  {
    id: 'compat-glass-wrapper',
    pattern: /\bUiGlassSurface\b/g,
    message: 'Use UiCard / UiSurface with the shared surface prop instead of UiGlassSurface.',
  },
  {
    id: 'material-class-leak',
    pattern: /\bmaterial-glass-[\w-]+\b/g,
    message: 'Product code must not depend on internal material-glass-* implementation classes.',
  },
  {
    id: 'material-token-leak',
    pattern: /--neoverse-material-[\w-]+/g,
    message: 'Product code must not read or override internal --neoverse-material-* variables.',
  },
  {
    id: 'glass-runtime-attribute-leak',
    pattern: /data-neoverse-glass-[\w-]+/g,
    message: 'Use semantic Surface props instead of Glass renderer/runtime data attributes.',
  },
  {
    id: 'glass-card-bypasses-card',
    pattern: /<UiSurface\b[^>]*\bsurface\s*=\s*["']glass-card["'][^>]*>/g,
    message: 'Standard glass cards must use <UiCard surface="glass-card"> so card geometry stays DS-owned.',
  },
  {
    id: 'bottom-dock-component-internal-override',
    pattern:
      /\.bottom-dock(?:__[\w-]+)?[^,{]*\.ui-(?:button|navigation-item(?:__[\w-]+)?|segmented-control(?:__[\w-]+)?)/g,
    message:
      'BottomDock may style its own composition hooks, but must consume UiButton, UiNavigationItem, and UiSegmentedControl geometry from Neoverse-UI.',
  },
];

async function collectSourceFiles(directory: string): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries) {
    const target = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await collectSourceFiles(target)));
      continue;
    }

    if (entry.isFile() && sourceExtensions.has(path.extname(entry.name))) {
      files.push(target);
    }
  }

  return files;
}

function lineNumberAt(source: string, index: number): number {
  return source.slice(0, index).split('\n').length;
}

const violations: string[] = [];
const files = await collectSourceFiles(appRoot);

for (const file of files) {
  const source = await readFile(file, 'utf8');
  const relativePath = path.relative(process.cwd(), file).replaceAll('\\', '/');

  for (const rule of rules) {
    rule.pattern.lastIndex = 0;
    for (const match of source.matchAll(rule.pattern)) {
      const index = match.index ?? 0;
      violations.push(
        `${relativePath}:${lineNumberAt(source, index)} [${rule.id}] ${rule.message} Found: ${JSON.stringify(match[0])}`,
      );
    }
  }
}

if (violations.length > 0) {
  console.error('Neoverse UI boundary check failed:\n');
  console.error(violations.map((violation) => `- ${violation}`).join('\n'));
  process.exit(1);
}

console.log(`Neoverse UI boundary check passed for ${files.length} source files.`);
