// copies the game (the same files the website uses) into www/ for the native apps
import { cpSync, rmSync, mkdirSync } from 'node:fs';
const src = new URL('../../', import.meta.url), out = new URL('../www/', import.meta.url);
rmSync(out, { recursive:true, force:true }); mkdirSync(out);
for(const f of ['index.html', 'manifest.webmanifest']) cpSync(new URL(f, src), new URL(f, out));
for(const d of ['assets', 'icons', 'fonts']) cpSync(new URL(d + '/', src), new URL(d + '/', out), { recursive:true });
console.log('www/ atualizado');
