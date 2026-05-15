import { readFileSync, writeFileSync } from 'fs';

const f = 'D:/vvcrm-2026-react-vercel-supabase-deepsea/src/main.jsx';
const newCompF = 'D:/vvcrm-2026-react-vercel-supabase-deepsea/new-leadsmemory.txt';

let src = readFileSync(f, 'utf8');
let newComp = readFileSync(newCompF, 'utf8').trim();

// LeadsMemory: 37012 to 39055
const start = 37012;
const end = 39055;

src = src.substring(0, start) + newComp + '\n\n' + src.substring(end);

writeFileSync(f, src, 'utf8');
console.log('Replaced LeadsMemory');
console.log('New file length:', src.length);