const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const ROOT = path.resolve(__dirname, '..');

function read(relativePath) {
  return fs.readFileSync(path.join(ROOT, relativePath), 'utf8');
}

function loadGameData() {
  const sandbox = { window: {} };
  vm.runInNewContext(read('js/game-data.js'), sandbox, {
    filename: path.join(ROOT, 'js', 'game-data.js')
  });
  assert.ok(sandbox.window.GAME_DATA, 'js/game-data.js doit exposer window.GAME_DATA');
  return sandbox.window.GAME_DATA;
}

const DATA = loadGameData();

test('le catalogue respecte les volumes de livraison', () => {
  const minimums = {
    items: 30,
    shelves: 10,
    themes: 8,
    lights: 7,
    challenges: 12
  };

  for (const [group, minimum] of Object.entries(minimums)) {
    assert.ok(Array.isArray(DATA[group]), `GAME_DATA.${group} doit être un tableau`);
    assert.ok(
      DATA[group].length >= minimum,
      `GAME_DATA.${group} doit contenir au moins ${minimum} entrées (reçu : ${DATA[group].length})`
    );
  }
});

test('tous les identifiants de contenu sont uniques et stables', () => {
  for (const group of ['items', 'shelves', 'themes', 'lights', 'challenges']) {
    const ids = DATA[group].map(entry => entry && entry.id);
    ids.forEach((id, index) => {
      assert.equal(typeof id, 'string', `${group}[${index}].id doit être une chaîne`);
      assert.match(id, /^[a-z0-9][a-z0-9_-]*$/, `${group}[${index}].id est invalide : ${id}`);
    });
    assert.equal(new Set(ids).size, ids.length, `GAME_DATA.${group} contient des IDs en double`);
  }
});

test('chaque objet pointe vers un SVG local existant et possède ses métadonnées essentielles', () => {
  const rarityIds = new Set(Object.keys(DATA.rarity || {}));
  const assetRoot = path.resolve(ROOT, 'assets', 'items');

  for (const item of DATA.items) {
    for (const field of ['name', 'category', 'universe', 'collection', 'rarity', 'image']) {
      assert.equal(typeof item[field], 'string', `${item.id}.${field} doit être une chaîne`);
      assert.ok(item[field].trim(), `${item.id}.${field} ne doit pas être vide`);
    }
    assert.ok(rarityIds.has(item.rarity), `${item.id} référence une rareté inconnue : ${item.rarity}`);
    assert.ok(Number(item.price) >= 0, `${item.id}.price doit être positif ou nul`);
    assert.ok(Number(item.weight) > 0, `${item.id}.weight doit être strictement positif`);
    assert.ok(Number(item.width) > 0 && Number(item.height) > 0, `${item.id} doit avoir des dimensions positives`);
    assert.match(item.image, /^assets\/items\/[a-z0-9_-]+\.svg$/, `${item.id}.image doit être un SVG local normalisé`);

    const imagePath = path.resolve(ROOT, item.image.split('/').join(path.sep));
    const relativeToAssets = path.relative(assetRoot, imagePath);
    assert.ok(relativeToAssets && !relativeToAssets.startsWith('..') && !path.isAbsolute(relativeToAssets), `${item.id}.image sort du dossier assets/items`);
    assert.ok(fs.existsSync(imagePath), `SVG absent pour ${item.id} : ${item.image}`);
    assert.match(fs.readFileSync(imagePath, 'utf8'), /<svg\b/i, `${item.image} n'est pas un SVG lisible`);
  }
});

test('les défis sont déclaratifs, uniques et vérifiables', () => {
  const supportedMetrics = new Set([
    'displayed', 'same_universe', 'category_mix', 'day', 'prestige', 'rare_display',
    'shelves', 'owned_unique', 'themes', 'visits', 'unique_presentations', 'collections', 'level'
  ]);

  for (const challenge of DATA.challenges) {
    assert.ok(challenge.title && challenge.description, `${challenge.id} doit avoir un titre et une description`);
    assert.ok(supportedMetrics.has(challenge.metric), `${challenge.id} utilise une métrique inconnue : ${challenge.metric}`);
    assert.ok(Number(challenge.target) > 0, `${challenge.id}.target doit être strictement positif`);
    assert.ok(Number(challenge.reward) >= 0, `${challenge.id}.reward doit être positif ou nul`);
    assert.ok(Number(challenge.minLevel) >= 1, `${challenge.id}.minLevel doit être au moins 1`);
  }
});

