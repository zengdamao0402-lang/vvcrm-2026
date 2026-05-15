import { readFileSync, writeFileSync } from 'fs';

const f = 'D:/vvcrm-2026-react-vercel-supabase-deepsea/src/main.jsx';
const newCompF = 'D:/vvcrm-2026-react-vercel-supabase-deepsea/new-leadsmemory.txt';

let src = readFileSync(f, 'utf8');
let newComp = readFileSync(newCompF, 'utf8');

// Find the old LeadsMemory function - look for the signature
const sig = 'function LeadsMemory({ leads: visibleLeads, selectedLead, query, onQuery, onSelect })';
const sigIdx = src.indexOf(sig);

if (sigIdx === -1) {
  console.log('ERROR: Signature not found');
  process.exit(1);
}

// Find the closing brace - the function ends with "}\n\nfunction LeadProfile"
const afterSig = src.substring(sigIdx);
const endMarker = '\n\nfunction LeadProfile';
const endIdx = afterSig.indexOf(endMarker);

if (endIdx === -1) {
  console.log('ERROR: End marker not found');
  process.exit(1);
}

const oldComponent = afterSig.substring(0, endIdx);

// Replace
src = src.substring(0, sigIdx) + newComp.trim() + '\n' + src.substring(sigIdx + oldComponent.length);

writeFileSync(f, src, 'utf8');
console.log('LeadsMemory replaced successfully');
console.log('Old length:', oldComponent.length, 'New length:', newComp.trim().length);