import { build } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
await build({configFile:false,root:path.join(repo,'laboratory/chapter-1'),base:'./',publicDir:false,plugins:[react(),tailwindcss()],build:{outDir:path.join(repo,'public/laboratory/biology/chapter-1'),emptyOutDir:false}});
