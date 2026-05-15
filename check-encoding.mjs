import { readFileSync } from 'fs';
const f = 'D:/vvcrm-2026-react-vercel-supabase-deepsea/src/main.jsx';
let src = readFileSync(f, 'utf8');

// Find the destinations line
const lines = src.split('\n');
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('Kazakhstan')) {
    console.log('Line ' + (i+1) + ':', JSON.stringify(lines[i]));
    break;
  }
}

// Check for odd replacement artifacts
const artifacts = ['`n  ChevronDown', '`n  Filter', '`n  RotateCcw'];
for (const a of artifacts) {
  if (src.includes(a)) {
    console.log('ARTIFACT FOUND:', a);
  }
}
console.log('Artifact check done');