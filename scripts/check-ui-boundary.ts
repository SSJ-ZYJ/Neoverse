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
    id: 'duplicate-skeleton-material',
    pattern: /--neoverse-skeleton-[\w-]+|@keyframes\s+[\w-]*skeleton[\w-]*/g,
    message:
      'Use UiSkeleton for skeleton material and effects; product code only owns placeholder geometry and layout.',
  },
  {
    id: 'removed-glass-wrapper',
    pattern: /\bUiGlassSurface\b/g,
    message: 'UiGlassSurface was removed in Neoverse UI 0.2. Use UiCard or UiSurface.',
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
    id: 'removed-glass-card-surface',
    pattern: /\bsurface\s*=\s*["']glass-card["']/g,
    message: 'The glass-card preset was removed in Neoverse UI 0.2. Use glass-elevated for cards.',
  },
  {
    id: 'removed-typography-token',
    pattern:
      /--neoverse-typography-(?:display|heading|subtitle|body|label)-(?:size|line-height|weight|letter-spacing)\b/g,
    message:
      'Use the canonical Neoverse UI 0.2 typography scales (display-lg, display-md, title-lg, body-md, label-md).',
  },
  {
    id: 'removed-motion-api',
    pattern: /\b(?:motionTransitions|MotionTransition)\b|--neoverse-motion-micro-[\w-]+/g,
    message: 'Use Neoverse UI 0.2 motionRoles / MotionRole and feedback, state, or spatial tokens.',
  },
  {
    id: 'bottom-dock-component-internal-override',
    pattern:
      /\.bottom-dock(?:__[\w-]+)?[^,{]*\.ui-(?:dock|control-surface(?:__[\w-]+)?|button|navigation-item(?:__[\w-]+)?|segmented-control(?:__[\w-]+)?)/g,
    message:
      'BottomDock may constrain viewport placement, but must consume UiDock and its shared control geometry from Neoverse-UI.',
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
