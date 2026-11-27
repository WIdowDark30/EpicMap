#!/usr/bin/env node
// Builds the EpicMap release package and release notes from the committed tree.
//
//   node tools/release.cjs --tag v1.2.7 [--out dist]
//       [--node-tap work/node-test.tap]
//       [--browser-report work/browser-check/browser-results.json]
//       [--launcher-log work/launcher-test.txt]
//       [--installer-checks "Windows PowerShell 5.1 and PowerShell 7"]
//
// Writes to --out:
//   epicmap-<tag>-windows.zip  complete package: `git archive HEAD`, minus export-ignore paths
//   SHA256SUMS.txt
//   release-notes.md           CHANGELOG section + generated installation and verification sections
//   release.json               { tag, title, prerelease, previousTag, ... } for the workflow
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const os = require('node:os');
const { execFileSync } = require('node:child_process');

const root = path.resolve(__dirname, '..');
const COMPANION = 'scripts/epicmap.lic';
// install.ps1 refuses a package without the EpicMap/ entries; the rest is what the README promises.
const REQUIRED = ['EpicMap/index.html', 'EpicMap/app.js', 'EpicMap/gs4map-data.js', COMPANION,
  'install.ps1', 'Install-EpicMap.cmd', 'README.md', 'MAP-CREDITS-AND-README.txt'];
// Files that must name the version being released.
const VERSIONED = ['README.md', 'UPDATE.txt'];

const OPTIONS = {
  tag: null,
  out: 'dist',
  nodeTap: 'work/node-test.tap',
  browserReport: 'work/browser-check/browser-results.json',
  launcherLog: 'work/launcher-test.txt',
  installerChecks: null,
};

function parseArgs(argv) {
  const args = { ...OPTIONS };
  for (let i = 0; i < argv.length; i++) {
    const key = argv[i].replace(/^--/, '').replace(/-([a-z])/g, (_, c) => c.toUpperCase());
    if (!(key in OPTIONS) || i + 1 >= argv.length) throw new Error(`Bad option ${argv[i]}`);
    args[key] = argv[++i];
  }
  if (!args.tag) throw new Error('--tag is required (for example --tag v1.2.7)');
  return args;
}

const run = (cmd, argv, opts = {}) => execFileSync(cmd, argv, { cwd: root, encoding: 'utf8', maxBuffer: 1 << 26, ...opts });
const succeeds = (cmd, argv) => { try { run(cmd, argv, { stdio: 'ignore' }); return true; } catch { return false; } };
const sha256 = (file) => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');

// ---- versions -------------------------------------------------------------

const TAG_RE = /^v(\d+)\.(\d+)\.(\d+)(?:-([0-9A-Za-z.-]+))?$/;

function parseTag(tag) {
  const m = TAG_RE.exec(tag);
  if (!m) return null;
  return { tag, nums: [+m[1], +m[2], +m[3]], pre: m[4] || null, base: `${m[1]}.${m[2]}.${m[3]}` };
}

// Semver precedence: numbers first, then a release outranks its prereleases,
// then prerelease identifiers compare numerically or lexically.
function compareTags(a, b) {
  for (let i = 0; i < 3; i++) if (a.nums[i] !== b.nums[i]) return a.nums[i] - b.nums[i];
  if (!a.pre || !b.pre) return (a.pre ? -1 : 0) - (b.pre ? -1 : 0);
  const pa = a.pre.split('.'), pb = b.pre.split('.');
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    if (pa[i] === undefined) return -1;
    if (pb[i] === undefined) return 1;
    const na = /^\d+$/.test(pa[i]), nb = /^\d+$/.test(pb[i]);
    if (na && nb && +pa[i] !== +pb[i]) return +pa[i] - +pb[i];
    if (na !== nb) return na ? -1 : 1;
    if (pa[i] !== pb[i]) return pa[i] < pb[i] ? -1 : 1;
  }
  return 0;
}

// The highest vX.Y.Z tag below the current one. A stable release only follows stable releases.
function previousTag(current) {
  return run('git', ['tag', '--list', 'v*']).split('\n').map((t) => parseTag(t.trim())).filter(Boolean)
    .filter((t) => compareTags(t, current) < 0 && (current.pre || !t.pre))
    .sort((a, b) => compareTags(b, a))[0]?.tag || null;
}

// ---- changelog ------------------------------------------------------------

