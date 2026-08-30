const fs = require('node:fs');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const vm = require('node:vm');
const { test, expect } = require('@playwright/test');

const ROOT = path.resolve(__dirname, '..');
const SAVE_KEY = 'vitrineverse_save_v2';
const BACKUP_SAVE_KEY = 'vitrineverse_backup_v2';
const LEGACY_SAVE_KEY = 'vitrineverse_save_v1';

function loadGameData() {
  const sandbox = { window: {} };
  vm.runInNewContext(fs.readFileSync(path.join(ROOT, 'js', 'game-data.js'), 'utf8'), sandbox);
  return sandbox.window.GAME_DATA;
}

const DATA = loadGameData();

function collectorState(overrides = {}) {
  const shelves = DATA.shelves.slice(0, 8).map((shelf, index) => ({
    id: `qa_shelf_${index}`,
    type: shelf.id
  }));
  const items = DATA.items.map((item, index) => ({
    instanceId: `qa_item_${index}`,
    defId: item.id,
    location: 'shelf',
    shelfId: shelves[index % shelves.length].id,
    x: 10 + ((index * 17) % 80),
    scale: 0.86,
    flipped: false,
    z: (index % 8) + 1,
    acquiredDay: 1,
    condition: 1,
    sentimentalValue: 0
  }));

  return {
    version: 2,
    coins: 50_000,
    day: 99,
    cleanliness: 100,
    bestPrestige: 10_000,
    reputation: 1_000_000,
    visits: 99,
    visitorStreak: 5,
    galleryName: 'Galerie de contrôle',
    currentTheme: DATA.themes[0].id,
    currentLight: DATA.lights[0].id,
    placementMode: 'magnetic',
    soundEnabled: false,
    unlockedThemes: DATA.themes.map(theme => theme.id),
    unlockedLights: DATA.lights.map(light => light.id),
    highestCareerLevel: Math.max(1, ...(DATA.careerChapters || []).map(chapter => Number(chapter.level) || 1)),
    shelves,
    items,
    customItems: [],
    challengeIndex: 0,
    completedChallenges: [],
    collectionRewards: [...new Set(DATA.items.map(item => item.collection))],
    claimedChapters: (DATA.careerChapters || []).map(chapter => chapter.id),
    lastVisitSignature: '',
    repeatVisitCount: 0,
    tutorial: {
      welcomeSeen: true,
      exploredShop: true,
      acquired: true,
      arranged: true,
      hosted: true,
      rewardClaimed: true
    },
    log: ['État de contrôle chargé.'],
    ...overrides
  };
}

async function openFreshGame(page) {
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: 'domcontentloaded' });
  await expect(page.locator('#galleryTitle')).toBeVisible();
}

async function openWithState(page, state) {
  await page.goto('/');
  await page.evaluate(({ key, value }) => {
    localStorage.clear();
    localStorage.setItem(key, JSON.stringify(value));
  }, { key: SAVE_KEY, value: state });
  await page.reload({ waitUntil: 'domcontentloaded' });
  await expect(page.locator('#galleryTitle')).toBeVisible();
}

async function openWithLegacyState(page, state) {
  await page.goto('/');
  await page.evaluate(({ legacyKey, value }) => {
    localStorage.clear();
    localStorage.setItem(legacyKey, JSON.stringify(value));
  }, { legacyKey: LEGACY_SAVE_KEY, value: state });
  await page.reload({ waitUntil: 'domcontentloaded' });
  await expect(page.locator('#galleryTitle')).toBeVisible();
}

async function dismissWelcome(page) {
  const welcome = page.locator('#welcomeDialog');
  if (await welcome.count()) {
    await expect(welcome).toBeVisible();
    await page.locator('#startJourneyBtn').click();
    await expect(welcome).not.toBeVisible();
  }
}

async function savedState(page) {
  return page.evaluate(key => JSON.parse(localStorage.getItem(key)), SAVE_KEY);
}

async function importPayload(page, payload, fileName = 'sauvegarde.json') {
  await page.locator('#importSaveInput').setInputFiles({
    name: fileName,
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify(payload))
  });
}

