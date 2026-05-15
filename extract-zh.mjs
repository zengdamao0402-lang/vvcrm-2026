import { readFileSync } from 'fs';

const f = 'D:/vvcrm-2026-react-vercel-supabase-deepsea/dist/assets/index-Cr7Yi-m2.js';
let src = readFileSync(f, 'utf8');

// Find Chinese strings in the dist file
const chinesePattern = /[\u4e00-\u9fff]+/g;
const found = new Set();
let match;
while ((match = chinesePattern.exec(src)) !== null) {
  if (match[0].length >= 2) found.add(match[0]);
}

console.log('Chinese strings found:', found.size);
const sorted = [...found].sort();
for (const s of sorted.slice(0, 50)) {
  console.log(s);
}