function changelogSection(version) {
  const text = fs.readFileSync(path.join(root, 'CHANGELOG.md'), 'utf8').replace(/\r\n/g, '\n');
  const headings = [...text.matchAll(/^## \[([^\]]+)\](.*)$/gm)];
  const idx = headings.findIndex((h) => h[1] === version);
  if (idx < 0) throw new Error(`CHANGELOG.md has no "## [${version}]" section`);
  const h = headings[idx];
  const end = idx + 1 < headings.length ? headings[idx + 1].index : text.length;
  const parts = h[2].split(/\s+-\s+/).map((s) => s.trim()).filter(Boolean);
  const date = /^\d{4}-\d{2}-\d{2}$/.test(parts[0] || '') ? parts.shift() : null;
  const title = parts.join(' - ');
  if (!title) throw new Error(`CHANGELOG.md section ${version} needs a title: "## [${version}] - YYYY-MM-DD - Title"`);
  let body = text.slice(h.index + h[0].length, end).trim();

  // "### Installation notes" is merged into the generated installation section.
  let installNotes = [];
  body = body.replace(/^### Installation notes\n([\s\S]*?)(?=^### |(?![\s\S]))/m, (_, notes) => {
    installNotes = notes.trim().split('\n').filter((l) => l.trim()).map((l) => l.replace(/^\s*[-*]\s+/, ''));
    return '';
  }).trim();
  if (!body) throw new Error(`CHANGELOG.md section ${version} has no release notes`);
  return { date, title, body, installNotes };
}

// Release bodies cannot resolve repository-relative paths; point images and links at the tagged tree.
function absolutizeLinks(markdown, repo, tag) {
  if (!repo) return markdown;
  return markdown.replace(/(!?)\[([^\]]*)\]\(([^)\s]+)\)/g, (all, bang, label, target) => {
    if (/^(?:[a-z]+:|#|\/)/i.test(target)) return all;
    const base = bang ? `https://raw.githubusercontent.com/${repo}/${tag}/` : `https://github.com/${repo}/blob/${tag}/`;
    return `${bang}[${label}](${base}${target.replace(/^\.\//, '')})`;
  });
}

// ---- test results ---------------------------------------------------------

function readVerification(args) {
  const read = (file, what) => {
    const full = path.resolve(root, file);
    if (!fs.existsSync(full)) throw new Error(`Missing ${what} at ${file}; run the tests first`);
    return fs.readFileSync(full, 'utf8');
  };
  const tap = read(args.nodeTap, 'map regression test results');
  const count = (name) => { const m = new RegExp(`^# ${name} (\\d+)$`, 'm').exec(tap); return m ? +m[1] : NaN; };
  const tests = count('tests');
  if (!(tests > 0) || count('pass') !== tests || count('fail') !== 0) throw new Error('Map regression tests did not all pass');

  const report = JSON.parse(read(args.browserReport, 'browser check results'));
  if (!report.passed || !report.checks?.length || report.pageErrors?.length) throw new Error('Browser checks did not pass cleanly');

  const launcher = /(\d+) runs, (\d+) assertions, 0 failures, 0 errors/.exec(read(args.launcherLog, 'launcher test output'));
  if (!launcher) throw new Error('Launcher tests did not all pass');

  return { tests, browserChecks: report.checks, launcherRuns: +launcher[1], launcherAssertions: +launcher[2], installer: args.installerChecks };
}

// ---- main -----------------------------------------------------------------

function main() {
  const args = parseArgs(process.argv.slice(2));
  const repo = process.env.GITHUB_REPOSITORY || '';
  const current = parseTag(args.tag);
  if (!current) throw new Error(`Tag ${args.tag} is not vX.Y.Z or vX.Y.Z-suffix`);
  const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
  if (pkg.version !== current.base && pkg.version !== args.tag.slice(1)) {
    throw new Error(`Tag ${args.tag} does not match package.json version ${pkg.version}`);
  }
  for (const f of VERSIONED) {
    if (!fs.readFileSync(path.join(root, f), 'utf8').includes(current.base)) {
      throw new Error(`${f} does not mention ${current.base}; update it for this release`);
    }
  }
  if (run('git', ['status', '--porcelain', '--untracked-files=no']).trim()) {
    throw new Error('Tracked files have uncommitted changes; releases are built from the committed tree');
  }

  const commit = run('git', ['rev-parse', 'HEAD']).trim();
  const changes = changelogSection(current.base);
  const verification = readVerification(args);
  const prev = previousTag(current);
  // Unknown (no previous tag, or it predates the companion being in git) counts as changed.
  const companionChanged = !(prev && succeeds('git', ['cat-file', '-e', `${prev}:${COMPANION}`])
    && succeeds('git', ['diff', '--quiet', prev, 'HEAD', '--', COMPANION]));

  const out = path.resolve(root, args.out);
  fs.rmSync(out, { recursive: true, force: true });
  fs.mkdirSync(out, { recursive: true });
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'epicmap-release-'));
  const stage = path.join(tmp, 'stage');
  fs.mkdirSync(stage);
  const tarFile = path.join(tmp, 'tree.tar');
  run('git', ['archive', '--format=tar', '-o', tarFile, 'HEAD']);
  run('tar', ['-xf', tarFile, '-C', stage]);
  for (const f of REQUIRED) {
    if (!fs.existsSync(path.join(stage, f))) throw new Error(`Package would be missing ${f}`);
  }
  if (!fs.readdirSync(path.join(stage, 'EpicMap/maps')).length) throw new Error('Package would have no EpicMap/maps images');

  const zipName = `epicmap-${args.tag}-windows.zip`;
  run('zip', ['-X', '-q', '-r', path.join(out, zipName), '.'], { cwd: stage });
  fs.rmSync(tmp, { recursive: true, force: true });
  const hash = sha256(path.join(out, zipName));
  fs.writeFileSync(path.join(out, 'SHA256SUMS.txt'), `${hash}  ${zipName}\n`);

  const notes = renderNotes({ repo, tag: args.tag, changes, zipName, hash, prev, companionChanged, verification, commit });
  fs.writeFileSync(path.join(out, 'release-notes.md'), notes);
  const meta = {
    tag: args.tag,
    title: `EpicMap ${args.tag} - ${changes.title}`,
    prerelease: Boolean(current.pre),
    previousTag: prev,
    companionChanged,
    commit,
    assets: [zipName, 'SHA256SUMS.txt'],
  };
  fs.writeFileSync(path.join(out, 'release.json'), JSON.stringify(meta, null, 2) + '\n');
  console.log(JSON.stringify(meta, null, 2));
}