async function hostVisit(page) {
  await page.locator('#visitorsBtn').click();
  await expect(page.locator('#visitDialog')).toBeVisible();
  const report = await page.locator('#visitReportBody').innerText();
  const freshness = report.match(/Fraîcheur\s*(\d+)%/i);
  expect(freshness, `Fraîcheur absente du rapport : ${report}`).toBeTruthy();
  await page.locator('#closeVisitReportBtn').click();
  await expect(page.locator('#visitDialog')).not.toBeVisible();
  return Number(freshness[1]);
}

async function blockPrimarySaveWrites(page) {
  await page.evaluate(key => {
    window.__nativeStorageSetItem ??= Storage.prototype.setItem;
    Storage.prototype.setItem = function setItem(storageKey, value) {
      if (storageKey === key) throw new DOMException('Quota simulé', 'QuotaExceededError');
      return window.__nativeStorageSetItem.call(this, storageKey, value);
    };
  }, SAVE_KEY);
}

async function restoreStorageWrites(page) {
  await page.evaluate(() => {
    if (window.__nativeStorageSetItem) Storage.prototype.setItem = window.__nativeStorageSetItem;
  });
}

test('le nouveau joueur découvre une galerie jouable et un onboarding persistant', async ({ page }) => {
  const pageErrors = [];
  page.on('pageerror', error => pageErrors.push(error.message));

  await openFreshGame(page);
  await expect(page.locator('#welcomeDialog')).toBeVisible();
  await expect(page.locator('#startJourneyBtn')).toBeVisible();
  await page.locator('#startJourneyBtn').click();

  await expect(page.locator('#tutorialCard')).toBeVisible();
  await expect(page.locator('#shelves .shelf-unit')).toHaveCount(1);
  await expect(page.locator('#inventoryGrid .item-card')).not.toHaveCount(0);
  await expect(page.locator('#shelves .placed-item')).not.toHaveCount(0);
  await expect(page.locator('#galleryTitle')).toContainText(/Cabinet|Galerie/i);

  const state = await savedState(page);
  expect(state.version).toBe(2);
  expect(state.tutorial.welcomeSeen).toBe(true);
  expect(pageErrors).toEqual([]);
});

test('achat, placement rapide et visite forment une boucle sauvegardée', async ({ page }) => {
  await openFreshGame(page);
  await dismissWelcome(page);

  const coinsAtStart = Number((await page.locator('#coinsStat').innerText()).replace(/\D/g, ''));
  await page.locator('[data-panel-tab="shop"]').click();
  const buyButton = page.locator('[data-buy-item]:not([disabled])').first();
  await expect(buyButton).toBeVisible();
  const defId = await buyButton.getAttribute('data-buy-item');
  await buyButton.click();

  const afterPurchase = await savedState(page);
  expect(afterPurchase.coins).toBeLessThan(coinsAtStart);
  const purchased = [...afterPurchase.items].reverse().find(item => item.defId === defId && item.location === 'inventory');
  expect(purchased).toBeTruthy();

  await page.locator(`[data-quick-place="${purchased.instanceId}"]`).click();
  const afterPlacement = await savedState(page);
  expect(afterPlacement.items.find(item => item.instanceId === purchased.instanceId).location).toBe('shelf');
  const beforeVisit = { coins: afterPlacement.coins, day: afterPlacement.day };

  await page.locator('#visitorsBtn').click();
  const afterVisit = await savedState(page);
  expect(afterVisit.day).toBe(beforeVisit.day + 1);
  expect(afterVisit.coins).toBeGreaterThan(beforeVisit.coins);
  expect(afterVisit.tutorial.hosted).toBe(true);
});

