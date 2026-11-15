import { cp, mkdir, rm } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const output = new URL('dist/', root);
const publicFiles = [
  'index.html', 'styles.css', 'manifest.webmanifest', 'sw.js',
  'js', 'assets', 'preview', 'VITRINEVERSE_PLAY.html'
];

await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });
for (const file of publicFiles) {
  await cp(new URL(file, root), new URL(file, output), { recursive: true });
}
console.log('Build Web : fichiers du jeu copiés dans dist/.');
