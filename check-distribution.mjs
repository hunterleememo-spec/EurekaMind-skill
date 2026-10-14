#!/usr/bin/env node
import { readFile, readdir, lstat, access } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const root = fileURLToPath(new URL('../', import.meta.url));
const required = ['README.md', 'LICENSE', 'CHANGELOG.md', 'CONTRIBUTING.md', '.gitignore', '.github/workflows/ci.yml',
  'skills/eurekamind/SKILL.md', 'skills/eurekamind/scripts/client.mjs', 'skills/eurekamind/references/api.md',
  ...['search', 'recordings', 'transcripts', 'notes', 'ideas', 'assets'].map(name => `skills/eurekamind/references/${name}.md`),
  'scripts/check-distribution.mjs', 'tests/skill-contract.test.mjs'];
async function files(dir) {
  const result = [];
  for (const name of await readdir(dir)) {
    if (['.git', 'node_modules'].includes(name)) continue;
    const file = path.join(dir, name), stat = await lstat(file);
    if (stat.isSymbolicLink()) throw new Error('Symlink in distribution: ' + path.relative(root, file));
    result.push(...(stat.isDirectory() ? await files(file) : [file]));
  }
  return result;
}
try {
  for (const name of required) await access(path.join(root, name));
  const names = await files(root);
  for (const file of names) {
    const relative = path.relative(root, file).split(path.sep).join('/');
    if (!required.includes(relative)) throw new Error('Unexpected distribution file: ' + relative);
    const text = await readFile(file, 'utf8');
    if (/\bem_ro_[A-Za-z0-9_-]{43}\b/.test(text) || /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/.test(text)) throw new Error('Potential credential in: ' + relative);
    if (/\/Users\/[^/\s]+\//.test(text)) throw new Error('Workstation path in: ' + relative);
    if (file.endsWith('.md')) {
      for (const [, link] of text.matchAll(/\[[^\]]*\]\(([^\s)]+)\)/g)) {
        if (/^[a-z][a-z0-9+.-]*:|^#/i.test(link)) continue;
        const target = path.resolve(path.dirname(file), decodeURIComponent(link.split('#')[0]));
        if (!target.startsWith(root)) throw new Error('Link escapes distribution: ' + relative);
        await access(target);
      }
    }
    if (file.endsWith('.mjs')) {
      const checked = spawnSync(process.execPath, ['--check', file], { encoding: 'utf8' });
      if (checked.status !== 0) throw new Error('Invalid JavaScript: ' + relative);
    }
  }
  const skill = await readFile(path.join(root, 'skills/eurekamind/SKILL.md'), 'utf8');
  const client = await readFile(path.join(root, 'skills/eurekamind/scripts/client.mjs'), 'utf8');
  const version = skill.match(/^  version: "([0-9]+\.[0-9]+\.[0-9]+)"$/m)?.[1];
  if (!version || !client.includes(`const VERSION = '${version}';`)) throw new Error('Skill/client version mismatch.');
  for (const name of ['README.md', 'CHANGELOG.md', 'skills/eurekamind/references/api.md']) {
    if (!(await readFile(path.join(root, name), 'utf8')).includes(version)) throw new Error('Missing current version: ' + name);
  }
  console.log(`PASS: ${names.length} allowlisted files, local links, credential scan, JavaScript syntax, version ${version}.`);
} catch (error) { console.error(error.message); process.exitCode = 1; }