test('un défi terminé ne peut jamais être réclamé une deuxième fois', async ({ page }) => {
  const lastChallenge = DATA.challenges.at(-1);
  const alreadyCompleted = DATA.challenges.slice(0, -1).map(challenge => challenge.id);
  await openWithState(page, collectorState({ completedChallenges: alreadyCompleted }));

  const claimButton = page.locator('#claimChallengeBtn');
  await expect(claimButton).toBeEnabled();
  const before = await savedState(page);
  await claimButton.click();
  const afterClaim = await savedState(page);

  expect(afterClaim.coins).toBe(before.coins + Number(lastChallenge.reward));
  expect(afterClaim.completedChallenges.filter(id => id === lastChallenge.id)).toHaveLength(1);
  expect(new Set(afterClaim.completedChallenges).size).toBe(DATA.challenges.length);
  await expect(claimButton).toBeDisabled();

  await page.evaluate(() => document.querySelector('#claimChallengeBtn').click());
  await page.reload({ waitUntil: 'domcontentloaded' });
  const afterRetry = await savedState(page);
  expect(afterRetry.coins).toBe(afterClaim.coins);
  expect(afterRetry.completedChallenges.filter(id => id === lastChallenge.id)).toHaveLength(1);
});

test('la reprise localStorage restaure exactement la galerie', async ({ page }) => {
  const state = collectorState({
    galleryName: 'Le Salon des souvenirs',
    coins: 1_234,
    day: 42,
    currentLight: DATA.lights.at(-1).id
  });
  await openWithState(page, state);

  await expect(page.locator('#galleryTitle')).toHaveText('Le Salon des souvenirs');
  await expect(page.locator('#coinsStat')).toContainText('1');
  await expect(page.locator('#dayStat')).toHaveText('42');
  await expect(page.locator('body')).toHaveAttribute('data-light', DATA.lights.at(-1).id);

  await page.reload({ waitUntil: 'domcontentloaded' });
  const resumed = await savedState(page);
  expect(resumed.galleryName).toBe(state.galleryName);
  expect(resumed.coins).toBe(state.coins);
  expect(resumed.day).toBe(state.day);
  expect(resumed.items).toHaveLength(state.items.length);
});

test('une sauvegarde principale corrompue récupère la copie de secours sans écraser les données brutes', async ({ page }) => {
  const backup = collectorState({
    galleryName: 'La Galerie récupérée',
    coins: 4_321,
    day: 27
  });
  const damagedPrimary = '{"version":2';

  await page.goto('/');
  await page.evaluate(({ saveKey, backupKey, damaged, backupState }) => {
    localStorage.clear();
    localStorage.setItem(saveKey, damaged);
    localStorage.setItem(backupKey, JSON.stringify(backupState));
  }, {
    saveKey: SAVE_KEY,
    backupKey: BACKUP_SAVE_KEY,
    damaged: damagedPrimary,
    backupState: backup
  });
  await page.reload({ waitUntil: 'domcontentloaded' });

  await expect(page.locator('#galleryTitle')).toHaveText(backup.galleryName);
  await expect(page.locator('#dayStat')).toHaveText(String(backup.day));
  await expect(page.locator('#toastStack .toast.error')).toContainText(/copie de secours/i);
  expect(await page.evaluate(key => localStorage.getItem(key), SAVE_KEY)).toBe(damagedPrimary);
  expect(JSON.parse(await page.evaluate(key => localStorage.getItem(key), BACKUP_SAVE_KEY)).galleryName)
    .toBe(backup.galleryName);
});

