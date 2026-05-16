#!/usr/bin/env node
const { execSync } = require('node:child_process');
const { readFileSync } = require('node:fs');

const files = execSync("rg --files -g '*.js' -g '*.jsx' app components lib server", { encoding: 'utf8' })
  .split('\n')
  .map((s) => s.trim())
  .filter(Boolean);

const issues = [];
for (const file of files) {
  const src = readFileSync(file, 'utf8');
  if (src.includes('<<<<<<<') || src.includes('=======') || src.includes('>>>>>>>')) {
    issues.push(`${file}: contains unresolved merge conflict markers`);
  }
  if (src.includes('\r\n')) {
    issues.push(`${file}: uses CRLF line endings`);
  }
}

if (issues.length) {
  console.error('Lint failed:\n' + issues.map((i) => `- ${i}`).join('\n'));
  process.exit(1);
}

console.log(`Lint passed: checked ${files.length} JS/JSX files.`);
