import { readFileSync } from 'fs';

const f = 'D:/vvcrm-2026-react-vercel-supabase-deepsea/src/main.jsx';
let src = readFileSync(f, 'utf8');

// Find all function definitions
const re = /^function \w+/gm;
let match;
while ((match = re.exec(src)) !== null) {
  console.log(match[0], 'at', match.index);
}