test('une sauvegarde v1 migre vers v2 sans perdre la galerie ni ses placements', async ({ page }) => {
  const legacyState = {
    version: 1,
    coins: 864,
    day: 17,
    cleanliness: 73,
    bestPrestige: 286,
    galleryName: 'Le Cabinet hérité',
    currentTheme: 'retroroom',
    currentLight: 'dark',
    unlockedThemes: ['bedroom', 'retroroom'],
    shelves: [
      { id: 'legacy_wood', type: 'wood' },
      { id: 'legacy_glass', type: 'glass' }
    ],
    items: [
      {
        instanceId: 'legacy_ronin', defId: 'neon_ronin', location: 'shelf',
        shelfId: 'legacy_wood', x: 23, scale: 0.91, flipped: true, z: 4, acquiredDay: 2
      },
      {
        instanceId: 'legacy_comic', defId: 'comic_stack', location: 'shelf',
        shelfId: 'legacy_glass', x: 68, scale: 0.84, flipped: false, z: 2, acquiredDay: 4
      },
      {
        instanceId: 'legacy_plush', defId: 'alien_plush', location: 'inventory',
        shelfId: null, x: 50, scale: 1, flipped: false, z: 1, acquiredDay: 6
      }
    ],
    customItems: [],
    challengeIndex: 1,
    completedChallenges: ['same_universe'],
    log: ['Cette galerie existait avant la migration.']
  };

  await openWithLegacyState(page, legacyState);
  await expect(page.locator('#galleryTitle')).toHaveText(legacyState.galleryName);
  await expect(page.locator('#shelves .shelf-unit')).toHaveCount(2);
  await expect(page.locator('[data-placed-id="legacy_ronin"]')).toBeVisible();
  await expect(page.locator('[data-placed-id="legacy_comic"]')).toBeVisible();

  const migrated = await savedState(page);
  expect(migrated.version).toBe(2);
  expect(migrated.galleryName).toBe(legacyState.galleryName);
  expect(migrated.coins).toBe(legacyState.coins);
  expect(migrated.day).toBe(legacyState.day);
  expect(migrated.currentTheme).toBe(legacyState.currentTheme);
  expect(migrated.currentLight).toBe(legacyState.currentLight);
  expect(migrated.shelves).toEqual(legacyState.shelves);
  expect(migrated.items.map(item => ({
    instanceId: item.instanceId,
    defId: item.defId,
    location: item.location,
    shelfId: item.shelfId,
    x: item.x,
    scale: item.scale,
    flipped: item.flipped,
    z: item.z,
    acquiredDay: item.acquiredDay
  }))).toEqual(legacyState.items);
  expect(migrated.items.every(item => item.condition === 1 && item.sentimentalValue === 0)).toBe(true);

  const legacyCopy = await page.evaluate(key => JSON.parse(localStorage.getItem(key)), LEGACY_SAVE_KEY);
  expect(legacyCopy).toEqual(legacyState);
  await page.reload({ waitUntil: 'domcontentloaded' });
  expect((await savedState(page)).galleryName).toBe(legacyState.galleryName);
  await expect(page.locator('[data-placed-id="legacy_ronin"]')).toBeVisible();
});

test('la progression maximale rend chaque contenu atteignable', async ({ page }) => {
  const maxState = collectorState({
    day: 1,
    completedChallenges: DATA.challenges.map(challenge => challenge.id),
    unlockedThemes: ['bedroom'],
    currentTheme: 'bedroom'
  });
  await openWithState(page, maxState);

  await expect(page.locator('#levelStat')).toHaveText('6');
  await expect(page.locator('#lightSelect option')).toHaveCount(DATA.lights.length);

  await page.locator('[data-panel-tab="shop"]').click();
  const reachableItemIds = new Set();
  const rotationDays = Math.max(DATA.items.length, 1);
  for (let day = 1; day <= rotationDays; day += 1) {
    await page.evaluate(({ key, nextDay }) => {
      const state = JSON.parse(localStorage.getItem(key));
      state.day = nextDay;
      localStorage.setItem(key, JSON.stringify(state));
    }, { key: SAVE_KEY, nextDay: day });
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.locator('[data-panel-tab="shop"]').click();
    for (const id of await page.locator('[data-buy-item]').evaluateAll(buttons => buttons.map(button => button.dataset.buyItem))) {
      reachableItemIds.add(id);
    }
    if (reachableItemIds.size === DATA.items.length) break;
  }
  expect([...reachableItemIds].sort()).toEqual(DATA.items.map(item => item.id).sort());

  await page.locator('[data-shop-tab="shelves"]').click();
  await expect(page.locator('[data-buy-shelf]')).toHaveCount(DATA.shelves.length);
  expect((await page.locator('[data-buy-shelf]').allTextContents()).filter(label => /Verrouill/i.test(label))).toEqual([]);

  await page.locator('[data-shop-tab="themes"]').click();
  await expect(page.locator('[data-theme-action]')).toHaveCount(DATA.themes.length);
  expect((await page.locator('[data-theme-action]').allTextContents()).filter(label => /Verrouill/i.test(label))).toEqual([]);
  await expect(page.locator('[data-light-action]')).toHaveCount(DATA.lights.length);
  expect((await page.locator('[data-light-action]').allTextContents()).filter(label => /Verrouill/i.test(label))).toEqual([]);
});

