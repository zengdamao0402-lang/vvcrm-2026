import { readFileSync, writeFileSync } from 'fs';

const f = 'D:/vvcrm-2026-react-vercel-supabase-deepsea/src/main.jsx';
const buf = readFileSync(f);

// Try reading as GBK (codepage 936)
try {
  const { decode } = await import('node:util');
} catch {}

// Use iconv-lite if available, otherwise try different approaches
// Let's try: the original was read as if it were ANSI (GBK) from a UTF-8 file
// So the bytes on disk ARE UTF-8, but they got mangled during a read/write cycle

// Actually, the corruption happened because:
// 1. File was originally correct UTF-8
// 2. Get-Content read it as ANSI (GBK) -> wrong interpretation
// 3. Set-Content wrote the wrong interpretation as ANSI (or UTF-8)

// Let me check if the corruption is consistent - maybe all non-ASCII chars got the same treatment

// A simpler approach: just read the current file and check if we can find patterns
const src = buf.toString('utf8');

// Find all unique garbled Chinese-looking strings
const garbled = src.match(/[^\x00-\x7F\r\n\t ]{2,}/g) || [];
const unique = [...new Set(garbled)];
console.log('Unique non-ASCII tokens:', unique.length);
console.log('First 20:');
for (const s of unique.slice(0, 20)) {
  console.log(s);
}