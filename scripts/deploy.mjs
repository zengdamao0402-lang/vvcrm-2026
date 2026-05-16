// Deploy to GitHub Pages
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

// Read token from .env
const envContent = fs.readFileSync('.env', 'utf8');
const tokenMatch = envContent.match(/GITHUB_TOKEN=(.+)/);
if (!tokenMatch) { console.error('GITHUB_TOKEN not found in .env'); process.exit(1); }
const TOKEN = tokenMatch[1].trim();

const OWNER = 'zengdamao0402-lang';
const REPO = 'vvcrm-2026';
const API = `https://api.github.com/repos/${OWNER}/${REPO}`;

async function api(endpoint, method = 'GET', body = null) {
  const opts = {
    method,
    headers: { Authorization: `token ${TOKEN}`, Accept: 'application/vnd.github+json', 'Content-Type': 'application/json' },
  };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(`${API}${endpoint}`, opts);
  const data = await res.json();
  if (!res.ok) throw new Error(`${method} ${endpoint}: ${res.status} ${JSON.stringify(data)}`);
  return data;
}

async function deploy() {
  // Build with GitHub Pages base path
  console.log('Building for GitHub Pages...');
  execSync('npx vite build --base /vvcrm-2026/', { stdio: 'inherit' });

  // Copy 404 and .nojekyll
  fs.copyFileSync('dist/index.html', 'dist/404.html');
  fs.writeFileSync('dist/.nojekyll', '');

  // Walk dist
  const files = [];
  function walk(dir, prefix = '') {
    for (const entry of fs.readdirSync(dir)) {
      const full = path.join(dir, entry);
      const rel = (prefix + entry).replace(/\\/g, '/');
      if (fs.statSync(full).isDirectory()) walk(full, rel + '/');
      else files.push({ path: rel, content: fs.readFileSync(full) });
    }
  }
  walk('dist');
  console.log(`Uploading ${files.length} files...`);

  // Create blobs and tree
  const tree = [];
  for (const f of files) {
    const blob = await api('/git/blobs', 'POST', { content: f.content.toString('base64'), encoding: 'base64' });
    tree.push({ path: f.path, mode: '100644', type: 'blob', sha: blob.sha });
  }

  let baseTreeSha = null, refSha = null;
  try { const ref = await api('/git/ref/heads/gh-pages'); refSha = ref.object.sha; baseTreeSha = (await api(`/git/commits/${refSha}`)).tree.sha; } catch {}

  const newTree = await api('/git/trees', 'POST', { tree, ...(baseTreeSha ? { base_tree: baseTreeSha } : {}) });

  let parents = [];
  try { parents = [(await api('/git/ref/heads/main')).object.sha]; } catch {}

  const commit = await api('/git/commits', 'POST', { message: 'Deploy', tree: newTree.sha, parents });

  if (refSha) await api('/git/refs/heads/gh-pages', 'PATCH', { sha: commit.sha, force: true });
  else await api('/git/refs', 'POST', { ref: 'refs/heads/gh-pages', sha: commit.sha });

  console.log(`Done! https://${OWNER}.github.io/${REPO}/`);
}

deploy().catch(e => { console.error(e.message); process.exit(1); });
