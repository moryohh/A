import { build } from 'vite';
import react from '@vitejs/plugin-react';
import { cp, mkdtemp, readdir, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve, join } from 'node:path';
import { execFileSync } from 'node:child_process';

// Content snapshot from moryohh/Xxx; the imported React source lives in integrations.
const revision = 'c81d07990dd8373ea75f7dbfda4015ccbad1d9a9';
const scratch = await mkdtemp(join(tmpdir(), 'solve-with-me-'));
const output = resolve('public/solve-with-me');
try {
  let content = process.env.SOLVE_WITH_ME_CONTENT_DIR;
  if (!content) {
    content = join(scratch, 'Xxx');
    execFileSync('git', ['clone', '--quiet', 'https://github.com/moryohh/Xxx.git', content], { stdio: 'inherit' });
    execFileSync('git', ['-C', content, 'checkout', '--quiet', revision], { stdio: 'inherit' });
  }
  await build({ configFile: false, root: resolve('integrations/solve-with-me'), base: './', plugins: [react()], build: { outDir: output, emptyOutDir: true } });
  // Heavy board JSON is loaded by immutable record id from Cloudflare R2.
  // It is deliberately no longer copied into every frontend deployment.
  for (const file of ['curriculum.json', 'chemistry-curriculum.json', 'physics-curriculum.json']) {
    await cp(join(content, file), join(output, file));
  }
  // Keep a local fallback so every lesson still opens if the remote index/R2 lookup misses a record.
  await cp(join(content, 'data'), join(output, 'data'), { recursive: true });
  // The room topic picker consumes this compact, build-verified manifest. A
  // filename is admitted only when its JSON exists and contains real content.
  const dataDirectory = join(content, 'data');
  const availableFiles = [];
  for (const file of await readdir(dataDirectory)) {
    if (!file.endsWith('.json')) continue;
    try {
      const parsed = JSON.parse(await readFile(join(dataDirectory, file), 'utf8'));
      const hasContent = Array.isArray(parsed) ? parsed.length > 0 : Boolean(parsed && Object.keys(parsed).length);
      if (hasContent) availableFiles.push(file);
    } catch {
      // Invalid JSON is intentionally excluded from the UI.
    }
  }
  await writeFile(join(output, 'catalog-availability.json'), JSON.stringify({ files: availableFiles.sort() }));
} finally {
  await rm(scratch, { recursive: true, force: true });
}
