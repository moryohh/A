import { build } from 'vite';
import react from '@vitejs/plugin-react';
import { cp, mkdtemp, rm, readFile, writeFile } from 'node:fs/promises';
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
  await cp(join(content, 'data'), join(output, 'data'), { recursive: true });
  // Math board files have no stable lesson_id like science content, so apply
  // the checked-in title-to-video mapping after copying the upstream snapshot.
  const mathVideoLinks = JSON.parse(await readFile(resolve('integrations/solve-with-me/math-video-links.json'), 'utf8'));
  for (const [file, metadata] of Object.entries(mathVideoLinks)) {
    const target = join(output, 'data', file);
    try {
      const questions = JSON.parse(await readFile(target, 'utf8'));
      if (Array.isArray(questions) && questions.length > 0) {
        questions[0] = { ...metadata, ...questions[0] };
        await writeFile(target, JSON.stringify(questions, null, 2) + '\n');
      }
    } catch (error) {
      console.warn(`[solve-with-me] Could not apply math video links to ${file}:`, error.message);
    }
  }
  for (const file of ['curriculum.json', 'chemistry-curriculum.json', 'physics-curriculum.json']) {
    await cp(join(content, file), join(output, file));
  }
} finally {
  await rm(scratch, { recursive: true, force: true });
}