test('tous les seuils de progression restent atteignables avant la fin de carrière', () => {
  assert.ok(Array.isArray(DATA.careerChapters) && DATA.careerChapters.length > 0, 'Les chapitres de carrière sont absents');
  const maxCareerLevel = Math.max(...DATA.careerChapters.map(chapter => Number(chapter.level) || 1));
  const rarityUnlockLevel = { common: 1, uncommon: 1, rare: 2, epic: 4, legendary: 6 };
  const completedCollectionCount = new Map();
  DATA.items.forEach(item => completedCollectionCount.set(item.collection, (completedCollectionCount.get(item.collection) || 0) + 1));
  const reachableCollections = [...completedCollectionCount.values()].filter(size => size >= 2).length;

  for (const item of DATA.items) {
    const unlockLevel = Number.isFinite(Number(item.unlockLevel))
      ? Number(item.unlockLevel)
      : rarityUnlockLevel[item.rarity] || 1;
    assert.ok(unlockLevel <= maxCareerLevel, `${item.id} exige le niveau ${unlockLevel}, au-delà du niveau maximal ${maxCareerLevel}`);
  }
  for (const [groupName, group] of [['shelves', DATA.shelves], ['themes', DATA.themes], ['lights', DATA.lights]]) {
    for (const entry of group) {
      const unlockLevel = Number(entry.unlockLevel) || 1;
      assert.ok(unlockLevel <= maxCareerLevel, `${groupName}.${entry.id} exige un niveau de carrière impossible : ${unlockLevel}`);
    }
  }
  for (const challenge of DATA.challenges) {
    assert.ok(Number(challenge.minLevel) <= maxCareerLevel, `${challenge.id} se débloque après la fin de carrière`);
  }
  for (const chapter of DATA.careerChapters) {
    assert.ok(Number(chapter.challengesRequired || 0) <= DATA.challenges.length, `${chapter.id} exige trop de défis`);
    assert.ok(Number(chapter.collectionsRequired || 0) <= reachableCollections, `${chapter.id} exige trop de collections`);
  }
});

test('le manifeste et le service worker forment un contrat PWA complet', () => {
  const manifestPath = path.join(ROOT, 'manifest.webmanifest');
  const serviceWorkerPath = path.join(ROOT, 'sw.js');
  assert.ok(fs.existsSync(manifestPath), 'manifest.webmanifest est absent');
  assert.ok(fs.existsSync(serviceWorkerPath), 'sw.js est absent');

  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  assert.ok(manifest.name && manifest.short_name, 'Le manifeste doit définir name et short_name');
  assert.ok(manifest.start_url, 'Le manifeste doit définir start_url');
  assert.ok(['standalone', 'fullscreen', 'minimal-ui'].includes(manifest.display), 'Le manifeste doit proposer un affichage installable');
  assert.ok(Array.isArray(manifest.icons) && manifest.icons.length > 0, 'Le manifeste doit déclarer au moins une icône');
  for (const icon of manifest.icons) {
    assert.ok(icon.src && icon.sizes && icon.type, 'Chaque icône du manifeste doit définir src, sizes et type');
    if (/^(?:data:|https?:)/.test(icon.src)) continue;
    const iconPath = path.resolve(ROOT, icon.src.replace(/^\.?\//, '').split('/').join(path.sep));
    assert.ok(fs.existsSync(iconPath), `Icône PWA absente : ${icon.src}`);
  }

  const sw = fs.readFileSync(serviceWorkerPath, 'utf8');
  for (const eventName of ['install', 'activate', 'fetch']) {
    assert.match(sw, new RegExp(`addEventListener\\(\\s*['\"]${eventName}['\"]`), `sw.js doit écouter ${eventName}`);
  }
  for (const coreAsset of ['index.html', 'styles.css', 'js/game-data.js', 'js/app.js', 'manifest.webmanifest']) {
    assert.ok(sw.includes(coreAsset), `sw.js doit mettre en cache ${coreAsset}`);
  }

  const index = read('index.html');
  const runtime = `${index}\n${read('js/app.js')}`;
  assert.match(index, /<link[^>]+rel=["']manifest["'][^>]+href=["'](?:\.\/)?manifest\.webmanifest["']/i, 'index.html doit référencer le manifeste');
  assert.match(runtime, /serviceWorker\.register\(\s*["'](?:\.\/|\/)?sw\.js["']/, 'Le runtime doit enregistrer sw.js');
});

test('la commande de build produit une version autonome sans références de jeu externes', () => {
  const packageJson = JSON.parse(read('package.json'));
  assert.equal(packageJson.scripts.build, 'py -3 build_single_file.py');
  assert.equal(packageJson.scripts['test:unit'], 'node --test tests/static-contracts.test.js');
  assert.equal(packageJson.scripts['test:e2e'], 'playwright test');

  const buildScript = read('build_single_file.py');
  for (const source of ['index.html', 'styles.css', 'game-data.js', 'app.js', 'assets']) {
    assert.ok(buildScript.includes(source), `Le build doit intégrer ${source}`);
  }

  const standalonePath = path.join(ROOT, 'VITRINEVERSE_PLAY.html');
  assert.ok(fs.existsSync(standalonePath), 'VITRINEVERSE_PLAY.html est absent ; exécuter npm run build');
  const standalone = fs.readFileSync(standalonePath, 'utf8');
  assert.match(standalone, /<style>[\s\S]+<\/style>/i, 'La feuille de styles doit être intégrée au fichier autonome');
  assert.match(standalone, /data:image\/svg\+xml;base64,/i, 'Les SVG doivent être intégrés en data URI');
  assert.doesNotMatch(standalone, /<link[^>]+href=["']styles\.css["']/i, 'Le fichier autonome référence encore styles.css');
  assert.doesNotMatch(standalone, /<script[^>]+src=["']js\/(?:game-data|app)\.js["']/i, 'Le fichier autonome référence encore les scripts de jeu');
});
