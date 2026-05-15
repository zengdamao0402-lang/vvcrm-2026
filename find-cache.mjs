import { readFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';

function findFiles(dir, pattern, maxDepth) {
  if (maxDepth <= 0) return [];
  try {
    const entries = readdirSync(dir);
    let results = [];
    for (const entry of entries) {
      const full = join(dir, entry);
      try {
        const st = statSync(full);
        if (st.isDirectory() && !entry.startsWith('.')) {
          results = results.concat(findFiles(full, pattern, maxDepth - 1));
        } else if (entry.includes(pattern)) {
          results.push(full);
        }
      } catch(e) {}
    }
    return results;
  } catch(e) { return []; }
}

// Look for any main.jsx or jsx files outside node_modules
const base = 'D:/vvcrm-2026-react-vercel-supabase-deepsea';
const viteDirs = [join(base, 'node_modules', '.vite'), join(base, 'node_modules', '.vite-temp')];
for (const d of viteDirs) {
  const found = findFiles(d, 'main', 3);
  console.log(d, found);
}

// Also check if dist has source maps
console.log('\nDist files:');
const distFiles = readdirSync(join(base, 'dist', 'assets'));
for (const f of distFiles) {
  console.log(f);
}