test('un chapitre acquis reste débloqué après la perte des conditions initiales', async ({ page }) => {
  const preservedLevel = 4;
  const sparseState = collectorState({
    highestCareerLevel: 1,
    claimedChapters: DATA.careerChapters.slice(0, preservedLevel).map(chapter => chapter.id),
    completedChallenges: [],
    items: [collectorState().items[0]],
    bestPrestige: 0,
    reputation: 0
  });
  await openWithState(page, sparseState);
  await expect(page.locator('#levelStat')).toHaveText(String(preservedLevel));
  expect((await savedState(page)).highestCareerLevel).toBe(preservedLevel);
});

test('une ambiance lumineuse tarifée est achetée puis persistée', async ({ page }) => {
  const targetLight = DATA.lights.find(light => light.id !== 'warm');
  const state = collectorState({ unlockedLights: ['warm'], currentLight: 'warm' });
  await openWithState(page, state);
  await page.locator('[data-panel-tab="shop"]').click();
  await page.locator('[data-shop-tab="themes"]').click();
  const before = await savedState(page);
  await page.locator(`[data-light-action="${targetLight.id}"]`).click();
  const after = await savedState(page);
  expect(after.unlockedLights).toContain(targetLight.id);
  expect(after.currentLight).toBe(targetLight.id);
  expect(after.coins).toBe(before.coins - targetLight.price);
});

test('un échec de quota annule entièrement un achat', async ({ page }) => {
  await openFreshGame(page);
  await dismissWelcome(page);
  await page.locator('[data-panel-tab="shop"]').click();
  const before = await savedState(page);
  await blockPrimarySaveWrites(page);
  await page.locator('[data-buy-item]:not([disabled])').first().click();
  const after = await savedState(page);
  expect(after.coins).toBe(before.coins);
  expect(after.items).toHaveLength(before.items.length);
  await expect(page.locator('#saveStatus')).toContainText(/saturée/i);
  await expect(page.locator('#toastStack')).toContainText(/quota/i);
  await restoreStorageWrites(page);
});

test('annuler et rétablir conservent état et piles si la sauvegarde échoue', async ({ page }) => {
  await openFreshGame(page);
  await dismissWelcome(page);
  await page.locator('[data-panel-tab="shop"]').click();
  await page.locator('[data-buy-item]:not([disabled])').first().click();
  const purchased = await savedState(page);

  await blockPrimarySaveWrites(page);
  await page.locator('#undoBtn').click();
  expect(await savedState(page)).toEqual(purchased);
  await expect(page.locator('#toastStack')).toContainText(/quota/i);
  await restoreStorageWrites(page);

  await page.locator('#undoBtn').click();
  const undone = await savedState(page);
  expect(undone.items).toHaveLength(purchased.items.length - 1);
  expect(undone.coins).toBeGreaterThan(purchased.coins);

  await blockPrimarySaveWrites(page);
  await page.locator('#redoBtn').click();
  expect(await savedState(page)).toEqual(undone);
  await restoreStorageWrites(page);

  await page.locator('#redoBtn').click();
  expect(await savedState(page)).toEqual(purchased);
});

test('un import JSON invalide est refusé sans altérer la sauvegarde', async ({ page }) => {
  await openWithState(page, collectorState({ galleryName: 'Sauvegarde intacte', coins: 7_777 }));
  const before = await page.evaluate(key => localStorage.getItem(key), SAVE_KEY);

  await page.locator('#importSaveInput').setInputFiles({
    name: 'sauvegarde-invalide.json',
    mimeType: 'application/json',
    buffer: Buffer.from('{ "game": "VITRINE//VERSE", "state": ')
  });
  await expect(page.locator('#toastStack .toast.error')).toBeVisible();

  const after = await page.evaluate(key => localStorage.getItem(key), SAVE_KEY);
  expect(after).toBe(before);
  await expect(page.locator('#galleryTitle')).toHaveText('Sauvegarde intacte');
});

