import { readFileSync } from 'fs';

const f = 'D:/vvcrm-2026-react-vercel-supabase-deepsea/src/main.jsx';
let src = readFileSync(f, 'utf8');

const sig = 'function LeadsMemory';
const sigIdx = src.indexOf(sig);

if (sigIdx !== -1) {
  // Show ~50 chars around the function boundaries
  const chunk = src.substring(sigIdx, sigIdx + 2000);
  const leadProfileIdx = chunk.indexOf('function LeadProfile');
  console.log('LeadProfile found at offset:', leadProfileIdx);
  if (leadProfileIdx > 0) {
    console.log('Context before LeadProfile:');
    console.log(JSON.stringify(chunk.substring(leadProfileIdx - 20, leadProfileIdx + 30)));
  }
  // Also show the last part of LeadsMemory
  const lastPart = chunk.substring(leadProfileIdx - 150, leadProfileIdx);
  console.log('End of LeadsMemory:');
  console.log(JSON.stringify(lastPart));
}