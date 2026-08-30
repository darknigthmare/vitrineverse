#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');

const ROOT = __dirname;
const read = relativePath => fs.readFileSync(path.join(ROOT, relativePath), 'utf8');

let html = read('index.html');
const css = read('styles.css');
let dataJs = read(path.join('js', 'game-data.js'));
const appJs = read(path.join('js', 'app.js'));

const assetDirectory = path.join(ROOT, 'assets', 'items');
for (const fileName of fs.readdirSync(assetDirectory).filter(name => name.endsWith('.svg')).sort()) {
  const encoded = fs.readFileSync(path.join(assetDirectory, fileName)).toString('base64');
  dataJs = dataJs.replaceAll(`assets/items/${fileName}`, `data:image/svg+xml;base64,${encoded}`);
}

function replaceRequired(source, marker, replacement) {
  if (!source.includes(marker)) throw new Error(`Marqueur de build absent : ${marker}`);
  return source.replace(marker, () => replacement);
}

html = replaceRequired(html, '<link rel="stylesheet" href="styles.css" />', `<style>\n${css}\n</style>`);
html = replaceRequired(html, '<script src="js/game-data.js"></script>', `<script>\n${dataJs}\n</script>`);
html = replaceRequired(html, '<script src="js/app.js"></script>', `<script>\n${appJs}\n</script>`);

const outputPath = path.join(ROOT, 'VITRINEVERSE_PLAY.html');
fs.writeFileSync(outputPath, html, 'utf8');
const formattedSize = fs.statSync(outputPath).size.toLocaleString('fr-FR');
console.log(`Construit : ${outputPath} (${formattedSize} octets)`);
