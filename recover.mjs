import { readFileSync, writeFileSync } from 'fs';

const f = 'D:/vvcrm-2026-react-vercel-supabase-deepsea/src/main.jsx';

// Read as Latin-1 bytes (each byte = one character in the 0-255 range)
const buf = readFileSync(f);

// Try: re-interpret as binary latin1 -> re-decode as UTF-8
// If the file was double-encoded (UTF-8 -> interpreted as latin1 -> UTF-8),
// we need to go from UTF-8 characters -> their latin1 byte values -> interpret as UTF-8

// Read the file as 'latin1' to get single-byte representation
const latin1 = buf.toString('latin1');

// Now try to re-encode: each latin1 char -> its byte value -> treat as UTF-8 bytes
const bytes = Buffer.from(latin1, 'latin1');

// Now interpret those bytes as UTF-8
const recovered = bytes.toString('utf8');

// Check if '哈萨克斯坦' appears
if (recovered.includes('哈萨克斯坦')) {
  console.log('RECOVERED! Found Kazakh string');
  writeFileSync(f + '.recovered', recovered, 'utf8');
  console.log('Written to .recovered file');
} else {
  console.log('Not recovered with simple latin1->utf8');
  // Check first few Chinese chars
  const idx = recovered.indexOf('Kazakhstan');
  if (idx !== -1) {
    console.log('Around Kazakhstan:', JSON.stringify(recovered.substring(idx, idx + 100)));
  }
}