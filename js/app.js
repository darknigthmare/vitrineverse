(() => {
  'use strict';

  const DATA = window.GAME_DATA;
  const STORAGE_KEY = 'vitrineverse_save_v1';
  const MAX_HISTORY = 45;
  const MAX_SHELVES = 6;

  const challenges = [
    {
      id: 'same_universe', title: 'Trilogie thématique', reward: 180, target: 3,
      description: 'Expose trois objets du même univers sur une seule étagère.',
      progress: () => {
        let max = 0;
        for (const shelf of state.shelves) {
          const counts = {};
          displayedOn(shelf.id).forEach(item => {
            const def = getDef(item.defId);
            if (!def) return;
            counts[def.universe] = (counts[def.universe] || 0) + 1;
          });
          max = Math.max(max, ...Object.values(counts), 0);
        }
        return max;
      }
    },
    {
      id: 'category_mix', title: 'Culture sans frontières', reward: 220, target: 4,
      description: 'Réunis quatre catégories différentes dans ta galerie.',
      progress: () => new Set(displayedItems().map(item => getDef(item.defId)?.category).filter(Boolean)).size
    },
    {
      id: 'prestige_300', title: 'Galerie remarquée', reward: 260, target: 300,
      description: 'Atteins 300 points de prestige avec ta mise en scène.',
      progress: () => computePrestige()
    },
    {
      id: 'rare_five', title: 'Pièces de choix', reward: 300, target: 5,
      description: 'Expose cinq objets rares, épiques ou légendaires.',
      progress: () => displayedItems().filter(item => ['rare', 'epic', 'legendary'].includes(getDef(item.defId)?.rarity)).length
    },
    {
      id: 'four_shelves', title: 'La grande extension', reward: 350, target: 4,
      description: 'Possède au moins quatre étagères dans la galerie.',
      progress: () => state.shelves.length
    }
  ];

  let storageAvailable = true;
  let state = loadState();
  let history = [];
  let future = [];
  let selectedInstanceId = null;
  let dragPayload = null;
  let ui = {
    panelTab: 'inventory',
    shopTab: 'items',
    inventorySearch: '',
    inventoryFilter: 'Tout'
  };

  const $ = selector => document.querySelector(selector);
  const $$ = selector => Array.from(document.querySelectorAll(selector));

  const dom = {
    coinsStat: $('#coinsStat'), prestigeStat: $('#prestigeStat'), dayStat: $('#dayStat'), cleanStat: $('#cleanStat'),
    inventoryGrid: $('#inventoryGrid'), inventoryEmpty: $('#inventoryEmpty'), inventorySearch: $('#inventorySearch'),
    inventoryFilters: $('#inventoryFilters'), shopGrid: $('#shopGrid'), collectionList: $('#collectionList'),
    shelves: $('#shelves'), displayCount: $('#displayCount'), themeSelect: $('#themeSelect'), lightSelect: $('#lightSelect'),
    inspectorCard: $('#inspectorCard'), activityLog: $('#activityLog'), saveStatus: $('#saveStatus'),
    challengeTitle: $('#challengeTitle'), challengeReward: $('#challengeReward'), challengeDescription: $('#challengeDescription'),
    challengeProgress: $('#challengeProgress'), challengeProgressText: $('#challengeProgressText'), claimChallengeBtn: $('#claimChallengeBtn'),
    undoBtn: $('#undoBtn'), redoBtn: $('#redoBtn'), importDialog: $('#importDialog'), importForm: $('#importForm'),
    importSaveInput: $('#importSaveInput'), toastStack: $('#toastStack')
  };

  function uid(prefix = 'id') {
    if (window.crypto?.randomUUID) return `${prefix}_${crypto.randomUUID()}`;
    if (window.crypto?.getRandomValues) {
      const parts = new Uint32Array(3);
      crypto.getRandomValues(parts);
      return `${prefix}_${Array.from(parts).map(n => n.toString(36)).join('')}`;
    }
    return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2)}`;
  }

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function esc(value) {
    return String(value ?? '')
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#039;');
  }

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function formatNumber(value) {
    return Math.round(value).toLocaleString('fr-FR');
  }

  function createDefaultState() {
    const shelves = [
      { id: 'shelf_start_wood', type: 'wood' },
      { id: 'shelf_start_acrylic', type: 'acrylic' }
    ];
    const makeItem = (instanceId, defId, location = 'inventory', shelfId = null, x = 50, scale = 1, z = 1) => ({
      instanceId, defId, location, shelfId, x, scale, flipped: false, z, acquiredDay: 1
    });
    return {
      version: 1,
      coins: 640,
      day: 1,
      cleanliness: 94,
      bestPrestige: 0,
      galleryName: 'Cabinet principal',
      currentTheme: 'bedroom',
      currentLight: 'warm',
      unlockedThemes: ['bedroom'],
      shelves,
      items: [
        makeItem('inst_neon_ronin', 'neon_ronin', 'shelf', shelves[0].id, 22, .9, 2),
        makeItem('inst_holo_crystal', 'holo_crystal', 'shelf', shelves[0].id, 52, .86, 3),
        makeItem('inst_comic_stack', 'comic_stack', 'shelf', shelves[0].id, 79, .9, 1),
        makeItem('inst_retro_console', 'retro_console', 'shelf', shelves[1].id, 24, .9, 1),
        makeItem('inst_arcade_cart', 'arcade_cart', 'shelf', shelves[1].id, 57, .84, 2),
        makeItem('inst_vhs_night', 'vhs_night', 'shelf', shelves[1].id, 80, .82, 3),
        makeItem('inst_pixel_mage', 'pixel_mage'),
        makeItem('inst_void_cat', 'void_cat'),
        makeItem('inst_alien_plush', 'alien_plush'),
        makeItem('inst_pinboard', 'pinboard'),
        makeItem('inst_spellbook', 'spellbook')
      ],
      customItems: [],
      challengeIndex: 0,
      completedChallenges: [],
      log: [
        'La galerie est ouverte. Organise tes premières pièces.',
        'Astuce : les objets d’un même univers créent un bonus de cohérence.'
      ]
    };
  }

  function normalizeState(raw) {
    const fallback = createDefaultState();
    if (!raw || typeof raw !== 'object') return fallback;
    const normalized = {
      ...fallback,
      ...raw,
      coins: Number.isFinite(Number(raw.coins)) ? Number(raw.coins) : fallback.coins,
      day: Math.max(1, Number(raw.day) || 1),
      cleanliness: clamp(Number(raw.cleanliness) || 0, 0, 100),
      shelves: Array.isArray(raw.shelves) ? raw.shelves.slice(0, MAX_SHELVES) : fallback.shelves,
      items: Array.isArray(raw.items) ? raw.items : fallback.items,
      customItems: Array.isArray(raw.customItems) ? raw.customItems.filter(validCustomDefinition) : [],
      unlockedThemes: Array.isArray(raw.unlockedThemes) ? raw.unlockedThemes : ['bedroom'],
      completedChallenges: Array.isArray(raw.completedChallenges) ? raw.completedChallenges : [],
      log: Array.isArray(raw.log) ? raw.log.slice(0, 12) : fallback.log
    };
    if (!normalized.unlockedThemes.includes('bedroom')) normalized.unlockedThemes.unshift('bedroom');
    if (!DATA.themes.some(theme => theme.id === normalized.currentTheme) || !normalized.unlockedThemes.includes(normalized.currentTheme)) {
      normalized.currentTheme = 'bedroom';
    }
    if (!DATA.lights.some(light => light.id === normalized.currentLight)) normalized.currentLight = 'warm';
    if (!normalized.shelves.length) normalized.shelves = [{ id: uid('shelf'), type: 'wood' }];
    const validShelfIds = new Set(normalized.shelves.map(shelf => shelf.id));
    normalized.items = normalized.items.filter(item => getDefinitionFrom(normalized, item.defId)).map(item => {
      const safe = {
        instanceId: String(item.instanceId || uid('item')),
        defId: String(item.defId),
        location: item.location === 'shelf' && validShelfIds.has(item.shelfId) ? 'shelf' : 'inventory',
        shelfId: item.location === 'shelf' && validShelfIds.has(item.shelfId) ? item.shelfId : null,
        x: clamp(Number(item.x) || 50, 3, 97),
        scale: clamp(Number(item.scale) || 1, .58, 1.42),
        flipped: Boolean(item.flipped),
        z: clamp(Number(item.z) || 1, 1, 99),
        acquiredDay: Math.max(1, Number(item.acquiredDay) || 1)
      };
      return safe;
    });
    return normalized;
  }

  function validCustomDefinition(def) {
    return def && typeof def.id === 'string' && typeof def.name === 'string' &&
      typeof def.image === 'string' && def.image.startsWith('data:image/');
  }

  function getDefinitionFrom(candidateState, defId) {
    return DATA.items.find(item => item.id === defId) || candidateState.customItems?.find(item => item.id === defId);
  }

  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return normalizeState(raw ? JSON.parse(raw) : null);
    } catch (error) {
      storageAvailable = false;
      console.warn('Sauvegarde locale indisponible, nouvelle partie temporaire créée.', error);
      return createDefaultState();
    }
  }

  function saveState() {
    if (!storageAvailable) {
      dom.saveStatus.textContent = 'Sauvegarde locale indisponible — utilise Exporter';
      return false;
    }
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      dom.saveStatus.textContent = `Sauvegardé à ${new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`;
      window.clearTimeout(saveState.statusTimer);
      saveState.statusTimer = window.setTimeout(() => {
        dom.saveStatus.textContent = 'Sauvegarde locale active';
      }, 2200);
      return true;
    } catch (error) {
      storageAvailable = false;
      console.warn('Sauvegarde locale désactivée.', error);
      dom.saveStatus.textContent = 'Sauvegarde locale indisponible — utilise Exporter';
      toast('La sauvegarde locale est indisponible. Utilise « Exporter la sauvegarde » pour conserver ta partie.', 'error', 5200);
      return false;
    }
  }

  function commit(mutator, message = '') {
    history.push(clone(state));
    if (history.length > MAX_HISTORY) history.shift();
    future = [];
    mutator();
    if (message) addLog(message);
    const prestige = computePrestige();
    state.bestPrestige = Math.max(state.bestPrestige || 0, prestige);
    saveState();
    renderAll();
  }

  function undo() {
    if (!history.length) return;
    future.push(clone(state));
    state = history.pop();
    selectedInstanceId = state.items.some(item => item.instanceId === selectedInstanceId) ? selectedInstanceId : null;
    saveState();
    renderAll();
    toast('Action annulée.');
  }

  function redo() {
    if (!future.length) return;
    history.push(clone(state));
    state = future.pop();
    selectedInstanceId = state.items.some(item => item.instanceId === selectedInstanceId) ? selectedInstanceId : null;
    saveState();
    renderAll();
    toast('Action rétablie.');
  }

  function addLog(message) {
    state.log.unshift(message);
    state.log = state.log.slice(0, 10);
  }

  function getDef(defId) {
    return getDefinitionFrom(state, defId);
  }

  function getShelfDef(type) {
    return DATA.shelves.find(shelf => shelf.id === type) || DATA.shelves[0];
  }

  function getInstance(instanceId) {
    return state.items.find(item => item.instanceId === instanceId);
  }

  function inventoryItems() {
    return state.items.filter(item => item.location === 'inventory');
  }

  function displayedItems() {
    return state.items.filter(item => item.location === 'shelf');
  }

  function displayedOn(shelfId) {
    return state.items.filter(item => item.location === 'shelf' && item.shelfId === shelfId);
  }

  function shelfWeight(shelfId) {
    return displayedOn(shelfId).reduce((sum, item) => sum + (Number(getDef(item.defId)?.weight) || 0), 0);
  }

  function shelfCanHold(shelfId, item, ignoreCurrent = true) {
    const shelf = state.shelves.find(entry => entry.id === shelfId);
    if (!shelf || !item) return false;
    const shelfDef = getShelfDef(shelf.type);
    let current = shelfWeight(shelfId);
    if (ignoreCurrent && item.location === 'shelf' && item.shelfId === shelfId) {
      current -= Number(getDef(item.defId)?.weight) || 0;
    }
    return current + (Number(getDef(item.defId)?.weight) || 0) <= shelfDef.capacity + 0.001;
  }

  function computePrestige() {
    let total = 0;
    for (const item of displayedItems()) {
      const def = getDef(item.defId);
      if (!def) continue;
      const rarity = DATA.rarity[def.rarity] || DATA.rarity.common;
      total += rarity.points + Math.round((def.price || 0) * 0.045);
    }
    for (const shelf of state.shelves) {
      const items = displayedOn(shelf.id);
      if (!items.length) continue;
      const universeCounts = {};
      const categories = new Set();
      items.forEach(item => {
        const def = getDef(item.defId);
        if (!def) return;
        universeCounts[def.universe] = (universeCounts[def.universe] || 0) + 1;
        categories.add(def.category);
      });
      Object.values(universeCounts).forEach(count => {
        if (count >= 2) total += (count - 1) * 14;
      });
      if (categories.size >= 3) total += categories.size * 4;
      const shelfDef = getShelfDef(shelf.type);
      if (['glass', 'neon', 'museum'].includes(shelfDef.id)) total += 7;
    }
    const cleanlinessMultiplier = .62 + (state.cleanliness / 100) * .38;
    const themeBonus = state.currentTheme === 'bedroom' ? 0 : 8;
    return Math.max(0, Math.round(total * cleanlinessMultiplier + themeBonus));
  }

  function currentChallenge() {
    return challenges[state.challengeIndex % challenges.length];
  }

  function renderAll() {
    renderBodyState();
    renderStats();
    renderTabs();
    renderInventory();
    renderShop();
    renderCollections();
    renderThemeControls();
    renderShelves();
    renderInspector();
    renderChallenge();
    renderActivity();
    dom.undoBtn.disabled = history.length === 0;
    dom.redoBtn.disabled = future.length === 0;
  }

  function renderBodyState() {
    document.body.dataset.roomTheme = state.currentTheme;
    document.body.dataset.light = state.currentLight;
    $('#galleryTitle').textContent = state.galleryName || 'Cabinet principal';
  }

  function renderStats() {
    dom.coinsStat.textContent = formatNumber(state.coins);
    dom.prestigeStat.textContent = formatNumber(computePrestige());
    dom.dayStat.textContent = String(state.day);
    dom.cleanStat.textContent = `${Math.round(state.cleanliness)}%`;
    dom.displayCount.textContent = String(displayedItems().length);
  }

  function renderTabs() {
    $$('[data-panel-tab]').forEach(button => button.classList.toggle('active', button.dataset.panelTab === ui.panelTab));
    $$('[data-panel-view]').forEach(view => view.classList.toggle('active', view.dataset.panelView === ui.panelTab));
    $$('[data-shop-tab]').forEach(button => button.classList.toggle('active', button.dataset.shopTab === ui.shopTab));
  }

  function renderInventory() {
    const categories = ['Tout', ...new Set(inventoryItems().map(item => getDef(item.defId)?.category).filter(Boolean))];
    if (!categories.includes(ui.inventoryFilter)) ui.inventoryFilter = 'Tout';
    dom.inventoryFilters.innerHTML = categories.map(category => `
      <button class="filter-chip ${ui.inventoryFilter === category ? 'active' : ''}" data-filter="${esc(category)}">${esc(category)}</button>
    `).join('');

    const query = ui.inventorySearch.trim().toLocaleLowerCase('fr');
    const items = inventoryItems().filter(item => {
      const def = getDef(item.defId);
      if (!def) return false;
      const matchesFilter = ui.inventoryFilter === 'Tout' || def.category === ui.inventoryFilter;
      const haystack = `${def.name} ${def.universe} ${def.category} ${def.collection || ''}`.toLocaleLowerCase('fr');
      return matchesFilter && (!query || haystack.includes(query));
    });

    dom.inventoryGrid.innerHTML = items.map(item => inventoryCardHTML(item)).join('');
    dom.inventoryEmpty.hidden = items.length > 0;
    attachInventoryCardEvents();
  }

  function inventoryCardHTML(item) {
    const def = getDef(item.defId);
    const rarity = DATA.rarity[def.rarity] || DATA.rarity.common;
    return `
      <article class="item-card rarity-${esc(def.rarity)} ${selectedInstanceId === item.instanceId ? 'selected' : ''}"
        draggable="true" tabindex="0" data-instance-id="${esc(item.instanceId)}" aria-label="${esc(def.name)}">
        <button class="quick-place" data-quick-place="${esc(item.instanceId)}" title="Placer automatiquement">↗</button>
        <div class="item-card-visual"><img src="${esc(def.image)}" alt="" draggable="false" /></div>
        <h4>${esc(def.name)}</h4>
        <div class="item-card-meta">
          <span><i class="rarity-dot"></i>${esc(rarity.label)}</span>
          <span>${esc(def.category)}</span>
        </div>
      </article>`;
  }

  function attachInventoryCardEvents() {
    $$('.item-card[data-instance-id]').forEach(card => {
      card.addEventListener('click', event => {
        if (event.target.closest('[data-quick-place]')) return;
        selectedInstanceId = card.dataset.instanceId;
        renderAll();
      });
      card.addEventListener('dblclick', () => quickPlace(card.dataset.instanceId));
      card.addEventListener('keydown', event => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          selectedInstanceId = card.dataset.instanceId;
          renderAll();
        }
      });
      card.addEventListener('dragstart', event => {
        dragPayload = { source: 'inventory', instanceId: card.dataset.instanceId };
        event.dataTransfer.effectAllowed = 'move';
        event.dataTransfer.setData('text/plain', card.dataset.instanceId);
      });
      card.addEventListener('dragend', () => { dragPayload = null; });
    });
    $$('[data-quick-place]').forEach(button => {
      button.addEventListener('click', event => {
        event.stopPropagation();
        quickPlace(button.dataset.quickPlace);
      });
    });
  }

  function renderShop() {
    if (ui.shopTab === 'items') renderItemShop();
    if (ui.shopTab === 'shelves') renderShelfShop();
    if (ui.shopTab === 'themes') renderThemeShop();
  }

  function renderItemShop() {
    const start = ((state.day - 1) * 5) % DATA.items.length;
    const stock = Array.from({ length: Math.min(12, DATA.items.length) }, (_, index) => DATA.items[(start + index) % DATA.items.length]);
    dom.shopGrid.innerHTML = stock.map(def => {
      const rarity = DATA.rarity[def.rarity] || DATA.rarity.common;
      const canBuy = state.coins >= def.price;
      return `
        <article class="shop-card rarity-${esc(def.rarity)}">
          <img src="${esc(def.image)}" alt="" />
          <div><h4>${esc(def.name)}</h4><p>${esc(def.universe)} · ${esc(rarity.label)}</p></div>
          <div class="price"><span>${formatNumber(def.price)} ¤</span><button class="button" data-buy-item="${esc(def.id)}" ${canBuy ? '' : 'disabled'}>Acheter</button></div>
        </article>`;
    }).join('');
    $$('[data-buy-item]').forEach(button => button.addEventListener('click', () => buyItem(button.dataset.buyItem)));
  }

  function renderShelfShop() {
    dom.shopGrid.innerHTML = DATA.shelves.map(def => {
      const canBuy = state.coins >= def.price && state.shelves.length < MAX_SHELVES;
      return `
        <article class="shop-card">
          <div class="shop-swatch swatch-${esc(def.id)}"></div>
          <div><h4>${esc(def.name)}</h4><p>${esc(def.description)} Capacité : ${def.capacity} kg.</p></div>
          <div class="price"><span>${formatNumber(def.price)} ¤</span><button class="button" data-buy-shelf="${esc(def.id)}" ${canBuy ? '' : 'disabled'}>Acheter</button></div>
        </article>`;
    }).join('') + (state.shelves.length >= MAX_SHELVES ? '<p class="empty-state">La pièce actuelle est pleine. La version complète permettra d’acheter d’autres murs et salles.</p>' : '');
    $$('[data-buy-shelf]').forEach(button => button.addEventListener('click', () => buyShelf(button.dataset.buyShelf)));
  }

  function renderThemeShop() {
    dom.shopGrid.innerHTML = DATA.themes.map(def => {
      const owned = state.unlockedThemes.includes(def.id);
      const active = state.currentTheme === def.id;
      const canBuy = state.coins >= def.price;
      const label = active ? 'Active' : owned ? 'Appliquer' : 'Acheter';
      return `
        <article class="shop-card">
          <div class="shop-swatch swatch-${esc(def.id)}"></div>
          <div><h4>${esc(def.name)}</h4><p>${esc(def.description)}</p></div>
          <div class="price"><span>${owned ? 'Possédée' : `${formatNumber(def.price)} ¤`}</span><button class="button" data-theme-action="${esc(def.id)}" ${active || (!owned && !canBuy) ? 'disabled' : ''}>${label}</button></div>
        </article>`;
    }).join('');
    $$('[data-theme-action]').forEach(button => button.addEventListener('click', () => themeAction(button.dataset.themeAction)));
  }

  function renderCollections() {
    const definitions = [...DATA.items, ...state.customItems];
    const groups = new Map();
    definitions.forEach(def => {
      const key = def.collection || 'Créations personnelles';
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(def);
    });
    const ownedIds = new Set(state.items.map(item => item.defId));
    dom.collectionList.innerHTML = Array.from(groups.entries()).map(([name, defs]) => {
      const owned = defs.filter(def => ownedIds.has(def.id)).length;
      const percent = defs.length ? Math.round((owned / defs.length) * 100) : 0;
      return `
        <article class="collection-row">
          <header><h4>${esc(name)}</h4><small>${owned} / ${defs.length}</small></header>
          <div class="mini-progress"><span style="width:${percent}%"></span></div>
        </article>`;
    }).join('');
  }

  function renderThemeControls() {
    dom.themeSelect.innerHTML = DATA.themes.filter(theme => state.unlockedThemes.includes(theme.id)).map(theme => `
      <option value="${esc(theme.id)}" ${theme.id === state.currentTheme ? 'selected' : ''}>${esc(theme.name)}</option>
    `).join('');
    dom.lightSelect.innerHTML = DATA.lights.map(light => `
      <option value="${esc(light.id)}" ${light.id === state.currentLight ? 'selected' : ''}>${esc(light.name)}</option>
    `).join('');
  }

  function renderShelves() {
    const dusty = state.cleanliness < 52 ? 'dusty' : '';
    dom.shelves.innerHTML = state.shelves.map((shelf, index) => {
      const shelfDef = getShelfDef(shelf.type);
      const items = displayedOn(shelf.id).sort((a, b) => a.z - b.z);
      const used = shelfWeight(shelf.id);
      return `
        <section class="shelf-unit ${esc(shelfDef.className)} ${dusty}" data-shelf-id="${esc(shelf.id)}">
          <div class="shelf-topline">
            <div class="shelf-label"><strong>${index + 1}</strong><span>${esc(shelfDef.name)}</span><span class="shelf-capacity">${used.toFixed(1)} / ${shelfDef.capacity} kg</span></div>
            <div class="shelf-actions">
              <button data-move-shelf="${esc(shelf.id)}" data-direction="-1" title="Monter" ${index === 0 ? 'disabled' : ''}>↑</button>
              <button data-move-shelf="${esc(shelf.id)}" data-direction="1" title="Descendre" ${index === state.shelves.length - 1 ? 'disabled' : ''}>↓</button>
              <button data-remove-shelf="${esc(shelf.id)}" title="Revendre l’étagère" ${items.length ? 'disabled' : ''}>×</button>
            </div>
          </div>
          <div class="shelf-items">
            ${items.length ? items.map(item => placedItemHTML(item)).join('') : '<div class="shelf-empty">Dépose ici une figurine ou un objet</div>'}
          </div>
        </section>`;
    }).join('');
    attachShelfEvents();
  }

  function placedItemHTML(item) {
    const def = getDef(item.defId);
    if (!def) return '';
    return `
      <div class="placed-item ${item.flipped ? 'flipped' : ''} ${selectedInstanceId === item.instanceId ? 'selected' : ''}"
        draggable="true" tabindex="0" data-placed-id="${esc(item.instanceId)}" title="${esc(def.name)}"
        style="left:${clamp(item.x, 3, 97)}%;--item-scale:${clamp(item.scale, .58, 1.42)};--item-width:${clamp(def.width || 86, 42, 160)}px;--item-height:${clamp(def.height || 110, 48, 170)}px;z-index:${clamp(item.z, 1, 99)}">
        <span class="item-base-shadow"></span><img src="${esc(def.image)}" alt="${esc(def.name)}" draggable="false" />
      </div>`;
  }

  function attachShelfEvents() {
    $$('.shelf-unit[data-shelf-id]').forEach(shelf => {
      shelf.addEventListener('dragover', event => {
        event.preventDefault();
        event.dataTransfer.dropEffect = 'move';
        shelf.classList.add('drag-over');
      });
      shelf.addEventListener('dragleave', event => {
        if (!shelf.contains(event.relatedTarget)) shelf.classList.remove('drag-over');
      });
      shelf.addEventListener('drop', event => {
        event.preventDefault();
        shelf.classList.remove('drag-over');
        const instanceId = dragPayload?.instanceId || event.dataTransfer.getData('text/plain');
        if (!instanceId) return;
        const rect = shelf.getBoundingClientRect();
        const x = clamp(((event.clientX - rect.left) / rect.width) * 100, 4, 96);
        placeItem(instanceId, shelf.dataset.shelfId, x);
      });
    });

    $$('.placed-item[data-placed-id]').forEach(element => {
      element.addEventListener('click', event => {
        event.stopPropagation();
        selectedInstanceId = element.dataset.placedId;
        renderAll();
      });
      element.addEventListener('keydown', event => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          selectedInstanceId = element.dataset.placedId;
          renderAll();
        }
      });
      element.addEventListener('dragstart', event => {
        dragPayload = { source: 'shelf', instanceId: element.dataset.placedId };
        event.dataTransfer.effectAllowed = 'move';
        event.dataTransfer.setData('text/plain', element.dataset.placedId);
        element.classList.add('dragging');
      });
      element.addEventListener('dragend', () => {
        dragPayload = null;
        element.classList.remove('dragging');
      });
    });

    $$('[data-move-shelf]').forEach(button => button.addEventListener('click', () => {
      moveShelf(button.dataset.moveShelf, Number(button.dataset.direction));
    }));
    $$('[data-remove-shelf]').forEach(button => button.addEventListener('click', () => removeShelf(button.dataset.removeShelf)));
  }

  function renderInspector() {
    const item = getInstance(selectedInstanceId);
    if (!item) {
      dom.inspectorCard.innerHTML = `
        <p class="eyebrow">Sélection</p><h2>Rien de sélectionné</h2>
        <p class="muted">Choisis une figurine, un objet ou une pièce exposée pour afficher ses détails.</p>`;
      return;
    }
    const def = getDef(item.defId);
    const rarity = DATA.rarity[def.rarity] || DATA.rarity.common;
    const locationLabel = item.location === 'shelf' ? `Étagère ${state.shelves.findIndex(shelf => shelf.id === item.shelfId) + 1}` : 'Inventaire';
    const availableShelves = state.shelves.filter(shelf => shelfCanHold(shelf.id, item));
    dom.inspectorCard.innerHTML = `
      <div class="inspector-visual"><img src="${esc(def.image)}" alt="" /></div>
      <div class="inspector-title-row">
        <div><p class="eyebrow">${esc(def.universe)}</p><h2>${esc(def.name)}</h2></div>
        <span class="rarity-badge rarity-${esc(def.rarity)}">${esc(rarity.label)}</span>
      </div>
      <p class="muted">${esc(def.description || 'Objet de collection personnalisé.')}</p>
      <div class="inspector-meta">
        <div class="meta-box"><span>Catégorie</span><strong>${esc(def.category)}</strong></div>
        <div class="meta-box"><span>Emplacement</span><strong>${esc(locationLabel)}</strong></div>
        <div class="meta-box"><span>Poids</span><strong>${Number(def.weight || 0).toFixed(1)} kg</strong></div>
        <div class="meta-box"><span>Valeur</span><strong>${formatNumber(def.price || 0)} ¤</strong></div>
      </div>
      ${item.location === 'inventory' ? `
        <select class="placement-select" id="inspectorShelfSelect" ${availableShelves.length ? '' : 'disabled'}>
          ${availableShelves.map(shelf => `<option value="${esc(shelf.id)}">${esc(getShelfDef(shelf.type).name)}</option>`).join('')}
        </select>
        <div class="inspector-actions">
          <button class="button accent span-all" id="inspectorPlaceBtn" ${availableShelves.length ? '' : 'disabled'}>Placer dans la vitrine</button>
          <button class="button ghost span-all" id="inspectorSellBtn">Revendre pour ${formatNumber(Math.max(1, Math.round((def.price || 20) * .5)))} ¤</button>
        </div>` : `
        <div class="inspector-actions">
          <button class="button ghost" data-item-action="left">←</button>
          <button class="button ghost" data-item-action="flip">Retourner</button>
          <button class="button ghost" data-item-action="right">→</button>
          <button class="button ghost" data-item-action="smaller">– Taille</button>
          <button class="button ghost" data-item-action="back">Arrière</button>
          <button class="button ghost" data-item-action="larger">+ Taille</button>
          <button class="button ghost" data-item-action="front">Premier plan</button>
          <button class="button ghost span-all" data-item-action="inventory">Remettre dans l’inventaire</button>
          <button class="button ghost span-all" id="inspectorSellBtn">Revendre pour ${formatNumber(Math.max(1, Math.round((def.price || 20) * .5)))} ¤</button>
        </div>`}
    `;

    $('#inspectorPlaceBtn')?.addEventListener('click', () => {
      const shelfId = $('#inspectorShelfSelect')?.value;
      if (shelfId) placeItem(item.instanceId, shelfId, nextOpenX(shelfId));
    });
    $('#inspectorSellBtn')?.addEventListener('click', () => sellItem(item.instanceId));
    $$('[data-item-action]').forEach(button => button.addEventListener('click', () => itemAction(item.instanceId, button.dataset.itemAction)));
  }

  function renderChallenge() {
    const challenge = currentChallenge();
    const progress = Math.min(challenge.target, Math.max(0, challenge.progress()));
    const complete = progress >= challenge.target;
    dom.challengeTitle.textContent = challenge.title;
    dom.challengeReward.textContent = `+${challenge.reward}`;
    dom.challengeDescription.textContent = challenge.description;
    dom.challengeProgress.style.width = `${Math.round((progress / challenge.target) * 100)}%`;
    dom.challengeProgressText.textContent = `${formatNumber(progress)} / ${formatNumber(challenge.target)}`;
    dom.claimChallengeBtn.disabled = !complete;
  }

  function renderActivity() {
    dom.activityLog.innerHTML = state.log.slice(0, 7).map(entry => `<div class="activity-entry"><span>${esc(entry)}</span></div>`).join('');
  }

  function buyItem(defId) {
    const def = getDef(defId);
    if (!def || state.coins < def.price) return toast('Crédits insuffisants.', 'error');
    ui.panelTab = 'inventory';
    commit(() => {
      state.coins -= def.price;
      state.items.push({
        instanceId: uid('item'), defId: def.id, location: 'inventory', shelfId: null, x: 50,
        scale: 1, flipped: false, z: 1, acquiredDay: state.day
      });
    }, `${def.name} a rejoint l’inventaire.`);
    toast(`${def.name} acheté.`, 'success');
  }

  function buyShelf(type) {
    const def = getShelfDef(type);
    if (state.shelves.length >= MAX_SHELVES) return toast('Cette pièce ne peut pas accueillir d’étagère supplémentaire.', 'error');
    if (state.coins < def.price) return toast('Crédits insuffisants.', 'error');
    commit(() => {
      state.coins -= def.price;
      state.shelves.push({ id: uid('shelf'), type: def.id });
    }, `${def.name} installée dans la galerie.`);
    toast('Nouvelle étagère installée.', 'success');
  }

  function themeAction(themeId) {
    const def = DATA.themes.find(theme => theme.id === themeId);
    if (!def) return;
    const owned = state.unlockedThemes.includes(themeId);
    if (owned) {
      commit(() => { state.currentTheme = themeId; }, `${def.name} devient le décor actif.`);
      return;
    }
    if (state.coins < def.price) return toast('Crédits insuffisants.', 'error');
    commit(() => {
      state.coins -= def.price;
      state.unlockedThemes.push(themeId);
      state.currentTheme = themeId;
    }, `${def.name} débloquée et appliquée.`);
    toast('Nouvelle pièce débloquée.', 'success');
  }

  function quickPlace(instanceId) {
    const item = getInstance(instanceId);
    if (!item) return;
    const shelf = state.shelves
      .filter(entry => shelfCanHold(entry.id, item))
      .sort((a, b) => shelfWeight(a.id) - shelfWeight(b.id))[0];
    if (!shelf) return toast('Aucune étagère ne peut supporter cet objet.', 'error');
    placeItem(instanceId, shelf.id, nextOpenX(shelf.id));
  }

  function nextOpenX(shelfId) {
    const xs = displayedOn(shelfId).map(item => item.x).sort((a, b) => a - b);
    const candidates = [10, 22, 34, 46, 58, 70, 82, 92];
    return candidates.find(candidate => xs.every(x => Math.abs(x - candidate) > 8)) ?? clamp(10 + xs.length * 11, 5, 95);
  }

  function placeItem(instanceId, shelfId, x) {
    const item = getInstance(instanceId);
    const shelf = state.shelves.find(entry => entry.id === shelfId);
    if (!item || !shelf) return;
    if (!shelfCanHold(shelfId, item)) return toast(`Cette étagère ne peut pas supporter ${getDef(item.defId)?.name || 'cet objet'}.`, 'error');
    const wasInventory = item.location === 'inventory';
    commit(() => {
      item.location = 'shelf';
      item.shelfId = shelfId;
      item.x = clamp(x, 4, 96);
      item.z = Math.max(1, ...displayedOn(shelfId).filter(other => other.instanceId !== item.instanceId).map(other => other.z), 0) + 1;
    }, wasInventory ? `${getDef(item.defId).name} est maintenant exposé.` : `${getDef(item.defId).name} a été déplacé.`);
    selectedInstanceId = instanceId;
    toast('Objet placé.', 'success');
  }

  function itemAction(instanceId, action) {
    const item = getInstance(instanceId);
    if (!item) return;
    commit(() => {
      if (action === 'left') item.x = clamp(item.x - 4, 3, 97);
      if (action === 'right') item.x = clamp(item.x + 4, 3, 97);
      if (action === 'flip') item.flipped = !item.flipped;
      if (action === 'smaller') item.scale = clamp(item.scale - .08, .58, 1.42);
      if (action === 'larger') item.scale = clamp(item.scale + .08, .58, 1.42);
      if (action === 'front') item.z = Math.min(99, Math.max(...displayedOn(item.shelfId).map(other => other.z), 0) + 1);
      if (action === 'back') item.z = Math.max(1, Math.min(...displayedOn(item.shelfId).filter(other => other.instanceId !== item.instanceId).map(other => other.z), 2) - 1);
      if (action === 'inventory') {
        item.location = 'inventory'; item.shelfId = null; item.x = 50; item.z = 1;
      }
    }, action === 'inventory' ? `${getDef(item.defId).name} retourne dans l’inventaire.` : 'Mise en scène ajustée.');
  }

  function sellItem(instanceId) {
    const item = getInstance(instanceId);
    if (!item) return;
    const def = getDef(item.defId);
    const value = Math.max(1, Math.round((def.price || 20) * .5));
    if (!window.confirm(`Revendre « ${def.name} » pour ${value} crédits ?`)) return;
    commit(() => {
      state.coins += value;
      state.items = state.items.filter(entry => entry.instanceId !== instanceId);
    }, `${def.name} a été revendu pour ${value} crédits.`);
    selectedInstanceId = null;
    toast('Objet revendu.', 'success');
  }

  function moveShelf(shelfId, direction) {
    const index = state.shelves.findIndex(shelf => shelf.id === shelfId);
    const target = index + direction;
    if (index < 0 || target < 0 || target >= state.shelves.length) return;
    commit(() => {
      const [shelf] = state.shelves.splice(index, 1);
      state.shelves.splice(target, 0, shelf);
    }, 'Ordre des étagères modifié.');
  }

  function removeShelf(shelfId) {
    if (displayedOn(shelfId).length) return toast('Vide cette étagère avant de la revendre.', 'error');
    if (state.shelves.length <= 1) return toast('Tu dois conserver au moins une étagère.', 'error');
    const shelf = state.shelves.find(entry => entry.id === shelfId);
    const def = getShelfDef(shelf?.type);
    const refund = Math.round(def.price * .5);
    commit(() => {
      state.shelves = state.shelves.filter(entry => entry.id !== shelfId);
      state.coins += refund;
    }, `${def.name} revendue pour ${refund} crédits.`);
  }

  function openGallery() {
    const prestige = computePrestige();
    const glassProtection = state.shelves.filter(shelf => shelf.type === 'glass').length;
    const dustLoss = Math.max(2, 7 - glassProtection);
    const reward = Math.max(24, Math.round(28 + prestige * .19 + displayedItems().length * 2));
    commit(() => {
      state.coins += reward;
      state.day += 1;
      state.cleanliness = clamp(state.cleanliness - dustLoss, 0, 100);
    }, `${reward} crédits reçus après une journée de visites.`);
    toast(`Galerie ouverte : +${reward} crédits.`, 'success');
  }

  function cleanGallery() {
    if (state.cleanliness >= 99) return toast('La galerie est déjà impeccable.');
    const cost = 12;
    if (state.coins < cost) return toast('Il faut 12 crédits pour le kit de nettoyage.', 'error');
    commit(() => {
      state.coins -= cost;
      state.cleanliness = 100;
    }, 'Toutes les vitrines ont été nettoyées.');
    toast('Galerie nettoyée.', 'success');
  }

  function autoArrange() {
    if (!displayedItems().length) return toast('Aucun objet à ranger.');
    commit(() => {
      state.shelves.forEach(shelf => {
        const items = displayedOn(shelf.id).sort((a, b) => {
          const da = getDef(a.defId); const db = getDef(b.defId);
          return `${da.universe}-${da.name}`.localeCompare(`${db.universe}-${db.name}`, 'fr');
        });
        const step = 100 / (items.length + 1);
        items.forEach((item, index) => {
          item.x = clamp(step * (index + 1), 5, 95);
          item.z = index + 1;
        });
      });
    }, 'La galerie a été rangée automatiquement.');
  }

  function claimChallenge() {
    const challenge = currentChallenge();
    if (challenge.progress() < challenge.target) return;
    commit(() => {
      state.coins += challenge.reward;
      state.completedChallenges.push(challenge.id);
      state.challengeIndex = (state.challengeIndex + 1) % challenges.length;
    }, `Défi « ${challenge.title} » terminé : +${challenge.reward} crédits.`);
    toast('Récompense récupérée.', 'success');
  }

  function toast(message, type = '', duration = 2800) {
    const element = document.createElement('div');
    element.className = `toast ${type}`;
    element.textContent = message;
    dom.toastStack.appendChild(element);
    window.setTimeout(() => element.remove(), duration);
  }

  async function compressImage(file) {
    if (!file || !file.type.startsWith('image/')) throw new Error('Format d’image invalide.');
    const source = await readFileAsDataURL(file);
    const image = await loadImage(source);
    const maxDimension = 512;
    const ratio = Math.min(1, maxDimension / Math.max(image.naturalWidth, image.naturalHeight));
    const width = Math.max(1, Math.round(image.naturalWidth * ratio));
    const height = Math.max(1, Math.round(image.naturalHeight * ratio));
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext('2d', { alpha: true });
    context.clearRect(0, 0, width, height);
    context.drawImage(image, 0, 0, width, height);
    let dataUrl;
    try {
      dataUrl = canvas.toDataURL('image/webp', .86);
      if (!dataUrl.startsWith('data:image/webp')) dataUrl = canvas.toDataURL('image/png');
    } catch {
      dataUrl = canvas.toDataURL('image/png');
    }
    return { dataUrl, naturalWidth: width, naturalHeight: height };
  }

  function readFileAsDataURL(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(reader.error || new Error('Lecture impossible.'));
      reader.readAsDataURL(file);
    });
  }

  function loadImage(src) {
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error('Image illisible.'));
      image.src = src;
    });
  }

  async function importCustomItem(event) {
    event.preventDefault();
    const submit = $('#confirmImportBtn');
    const file = $('#customImage').files[0];
    if (!file) return toast('Choisis une image.', 'error');
    submit.disabled = true;
    submit.textContent = 'Préparation…';
    try {
      const prepared = await compressImage(file);
      const size = Number($('#customSize').value) || 92;
      const ratio = prepared.naturalWidth / prepared.naturalHeight;
      const width = Math.round(ratio >= 1 ? size : size * ratio);
      const height = Math.round(ratio >= 1 ? size / ratio : size);
      const id = uid('custom');
      const definition = {
        id,
        name: $('#customName').value.trim(),
        universe: $('#customUniverse').value.trim(),
        category: $('#customCategory').value,
        collection: 'Créations personnelles',
        rarity: $('#customRarity').value,
        price: 0,
        weight: clamp(Number($('#customWeight').value) || 1, .1, 20),
        width: clamp(width, 42, 160),
        height: clamp(height, 48, 170),
        image: prepared.dataUrl,
        description: 'Pièce personnalisée importée dans l’atelier de VITRINE//VERSE.',
        tags: ['personnalisé']
      };
      ui.panelTab = 'inventory';
      commit(() => {
        state.customItems.push(definition);
        state.items.push({
          instanceId: uid('item'), defId: id, location: 'inventory', shelfId: null, x: 50,
          scale: 1, flipped: false, z: 1, acquiredDay: state.day
        });
      }, `${definition.name} a été créé dans l’atelier.`);
      dom.importDialog.close();
      dom.importForm.reset();
      toast('Objet personnalisé ajouté.', 'success');
    } catch (error) {
      console.error(error);
      toast(error.message || 'Impossible d’importer cette image.', 'error');
    } finally {
      submit.disabled = false;
      submit.textContent = 'Ajouter à l’inventaire';
    }
  }

  function exportSave() {
    const payload = JSON.stringify({
      game: 'VITRINE//VERSE', exportedAt: new Date().toISOString(), state
    }, null, 2);
    const blob = new Blob([payload], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `vitrineverse_sauvegarde_jour_${state.day}.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    toast('Sauvegarde exportée.', 'success');
  }

  async function importSave(file) {
    if (!file) return;
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      const candidate = parsed?.state || parsed;
      const normalized = normalizeState(candidate);
      history.push(clone(state));
      state = normalized;
      future = [];
      selectedInstanceId = null;
      saveState();
      renderAll();
      toast('Sauvegarde importée.', 'success');
    } catch (error) {
      console.error(error);
      toast('Ce fichier de sauvegarde est invalide.', 'error');
    } finally {
      dom.importSaveInput.value = '';
    }
  }

  function resetGame() {
    if (!window.confirm('Recommencer depuis le début ? La sauvegarde actuelle sera remplacée.')) return;
    history.push(clone(state));
    state = createDefaultState();
    future = [];
    selectedInstanceId = null;
    saveState();
    renderAll();
    toast('Nouvelle galerie créée.', 'success');
  }

  function togglePhotoMode(forceOff = false) {
    if (forceOff) document.body.classList.remove('photo-mode');
    else document.body.classList.toggle('photo-mode');
  }

  function bindEvents() {
    $$('[data-panel-tab]').forEach(button => button.addEventListener('click', () => {
      ui.panelTab = button.dataset.panelTab;
      renderAll();
    }));
    $$('[data-shop-tab]').forEach(button => button.addEventListener('click', () => {
      ui.shopTab = button.dataset.shopTab;
      renderAll();
    }));
    dom.inventorySearch.addEventListener('input', () => {
      ui.inventorySearch = dom.inventorySearch.value;
      renderInventory();
    });
    dom.inventoryFilters.addEventListener('click', event => {
      const button = event.target.closest('[data-filter]');
      if (!button) return;
      ui.inventoryFilter = button.dataset.filter;
      renderInventory();
    });
    dom.themeSelect.addEventListener('change', () => commit(() => { state.currentTheme = dom.themeSelect.value; }, 'Décor de la galerie modifié.'));
    dom.lightSelect.addEventListener('change', () => commit(() => { state.currentLight = dom.lightSelect.value; }, 'Ambiance lumineuse modifiée.'));
    $('#visitorsBtn').addEventListener('click', openGallery);
    $('#cleanBtn').addEventListener('click', cleanGallery);
    $('#autoArrangeBtn').addEventListener('click', autoArrange);
    dom.claimChallengeBtn.addEventListener('click', claimChallenge);
    dom.undoBtn.addEventListener('click', undo);
    dom.redoBtn.addEventListener('click', redo);
    $('#photoModeBtn').addEventListener('click', () => togglePhotoMode());
    $('#openImportBtn').addEventListener('click', () => dom.importDialog.showModal());
    dom.importForm.addEventListener('submit', importCustomItem);
    $('#exportSaveBtn').addEventListener('click', exportSave);
    dom.importSaveInput.addEventListener('change', () => importSave(dom.importSaveInput.files[0]));
    $('#resetBtn').addEventListener('click', resetGame);
    document.addEventListener('keydown', event => {
      if (event.key === 'Escape' && document.body.classList.contains('photo-mode')) togglePhotoMode(true);
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'z') {
        event.preventDefault();
        event.shiftKey ? redo() : undo();
      }
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'y') {
        event.preventDefault(); redo();
      }
      const selectedItem = getInstance(selectedInstanceId);
      if (selectedItem?.location === 'shelf' && ['ArrowLeft', 'ArrowRight'].includes(event.key) && !['INPUT', 'SELECT', 'TEXTAREA'].includes(document.activeElement?.tagName)) {
        event.preventDefault();
        itemAction(selectedInstanceId, event.key === 'ArrowLeft' ? 'left' : 'right');
      }
    });
  }

  bindEvents();
  renderAll();
})();
