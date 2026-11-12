// black-box.mjs: keeps an agent on the user's side of the product.
//
// A Claude Code PreToolUse hook for the agents in agents/. Before each tool call an agent makes, it checks the
// paths and addresses the call asks for. The synthetic user may read the skill, the knowledge base,
// the spec and the product decisions; it may write its report and rules marked "to confirm". It may
// not read the code, the git history, the secrets or the eval cases.
//
// Exit 0 lets the call run. Exit 2 blocks it, and Claude Code shows the message to the agent.
// It is a guard against reading the code by accident, not a sandbox: it checks paths, not intent.
// The agent's instructions say the same thing in words, so the two cover each other.
//
// Install: copy to .claude/hooks/black-box.mjs, and hooks/settings.json to .claude/settings.json (or merge it in).
// It runs from the project's settings, not from each agent's frontmatter: Claude Code skips frontmatter hooks in a
// folder it does not trust, including every `claude -p` run, and the agent would then run with no guard.
// Claude Code tells the hook which agent is calling (agent_type), so each agent gets its own profile below.
// The person's own session, and any other agent, pass through: the hook guards only the agents named here.
// Test: node --test hooks/black-box.test.mjs

import { readFileSync, realpathSync, existsSync } from 'node:fs';
import { basename, dirname, isAbsolute, join, normalize, relative, sep } from 'node:path';
import { tmpdir } from 'node:os';

// ---------- Settings: edit these for your project. Folders are relative to the project root. ----------

const SKILL = '.claude/skills/synthetic-user/'; // SKILL.md, the map, the persona sheets, the report template
const KNOWLEDGE_BASE = 'knowledge-base/';       // the rules, each with its source
const SPECS = 'specs/';                         // what is under review, in the user's terms
const DECISIONS = 'decisions/';                 // product decisions, one file per feature
const REVIEWS = 'reviews/';                     // the reports

// What each agent may read and write. A role's report stays out of the other roles' reach,
// so the synthetic user cannot read reviews/; the verifier reads them all.
const PROFILES = {
  'synthetic-user': { read: [SKILL, KNOWLEDGE_BASE, SPECS, DECISIONS], write: [REVIEWS, KNOWLEDGE_BASE] },
  verifier: { read: [SKILL, KNOWLEDGE_BASE, SPECS, DECISIONS, REVIEWS], write: [REVIEWS] },
  // The rules watch may turn a checked rule back to "to confirm". No agent may mark a rule "checked".
  'rules-watch': { read: [KNOWLEDGE_BASE, REVIEWS], write: [KNOWLEDGE_BASE, REVIEWS], reopen: true },
};

// Never readable, even inside an allowed folder: any folder named eval (the cases hold the answers) or .git, wherever it sits.
const NEVER = /(^|\/)(eval|\.git)(\/|$)/;
const SECRET = /(^|\/)(\.env(\..*)?|\.dev\.vars|.*\.pem|.*\.key|id_rsa.*|credentials.*)$/i;

// Bash is off unless a command matches one of these, whole and alone (no ; | & ` $( > < or new line).
// Example for a product walk with a browser script: /^node walk\/[a-z-]+\.mjs( --role [a-z-]+)?$/
const ALLOWED_COMMANDS = [];

