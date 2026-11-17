// Tests for black-box.mjs. Run: node --test hooks/black-box.test.mjs
// Each test sends the hook a PreToolUse call, as Claude Code does, and checks whether it lets it run (0) or blocks it (2).

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, writeFileSync, symlinkSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HOOK = join(dirname(fileURLToPath(import.meta.url)), 'black-box.mjs');

// A small project: the allowed folders, some code, the eval and a secret.
const ROOT = mkdtempSync(join(tmpdir(), 'black-box-test-'));
const files = {
  '.claude/skills/synthetic-user/SKILL.md': '# skill',
  'spec/personas/privacy-lead.md': '# sheet',
  'spec/sources/privacy-requests.md': '| ID | Rule | Mark |\n| PRIV-01 | One month | checked |\n',
  'spec/screens/request.md': '# spec',
  'spec/decisions.md': '# decisions',
  'reviews/2026-11-12-request-form-privacy-lead.md': '# report',
  'eval/cases.md': '# cases',
  '.claude/skills/synthetic-user/eval/cases.md': '# cases kept in the wrong place',
  'src/app.js': 'code',
  '.env': 'SECRET=1',
};
for (const [path, body] of Object.entries(files)) {
  mkdirSync(dirname(join(ROOT, path)), { recursive: true });
  writeFileSync(join(ROOT, path), body);
}
symlinkSync(join(ROOT, 'src'), join(ROOT, 'spec', 'sources', 'link-to-src'));

// Claude Code sends agent_type for a subagent's tool call; the tests default to the synthetic user.
function run(tool, args, profile, raw, agent = 'synthetic-user') {
  const input = raw ?? JSON.stringify({ hook_event_name: 'PreToolUse', tool_name: tool, tool_input: args, cwd: ROOT, ...(agent ? { agent_type: agent } : {}) });
  const result = spawnSync('node', [HOOK, ...(profile ? [profile] : [])], {
    input, encoding: 'utf8', env: { ...process.env, CLAUDE_PROJECT_DIR: ROOT },
  });
  return { code: result.status, err: result.stderr };
}
const allows = (...a) => assert.equal(run(...a).code, 0, JSON.stringify(a));
const blocks = (...a) => assert.equal(run(...a).code, 2, JSON.stringify(a));

test('reads only the allowed folders', () => {
  allows('Read', { file_path: join(ROOT, 'spec/sources/privacy-requests.md') });
  allows('Read', { file_path: 'spec/screens/request.md' });
  allows('Read', { file_path: 'spec/personas/privacy-lead.md' });
  blocks('Read', { file_path: 'src/app.js' });
  blocks('Read', { file_path: 'spec/sources/../../src/app.js' });
  blocks('Read', { file_path: '/etc/hosts' });
});

test('never reads the eval, secrets or code behind a link', () => {
  blocks('Read', { file_path: 'eval/cases.md' });
  blocks('Read', { file_path: '.claude/skills/synthetic-user/eval/cases.md' });
  blocks('Grep', { pattern: 'flag', path: '.claude/skills/synthetic-user/eval' });
  blocks('Read', { file_path: '.env' });
  blocks('Read', { file_path: 'spec/sources/link-to-src/app.js' });
});

test('each profile reads its own folders', () => {
  blocks('Read', { file_path: 'reviews/2026-11-12-request-form-privacy-lead.md' }, 'synthetic-user');
  allows('Read', { file_path: 'reviews/2026-11-12-request-form-privacy-lead.md' }, 'verifier');
  blocks('Read', { file_path: 'eval/cases.md' }, 'verifier');
  blocks('Read', { file_path: 'spec/screens/request.md' }, 'rules-watch');
  blocks('Read', { file_path: 'spec/screens/request.md' }, 'unknown');
});

test('searches need an allowed path', () => {
  blocks('Grep', { pattern: 'deadline' });
  allows('Grep', { pattern: 'deadline', path: 'spec/sources' });
  blocks('Grep', { pattern: 'deadline', path: 'src' });
  allows('Glob', { pattern: '**/*.md', path: 'spec' });
  blocks('Glob', { pattern: '**/*.js' });
  blocks('Glob', { pattern: join(ROOT, 'src/*.js'), path: 'spec' });
});

test('writes only the report and the official rules', () => {
  allows('Write', { file_path: 'reviews/2026-11-13-export-board.md', content: '# report' });
  blocks('Write', { file_path: 'src/app.js', content: 'fixed' });
  blocks('Write', { file_path: 'spec/screens/request.md', content: 'changed' });
  blocks('Edit', { file_path: 'spec/personas/privacy-lead.md', old_string: '# sheet', new_string: '# changed' });
  blocks('Write', { file_path: 'spec/sources/x.md', content: '# rules' }, 'verifier');
});