test('l’import supprime les champs inconnus et borne les propriétés des créations', async ({ page }) => {
  const baseline = collectorState({ galleryName: 'Import nettoyé' });
  const customId = 'custom_guarded';
  baseline.junk = 'x'.repeat(200_000);
  baseline.customItems = [{
    id: customId,
    name: 'Relique personnelle',
    universe: 'Atelier QA',
    category: 'Objet',
    rarity: 'rare',
    image: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=',
    weight: -100,
    width: 'invalide',
    height: 1
  }];
  baseline.items.push({
    instanceId: 'qa_custom_guarded',
    defId: customId,
    location: 'inventory',
    shelfId: null,
    x: 50,
    scale: 1,
    flipped: false,
    z: 1,
    acquiredDay: 1,
    condition: 1,
    sentimentalValue: 0
  });

  await openFreshGame(page);
  await importPayload(page, {
    game: 'VITRINE//VERSE',
    schemaVersion: 2,
    dataVersion: DATA.version,
    state: baseline
  }, 'sauvegarde-nettoyee.json');
  const imported = await savedState(page);
  const custom = imported.customItems.find(item => item.id === customId);
  expect(imported.junk).toBeUndefined();
  expect(custom.weight).toBe(.1);
  expect(custom.width).toBe(92);
  expect(custom.height).toBe(48);
});

for (const unsafeImport of [
  {
    label: 'plus de mille instances',
    mutate(state) {
      state.items = Array.from({ length: 1001 }, (_, index) => ({
        instanceId: `overflow_${index}`,
        defId: DATA.items[0].id,
        location: 'inventory',
        shelfId: null,
        x: 50,
        scale: 1,
        flipped: false,
        z: 1,
        acquiredDay: 1,
        condition: 1,
        sentimentalValue: 0
      }));
    }
  },
  {
    label: 'deux instances d’une même création personnelle',
    mutate(state) {
      const customId = 'custom_duplicated';
      state.customItems = [{
        id: customId,
        name: 'Création dupliquée',
        image: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII='
      }];
      state.items.push(...[1, 2].map(index => ({
        instanceId: `custom_duplicate_${index}`,
        defId: customId,
        location: 'inventory',
        shelfId: null,
        x: 50,
        scale: 1,
        flipped: false,
        z: 1,
        acquiredDay: 1,
        condition: 1,
        sentimentalValue: 0
      })));
    }
  }
]) {
  test(`un import contenant ${unsafeImport.label} est refusé sans perte`, async ({ page }) => {
    const baseline = collectorState({ galleryName: 'Base protégée' });
    await openWithState(page, baseline);
    const before = await page.evaluate(key => localStorage.getItem(key), SAVE_KEY);
    const candidate = JSON.parse(before);
    unsafeImport.mutate(candidate);
    await importPayload(page, {
      game: 'VITRINE//VERSE',
      schemaVersion: 2,
      dataVersion: DATA.version,
      state: candidate
    }, 'sauvegarde-hors-limites.json');
    await expect(page.locator('#toastStack .toast.error')).toBeVisible();
    expect(await page.evaluate(key => localStorage.getItem(key), SAVE_KEY)).toBe(before);
  });
}

for (const unknownContent of [
  {
    label: 'un type d’étagère inconnu',
    mutate(state) { state.shelves[0].type = 'future_shelf_type'; }
  },
  {
    label: 'une définition d’objet inconnue',
    mutate(state) { state.items[0].defId = 'future_item_definition'; }
  }
]) {
  test(`un import v2 contenant ${unknownContent.label} est refusé sans perte`, async ({ page }) => {
    const baseline = collectorState({ galleryName: 'Sauvegarde de référence', coins: 9_321 });
    await openWithState(page, baseline);
    const before = await page.evaluate(key => localStorage.getItem(key), SAVE_KEY);
    const candidate = JSON.parse(before);
    unknownContent.mutate(candidate);

    await importPayload(page, {
      game: 'VITRINE//VERSE',
      schemaVersion: 2,
      dataVersion: DATA.version,
      state: candidate
    }, 'sauvegarde-v2-contenu-inconnu.json');
    await expect(page.locator('#toastStack .toast.error')).toBeVisible();

    const after = await page.evaluate(key => localStorage.getItem(key), SAVE_KEY);
    expect(after).toBe(before);
    await expect(page.locator('#galleryTitle')).toHaveText('Sauvegarde de référence');
    expect((await savedState(page)).items).toHaveLength(baseline.items.length);
  });
}

