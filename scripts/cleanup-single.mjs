import fs from 'node:fs';
import path from 'node:path';

const outDir = path.resolve('dist');
if (!fs.existsSync(outDir)) process.exit(0);
for (const entry of fs.readdirSync(outDir)) {
  if (entry === 'index.html') continue;
  const p = path.join(outDir, entry);
  const st = fs.statSync(p);
  if (st.isDirectory()) {
    fs.rmSync(p, { recursive: true, force: true });
  } else {
    fs.unlinkSync(p);
  }
}

console.log('Cleaned dist; left only index.html');

