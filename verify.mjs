import { readFileSync } from 'fs';

const f = 'D:/vvcrm-2026-react-vercel-supabase-deepsea/src/main.jsx';
let src = readFileSync(f, 'utf8');

// Check key Chinese strings
const checks = ['阶段', '国家', '车型', '来源', '商机记忆库', '清除', '没有匹配的商机记录'];
for (const s of checks) {
  const idx = src.indexOf(s);
  console.log(s + ': ' + (idx !== -1 ? 'OK at ' + idx : 'NOT FOUND!'));
}

// Also check the new component structure
console.log('\n--- Structure checks ---');
console.log('handleFilterSelect:', src.indexOf('handleFilterSelect') !== -1 ? 'OK' : 'MISSING');
console.log('handleClearAll:', src.indexOf('handleClearAll') !== -1 ? 'OK' : 'MISSING');
console.log('filterDefs:', src.indexOf('filterDefs') !== -1 ? 'OK' : 'MISSING');
console.log('LeadProfile:', src.indexOf('function LeadProfile') !== -1 ? 'OK' : 'MISSING');
console.log('BackupAlert:', src.indexOf('function BackupAlert') !== -1 ? 'OK' : 'MISSING');