test('alterner deux compositions ne réinitialise pas l’anti-farm, même après rechargement', async ({ page }) => {
  await openWithState(page, collectorState({
    currentLight: 'warm',
    completedChallenges: DATA.challenges.map(challenge => challenge.id),
    recentVisitSignatures: [],
    lastVisitSignature: '',
    repeatVisitCount: 0
  }));

  await page.locator('#lightSelect').selectOption('warm');
  const firstA = await hostVisit(page);
  expect(firstA).toBe(100);
  await page.locator('#lightSelect').selectOption('cool');
  const firstB = await hostVisit(page);
  expect(firstB).toBe(100);
  await page.locator('#lightSelect').selectOption('warm');
  const secondA = await hostVisit(page);
  expect(secondA).toBeGreaterThan(0);
  expect(secondA).toBeLessThan(firstA);
  await page.locator('#lightSelect').selectOption('cool');
  const secondB = await hostVisit(page);
  expect(secondB).toBe(secondA);

  const beforeReload = await savedState(page);
  expect(beforeReload.recentVisitSignatures).toHaveLength(4);
  expect(new Set(beforeReload.recentVisitSignatures).size).toBe(2);
  expect(Object.values(beforeReload.visitSignatureCounts).sort((a, b) => a - b)).toEqual([2, 2]);

  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.locator('#lightSelect').selectOption('warm');
  const thirdA = await hostVisit(page);
  expect(thirdA).toBeLessThan(secondA);

  await page.reload({ waitUntil: 'domcontentloaded' });
  const persisted = await savedState(page);
  expect(persisted.recentVisitSignatures).toHaveLength(5);
  expect(new Set(persisted.recentVisitSignatures).size).toBe(2);
  expect(Object.values(persisted.visitSignatureCounts).sort((a, b) => a - b)).toEqual([2, 3]);
  expect(persisted.visits).toBe(beforeReload.visits + 1);
});

test('le carnet de visites compte les présentations distinctes, pas les clics répétés', async ({ page }) => {
  const challengeIndex = DATA.challenges.findIndex(challenge => challenge.id === 'gallery_regular');
  const signatures = Object.fromEntries(Array.from({ length: 11 }, (_, index) => [
    `visit_${index.toString(16).padStart(8, '0')}_42`, 1
  ]));
  await openWithState(page, collectorState({
    completedChallenges: DATA.challenges.slice(0, challengeIndex).map(challenge => challenge.id),
    visitSignatureCounts: signatures,
    visits: 99
  }));

  await expect(page.locator('#challengeTitle')).toHaveText('Carnet de visites');
  await expect(page.locator('#challengeProgressText')).toHaveText('11 / 12');
  await expect(page.locator('#claimChallengeBtn')).toBeDisabled();
  await hostVisit(page);
  await expect(page.locator('#challengeProgressText')).toHaveText('12 / 12');
  await expect(page.locator('#claimChallengeBtn')).toBeEnabled();
});

test('les sous-onglets de boutique suivent un focus clavier roving', async ({ page }) => {
  await openFreshGame(page);
  await dismissWelcome(page);
  await page.locator('[data-panel-tab="shop"]').click();
  const itemsTab = page.locator('[data-shop-tab="items"]');
  const shelvesTab = page.locator('[data-shop-tab="shelves"]');
  await itemsTab.focus();
  await page.keyboard.press('ArrowRight');
  await expect(shelvesTab).toBeFocused();
  await expect(shelvesTab).toHaveAttribute('aria-selected', 'true');
  await expect(shelvesTab).toHaveAttribute('tabindex', '0');
  await expect(itemsTab).toHaveAttribute('tabindex', '-1');
});