test('only a person marks a rule checked', () => {
  allows('Write', { file_path: 'spec/sources/fees.md', content: '| PRIV-04 | Free of charge | to confirm |' });
  blocks('Write', { file_path: 'spec/sources/fees.md', content: '| PRIV-04 | Free of charge | checked |' });
  blocks('Write', { file_path: 'spec/sources/privacy-requests.md', content: 'overwrite' });
  allows('Edit', { file_path: 'spec/sources/privacy-requests.md', old_string: '| PRIV-01 | One month | checked |\n', new_string: '| PRIV-01 | One month | checked |\n| PRIV-07 | New | to confirm |\n' });
  blocks('Edit', { file_path: 'spec/sources/privacy-requests.md', old_string: '| PRIV-01 | One month | checked |', new_string: '| PRIV-01 | Two months | to confirm |' });
  allows('Edit', { file_path: 'spec/sources/privacy-requests.md', old_string: '| PRIV-01 | One month | checked |', new_string: '| PRIV-01 | One month | to confirm |' }, 'rules-watch');
  blocks('Edit', { file_path: 'spec/sources/privacy-requests.md', old_string: '| PRIV-07 | New | to confirm |', new_string: '| PRIV-07 | New | checked |' }, 'rules-watch');
});

test('commands are off unless allowed', () => {
  blocks('Bash', { command: 'cat src/app.js' });
  blocks('Bash', { command: 'git log' });
  blocks('Bash', { command: 'ls' });
});

test('addresses that serve source code are blocked', () => {
  allows('WebFetch', { url: 'https://eur-lex.europa.eu/eli/reg/2016/679/oj', prompt: 'x' });
  allows('mcp__playwright__browser_navigate', { url: 'http://localhost:3000/requests' });
  blocks('mcp__playwright__browser_navigate', { url: 'http://localhost:3000/assets/app.js' });
  blocks('mcp__playwright__browser_navigate', { url: 'view-source:http://localhost:3000/' });
  blocks('WebFetch', { url: 'http://localhost:3000/app.js.map', prompt: 'x' });
  blocks('mcp__playwright__browser_evaluate', { function: '() => document.scripts' });
  blocks('mcp__playwright__browser_run_code_unsafe', { code: 'async (page) => page.content()' });
  blocks('mcp__playwright__browser_navigate', { url: 'javascript:fetch("/assets/app.js")' });
  blocks('mcp__playwright__browser_tabs', { action: 'new', url: 'http://localhost:3000/assets/app.js' });
});

test('the body of a file the page loaded is blocked; the list of addresses is not', () => {
  blocks('mcp__playwright__browser_network_request', { index: 2, part: 'response-body' });
  allows('mcp__playwright__browser_network_requests', {});
});

test('local files given to the page are reads, and a file a browser tool saves is a write', () => {
  blocks('mcp__playwright__browser_file_upload', { paths: [join(ROOT, '.env')] });
  blocks('mcp__playwright__browser_drop', { target: 'e5', paths: [join(ROOT, 'src/app.js')] });
  allows('mcp__playwright__browser_file_upload', { paths: [join(ROOT, 'spec/screens/request.md')] });
  blocks('mcp__playwright__browser_take_screenshot', { filename: join(ROOT, 'spec/walk.png') });
  blocks('mcp__playwright__browser_snapshot', { filename: 'walk.md' });
  allows('mcp__playwright__browser_take_screenshot', { filename: join(ROOT, 'reviews/walk-1.png') });
  allows('mcp__playwright__browser_take_screenshot', { filename: join(tmpdir(), 'synthetic-user', 'walk-1.png') });
  allows('mcp__playwright__browser_take_screenshot', {});
});

test('it guards the agents by name, and lets every other session through', () => {
  const code = (agent) => run('Read', { file_path: 'src/app.js' }, null, null, agent).code;
  assert.equal(code('synthetic-user'), 2);
  assert.equal(code('verifier'), 2);
  assert.equal(code('rules-watch'), 2);
  assert.equal(code(null), 0, 'the person\'s own session');
  assert.equal(code('general-purpose'), 0, 'another agent');
  assert.equal(run('Read', { file_path: 'reviews/2026-11-12-request-form-privacy-lead.md' }, null, null, 'verifier').code, 0);
  assert.equal(run('Read', { file_path: 'reviews/2026-11-12-request-form-privacy-lead.md' }, null, null, 'synthetic-user').code, 2);
});

test('the temporary folder is open', () => {
  allows('Write', { file_path: join(tmpdir(), 'synthetic-user', 'walk.png'), content: 'x' });
  allows('Read', { file_path: join(tmpdir(), 'synthetic-user', 'notes.md') });
});

test('malformed input is blocked without being echoed', () => {
  const { code, err } = run(null, null, null, '{"tool_name": "Read", "secret": "abc123"');
  assert.equal(code, 2);
  assert.ok(!err.includes('abc123'));
  assert.equal(run(null, null, null, JSON.stringify({ tool_name: 'Read' })).code, 2);
});