function renderNotes({ repo, tag, changes, zipName, hash, prev, companionChanged, verification, commit }) {
  const lines = [absolutizeLinks(changes.body.replace(/^###(?=\s)/gm, '##'), repo, tag), ''];

  lines.push('## Downloads and installation', '');
  lines.push(`1. Download **${zipName}** below, then right-click and choose **Extract All**. Do not use the Source code ZIP.`);
  lines.push('2. Open the extracted folder and double-click **Install-EpicMap.cmd**. It finds Lich, including OneDrive and nested folders. Choose your installation if prompted.');
  if (companionChanged) {
    lines.push('3. In game run `;epicmap`. If already running, first use `;kill epicmap`. Other characters use `;epicmap noopen`. Reload the map with Ctrl+F5.');
  } else {
    lines.push(`3. Reload the open map with Ctrl+F5. The Lich companion is unchanged since ${prev}, so a running \`;epicmap\` does not need a restart. Otherwise run \`;epicmap\`; other characters use \`;epicmap noopen\`.`);
  }
  lines.push('');
  lines.push('Without the installer, copy the `EpicMap` folder into your Lich folder and `scripts/epicmap.lic` into `Lich5/scripts`. See README.md for custom folders and troubleshooting.');
  if (changes.installNotes.length) lines.push('', ...changes.installNotes.map((n) => `- ${n}`));
  lines.push('', 'This complete package supports new installs and upgrades. Map artwork and data credits are in MAP-CREDITS-AND-README.txt.', '');

  const v = verification;
  const parts = [`${v.tests} map regression tests`, `${v.browserChecks.length} headless-browser check groups`,
    `${v.launcherRuns} launcher tests (${v.launcherAssertions} assertions)`];
  if (v.installer) parts.push(`installer checks in ${v.installer}`);
  const list = parts.length > 2 ? `${parts.slice(0, -1).join(', ')} and ${parts.at(-1)}` : parts.join(' and ');
  const builder = process.env.GITHUB_ACTIONS === 'true' ? 'by GitHub Actions ' : '';
  lines.push('## Verification', '');
  lines.push(`All ${list} passed. The ZIP was built ${builder}from commit ${commit.slice(0, 7)}. Live in-game Lich execution is not part of these checks.`, '');
  lines.push('<details><summary>Browser checks</summary>', '', ...v.browserChecks.map((c) => `- ${c}`), '', '</details>', '');
  lines.push(`SHA-256 for ${zipName} (also in SHA256SUMS.txt):`, '', '```text', hash, '```', '');
  return lines.join('\n');
}

try {
  main();
} catch (e) {
  console.error(`release: ${e.message}`);
  process.exit(1);
}
