import { readFileSync } from 'fs';
const f = 'D:/vvcrm-2026-react-vercel-supabase-deepsea/src/main.jsx';
const buf = readFileSync(f);

// Check if the destinations line has the correct bytes
// '哈萨克斯坦' in UTF-8 should be: E5 93 88 E8 90 A8 E5 85 8B E6 96 AF E5 9D A6
const target = Buffer.from('哈萨克斯坦', 'utf8');
console.log('Expected bytes:', target.toString('hex'));

// Find 'Kazakhstan' in the file
const idx = buf.indexOf('Kazakhstan');
if (idx !== -1) {
  // Show bytes around it
  const slice = buf.subarray(idx - 5, idx + 80);
  console.log('Around Kazakhstan:', slice.toString('hex'));
  console.log('As UTF-8:', slice.toString('utf8'));
}

// Also check if the file has the 'cn' property correctly
const cnIdx = buf.indexOf('cn: ');
if (cnIdx !== -1) {
  const cnSlice = buf.subarray(cnIdx, cnIdx + 30);
  console.log('cn field:', cnSlice.toString('hex'));
  console.log('As UTF-8:', cnSlice.toString('utf8'));
}