// For tools that open an address (WebFetch, browser tools): the source code the page loads, and addresses that run code.
const SOURCE_URL = /^(view-source:|file:|javascript:|data:)|\.(m?js|cjs|ts|tsx|jsx|css|map)([?#]|$)|\/(src|node_modules)\//i;
// Browser tools that run code, or return the body of a file the page loaded, can read the source.
// The names are Playwright MCP's (browser_evaluate, browser_run_code_unsafe, browser_network_request); check your browser server's.
const BLOCKED_TOOLS = /^mcp__.*(evaluate|run_code|network_request$)/i;

// A folder in the system's temporary directory, for screenshots and notes during a run.
const TEMP = join(tmpdir(), 'synthetic-user');

// A rule row whose mark is "checked", in the knowledge base table.
const CHECKED_ROW = /\|\s*checked\s*\|/i;

// ---------- The hook ----------

const block = (reason) => {
  process.stderr.write(
    `Blocked (black box): ${reason}\n` +
    'You review the product as its user meets it: the spec, the knowledge base, your skill files and the product in a browser. ' +
    'If they are not enough to say what is right, write it in your report as a gap. Do not look for the code.\n');
  process.exit(2);
};

// Never echo malformed input: it may hold a command or a document with secrets.
function readInput() {
  try {
    const input = JSON.parse(readFileSync(0, 'utf8'));
    const isObject = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);
    if (!isObject(input) || typeof input.tool_name !== 'string' || !input.tool_name || !isObject(input.tool_input)) throw new Error();
    if (input.hook_event_name !== undefined && input.hook_event_name !== 'PreToolUse') throw new Error();
    return input;
  } catch {
    process.stderr.write('Blocked (black box): the hook input is not valid PreToolUse JSON, so the tool call was not allowed. Check the hook install.\n');
    process.exit(2);
  }
}

const input = readInput();
// Which agent is calling: its frontmatter name, as Claude Code sends it, or a profile given as an argument.
// Rename an agent and you must rename its profile here, or the hook stops guarding it.
const name = process.argv[2] || input.agent_type;
if (process.argv[2] && !PROFILES[name]) block(`unknown profile "${name}". Use one of: ${Object.keys(PROFILES).join(', ')}.`);
if (!PROFILES[name]) process.exit(0);
const profile = PROFILES[name];

const tool = input.tool_name;
const args = input.tool_input;
const ROOT = process.env.CLAUDE_PROJECT_DIR || input.cwd || process.cwd();
const str = (v) => (typeof v === 'string' ? v : '');

// The real path, following links; for a file that does not exist yet, the real path of its folder.
function real(p) {
  let current = normalize(p);
  const rest = [];
  for (;;) {
    try { return join(realpathSync(current), ...rest.reverse()); } catch { /* go up one folder */ }
    const parent = dirname(current);
    if (parent === current) return normalize(p);
    rest.push(basename(current));
    current = parent;
  }
}

// Where a path points: inside the temporary folder, inside the project (as a relative path), or outside.
function locate(p) {
  if (!p) return { outside: true };
  const abs = real(isAbsolute(p) ? p : join(input.cwd || ROOT, p));
  const temp = real(TEMP);
  if (abs === temp || abs.startsWith(temp)) return { temp: true };
  const rel = relative(real(ROOT), abs).split(sep).join('/');
  if (!rel || rel.startsWith('..') || isAbsolute(rel)) return { outside: true };
  return { rel };
}

const under = (rel, folder) => rel === folder.replace(/\/$/, '') || rel.startsWith(folder);
const forbidden = (rel) => NEVER.test(rel) || SECRET.test(rel);
const list = (folders) => folders.join(', ');

function checkRead(p) {
  const where = locate(p);
  if (where.temp) return;
  if (where.outside) block(`${p || 'this path'} is outside the files you may read (${list(profile.read)}).`);
  if (forbidden(where.rel)) block(`${where.rel} is never readable here.`);
  if (!profile.read.some((f) => under(where.rel, f))) block(`${where.rel} is not in the files you may read (${list(profile.read)}).`);
}

function checkWrite(p, content, oldContent) {
  const where = locate(p);
  if (where.temp) return;
  if (where.outside || forbidden(where.rel) || !profile.write.some((f) => under(where.rel, f))) {
    block(`you write only in ${list(profile.write)}. You do not change the spec, the code or the product.`);
  }
  if (!under(where.rel, KNOWLEDGE_BASE)) return;
  // The knowledge base: add rules marked "to confirm"; only a person marks a rule "checked".
  if (oldContent === undefined && existsSync(join(real(ROOT), where.rel))) {
    block(`${where.rel} already exists. Add rules to it with Edit, so no rule is overwritten.`);
  }
  const before = checkedRows(oldContent || '');
  const after = checkedRows(content);
  if (after.some((row) => !before.includes(row))) block('only a person marks a rule "checked". Add the rule marked "to confirm".');
  if (!profile.reopen && before.some((row) => !after.includes(row))) {
    block('this edit changes a checked rule. Add a new version marked "to confirm" instead; a person decides.');
  }
}

const checkedRows = (text) => text.split('\n').filter((line) => CHECKED_ROW.test(line)).map((line) => line.trim());

if (BLOCKED_TOOLS.test(tool)) block(`${tool} runs code in the page or returns a file the page loaded, which can be the source.`);

switch (tool) {
  case 'Read':
    checkRead(str(args.file_path));
    break;
  case 'Grep':
  case 'Glob': {
    // Without a path, a search covers the whole project, code included.
    if (!str(args.path)) block(`give ${tool} a path: one of ${list(profile.read)}.`);
    checkRead(str(args.path));
    const pattern = str(args.pattern);
    if (tool === 'Glob' && (isAbsolute(pattern) || pattern.includes('..'))) block('use a pattern relative to the path you give.');
    break;
  }
  case 'Write':
    checkWrite(str(args.file_path), str(args.content));
    break;
  case 'Edit':
    checkWrite(str(args.file_path), str(args.new_string), str(args.old_string));
    break;
  case 'MultiEdit': {
    const edits = Array.isArray(args.edits) ? args.edits : [];
    checkWrite(str(args.file_path), edits.map((e) => str(e?.new_string)).join('\n'), edits.map((e) => str(e?.old_string)).join('\n'));
    break;
  }
  case 'NotebookEdit':
    block('notebooks are not part of the review.');
    break;
  case 'Bash': {
    const command = str(args.command).trim();
    if (/[;&|`<>\n]|\$\(/.test(command) || !ALLOWED_COMMANDS.some((re) => re.test(command))) {
      block('commands are off for this agent. Read the allowed files with Read, and walk the product with the browser tool.');
    }
    break;
  }
  default: {
    // WebFetch and browser tools: any address that serves the source code.
    const url = str(args.url);
    if (url && SOURCE_URL.test(url)) block(`${url} is source code, not something a user sees.`);
    // Browser tools that take local files: files given to the page are reads (upload, drop); a file saved is a write.
    for (const p of Array.isArray(args.paths) ? args.paths : []) checkRead(str(p));
    const file = str(args.filename);
    if (file) {
      const where = locate(file);
      if (!where.temp && (where.outside || forbidden(where.rel) || !profile.write.some((f) => under(where.rel, f)))) {
        block(`save the browser's files (screenshots, snapshots) in ${REVIEWS}, or in ${TEMP} if your browser tool may write there.`);
      }
      checkWrite(file, '');
    }
  }
}

process.exit(0);