test('la sélection clavier d’une pièce conserve son focus après le rendu', async ({ page }) => {
  await openFreshGame(page);
  await dismissWelcome(page);
  const firstButton = page.locator('#inventoryGrid [data-select-item]').first();
  const instanceId = await firstButton.getAttribute('data-select-item');
  await firstButton.focus();
  await page.keyboard.press('Enter');
  await expect(page.locator(`[data-select-item="${instanceId}"]`)).toBeFocused();
});

test.describe('parcours tactiles 390×844', () => {
  test.use({
    viewport: { width: 390, height: 844 },
    hasTouch: true,
    isMobile: true
  });

  test('placement et réorganisation fonctionnent sans glisser-déposer', async ({ page }) => {
    await openFreshGame(page);
    await dismissWelcome(page);

    const inspector = page.locator('#inspectorPanel');
    await expect(inspector).toBeVisible();
    const inventoryCard = page.locator('#inventoryGrid .item-card').first();
    const instanceId = await inventoryCard.getAttribute('data-instance-id');
    await inventoryCard.tap();

    const placeButton = page.locator('#inspectorPlaceBtn');
    await placeButton.scrollIntoViewIfNeeded();
    await expect(placeButton).toBeVisible();
    await placeButton.tap();
    let state = await savedState(page);
    expect(state.items.find(item => item.instanceId === instanceId).location).toBe('shelf');

    const placed = page.locator(`[data-placed-id="${instanceId}"]`);
    await placed.tap();
    const beforeX = (await savedState(page)).items.find(item => item.instanceId === instanceId).x;
    const moveRight = page.locator('[data-item-action="right"]');
    await moveRight.scrollIntoViewIfNeeded();
    await moveRight.tap();
    state = await savedState(page);
    expect(state.items.find(item => item.instanceId === instanceId).x).toBeGreaterThan(beforeX);
  });

  test('le mode photo possède une sortie tactile toujours visible', async ({ page }) => {
    await openFreshGame(page);
    await dismissWelcome(page);

    await page.locator('#photoModeBtn').tap();
    await expect(page.locator('body')).toHaveClass(/photo-mode/);
    const exitButton = page.locator('#exitPhotoModeBtn');
    await expect(exitButton).toBeVisible();
    await exitButton.tap();
    await expect(page.locator('body')).not.toHaveClass(/photo-mode/);
  });
});

test('la version autonome démarre sans dépendance externe ni erreur console', async ({ page }) => {
  const pageErrors = [];
  const consoleErrors = [];
  page.on('pageerror', error => pageErrors.push(error.message));
  page.on('console', message => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });

  await page.goto(pathToFileURL(path.join(ROOT, 'VITRINEVERSE_PLAY.html')).href, { waitUntil: 'load' });
  await expect(page.locator('#galleryTitle')).toBeVisible();
  await expect(page.locator('#welcomeDialog')).toBeVisible();
  await expect(page.locator('#networkStatus')).toHaveText('Version autonome · sauvegarde locale');
  await expect(page.locator('#inventoryGrid .item-card-select')).toHaveCount(3);
  expect(pageErrors).toEqual([]);
  expect(consoleErrors).toEqual([]);
});

test('la PWA enregistre son service worker et redémarre hors ligne', async ({ page, context }) => {
  test.slow();
  await openFreshGame(page);
  await dismissWelcome(page);

  const scriptUrl = await page.evaluate(async () => {
    if (!('serviceWorker' in navigator)) throw new Error('Service Worker indisponible');
    const registration = await navigator.serviceWorker.ready;
    return (registration.active || registration.waiting || registration.installing)?.scriptURL || '';
  });
  expect(scriptUrl).toMatch(/\/sw\.js$/);

  await page.reload({ waitUntil: 'networkidle' });
  await expect.poll(() => page.evaluate(() => Boolean(navigator.serviceWorker.controller))).toBe(true);
  await context.setOffline(true);
  try {
    await page.reload({ waitUntil: 'domcontentloaded' });
    await expect(page.locator('#galleryTitle')).toBeVisible();
    await expect.poll(() => page.evaluate(() => Boolean(navigator.serviceWorker.controller))).toBe(true);
  } finally {
    await context.setOffline(false);
  }
});
