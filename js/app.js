(() => {
  'use strict';

  const DATA = window.GAME_DATA;
  const SAVE_VERSION = 2;
  const STORAGE_KEY = 'vitrineverse_save_v2';
  const LEGACY_STORAGE_KEYS = ['vitrineverse_save_v1'];
  const BACKUP_STORAGE_KEY = 'vitrineverse_backup_v2';
  const MAX_HISTORY = 45;
  const MAX_HISTORY_BYTES = 12_000_000;
  const MAX_SHELVES = 8;
  const MAX_ITEM_INSTANCES = 1000;
  const MAX_CUSTOM_ITEMS = 120;
  const MAX_SAVE_BYTES = 4_500_000;
  const MAX_IMPORT_BYTES = 5_250_000;

  const fallbackChallenges = [
    { id: 'first_display', title: 'Première curation', reward: 120, target: 7, minLevel: 1, metric: 'displayed', description: 'Expose sept pièces dans ta galerie.' },
    { id: 'same_universe', title: 'Trilogie thématique', reward: 180, target: 3, minLevel: 1, metric: 'same_universe', description: 'Expose trois objets du même univers sur une seule étagère.' },
    { id: 'category_mix', title: 'Culture sans frontières', reward: 220, target: 4, minLevel: 2, metric: 'category_mix', description: 'Réunis quatre catégories différentes dans ta galerie.' },
    { id: 'prestige_300', title: 'Galerie remarquée', reward: 260, target: 300, minLevel: 3, metric: 'prestige', description: 'Atteins 300 points de prestige avec ta mise en scène.' },
    { id: 'rare_five', title: 'Pièces de choix', reward: 300, target: 5, minLevel: 4, metric: 'rare_display', description: 'Expose cinq objets rares, épiques ou légendaires.' },
    { id: 'four_shelves', title: 'La grande extension', reward: 350, target: 4, minLevel: 5, metric: 'shelves', description: 'Possède au moins quatre étagères dans la galerie.' }
  ];
  const challenges = Array.isArray(DATA.challenges) && DATA.challenges.length ? DATA.challenges : fallbackChallenges;

  let storageAvailable = true;
  let loadNotice = '';
  let deferredInstallPrompt = null;
  let audioContext = null;
  let networkCheckId = 0;
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
    levelStat: $('#levelStat'),
    inventoryGrid: $('#inventoryGrid'), inventoryEmpty: $('#inventoryEmpty'), inventorySearch: $('#inventorySearch'),
    inventoryFilters: $('#inventoryFilters'), shopGrid: $('#shopGrid'), collectionList: $('#collectionList'),
    shelves: $('#shelves'), displayCount: $('#displayCount'), themeSelect: $('#themeSelect'), lightSelect: $('#lightSelect'),
    placementModeSelect: $('#placementModeSelect'), prestigeBreakdown: $('#prestigeBreakdown'),
    inspectorCard: $('#inspectorCard'), activityLog: $('#activityLog'), saveStatus: $('#saveStatus'),
    challengeTitle: $('#challengeTitle'), challengeReward: $('#challengeReward'), challengeDescription: $('#challengeDescription'),
    challengeProgress: $('#challengeProgress'), challengeProgressText: $('#challengeProgressText'), claimChallengeBtn: $('#claimChallengeBtn'),
    chapterName: $('#chapterName'), reputationProgress: $('#reputationProgress'), reputationProgressText: $('#reputationProgressText'),
    nextUnlockText: $('#nextUnlockText'), briefCard: $('#briefCard'), briefTitle: $('#briefTitle'),
    briefDescription: $('#briefDescription'), briefProgress: $('#briefProgress'), briefProgressText: $('#briefProgressText'),
    briefReward: $('#briefReward'), tutorialCard: $('#tutorialCard'), tutorialList: $('#tutorialList'),
    undoBtn: $('#undoBtn'), redoBtn: $('#redoBtn'), importDialog: $('#importDialog'), importForm: $('#importForm'),
    importSaveInput: $('#importSaveInput'), toastStack: $('#toastStack'), soundBtn: $('#soundBtn'),
    installBtn: $('#installBtn'), networkStatus: $('#networkStatus'), welcomeDialog: $('#welcomeDialog'),
    visitDialog: $('#visitDialog'), visitReportTitle: $('#visitReportTitle'), visitReportBody: $('#visitReportBody')
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
      { id: 'shelf_start_wood', type: 'wood' }
    ];
    const makeItem = (instanceId, defId, location = 'inventory', shelfId = null, x = 50, scale = 1, z = 1) => ({
      instanceId, defId, location, shelfId, x, scale, flipped: false, z, acquiredDay: 1,
      condition: 1, sentimentalValue: 0
    });
    return {
      version: SAVE_VERSION,
      coins: 360,
      day: 1,
      cleanliness: 88,
      bestPrestige: 0,
      reputation: 0,
      visits: 0,
      visitorStreak: 0,
      galleryName: 'Cabinet principal',
      currentTheme: 'bedroom',
      currentLight: 'warm',
      placementMode: 'magnetic',
      soundEnabled: true,
      unlockedThemes: ['bedroom'],
      unlockedLights: ['warm'],
      highestCareerLevel: 1,
      shelves,
      items: [
        makeItem('inst_pixel_mage', 'pixel_mage', 'shelf', shelves[0].id, 20, .88, 2),
        makeItem('inst_arcade_cart', 'arcade_cart', 'shelf', shelves[0].id, 48, .86, 1),
        makeItem('inst_alien_plush', 'alien_plush', 'shelf', shelves[0].id, 76, .9, 3),
        makeItem('inst_comic_stack', 'comic_stack'),
        makeItem('inst_void_cat', 'void_cat'),
        makeItem('inst_pinboard', 'pinboard')
      ],
      customItems: [],
      challengeIndex: 0,
      completedChallenges: [],
      collectionRewards: [],
      claimedChapters: [],
      lastVisitSignature: '',
      repeatVisitCount: 0,
      recentVisitSignatures: [],
      visitSignatureCounts: {},
      tutorial: {
        welcomeSeen: false,
        exploredShop: false,
        acquired: false,
        arranged: false,
        hosted: false,
        rewardClaimed: false
      },
      log: [
        'Bienvenue dans ton coin de collection. Chaque pièce a une histoire.',
        'Première étape : explore la boutique puis compose ta propre scène.'
      ]
    };
  }

  function finiteNumber(value, fallback, min = -Infinity, max = Infinity) {
    const number = Number(value);
    return Number.isFinite(number) ? clamp(number, min, max) : fallback;
  }

  function normalizeVisitSignature(value) {
    if (typeof value !== 'string' || !value) return '';
    if (/^visit_[0-9a-f]{8}_\d+$/.test(value)) return value;
    let hash = 2166136261;
    for (let index = 0; index < value.length; index += 1) {
      hash ^= value.charCodeAt(index);
      hash = Math.imul(hash, 16777619);
    }
    return `visit_${(hash >>> 0).toString(16).padStart(8, '0')}_${value.length}`;
  }

  function normalizeState(raw) {
    const fallback = createDefaultState();
    if (!raw || typeof raw !== 'object') return fallback;
    const customItems = Array.isArray(raw.customItems)
      ? raw.customItems.slice(0, MAX_CUSTOM_ITEMS).filter(validCustomDefinition).map(def => ({
        id: String(def.id).slice(0, 100),
        name: String(def.name).trim().slice(0, 60),
        universe: String(def.universe || 'Créations personnelles').slice(0, 60),
        collection: 'Créations personnelles',
        category: String(def.category || 'Objet').slice(0, 40),
        rarity: DATA.rarity[def.rarity] ? def.rarity : 'common',
        price: 0,
        competitive: false,
        tradeable: false,
        weight: finiteNumber(def.weight, 1, .1, 20),
        width: Math.round(finiteNumber(def.width, 92, 42, 160)),
        height: Math.round(finiteNumber(def.height, 110, 48, 170)),
        image: def.image,
        description: String(def.description || 'Pièce personnalisée importée dans l’atelier de VITRINE//VERSE.').slice(0, 280),
        tags: Array.isArray(def.tags) ? def.tags.map(String).map(tag => tag.slice(0, 32)).slice(0, 12) : ['personnalisé']
      }))
      : [];
    const seenShelfIds = new Set();
    const shelves = (Array.isArray(raw.shelves) ? raw.shelves : fallback.shelves)
      .filter(shelf => shelf && typeof shelf === 'object' && DATA.shelves.some(def => def.id === shelf.type))
      .map(shelf => ({ id: String(shelf.id || uid('shelf')), type: String(shelf.type) }))
      .filter(shelf => {
        if (seenShelfIds.has(shelf.id)) return false;
        seenShelfIds.add(shelf.id);
        return true;
      })
      .slice(0, MAX_SHELVES);
    if (!shelves.length) shelves.push({ id: uid('shelf'), type: 'wood' });

    const normalized = {
      ...fallback,
      version: SAVE_VERSION,
      coins: Math.round(finiteNumber(raw.coins, fallback.coins, 0, 100_000_000)),
      day: Math.round(finiteNumber(raw.day, 1, 1, 1_000_000)),
      cleanliness: finiteNumber(raw.cleanliness, fallback.cleanliness, 0, 100),
      bestPrestige: Math.round(finiteNumber(raw.bestPrestige, 0, 0, 10_000_000)),
      reputation: Math.round(finiteNumber(raw.reputation, 0, 0, 10_000_000)),
      visits: Math.round(finiteNumber(raw.visits, 0, 0, 1_000_000)),
      visitorStreak: Math.round(finiteNumber(raw.visitorStreak, 0, 0, 1_000_000)),
      galleryName: String(raw.galleryName || fallback.galleryName).trim().slice(0, 50) || fallback.galleryName,
      currentTheme: String(raw.currentTheme || fallback.currentTheme),
      currentLight: String(raw.currentLight || fallback.currentLight),
      placementMode: raw.placementMode === 'free' ? 'free' : 'magnetic',
      soundEnabled: raw.soundEnabled !== false,
      shelves,
      items: Array.isArray(raw.items) ? raw.items : fallback.items,
      customItems,
      unlockedThemes: Array.isArray(raw.unlockedThemes)
        ? [...new Set(raw.unlockedThemes.filter(id => DATA.themes.some(theme => theme.id === id)))]
        : ['bedroom'],
      unlockedLights: Array.isArray(raw.unlockedLights)
        ? [...new Set(raw.unlockedLights.filter(id => DATA.lights.some(light => light.id === id)))]
        : ['warm'],
      highestCareerLevel: Math.round(finiteNumber(raw.highestCareerLevel, 1, 1, DATA.careerChapters?.length || 6)),
      completedChallenges: Array.isArray(raw.completedChallenges)
        ? [...new Set(raw.completedChallenges.filter(id => challenges.some(challenge => challenge.id === id)))]
        : [],
      collectionRewards: Array.isArray(raw.collectionRewards)
        ? [...new Set(raw.collectionRewards.map(String).filter(name => DATA.items.some(item => item.collection === name)))]
        : [],
      claimedChapters: Array.isArray(raw.claimedChapters)
        ? [...new Set(raw.claimedChapters.map(String).filter(id => DATA.careerChapters?.some(chapter => chapter.id === id)))]
        : [],
      challengeIndex: Math.round(finiteNumber(raw.challengeIndex, 0, 0, challenges.length)),
      lastVisitSignature: normalizeVisitSignature(raw.lastVisitSignature),
      repeatVisitCount: Math.round(finiteNumber(raw.repeatVisitCount, 0, 0, 1000)),
      recentVisitSignatures: Array.isArray(raw.recentVisitSignatures)
        ? raw.recentVisitSignatures.map(normalizeVisitSignature).filter(Boolean).slice(-6)
        : [],
      visitSignatureCounts: {},
      tutorial: {
        welcomeSeen: Boolean(raw.tutorial?.welcomeSeen),
        exploredShop: Boolean(raw.tutorial?.exploredShop),
        acquired: Boolean(raw.tutorial?.acquired),
        arranged: Boolean(raw.tutorial?.arranged),
        hosted: Boolean(raw.tutorial?.hosted),
        rewardClaimed: Boolean(raw.tutorial?.rewardClaimed)
      },
      log: Array.isArray(raw.log) ? raw.log.map(String).slice(0, 12) : fallback.log
    };
    if (!normalized.unlockedThemes.includes('bedroom')) normalized.unlockedThemes.unshift('bedroom');
    if (!normalized.unlockedLights.includes('warm')) normalized.unlockedLights.unshift('warm');
    if (!DATA.themes.some(theme => theme.id === normalized.currentTheme) || !normalized.unlockedThemes.includes(normalized.currentTheme)) {
      normalized.currentTheme = 'bedroom';
    }
    if (!DATA.lights.some(light => light.id === normalized.currentLight)) normalized.currentLight = 'warm';
    if (!normalized.unlockedLights.includes(normalized.currentLight)) normalized.unlockedLights.push(normalized.currentLight);
    if (!normalized.recentVisitSignatures.length && normalized.lastVisitSignature) {
      const legacyVisitCount = clamp(normalized.repeatVisitCount + 1, 1, 6);
      normalized.recentVisitSignatures = Array.from({ length: legacyVisitCount }, () => normalized.lastVisitSignature);
    }
    if (raw.visitSignatureCounts && typeof raw.visitSignatureCounts === 'object' && !Array.isArray(raw.visitSignatureCounts)) {
      Object.entries(raw.visitSignatureCounts).slice(0, 5000).forEach(([signature, count]) => {
        const normalizedSignature = normalizeVisitSignature(signature);
        const normalizedCount = Math.round(finiteNumber(count, 0, 0, 1000));
        if (normalizedSignature && normalizedCount > 0) normalized.visitSignatureCounts[normalizedSignature] = normalizedCount;
      });
    }
    if (!Object.keys(normalized.visitSignatureCounts).length) {
      normalized.recentVisitSignatures.forEach(signature => {
        normalized.visitSignatureCounts[signature] = (normalized.visitSignatureCounts[signature] || 0) + 1;
      });
    }
    const claimedCareerLevel = Math.max(1, ...(DATA.careerChapters || [])
      .filter(chapter => normalized.claimedChapters.includes(chapter.id))
      .map(chapter => Number(chapter.level ?? chapter.minLevel) || 1));
    normalized.highestCareerLevel = Math.max(normalized.highestCareerLevel, claimedCareerLevel);
    const validShelfIds = new Set(normalized.shelves.map(shelf => shelf.id));
    const seenInstanceIds = new Set();
    normalized.items = normalized.items.slice(0, MAX_ITEM_INSTANCES).filter(item => item && getDefinitionFrom(normalized, item.defId)).map(item => {
      let instanceId = String(item.instanceId || uid('item'));
      if (seenInstanceIds.has(instanceId)) instanceId = uid('item');
      seenInstanceIds.add(instanceId);
      const safe = {
        instanceId,
        defId: String(item.defId),
        location: item.location === 'shelf' && validShelfIds.has(item.shelfId) ? 'shelf' : 'inventory',
        shelfId: item.location === 'shelf' && validShelfIds.has(item.shelfId) ? item.shelfId : null,
        x: finiteNumber(item.x, 50, 3, 97),
        scale: finiteNumber(item.scale, 1, .58, 1.42),
        flipped: Boolean(item.flipped),
        z: Math.round(finiteNumber(item.z, 1, 1, 99)),
        acquiredDay: Math.round(finiteNumber(item.acquiredDay, 1, 1, normalized.day)),
        condition: finiteNumber(item.condition, 1, .35, 1),
        sentimentalValue: Math.round(finiteNumber(item.sentimentalValue, 0, 0, 100))
      };
      return safe;
    });
    Object.keys(normalized.tutorial).forEach(key => {
      normalized.tutorial[key] = Boolean(normalized.tutorial[key]);
    });
    return normalized;
  }

  function validCustomDefinition(def) {
    return def && typeof def.id === 'string' && /^custom_[A-Za-z0-9_-]{1,93}$/.test(def.id) &&
      typeof def.name === 'string' && Boolean(def.name.trim()) &&
      typeof def.image === 'string' && /^data:image\/(?:png|webp|jpeg);base64,/i.test(def.image) &&
      def.image.length <= 1_500_000 && !DATA.items.some(item => item.id === def.id);
  }

  function getDefinitionFrom(candidateState, defId) {
    return DATA.items.find(item => item.id === defId) || candidateState.customItems?.find(item => item.id === defId);
  }

  function loadState() {
    const candidates = [];
    let primaryRaw = null;
    try {
      primaryRaw = localStorage.getItem(STORAGE_KEY);
      if (primaryRaw) candidates.push({ key: STORAGE_KEY, raw: primaryRaw, label: 'principale' });
      const backupRaw = localStorage.getItem(BACKUP_STORAGE_KEY);
      if (backupRaw) candidates.push({ key: BACKUP_STORAGE_KEY, raw: backupRaw, label: 'de secours' });
      LEGACY_STORAGE_KEYS.forEach(legacyKey => {
        const legacyRaw = localStorage.getItem(legacyKey);
        if (legacyRaw) candidates.push({ key: legacyKey, raw: legacyRaw, label: 'version 1' });
      });
    } catch (error) {
      storageAvailable = false;
      console.warn('Sauvegarde locale indisponible, nouvelle partie temporaire créée.', error);
      return createDefaultState();
    }
    if (!candidates.length) return createDefaultState();
    for (const candidate of candidates) {
      try {
        const normalized = validateImportPayload(JSON.parse(candidate.raw));
        if (candidate.key === STORAGE_KEY) {
          const normalizedRaw = JSON.stringify(normalized);
          if (candidate.raw !== normalizedRaw) {
            try {
              localStorage.setItem(STORAGE_KEY, normalizedRaw);
              loadNotice = 'Sauvegarde mise à niveau vers le schéma actuel.';
            } catch (upgradeError) {
              console.warn('Sauvegarde mise à niveau en mémoire, mais non réécrite.', upgradeError);
              loadNotice = 'Sauvegarde mise à niveau en mémoire. Exporte-la : le stockage local est saturé.';
            }
          }
          return normalized;
        }
        if (!primaryRaw) {
          try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
            loadNotice = candidate.key === BACKUP_STORAGE_KEY
              ? 'Sauvegarde de secours restaurée vers la version 2.'
              : 'Sauvegarde précédente migrée vers la version 2.';
          } catch (migrationError) {
            console.warn('Sauvegarde récupérée chargée, mais sa copie v2 n’a pas pu être écrite.', migrationError);
            loadNotice = `Sauvegarde ${candidate.label} chargée en mémoire. Exporte-la : le stockage local est saturé.`;
          }
        } else {
          loadNotice = `Sauvegarde principale invalide : la copie ${candidate.label} a été chargée sans écraser l’original. Exporte-la avant de continuer.`;
        }
        return normalized;
      } catch (error) {
        console.warn(`Sauvegarde ${candidate.label} ignorée sans être écrasée.`, error);
      }
    }
    loadNotice = 'Aucune sauvegarde locale valide. Une partie temporaire a été ouverte ; les données brutes n’ont pas été écrasées.';
    return createDefaultState();
  }

  function serializedBytes(value) {
    return new Blob([JSON.stringify(value)]).size;
  }

  function migrateImportedState(candidate, version) {
    const migrated = clone(candidate);
    if (version !== 1) return migrated;
    migrated.version = SAVE_VERSION;
    if (!Array.isArray(migrated.unlockedLights)) {
      migrated.unlockedLights = ['warm', 'cool', 'neon', 'dark'].filter(id => DATA.lights.some(light => light.id === id));
    }
    migrated.shelves = migrated.shelves.map(shelf => ({
      ...shelf,
      id: String(shelf?.id || uid('shelf')),
      type: String(shelf?.type || '')
    }));
    const shelfIds = new Set(migrated.shelves.map(shelf => shelf.id));
    migrated.items = migrated.items.map(item => {
      const shelfId = item?.shelfId == null ? null : String(item.shelfId);
      const isDisplayed = item?.location === 'shelf' && shelfIds.has(shelfId);
      return {
        ...item,
        instanceId: String(item?.instanceId || uid('item')),
        defId: String(item?.defId || ''),
        location: isDisplayed ? 'shelf' : 'inventory',
        shelfId: isDisplayed ? shelfId : null
      };
    });
    return migrated;
  }

  function validateImportPayload(parsed) {
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      throw new Error('Le fichier ne contient pas une sauvegarde structurée.');
    }
    if (parsed.game != null && parsed.game !== 'VITRINE//VERSE') {
      throw new Error('Cette sauvegarde appartient à un autre jeu.');
    }
    if (parsed.schemaVersion != null && (!Number.isInteger(Number(parsed.schemaVersion)) || Number(parsed.schemaVersion) > SAVE_VERSION)) {
      throw new Error('Schéma de sauvegarde plus récent que cette version du jeu.');
    }
    if (parsed.dataVersion != null && (!Number.isInteger(Number(parsed.dataVersion)) || Number(parsed.dataVersion) > Number(DATA.version || 1))) {
      throw new Error('Catalogue de sauvegarde plus récent que cette version du jeu.');
    }
    const candidate = parsed.state ?? parsed;
    if (!candidate || typeof candidate !== 'object' || Array.isArray(candidate)) {
      throw new Error('État de jeu absent.');
    }
    if (!Array.isArray(candidate.items) || !Array.isArray(candidate.shelves)) {
      throw new Error('La liste des objets ou des étagères est absente.');
    }
    if (candidate.customItems != null && !Array.isArray(candidate.customItems)) {
      throw new Error('La liste des créations personnelles est invalide.');
    }
    if (candidate.items.length > MAX_ITEM_INSTANCES) {
      throw new Error(`La sauvegarde dépasse la limite de ${MAX_ITEM_INSTANCES} pièces.`);
    }
    if (candidate.shelves.length > MAX_SHELVES) {
      throw new Error(`La sauvegarde dépasse la limite de ${MAX_SHELVES} étagères.`);
    }
    if ((candidate.customItems?.length || 0) > MAX_CUSTOM_ITEMS) {
      throw new Error(`La sauvegarde dépasse la limite de ${MAX_CUSTOM_ITEMS} créations personnelles.`);
    }
    const version = candidate.version == null ? 1 : Number(candidate.version);
    if (!Number.isInteger(version) || version < 1 || version > SAVE_VERSION) {
      throw new Error('Version de sauvegarde non prise en charge.');
    }
    const migrated = migrateImportedState(candidate, version);
    for (const key of ['coins', 'day', 'cleanliness', 'bestPrestige', 'reputation', 'visits']) {
      if (migrated[key] != null && !Number.isFinite(Number(migrated[key]))) {
        throw new Error(`Champ numérique invalide : ${key}.`);
      }
    }
    if (migrated.challengeIndex != null && (!Number.isInteger(Number(migrated.challengeIndex)) || Number(migrated.challengeIndex) < 0 || Number(migrated.challengeIndex) > challenges.length)) {
      throw new Error('Index de défi invalide.');
    }
    if (!migrated.shelves.length) throw new Error('La sauvegarde ne contient aucune étagère.');
    const shelfIds = migrated.shelves.map(shelf => shelf?.id).filter(Boolean).map(String);
    const instanceIds = migrated.items.map(item => item?.instanceId).filter(Boolean).map(String);
    if (shelfIds.length !== migrated.shelves.length || instanceIds.length !== migrated.items.length) {
      throw new Error('Un meuble ou un objet ne possède pas d’identifiant.');
    }
    if (new Set(shelfIds).size !== shelfIds.length || new Set(instanceIds).size !== instanceIds.length) {
      throw new Error('La sauvegarde contient des identifiants en double.');
    }
    if (migrated.shelves.some(shelf => !shelf || typeof shelf !== 'object' || !DATA.shelves.some(def => def.id === shelf.type))) {
      throw new Error('La sauvegarde référence un type d’étagère inconnu.');
    }
    const importedCustomItems = Array.isArray(migrated.customItems) ? migrated.customItems : [];
    if (importedCustomItems.some(definition => !validCustomDefinition(definition))) {
      throw new Error('Une création personnelle est invalide ou trop volumineuse.');
    }
    const customDefinitionIds = importedCustomItems.map(definition => definition.id);
    if (new Set(customDefinitionIds).size !== customDefinitionIds.length) {
      throw new Error('La sauvegarde contient des créations personnelles en double.');
    }
    const knownDefinitionIds = new Set([...DATA.items.map(item => item.id), ...customDefinitionIds]);
    const shelfIdSet = new Set(shelfIds);
    if (migrated.items.some(item => !item || typeof item !== 'object' || !knownDefinitionIds.has(item.defId))) {
      throw new Error('La sauvegarde référence un objet de collection inconnu.');
    }
    const customDefinitionIdSet = new Set(customDefinitionIds);
    const customInstanceCounts = new Map();
    migrated.items.forEach(item => {
      if (customDefinitionIdSet.has(item.defId)) {
        customInstanceCounts.set(item.defId, (customInstanceCounts.get(item.defId) || 0) + 1);
      }
    });
    if ([...customInstanceCounts.values()].some(count => count > 1)) {
      throw new Error('Une création personnelle ne peut posséder qu’une seule instance.');
    }
    if (migrated.items.some(item => !['inventory', 'shelf'].includes(item.location) || (item.location === 'shelf' && !shelfIdSet.has(String(item.shelfId))))) {
      throw new Error('La sauvegarde contient un placement d’objet invalide.');
    }
    if (serializedBytes(candidate) > MAX_SAVE_BYTES) {
      throw new Error('La sauvegarde dépasse la taille locale sûre de 4,5 Mo.');
    }
    const normalized = normalizeState(migrated);
    if (serializedBytes(normalized) > MAX_SAVE_BYTES) {
      throw new Error('La sauvegarde normalisée dépasse la taille locale sûre de 4,5 Mo.');
    }
    return normalized;
  }

  function saveState() {
    if (!storageAvailable) {
      dom.saveStatus.textContent = 'Sauvegarde locale indisponible — utilise Exporter';
      return false;
    }
    try {
      if (state.items.length > MAX_ITEM_INSTANCES || state.shelves.length > MAX_SHELVES || state.customItems.length > MAX_CUSTOM_ITEMS) {
        throw new Error('La collection dépasse les limites sûres de sauvegarde.');
      }
      const serialized = JSON.stringify(state);
      if (new Blob([serialized]).size > MAX_SAVE_BYTES) {
        throw new Error('La sauvegarde dépasse 4,5 Mo. Exporte-la puis retire une image personnalisée.');
      }
      localStorage.setItem(STORAGE_KEY, serialized);
      dom.saveStatus.textContent = `Sauvegardé à ${new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`;
      window.clearTimeout(saveState.statusTimer);
      saveState.statusTimer = window.setTimeout(() => {
        dom.saveStatus.textContent = 'Sauvegarde locale active';
      }, 2200);
      return true;
    } catch (error) {
      console.warn('Sauvegarde locale momentanément impossible.', error);
      dom.saveStatus.textContent = 'Sauvegarde locale saturée — utilise Exporter';
      toast(error.message || 'La sauvegarde locale est indisponible. Utilise « Exporter » pour conserver ta partie.', 'error', 5200);
      return false;
    }
  }

  function pushSnapshot(stack, snapshot) {
    stack.push(clone(snapshot));
    while (stack.length > MAX_HISTORY) stack.shift();
    let totalBytes = stack.reduce((total, entry) => total + serializedBytes(entry), 0);
    while (stack.length > 1 && totalBytes > MAX_HISTORY_BYTES) {
      totalBytes -= serializedBytes(stack[0]);
      stack.shift();
    }
  }

  function pushHistory(snapshot = state) {
    pushSnapshot(history, snapshot);
  }

  function commit(mutator, message = '') {
    const previousState = clone(state);
    try {
      mutator();
      if (message) addLog(message);
      const prestige = computePrestige();
      state.bestPrestige = Math.max(state.bestPrestige || 0, prestige);
    } catch (error) {
      state = previousState;
      console.error('Action annulée avant sauvegarde.', error);
      renderAll();
      toast('Cette action n’a pas pu être appliquée.', 'error');
      return false;
    }
    if (!saveState()) {
      state = previousState;
      renderAll();
      return false;
    }
    pushHistory(previousState);
    future = [];
    renderAll();
    finalizeTutorial();
    return true;
  }

  function undo() {
    if (!history.length) return;
    const previousState = clone(state);
    state = clone(history[history.length - 1]);
    if (!saveState()) {
      state = previousState;
      renderAll();
      return;
    }
    history.pop();
    pushSnapshot(future, previousState);
    selectedInstanceId = state.items.some(item => item.instanceId === selectedInstanceId) ? selectedInstanceId : null;
    renderAll();
    toast('Action annulée.');
  }

  function redo() {
    if (!future.length) return;
    const previousState = clone(state);
    state = clone(future[future.length - 1]);
    if (!saveState()) {
      state = previousState;
      renderAll();
      return;
    }
    future.pop();
    pushHistory(previousState);
    selectedInstanceId = state.items.some(item => item.instanceId === selectedInstanceId) ? selectedInstanceId : null;
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

  function itemFootprint(item) {
    const def = getDef(item?.defId);
    if (!def) return 10;
    return clamp(((Number(def.width) || 86) * finiteNumber(item.scale, 1, .58, 1.42)) / 9, 6, 22);
  }

  function canPlaceAt(shelfId, item, x) {
    if (state.placementMode === 'free') return true;
    const footprint = itemFootprint(item);
    return displayedOn(shelfId)
      .filter(other => other.instanceId !== item.instanceId)
      .every(other => Math.abs(other.x - x) >= (footprint + itemFootprint(other)) * .43);
  }

  function findOpenX(shelfId, item, preferredX = 50) {
    const preferred = clamp(state.placementMode === 'magnetic' ? Math.round(preferredX / 4) * 4 : preferredX, 4, 96);
    if (canPlaceAt(shelfId, item, preferred)) return preferred;
    if (state.placementMode === 'free') return preferred;
    const candidates = Array.from({ length: 24 }, (_, index) => 4 + index * 4)
      .sort((a, b) => Math.abs(a - preferred) - Math.abs(b - preferred));
    return candidates.find(candidate => canPlaceAt(shelfId, item, candidate)) ?? null;
  }

  function reputationForLevel(level) {
    if (level <= 1) return 0;
    return Math.round(85 * Math.pow(level - 1, 1.55));
  }

  function playerLevel(reputation = state.reputation) {
    let level = 1;
    while (level < 20 && reputation >= reputationForLevel(level + 1)) level += 1;
    return level;
  }

  function itemUnlockLevel(def) {
    if (Number.isFinite(Number(def?.unlockLevel))) return Math.max(1, Number(def.unlockLevel));
    return { common: 1, uncommon: 1, rare: 2, epic: 4, legendary: 6 }[def?.rarity] || 1;
  }

  function competitiveDefinition(def) {
    return def && def.competitive !== false && !String(def.id).startsWith('custom_');
  }

  function completedCollectionNames() {
    const ownedIds = new Set(state.items.map(item => item.defId));
    const groups = new Map();
    DATA.items.forEach(def => {
      const name = def.collection || 'Sans collection';
      if (!groups.has(name)) groups.set(name, []);
      groups.get(name).push(def.id);
    });
    return Array.from(groups.entries())
      .filter(([, ids]) => ids.length >= 2 && ids.every(id => ownedIds.has(id)))
      .map(([name]) => name);
  }

  function careerLevel() {
    const chapters = Array.isArray(DATA.careerChapters) ? [...DATA.careerChapters] : [];
    if (!chapters.length) return Math.min(6, playerLevel());
    chapters.sort((a, b) => (Number(a.level ?? a.minLevel) || 1) - (Number(b.level ?? b.minLevel) || 1));
    let unlockedLevel = clamp(Math.round(Number(state.highestCareerLevel) || 1), 1, chapters.length);
    const reputationLevel = playerLevel();
    const completedCollections = completedCollectionNames().length;
    const completedChallengeCount = state.completedChallenges.length;
    for (const chapter of chapters) {
      const level = Number(chapter.level ?? chapter.minLevel) || 1;
      if (level <= unlockedLevel) continue;
      const eligible = reputationLevel >= level &&
        state.bestPrestige >= (Number(chapter.prestigeRequired) || 0) &&
        completedCollections >= (Number(chapter.collectionsRequired) || 0) &&
        completedChallengeCount >= (Number(chapter.challengesRequired) || 0);
      if (!eligible) break;
      unlockedLevel = Math.max(unlockedLevel, level);
    }
    return unlockedLevel;
  }

  function computePrestigeDetails() {
    let objectValue = 0;
    let synergy = 0;
    let variety = 0;
    let composition = 0;
    let furniture = 0;
    const duplicateCounts = new Map();
    const galleryCategories = new Set();

    for (const item of displayedItems()) {
      const def = getDef(item.defId);
      if (!def) continue;
      if (!competitiveDefinition(def)) continue;
      const count = duplicateCounts.get(def.id) || 0;
      duplicateCounts.set(def.id, count + 1);
      const duplicateMultiplier = count === 0 ? 1 : count === 1 ? .42 : .16;
      const rarity = DATA.rarity[def.rarity] || DATA.rarity.common;
      const condition = finiteNumber(item.condition, 1, .35, 1);
      const memoryBonus = Math.min(6, finiteNumber(item.sentimentalValue, 0, 0, 100) / 18);
      objectValue += ((rarity.points + Math.round((def.price ?? 0) * .045)) * duplicateMultiplier + memoryBonus) * condition;
      galleryCategories.add(def.category);
    }

    for (const shelf of state.shelves) {
      const items = displayedOn(shelf.id);
      if (!items.length) continue;
      const universeCounts = {};
      const categories = new Set();
      const positions = [];
      items.forEach(item => {
        const def = getDef(item.defId);
        if (!competitiveDefinition(def)) return;
        universeCounts[def.universe] = (universeCounts[def.universe] || 0) + 1;
        categories.add(def.category);
        positions.push({ x: item.x, footprint: clamp(((def.width || 86) * item.scale) / 9, 6, 22) });
      });
      Object.values(universeCounts).forEach(count => {
        if (count >= 2) synergy += Math.min(42, (count - 1) * 14);
      });
      if (categories.size >= 3) synergy += Math.min(24, categories.size * 4);
      positions.sort((a, b) => a.x - b.x);
      for (let index = 1; index < positions.length; index += 1) {
        const previous = positions[index - 1];
        const current = positions[index];
        const safeGap = (previous.footprint + current.footprint) * .42;
        composition += current.x - previous.x >= safeGap ? 2 : -8;
      }
      const shelfDef = getShelfDef(shelf.type);
      furniture += Number(shelfDef.prestigeBonus) || (['glass', 'neon', 'museum'].includes(shelfDef.id) ? 7 : 2);
    }

    variety = Math.min(36, Math.max(0, galleryCategories.size - 1) * 5);
    const themeDef = DATA.themes.find(theme => theme.id === state.currentTheme);
    const lightDef = DATA.lights.find(light => light.id === state.currentLight);
    const atmosphere = (Number(themeDef?.prestigeBonus) || (state.currentTheme === 'bedroom' ? 0 : 8)) +
      (Number(lightDef?.prestigeBonus) || 0);
    const cleanlinessMultiplier = .58 + (state.cleanliness / 100) * .42;
    const subtotal = Math.max(0, objectValue + synergy + variety + composition + furniture + atmosphere);
    return {
      objectValue: Math.round(objectValue),
      synergy: Math.round(synergy),
      variety: Math.round(variety),
      composition: Math.round(composition),
      furniture: Math.round(furniture),
      atmosphere: Math.round(atmosphere),
      cleanlinessMultiplier,
      total: Math.max(0, Math.round(subtotal * cleanlinessMultiplier))
    };
  }

  function computePrestige() {
    return computePrestigeDetails().total;
  }

  function maxSameUniverseOnShelf() {
    let max = 0;
    for (const shelf of state.shelves) {
      const counts = {};
      displayedOn(shelf.id).forEach(item => {
        const def = getDef(item.defId);
        if (!competitiveDefinition(def)) return;
        counts[def.universe] = (counts[def.universe] || 0) + 1;
      });
      max = Math.max(max, ...Object.values(counts), 0);
    }
    return max;
  }

  function challengeProgress(challenge) {
    if (!challenge) return 0;
    const competitiveDisplayed = displayedItems().filter(item => competitiveDefinition(getDef(item.defId)));
    const ownedUnique = new Set(state.items.filter(item => competitiveDefinition(getDef(item.defId))).map(item => item.defId)).size;
    const metrics = {
      displayed: competitiveDisplayed.length,
      same_universe: maxSameUniverseOnShelf(),
      category_mix: new Set(competitiveDisplayed.map(item => getDef(item.defId)?.category).filter(Boolean)).size,
      day: state.day,
      prestige: computePrestige(),
      rare_display: competitiveDisplayed.filter(item => ['rare', 'epic', 'legendary'].includes(getDef(item.defId)?.rarity)).length,
      shelves: state.shelves.length,
      owned_unique: ownedUnique,
      themes: state.unlockedThemes.length,
      visits: state.visits,
      unique_presentations: Object.keys(state.visitSignatureCounts || {}).length,
      collections: completedCollectionNames().length,
      level: careerLevel()
    };
    return Number(metrics[challenge.metric]) || 0;
  }

  function currentChallenge() {
    const level = careerLevel();
    return challenges.find(challenge =>
      !state.completedChallenges.includes(challenge.id) && level >= (Number(challenge.minLevel) || 1)
    ) || null;
  }

  function nextLockedChallenge() {
    const level = careerLevel();
    return challenges.find(challenge =>
      !state.completedChallenges.includes(challenge.id) && level < (Number(challenge.minLevel) || 1)
    ) || null;
  }

  function currentBrief() {
    const briefs = Array.isArray(DATA.exhibitionBriefs) ? DATA.exhibitionBriefs : [];
    return briefs.length ? briefs[(state.day - 1) % briefs.length] : null;
  }

  function briefProgress(brief) {
    if (!brief) return 0;
    const competitiveDisplayed = displayedItems().filter(item => competitiveDefinition(getDef(item.defId)));
    const values = {
      universe: competitiveDisplayed.filter(item => getDef(item.defId)?.universe === brief.value).length,
      category_mix: new Set(competitiveDisplayed.map(item => getDef(item.defId)?.category).filter(Boolean)).size,
      rare_display: competitiveDisplayed.filter(item => ['rare', 'epic', 'legendary'].includes(getDef(item.defId)?.rarity)).length,
      clean: Math.round(state.cleanliness),
      light_dark: state.currentLight === 'dark' ? 1 : 0,
      unique_items: new Set(competitiveDisplayed.map(item => item.defId)).size
    };
    return Number(values[brief.metric]) || 0;
  }

  function renderAll() {
    const focusedInventoryId = document.activeElement?.dataset?.selectItem || null;
    const focusedPlacedId = document.activeElement?.dataset?.placedId || null;
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
    renderCareer();
    renderBrief();
    renderTutorial();
    renderActivity();
    dom.undoBtn.disabled = history.length === 0;
    dom.redoBtn.disabled = future.length === 0;
    if (focusedInventoryId || focusedPlacedId) {
      window.requestAnimationFrame(() => {
        const selector = focusedInventoryId
          ? `[data-select-item="${CSS.escape(focusedInventoryId)}"]`
          : `[data-placed-id="${CSS.escape(focusedPlacedId)}"]`;
        document.querySelector(selector)?.focus({ preventScroll: true });
      });
    }
  }

  function renderBodyState() {
    document.body.dataset.roomTheme = state.currentTheme;
    document.body.dataset.light = state.currentLight;
    document.body.dataset.placementMode = state.placementMode;
    $('#galleryTitle').textContent = state.galleryName || 'Cabinet principal';
    if (dom.soundBtn) {
      dom.soundBtn.textContent = state.soundEnabled ? 'Son : oui' : 'Son : non';
      dom.soundBtn.setAttribute('aria-pressed', String(state.soundEnabled));
    }
  }

  function renderStats() {
    const details = computePrestigeDetails();
    dom.coinsStat.textContent = formatNumber(state.coins);
    dom.prestigeStat.textContent = formatNumber(details.total);
    dom.dayStat.textContent = String(state.day);
    dom.cleanStat.textContent = `${Math.round(state.cleanliness)}%`;
    dom.displayCount.textContent = String(displayedItems().length);
    if (dom.levelStat) dom.levelStat.textContent = String(careerLevel());
    if (dom.prestigeBreakdown) {
      dom.prestigeBreakdown.textContent =
        `Pièces ${details.objectValue} · séries ${details.synergy} · variété ${details.variety} · mise en scène ${details.composition} · mobilier ${details.furniture} · ambiance ${details.atmosphere}`;
    }
  }

  function renderTabs() {
    $$('[data-panel-tab]').forEach(button => {
      const active = button.dataset.panelTab === ui.panelTab;
      button.classList.toggle('active', active);
      button.setAttribute('aria-selected', String(active));
      button.tabIndex = active ? 0 : -1;
    });
    $$('[data-panel-view]').forEach(view => {
      const active = view.dataset.panelView === ui.panelTab;
      view.classList.toggle('active', active);
      view.hidden = !active;
    });
    $$('[data-shop-tab]').forEach(button => {
      const active = button.dataset.shopTab === ui.shopTab;
      button.classList.toggle('active', active);
      button.setAttribute('aria-selected', String(active));
      button.tabIndex = active ? 0 : -1;
      if (active && button.id) dom.shopGrid?.setAttribute('aria-labelledby', button.id);
    });
  }

  function renderCareer() {
    if (!dom.reputationProgress || !dom.reputationProgressText) return;
    const level = careerLevel();
    const chapters = Array.isArray(DATA.careerChapters) ? DATA.careerChapters : [];
    const chapterLevel = entry => Number(entry.level ?? entry.minLevel) || 1;
    const maxCareerLevel = Math.max(1, ...chapters.map(chapterLevel));
    const currentThreshold = reputationForLevel(level);
    const nextThreshold = level >= maxCareerLevel ? currentThreshold : reputationForLevel(level + 1);
    const levelSpan = Math.max(1, nextThreshold - currentThreshold);
    const percent = level >= maxCareerLevel ? 100 : clamp(((state.reputation - currentThreshold) / levelSpan) * 100, 0, 100);
    dom.reputationProgress.style.width = `${Math.round(percent)}%`;
    dom.reputationProgress.parentElement?.setAttribute('aria-valuenow', String(Math.round(percent)));
    dom.reputationProgressText.textContent = level >= maxCareerLevel
      ? `${formatNumber(state.reputation)} réputation · carrière accomplie`
      : `${formatNumber(state.reputation)} / ${formatNumber(nextThreshold)} réputation requise`;
    const chapter = chapters.filter(entry => level >= chapterLevel(entry)).at(-1);
    const nextChapter = chapters.find(entry => level < chapterLevel(entry));
    if (dom.chapterName) dom.chapterName.textContent = chapter?.title || chapter?.name || 'Coin de chambre';
    if (dom.nextUnlockText) {
      const unlockables = [
        ...DATA.items.map(def => ({ level: itemUnlockLevel(def), name: def.name })),
        ...DATA.shelves.map(def => ({ level: Number(def.unlockLevel) || 1, name: def.name })),
        ...DATA.themes.map(def => ({ level: Number(def.unlockLevel) || 1, name: def.name })),
        ...DATA.lights.map(def => ({ level: Number(def.unlockLevel) || 1, name: def.name }))
      ].filter(entry => entry.level > level).sort((a, b) => a.level - b.level);
      const nextUnlock = unlockables[0];
      const nextChapterLevel = nextChapter ? chapterLevel(nextChapter) : Infinity;
      const missing = [];
      if (nextChapter) {
        if (playerLevel() < nextChapterLevel) missing.push(`${formatNumber(Math.max(0, nextThreshold - state.reputation))} réputation`);
        if (state.bestPrestige < (Number(nextChapter.prestigeRequired) || 0)) missing.push(`prestige ${formatNumber(nextChapter.prestigeRequired)}`);
        if (completedCollectionNames().length < (Number(nextChapter.collectionsRequired) || 0)) missing.push(`${nextChapter.collectionsRequired} collection(s)`);
        if (state.completedChallenges.length < (Number(nextChapter.challengesRequired) || 0)) missing.push(`${nextChapter.challengesRequired} objectif(s)`);
      }
      dom.nextUnlockText.textContent = nextChapter
        ? `${nextChapter.title || nextChapter.name} : ${missing.length ? missing.join(' · ') : 'conditions remplies, valide une nouvelle action'}`
        : nextUnlock ? `Prochain déblocage au niveau ${nextUnlock.level} : ${nextUnlock.name}` : 'Tous les déblocages de carrière sont acquis.';
    }
  }

  function renderBrief() {
    if (!dom.briefCard) return;
    const brief = currentBrief();
    dom.briefCard.hidden = !brief;
    if (!brief) return;
    const target = Math.max(1, Number(brief.target) || 1);
    const progress = clamp(briefProgress(brief), 0, target);
    if (dom.briefTitle) dom.briefTitle.textContent = brief.title;
    if (dom.briefDescription) dom.briefDescription.textContent = brief.description;
    if (dom.briefProgress) {
      dom.briefProgress.style.width = `${Math.round((progress / target) * 100)}%`;
      dom.briefProgress.parentElement?.setAttribute('aria-valuenow', String(progress));
      dom.briefProgress.parentElement?.setAttribute('aria-valuemax', String(target));
    }
    if (dom.briefProgressText) dom.briefProgressText.textContent = `${formatNumber(progress)} / ${formatNumber(target)}`;
    if (dom.briefReward) dom.briefReward.textContent = `+${formatNumber(brief.creditBonus || 0)} ¤ · +${formatNumber(brief.reputationBonus || 0)} réputation`;
  }

  function renderTutorial() {
    if (!dom.tutorialCard || !dom.tutorialList) return;
    const steps = [
      ['exploredShop', 'Explorer la boutique'],
      ['acquired', 'Acquérir une nouvelle pièce'],
      ['arranged', 'Ajuster la mise en scène'],
      ['hosted', 'Accueillir les premiers visiteurs']
    ];
    dom.tutorialList.innerHTML = steps.map(([key, label]) =>
      `<li class="${state.tutorial[key] ? 'complete' : ''}"><span aria-hidden="true">${state.tutorial[key] ? '✓' : '○'}</span> ${esc(label)}</li>`
    ).join('');
    dom.tutorialCard.classList.toggle('complete', Boolean(state.tutorial.rewardClaimed));
  }

  function renderInventory() {
    const categories = ['Tout', ...new Set(inventoryItems().map(item => getDef(item.defId)?.category).filter(Boolean))];
    if (!categories.includes(ui.inventoryFilter)) ui.inventoryFilter = 'Tout';
    dom.inventoryFilters.innerHTML = categories.map(category => `
      <button class="filter-chip ${ui.inventoryFilter === category ? 'active' : ''}" data-filter="${esc(category)}" aria-pressed="${ui.inventoryFilter === category}">${esc(category)}</button>
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
        draggable="true" data-instance-id="${esc(item.instanceId)}">
        <button class="quick-place" data-quick-place="${esc(item.instanceId)}" title="Placer automatiquement" aria-label="Placer automatiquement ${esc(def.name)}">↗</button>
        <button class="item-card-select" type="button" data-select-item="${esc(item.instanceId)}"
          aria-label="Sélectionner ${esc(def.name)}" aria-pressed="${selectedInstanceId === item.instanceId}">
          <span class="item-card-visual"><img src="${esc(def.image)}" alt="" draggable="false" loading="lazy" decoding="async" /></span>
          <span class="item-card-title">${esc(def.name)}</span>
          <span class="item-card-meta">
            <span><i class="rarity-dot"></i>${esc(rarity.label)}</span>
            <span>${esc(def.category)}</span>
          </span>
        </button>
      </article>`;
  }

  function attachInventoryCardEvents() {
    $$('.item-card[data-instance-id]').forEach(card => {
      const selectButton = card.querySelector('[data-select-item]');
      selectButton?.addEventListener('click', () => {
        selectedInstanceId = card.dataset.instanceId;
        renderAll();
      });
      selectButton?.addEventListener('dblclick', () => quickPlace(card.dataset.instanceId));
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
    const level = careerLevel();
    const unlocked = DATA.items.filter(def => itemUnlockLevel(def) <= level);
    const start = unlocked.length ? ((state.day - 1) * 5) % unlocked.length : 0;
    const stock = Array.from({ length: Math.min(8, unlocked.length) }, (_, index) => unlocked[(start + index) % unlocked.length]);
    const source = ['Boutique de quartier', 'Brocante du dimanche', 'Convention locale'][state.day % 3];
    dom.shopGrid.innerHTML = stock.map(def => {
      const rarity = DATA.rarity[def.rarity] || DATA.rarity.common;
      const canBuy = state.coins >= def.price;
      return `
        <article class="shop-card rarity-${esc(def.rarity)}">
          <img src="${esc(def.image)}" alt="" loading="lazy" decoding="async" />
          <div><h4>${esc(def.name)}</h4><p>${esc(def.universe)} · ${esc(rarity.label)}<br>${esc(source)}</p></div>
          <div class="price"><span>${formatNumber(def.price)} ¤</span><button class="button" data-buy-item="${esc(def.id)}" ${canBuy ? '' : 'disabled'} aria-label="Acheter ${esc(def.name)} pour ${formatNumber(def.price)} crédits">Acheter</button></div>
        </article>`;
    }).join('') || '<p class="empty-state">Le prochain stock se débloque avec ta réputation.</p>';
    $$('[data-buy-item]').forEach(button => button.addEventListener('click', () => buyItem(button.dataset.buyItem)));
  }

  function renderShelfShop() {
    const level = careerLevel();
    dom.shopGrid.innerHTML = DATA.shelves.map(def => {
      const unlockLevel = Number(def.unlockLevel) || 1;
      const unlocked = level >= unlockLevel;
      const canBuy = unlocked && state.coins >= def.price && state.shelves.length < MAX_SHELVES;
      return `
        <article class="shop-card ${unlocked ? '' : 'locked'}">
          <div class="shop-swatch swatch-${esc(def.id)}"></div>
          <div><h4>${esc(def.name)}</h4><p>${esc(def.description)} Capacité : ${def.capacity} kg.</p></div>
          <div class="price"><span>${unlocked ? `${formatNumber(def.price)} ¤` : `Niv. ${unlockLevel}`}</span><button class="button" data-buy-shelf="${esc(def.id)}" ${canBuy ? '' : 'disabled'}>${unlocked ? 'Acheter' : 'Verrouillé'}</button></div>
        </article>`;
    }).join('') + (state.shelves.length >= MAX_SHELVES ? '<p class="empty-state">Cette salle est complète : réorganise ou revends une étagère vide.</p>' : '');
    $$('[data-buy-shelf]').forEach(button => button.addEventListener('click', () => buyShelf(button.dataset.buyShelf)));
  }

  function renderThemeShop() {
    const level = careerLevel();
    const themeCards = DATA.themes.map(def => {
      const owned = state.unlockedThemes.includes(def.id);
      const active = state.currentTheme === def.id;
      const unlockLevel = Number(def.unlockLevel) || 1;
      const unlocked = level >= unlockLevel;
      const canBuy = unlocked && state.coins >= def.price;
      const label = active ? 'Active' : owned ? 'Appliquer' : unlocked ? 'Acheter' : 'Verrouillée';
      return `
        <article class="shop-card ${unlocked ? '' : 'locked'}">
          <div class="shop-swatch swatch-${esc(def.id)}"></div>
          <div><h4>${esc(def.name)}</h4><p>${esc(def.description)}</p></div>
          <div class="price"><span>${owned ? 'Possédée' : unlocked ? `${formatNumber(def.price)} ¤` : `Niv. ${unlockLevel}`}</span><button class="button" data-theme-action="${esc(def.id)}" ${active || (!owned && !canBuy) ? 'disabled' : ''}>${label}</button></div>
        </article>`;
    }).join('');
    const lightCards = DATA.lights.map(def => {
      const owned = state.unlockedLights.includes(def.id);
      const active = state.currentLight === def.id;
      const unlockLevel = Number(def.unlockLevel) || 1;
      const unlocked = level >= unlockLevel;
      const canBuy = unlocked && state.coins >= def.price;
      const label = active ? 'Active' : owned ? 'Appliquer' : unlocked ? 'Acheter' : 'Verrouillée';
      return `
        <article class="shop-card ${unlocked ? '' : 'locked'}">
          <div class="shop-swatch swatch-${esc(def.id)}"></div>
          <div><h4>${esc(def.name)}</h4><p>Éclairage de galerie · entretien ${formatNumber(def.maintenanceCost || 0)} ¤ par visite.</p></div>
          <div class="price"><span>${owned ? 'Possédée' : unlocked ? `${formatNumber(def.price)} ¤` : `Niv. ${unlockLevel}`}</span><button class="button" data-light-action="${esc(def.id)}" ${active || (!owned && !canBuy) ? 'disabled' : ''}>${label}</button></div>
        </article>`;
    }).join('');
    dom.shopGrid.innerHTML = `<h3 class="shop-section-title">Décors de la galerie</h3>${themeCards}<h3 class="shop-section-title">Ambiances lumineuses</h3>${lightCards}`;
    $$('[data-theme-action]').forEach(button => button.addEventListener('click', () => themeAction(button.dataset.themeAction)));
    $$('[data-light-action]').forEach(button => button.addEventListener('click', () => lightAction(button.dataset.lightAction)));
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
      const complete = defs.length >= 2 && owned === defs.length && defs.every(competitiveDefinition);
      const claimed = state.collectionRewards.includes(name);
      const reward = 80 + defs.length * 35;
      return `
        <article class="collection-row">
          <header><h4>${esc(name)}</h4><small>${owned} / ${defs.length}</small></header>
          <div class="mini-progress" role="progressbar" aria-label="Collection ${esc(name)}" aria-valuemin="0" aria-valuemax="${defs.length}" aria-valuenow="${owned}"><span style="width:${percent}%"></span></div>
          ${complete ? `<button class="button ghost collection-reward" data-claim-collection="${esc(name)}" ${claimed ? 'disabled' : ''}>${claimed ? 'Plaque obtenue' : `Obtenir la plaque · +${reward} ¤`}</button>` : ''}
        </article>`;
    }).join('');
    $$('[data-claim-collection]').forEach(button => button.addEventListener('click', () => claimCollection(button.dataset.claimCollection)));
  }

  function renderThemeControls() {
    dom.themeSelect.innerHTML = DATA.themes.filter(theme => state.unlockedThemes.includes(theme.id)).map(theme => `
      <option value="${esc(theme.id)}" ${theme.id === state.currentTheme ? 'selected' : ''}>${esc(theme.name)}</option>
    `).join('');
    dom.lightSelect.innerHTML = DATA.lights.filter(light => state.unlockedLights.includes(light.id)).map(light => `
      <option value="${esc(light.id)}" ${light.id === state.currentLight ? 'selected' : ''}>${esc(light.name)}</option>
    `).join('');
    if (dom.placementModeSelect) dom.placementModeSelect.value = state.placementMode;
  }

  function renderShelves() {
    const dusty = state.cleanliness < 52 ? 'dusty' : '';
    dom.shelves.innerHTML = state.shelves.map((shelf, index) => {
      const shelfDef = getShelfDef(shelf.type);
      const items = displayedOn(shelf.id).sort((a, b) => a.z - b.z);
      const used = shelfWeight(shelf.id);
      return `
        <section class="shelf-unit ${esc(shelfDef.className)} ${dusty}" data-shelf-id="${esc(shelf.id)}" aria-label="Étagère ${index + 1}, ${esc(shelfDef.name)}">
          <div class="shelf-topline">
            <div class="shelf-label"><strong>${index + 1}</strong><span>${esc(shelfDef.name)}</span><span class="shelf-capacity">${used.toFixed(1)} / ${shelfDef.capacity} kg</span></div>
            <div class="shelf-actions">
              <button data-move-shelf="${esc(shelf.id)}" data-direction="-1" title="Monter" aria-label="Monter l’étagère ${index + 1}" ${index === 0 ? 'disabled' : ''}>↑</button>
              <button data-move-shelf="${esc(shelf.id)}" data-direction="1" title="Descendre" aria-label="Descendre l’étagère ${index + 1}" ${index === state.shelves.length - 1 ? 'disabled' : ''}>↓</button>
              <button data-remove-shelf="${esc(shelf.id)}" title="Revendre l’étagère" aria-label="Revendre l’étagère ${index + 1}" ${items.length ? 'disabled' : ''}>×</button>
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
        draggable="true" tabindex="0" role="button" data-placed-id="${esc(item.instanceId)}" title="${esc(def.name)}" aria-label="Sélectionner ${esc(def.name)}" aria-pressed="${selectedInstanceId === item.instanceId}"
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
      element.addEventListener('pointerdown', event => {
        if (!['touch', 'pen'].includes(event.pointerType) || !event.isPrimary) return;
        const shelfElement = element.closest('.shelf-unit[data-shelf-id]');
        if (!shelfElement) return;
        let pointerX = null;
        element.setPointerCapture(event.pointerId);
        const move = moveEvent => {
          const rect = shelfElement.getBoundingClientRect();
          pointerX = clamp(((moveEvent.clientX - rect.left) / rect.width) * 100, 4, 96);
          element.style.left = `${pointerX}%`;
          element.classList.add('dragging');
        };
        const finish = () => {
          element.removeEventListener('pointermove', move);
          element.removeEventListener('pointerup', finish);
          element.removeEventListener('pointercancel', cancel);
          element.classList.remove('dragging');
          if (pointerX != null) placeItem(element.dataset.placedId, shelfElement.dataset.shelfId, pointerX);
        };
        const cancel = () => {
          element.removeEventListener('pointermove', move);
          element.removeEventListener('pointerup', finish);
          element.removeEventListener('pointercancel', cancel);
          element.classList.remove('dragging');
          renderShelves();
        };
        element.addEventListener('pointermove', move);
        element.addEventListener('pointerup', finish);
        element.addEventListener('pointercancel', cancel);
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
    const tradeable = def.tradeable !== false && (Number(def.price) || 0) > 0;
    const resaleValue = Math.max(0, Math.round((def.price ?? 0) * .5));
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
        <div class="meta-box"><span>Valeur</span><strong>${tradeable ? `${formatNumber(def.price ?? 0)} ¤` : 'Personnelle'}</strong></div>
        <div class="meta-box"><span>État</span><strong>${Math.round(item.condition * 100)}%</strong></div>
        <div class="meta-box"><span>Attachement</span><strong>${item.sentimentalValue || 0} / 100</strong></div>
      </div>
      ${item.location === 'inventory' ? `
        <select class="placement-select" id="inspectorShelfSelect" ${availableShelves.length ? '' : 'disabled'}>
          ${availableShelves.map(shelf => `<option value="${esc(shelf.id)}">${esc(getShelfDef(shelf.type).name)}</option>`).join('')}
        </select>
        <div class="inspector-actions">
          <button class="button accent span-all" id="inspectorPlaceBtn" ${availableShelves.length ? '' : 'disabled'}>Placer dans la vitrine</button>
          ${tradeable ? `<button class="button ghost span-all" id="inspectorSellBtn">Revendre pour ${formatNumber(resaleValue)} ¤</button>` : '<p class="muted span-all personal-note">Création personnelle : exposable, non revendable et hors score compétitif.</p><button class="button ghost span-all" id="inspectorDeleteBtn">Retirer cette création</button>'}
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
          ${tradeable ? `<button class="button ghost span-all" id="inspectorSellBtn">Revendre pour ${formatNumber(resaleValue)} ¤</button>` : '<p class="muted span-all personal-note">Création personnelle : exposable, non revendable et hors score compétitif.</p><button class="button ghost span-all" id="inspectorDeleteBtn">Retirer cette création</button>'}
        </div>`}
      ${item.condition < .995 ? '<button class="button ghost wide restore-item" id="inspectorRestoreBtn">Entretenir la pièce · 18 ¤</button>' : ''}
    `;

    $('#inspectorPlaceBtn')?.addEventListener('click', () => {
      const shelfId = $('#inspectorShelfSelect')?.value;
      if (shelfId) placeItem(item.instanceId, shelfId, nextOpenX(shelfId, item));
    });
    $('#inspectorSellBtn')?.addEventListener('click', () => sellItem(item.instanceId));
    $('#inspectorDeleteBtn')?.addEventListener('click', () => deleteCustomItem(item.instanceId));
    $('#inspectorRestoreBtn')?.addEventListener('click', () => restoreItem(item.instanceId));
    $$('[data-item-action]').forEach(button => button.addEventListener('click', () => itemAction(item.instanceId, button.dataset.itemAction)));
  }

  function renderChallenge() {
    const challenge = currentChallenge();
    if (!challenge) {
      const locked = nextLockedChallenge();
      dom.challengeTitle.textContent = locked ? `Prochain objectif · niveau ${locked.minLevel}` : 'Parcours de collection accompli';
      dom.challengeReward.textContent = locked ? `+${locked.reward}` : '✓';
      dom.challengeDescription.textContent = locked
        ? 'Développe ta réputation pour ouvrir la prochaine commande de curation.'
        : 'Toutes les commandes scénarisées ont été validées une seule fois.';
      dom.challengeProgress.style.width = '100%';
      dom.challengeProgressText.textContent = locked ? `Niveau ${careerLevel()} / ${locked.minLevel}` : `${challenges.length} / ${challenges.length}`;
      dom.claimChallengeBtn.disabled = true;
      dom.claimChallengeBtn.textContent = locked ? 'Verrouillé' : 'Terminé';
      return;
    }
    const progress = Math.min(challenge.target, Math.max(0, challengeProgress(challenge)));
    const complete = progress >= challenge.target;
    dom.challengeTitle.textContent = challenge.title;
    dom.challengeReward.textContent = `+${challenge.reward}`;
    dom.challengeDescription.textContent = challenge.description;
    dom.challengeProgress.style.width = `${Math.round((progress / challenge.target) * 100)}%`;
    dom.challengeProgress.parentElement?.setAttribute('aria-valuenow', String(progress));
    dom.challengeProgress.parentElement?.setAttribute('aria-valuemax', String(challenge.target));
    dom.challengeProgressText.textContent = `${formatNumber(progress)} / ${formatNumber(challenge.target)}`;
    dom.claimChallengeBtn.disabled = !complete;
    dom.claimChallengeBtn.textContent = 'Réclamer';
  }

  function renderActivity() {
    dom.activityLog.innerHTML = state.log.slice(0, 7).map(entry => `<div class="activity-entry"><span>${esc(entry)}</span></div>`).join('');
  }

  function buyItem(defId) {
    const def = getDef(defId);
    if (!def || state.coins < def.price) return toast('Crédits insuffisants.', 'error');
    if (itemUnlockLevel(def) > careerLevel()) return toast('Cette pièce se débloque avec davantage de réputation.', 'error');
    if (state.items.length >= MAX_ITEM_INSTANCES) return toast(`Inventaire complet (${MAX_ITEM_INSTANCES} pièces). Revends une pièce avant un nouvel achat.`, 'error', 4400);
    ui.panelTab = 'inventory';
    if (!commit(() => {
      state.coins -= def.price;
      state.items.push({
        instanceId: uid('item'), defId: def.id, location: 'inventory', shelfId: null, x: 50,
        scale: 1, flipped: false, z: 1, acquiredDay: state.day, condition: 1,
        sentimentalValue: Math.min(100, 4 + Math.round((DATA.rarity[def.rarity]?.points || 0) / 3))
      });
      state.tutorial.acquired = true;
    }, `${def.name} a rejoint l’inventaire.`)) return;
    playSound('buy');
    toast(`${def.name} acheté.`, 'success');
  }

  function buyShelf(type) {
    const def = getShelfDef(type);
    if (state.shelves.length >= MAX_SHELVES) return toast('Cette pièce ne peut pas accueillir d’étagère supplémentaire.', 'error');
    if (state.coins < def.price) return toast('Crédits insuffisants.', 'error');
    if ((Number(def.unlockLevel) || 1) > careerLevel()) return toast('Ce meuble se débloque plus tard dans la carrière.', 'error');
    if (!commit(() => {
      state.coins -= def.price;
      state.shelves.push({ id: uid('shelf'), type: def.id });
    }, `${def.name} installée dans la galerie.`)) return;
    playSound('buy');
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
    if ((Number(def.unlockLevel) || 1) > careerLevel()) return toast('Cette pièce se débloque plus tard dans la carrière.', 'error');
    if (state.coins < def.price) return toast('Crédits insuffisants.', 'error');
    if (!commit(() => {
      state.coins -= def.price;
      state.unlockedThemes.push(themeId);
      state.currentTheme = themeId;
    }, `${def.name} débloquée et appliquée.`)) return;
    playSound('success');
    toast('Nouvelle pièce débloquée.', 'success');
  }

  function lightAction(lightId) {
    const def = DATA.lights.find(light => light.id === lightId);
    if (!def) return;
    const owned = state.unlockedLights.includes(lightId);
    if (owned) {
      commit(() => { state.currentLight = lightId; }, `${def.name} devient l’ambiance active.`);
      return;
    }
    if ((Number(def.unlockLevel) || 1) > careerLevel()) return toast('Cette ambiance se débloque plus tard dans la carrière.', 'error');
    if (state.coins < def.price) return toast('Crédits insuffisants.', 'error');
    if (!commit(() => {
      state.coins -= def.price;
      state.unlockedLights.push(lightId);
      state.currentLight = lightId;
    }, `${def.name} débloquée et appliquée.`)) return;
    playSound('success');
    toast('Nouvelle ambiance lumineuse débloquée.', 'success');
  }

  function quickPlace(instanceId) {
    const item = getInstance(instanceId);
    if (!item) return;
    const shelf = state.shelves
      .filter(entry => shelfCanHold(entry.id, item))
      .sort((a, b) => shelfWeight(a.id) - shelfWeight(b.id))[0];
    if (!shelf) return toast('Aucune étagère ne peut supporter cet objet.', 'error');
    placeItem(instanceId, shelf.id, nextOpenX(shelf.id, item));
  }

  function nextOpenX(shelfId, item) {
    const xs = displayedOn(shelfId).filter(other => other.instanceId !== item?.instanceId).map(other => other.x).sort((a, b) => a - b);
    const candidates = [10, 22, 34, 46, 58, 70, 82, 92];
    const preferred = candidates.find(candidate => xs.every(x => Math.abs(x - candidate) > 8)) ?? clamp(10 + xs.length * 11, 5, 95);
    return findOpenX(shelfId, item, preferred);
  }

  function placeItem(instanceId, shelfId, x) {
    const item = getInstance(instanceId);
    const shelf = state.shelves.find(entry => entry.id === shelfId);
    if (!item || !shelf) return;
    if (!shelfCanHold(shelfId, item)) return toast(`Cette étagère ne peut pas supporter ${getDef(item.defId)?.name || 'cet objet'}.`, 'error');
    const placementX = findOpenX(shelfId, item, Number.isFinite(Number(x)) ? Number(x) : 50);
    if (placementX == null) return toast('Cette étagère est trop dense en mode magnétique. Passe en mode libre ou déplace une pièce.', 'error', 4200);
    const wasInventory = item.location === 'inventory';
    selectedInstanceId = instanceId;
    if (!commit(() => {
      item.location = 'shelf';
      item.shelfId = shelfId;
      item.x = placementX;
      item.z = Math.max(1, ...displayedOn(shelfId).filter(other => other.instanceId !== item.instanceId).map(other => other.z), 0) + 1;
      state.tutorial.arranged = true;
    }, wasInventory ? `${getDef(item.defId).name} est maintenant exposé.` : `${getDef(item.defId).name} a été déplacé.`)) return;
    playSound('place');
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
    if (def.tradeable === false || (Number(def.price) || 0) <= 0) {
      return toast('Les créations personnelles ne sont pas revendables.', 'error');
    }
    const value = Math.max(1, Math.round((def.price ?? 0) * .5));
    if (!window.confirm(`Revendre « ${def.name} » pour ${value} crédits ?`)) return;
    if (!commit(() => {
      state.coins += value;
      state.items = state.items.filter(entry => entry.instanceId !== instanceId);
      if (!state.items.some(entry => entry.defId === def.id)) {
        state.customItems = state.customItems.filter(entry => entry.id !== def.id);
      }
    }, `${def.name} a été revendu pour ${value} crédits.`)) return;
    selectedInstanceId = null;
    playSound('sell');
    toast('Objet revendu.', 'success');
  }

  function deleteCustomItem(instanceId) {
    const item = getInstance(instanceId);
    const def = item ? getDef(item.defId) : null;
    if (!item || competitiveDefinition(def)) return;
    if (!window.confirm(`Retirer « ${def.name} » de cette sauvegarde ? Tu pourras encore annuler juste après.`)) return;
    if (!commit(() => {
      state.items = state.items.filter(entry => entry.instanceId !== instanceId);
      if (!state.items.some(entry => entry.defId === def.id)) {
        state.customItems = state.customItems.filter(entry => entry.id !== def.id);
      }
    }, `${def.name} a été retiré de la collection personnelle.`)) return;
    selectedInstanceId = null;
    toast('Création retirée. L’espace de sauvegarde a été libéré.', 'success');
  }

  function restoreItem(instanceId) {
    const item = getInstance(instanceId);
    if (!item || item.condition >= .995) return toast('Cette pièce est déjà parfaitement entretenue.');
    const cost = 18;
    if (state.coins < cost) return toast('Il faut 18 crédits pour le matériel d’entretien.', 'error');
    if (!commit(() => {
      state.coins -= cost;
      item.condition = 1;
      item.sentimentalValue = clamp((item.sentimentalValue || 0) + 2, 0, 100);
    }, `${getDef(item.defId).name} a été soigneusement entretenu.`)) return;
    playSound('clean');
    toast('Pièce restaurée.', 'success');
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

  function gallerySignature() {
    return normalizeVisitSignature(JSON.stringify({
      theme: state.currentTheme,
      light: state.currentLight,
      shelves: state.shelves.map(shelf => ({
        type: shelf.type,
        items: displayedOn(shelf.id)
          .filter(item => competitiveDefinition(getDef(item.defId)))
          .sort((a, b) => a.x - b.x || a.defId.localeCompare(b.defId))
          .map(item => item.defId)
      }))
    }));
  }

  function showVisitReport(report) {
    if (!dom.visitDialog || !dom.visitReportBody) return;
    if (dom.visitReportTitle) dom.visitReportTitle.textContent = report.briefComplete ? 'Commande d’exposition réussie' : 'Compte rendu des visiteurs';
    dom.visitReportBody.innerHTML = `
      <dl class="visit-report-grid">
        <div><dt>Prestige</dt><dd>${formatNumber(report.prestige)}</dd></div>
        <div><dt>Recette nette</dt><dd>+${formatNumber(report.reward)} ¤</dd></div>
        <div><dt>Réputation</dt><dd>+${formatNumber(report.reputation)}</dd></div>
        <div><dt>Fraîcheur</dt><dd>${Math.round(report.repeatFactor * 100)}%</dd></div>
      </dl>
      <p>${report.briefComplete ? `Le brief « ${esc(report.briefTitle)} » a convaincu les visiteurs.` : 'Le brief du jour reste facultatif : ta galerie personnelle n’est jamais déclarée mauvaise.'}</p>
      ${report.repeatFactor < 1 ? '<p class="muted">Cette composition a déjà été vue : réorganise quelques pièces ou change l’ambiance pour retrouver toute la curiosité du public.</p>' : ''}
    `;
    dom.visitDialog.showModal();
  }

  function openGallery() {
    const competitiveDisplayed = displayedItems().filter(item => competitiveDefinition(getDef(item.defId)));
    if (competitiveDisplayed.length < 3) {
      return toast('Expose au moins trois pièces originales avant d’ouvrir la galerie.', 'error', 4200);
    }
    const prestige = computePrestige();
    const signature = gallerySignature();
    const signatureCounts = state.visitSignatureCounts || {};
    const knownSignature = Object.prototype.hasOwnProperty.call(signatureCounts, signature);
    const signatureLibraryFull = !knownSignature && Object.keys(signatureCounts).length >= 5000;
    const repeatCount = signatureLibraryFull ? 4 : (Number(signatureCounts[signature]) || 0);
    const repeatFactor = [1, .62, .32, .14, 0][Math.min(repeatCount, 4)];
    const uniqueCount = new Set(competitiveDisplayed.map(item => item.defId)).size;
    const shelfModifiers = state.shelves.reduce((total, shelf) => total + (Number(getShelfDef(shelf.type).visitorBonus) || 0), 0);
    const themeDef = DATA.themes.find(theme => theme.id === state.currentTheme);
    const lightDef = DATA.lights.find(light => light.id === state.currentLight);
    const loyaltyBonus = Math.min(0.1, state.visitorStreak * 0.01);
    const visitorMultiplier = 1 + shelfModifiers + (Number(themeDef?.visitorBonus) || 0) + (Number(lightDef?.visitorBonus) || 0) + loyaltyBonus;
    const maintenanceCost = 8 + state.shelves.length * 2 + (Number(lightDef?.maintenanceCost) || 0);
    const brief = currentBrief();
    const briefComplete = brief && briefProgress(brief) >= (Number(brief.target) || 1);
    const briefCredit = briefComplete ? Math.round((Number(brief.creditBonus) || 0) * repeatFactor) : 0;
    const briefReputation = briefComplete ? Math.round((Number(brief.reputationBonus) || 0) * repeatFactor) : 0;
    const gross = Math.round((20 + prestige * .17 + uniqueCount * 2.5) * visitorMultiplier * repeatFactor);
    const reward = Math.max(0, gross + briefCredit - maintenanceCost);
    const reputation = repeatFactor <= 0 ? 0 : Math.max(1, Math.round((prestige * .035 + uniqueCount * .6) * repeatFactor) + briefReputation);
    const dustProtection = state.shelves.reduce((total, shelf) => total + (Number(getShelfDef(shelf.type).dustProtection) || 0), 0) +
      (Number(themeDef?.dustProtection) || 0);
    const dustLoss = Math.max(1, 7 - Math.min(6, dustProtection));
    const wear = .003 + Math.min(.004, repeatCount * .001);
    if (!commit(() => {
      state.coins += reward;
      state.reputation += reputation;
      state.visits += 1;
      state.visitorStreak = reward > 0 ? state.visitorStreak + 1 : 0;
      state.day += 1;
      state.cleanliness = clamp(state.cleanliness - dustLoss, 0, 100);
      state.lastVisitSignature = signature;
      state.repeatVisitCount = repeatCount;
      state.recentVisitSignatures = [...(state.recentVisitSignatures || []), signature].slice(-6);
      if (!signatureLibraryFull || knownSignature) {
        state.visitSignatureCounts[signature] = Math.min(1000, repeatCount + 1);
      }
      state.tutorial.hosted = true;
      displayedItems().forEach(item => {
        item.condition = clamp(item.condition - wear, .35, 1);
        item.sentimentalValue = clamp((item.sentimentalValue || 0) + 1, 0, 100);
      });
    }, `${reward} crédits nets et ${reputation} réputation après une journée de visites.`)) return;
    playSound(briefComplete ? 'success' : 'visitors');
    showVisitReport({ prestige, reward, reputation, repeatFactor, briefComplete, briefTitle: brief?.title || '' });
    toast(`Galerie ouverte : +${reward} crédits, +${reputation} réputation.`, 'success', 4200);
  }

  function cleanGallery() {
    if (state.cleanliness >= 99) return toast('La galerie est déjà impeccable.');
    const cost = 8 + state.shelves.length * 3;
    if (state.coins < cost) return toast(`Il faut ${cost} crédits pour entretenir toute la galerie.`, 'error');
    if (!commit(() => {
      state.coins -= cost;
      state.cleanliness = 100;
    }, 'Toutes les vitrines ont été nettoyées.')) return;
    playSound('clean');
    toast('Galerie nettoyée.', 'success');
  }

  function autoArrange() {
    if (!displayedItems().length) return toast('Aucun objet à ranger.');
    if (!commit(() => {
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
      state.tutorial.arranged = true;
    }, 'La galerie a été rangée automatiquement.')) return;
    playSound('place');
  }

  function claimChallenge() {
    const challenge = currentChallenge();
    if (!challenge || state.completedChallenges.includes(challenge.id) || challengeProgress(challenge) < challenge.target) return;
    const reputationReward = Math.max(12, Math.round(challenge.reward * .18));
    if (!commit(() => {
      state.coins += challenge.reward;
      state.reputation += reputationReward;
      if (!state.completedChallenges.includes(challenge.id)) state.completedChallenges.push(challenge.id);
    }, `Défi « ${challenge.title} » terminé : +${challenge.reward} crédits et +${reputationReward} réputation.`)) return;
    playSound('success');
    toast('Récompense récupérée.', 'success');
  }

  function claimCollection(name) {
    if (!name || state.collectionRewards.includes(name)) return;
    const definitions = DATA.items.filter(def => (def.collection || 'Sans collection') === name);
    const ownedIds = new Set(state.items.map(item => item.defId));
    if (definitions.length < 2 || !definitions.every(def => ownedIds.has(def.id))) {
      return toast('Cette collection n’est pas encore complète.', 'error');
    }
    const reward = 80 + definitions.length * 35;
    const reputationReward = 25 + definitions.length * 8;
    if (!commit(() => {
      state.collectionRewards.push(name);
      state.coins += reward;
      state.reputation += reputationReward;
    }, `Plaque « ${name} » obtenue : +${reward} crédits et +${reputationReward} réputation.`)) return;
    playSound('success');
    toast('Collection célébrée par une plaque commémorative.', 'success', 3800);
  }

  function finalizeTutorial() {
    const previousState = clone(state);
    let changed = false;
    const tutorialDone = ['exploredShop', 'acquired', 'arranged', 'hosted'].every(key => state.tutorial[key]);
    let tutorialJustCompleted = false;
    if (tutorialDone && !state.tutorial.rewardClaimed) {
      state.tutorial.rewardClaimed = true;
      state.coins += 120;
      state.reputation += 35;
      addLog('Parcours découverte terminé : +120 crédits et +35 réputation.');
      changed = true;
      tutorialJustCompleted = true;
    }
    const chapters = Array.isArray(DATA.careerChapters) ? DATA.careerChapters : [];
    const level = careerLevel();
    if (level > (state.highestCareerLevel || 1)) {
      state.highestCareerLevel = level;
      changed = true;
    }
    let chapterReward = 0;
    chapters.forEach(chapter => {
      const chapterLevel = Number(chapter.level ?? chapter.minLevel) || 1;
      if (chapterLevel <= level && !state.claimedChapters.includes(chapter.id)) {
        state.claimedChapters.push(chapter.id);
        chapterReward += Number(chapter.reward) || 0;
        changed = true;
      }
    });
    if (chapterReward > 0) {
      state.coins += chapterReward;
      addLog(`Nouveau chapitre de carrière : +${chapterReward} crédits d’aménagement.`);
    }
    if (changed) {
      if (!saveState()) {
        state = previousState;
        renderAll();
        return false;
      }
      renderAll();
      if (tutorialJustCompleted) toast('Parcours découverte terminé.', 'success', 3600);
      if (chapterReward > 0) toast(`Chapitre débloqué : +${chapterReward} crédits.`, 'success', 4200);
    }
    return true;
  }

  function playSound(kind = 'click') {
    if (!state.soundEnabled) return;
    const AudioEngine = window.AudioContext || window.webkitAudioContext;
    if (!AudioEngine) return;
    try {
      audioContext ??= new AudioEngine();
      const presets = {
        click: [360, .035, 'sine', .025],
        buy: [660, .1, 'triangle', .045],
        sell: [280, .08, 'triangle', .035],
        place: [440, .07, 'sine', .035],
        clean: [760, .12, 'sine', .035],
        visitors: [520, .14, 'triangle', .04],
        success: [880, .18, 'sine', .05]
      };
      const [frequency, duration, type, volume] = presets[kind] || presets.click;
      const oscillator = audioContext.createOscillator();
      const gain = audioContext.createGain();
      const now = audioContext.currentTime;
      oscillator.type = type;
      oscillator.frequency.setValueAtTime(frequency, now);
      if (kind === 'success') oscillator.frequency.exponentialRampToValueAtTime(frequency * 1.34, now + duration);
      gain.gain.setValueAtTime(.0001, now);
      gain.gain.exponentialRampToValueAtTime(volume, now + .012);
      gain.gain.exponentialRampToValueAtTime(.0001, now + duration);
      oscillator.connect(gain).connect(audioContext.destination);
      oscillator.start(now);
      oscillator.stop(now + duration + .02);
    } catch (error) {
      console.debug('Retour sonore indisponible.', error);
    }
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
    if (file.size > 4_000_000) throw new Error('L’image dépasse 4 Mo. Réduis-la avant l’import.');
    const source = await readFileAsDataURL(file);
    const image = await loadImage(source);
    const maxDimension = 384;
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
    if (dataUrl.length > 1_500_000) throw new Error('L’image compressée reste trop volumineuse pour une sauvegarde locale sûre.');
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
    if (state.items.length >= MAX_ITEM_INSTANCES) return toast(`Inventaire complet (${MAX_ITEM_INSTANCES} pièces).`, 'error');
    if (state.customItems.length >= MAX_CUSTOM_ITEMS) return toast(`Atelier complet (${MAX_CUSTOM_ITEMS} créations). Retire une création avant d’en ajouter une autre.`, 'error', 4400);
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
        competitive: false,
        tradeable: false,
        weight: clamp(Number($('#customWeight').value) || 1, .1, 20),
        width: clamp(width, 42, 160),
        height: clamp(height, 48, 170),
        image: prepared.dataUrl,
        description: 'Pièce personnalisée importée dans l’atelier de VITRINE//VERSE.',
        tags: ['personnalisé']
      };
      ui.panelTab = 'inventory';
      if (!commit(() => {
        state.customItems.push(definition);
        state.items.push({
          instanceId: uid('item'), defId: id, location: 'inventory', shelfId: null, x: 50,
          scale: 1, flipped: false, z: 1, acquiredDay: state.day, condition: 1, sentimentalValue: 35
        });
      }, `${definition.name} a été créé dans l’atelier.`)) return;
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
      game: 'VITRINE//VERSE', schemaVersion: SAVE_VERSION, dataVersion: DATA.version,
      exportedAt: new Date().toISOString(), state
    });
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
      if (file.size > MAX_IMPORT_BYTES) throw new Error('Le fichier dépasse 5,25 Mo.');
      const text = await file.text();
      const parsed = JSON.parse(text);
      const normalized = validateImportPayload(parsed);
      const previousState = clone(state);
      let backupSaved = false;
      if (storageAvailable) {
        try {
          localStorage.setItem(BACKUP_STORAGE_KEY, JSON.stringify(previousState));
          backupSaved = true;
        } catch (backupError) {
          console.warn('Copie de secours impossible avant import, poursuite transactionnelle.', backupError);
        }
        localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
      }
      pushHistory(previousState);
      state = normalized;
      future = [];
      selectedInstanceId = null;
      renderAll();
      playSound('success');
      const backupMessage = backupSaved
        ? ' Une copie de secours a été conservée.'
        : storageAvailable ? ' Le stockage était trop plein pour doubler la copie : utilise Annuler ou exporte maintenant.' : ' Cette partie reste temporaire : exporte-la maintenant.';
      toast(`Sauvegarde validée, migrée et importée.${backupMessage}`, backupSaved ? 'success' : '', 5600);
    } catch (error) {
      console.error(error);
      toast(error.message || 'Ce fichier de sauvegarde est invalide. La partie actuelle est intacte.', 'error', 5200);
    } finally {
      dom.importSaveInput.value = '';
    }
  }

  function restoreBackup() {
    try {
      const raw = localStorage.getItem(BACKUP_STORAGE_KEY);
      if (!raw) return toast('Aucune sauvegarde de secours n’est disponible.');
      const normalized = validateImportPayload(JSON.parse(raw));
      const previousState = clone(state);
      state = normalized;
      if (!saveState()) {
        state = previousState;
        renderAll();
        return;
      }
      pushHistory(previousState);
      future = [];
      selectedInstanceId = null;
      renderAll();
      toast('Sauvegarde de secours restaurée.', 'success');
    } catch (error) {
      console.error(error);
      toast('La sauvegarde de secours est illisible. La partie actuelle est intacte.', 'error');
    }
  }

  function resetGame() {
    if (!window.confirm('Recommencer depuis le début ? La sauvegarde actuelle sera remplacée.')) return;
    const previousState = clone(state);
    try {
      if (storageAvailable) localStorage.setItem(BACKUP_STORAGE_KEY, JSON.stringify(state));
    } catch (error) {
      console.warn('Copie de secours impossible avant réinitialisation.', error);
    }
    state = createDefaultState();
    if (!saveState()) {
      state = previousState;
      renderAll();
      return;
    }
    pushHistory(previousState);
    future = [];
    selectedInstanceId = null;
    renderAll();
    toast('Nouvelle galerie créée.', 'success');
  }

  function togglePhotoMode(forceOff = false) {
    if (forceOff) document.body.classList.remove('photo-mode');
    else document.body.classList.toggle('photo-mode');
    const active = document.body.classList.contains('photo-mode');
    $('#photoModeBtn')?.setAttribute('aria-pressed', String(active));
    $('#exitPhotoModeBtn')?.toggleAttribute('hidden', !active);
  }

  function startJourney() {
    const previousState = clone(state);
    state.tutorial.welcomeSeen = true;
    if (!saveState()) {
      state = previousState;
      renderAll();
      return;
    }
    dom.welcomeDialog?.close();
    renderAll();
    $('#libraryPanel [data-panel-tab="inventory"]')?.focus();
  }

  function replayTutorial() {
    const previousState = clone(state);
    const rewardClaimed = state.tutorial.rewardClaimed;
    state.tutorial = {
      welcomeSeen: false,
      exploredShop: false,
      acquired: false,
      arranged: false,
      hosted: false,
      rewardClaimed
    };
    if (!saveState()) {
      state = previousState;
      renderAll();
      return;
    }
    renderAll();
    dom.welcomeDialog?.showModal();
  }

  function toggleSound() {
    const previousValue = state.soundEnabled;
    state.soundEnabled = !state.soundEnabled;
    if (!saveState()) {
      state.soundEnabled = previousValue;
      renderBodyState();
      return;
    }
    renderBodyState();
    if (state.soundEnabled) playSound('click');
    toast(state.soundEnabled ? 'Retours sonores activés.' : 'Retours sonores coupés.');
  }

  async function updateNetworkStatus() {
    if (!dom.networkStatus) return;
    const checkId = ++networkCheckId;
    if (!/^https?:$/.test(location.protocol)) {
      dom.networkStatus.textContent = 'Version autonome · sauvegarde locale';
      dom.networkStatus.classList.remove('offline');
      return;
    }
    if (!navigator.onLine) {
      dom.networkStatus.textContent = 'Hors ligne · galerie disponible';
      dom.networkStatus.classList.add('offline');
      return;
    }
    dom.networkStatus.textContent = 'Connexion en vérification…';
    try {
      const response = await fetch(`./manifest.webmanifest?__network_probe=1&t=${Date.now()}`, { cache: 'no-store' });
      if (!response.ok) throw new Error(`Sonde HTTP ${response.status}`);
      if (checkId !== networkCheckId) return;
      dom.networkStatus.textContent = 'En ligne · sauvegarde locale';
      dom.networkStatus.classList.remove('offline');
    } catch {
      if (checkId !== networkCheckId) return;
      dom.networkStatus.textContent = 'Hors ligne · galerie disponible';
      dom.networkStatus.classList.add('offline');
    }
  }

  function setupPWA() {
    updateNetworkStatus();
    window.addEventListener('online', updateNetworkStatus);
    window.addEventListener('offline', updateNetworkStatus);
    window.addEventListener('beforeinstallprompt', event => {
      event.preventDefault();
      deferredInstallPrompt = event;
      if (dom.installBtn) dom.installBtn.hidden = false;
    });
    window.addEventListener('appinstalled', () => {
      deferredInstallPrompt = null;
      if (dom.installBtn) dom.installBtn.hidden = true;
      toast('VITRINE//VERSE est installé et prêt hors ligne.', 'success');
    });
    if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol)) {
      navigator.serviceWorker.register('./sw.js').catch(error => {
        console.warn('Service worker indisponible.', error);
      });
    }
  }

  function markShopExplored() {
    if (state.tutorial.exploredShop) return true;
    const previousState = clone(state);
    state.tutorial.exploredShop = true;
    if (!saveState()) {
      state = previousState;
      return false;
    }
    return finalizeTutorial();
  }

  async function installPWA() {
    if (!deferredInstallPrompt) return;
    await deferredInstallPrompt.prompt();
    await deferredInstallPrompt.userChoice;
    deferredInstallPrompt = null;
    if (dom.installBtn) dom.installBtn.hidden = true;
  }

  function bindEvents() {
    $$('[data-panel-tab]').forEach((button, index, buttons) => {
      const activate = () => {
        ui.panelTab = button.dataset.panelTab;
        if (ui.panelTab === 'shop') markShopExplored();
        renderAll();
      };
      button.addEventListener('click', activate);
      button.addEventListener('keydown', event => {
        if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
        event.preventDefault();
        let nextIndex = index;
        if (event.key === 'ArrowRight') nextIndex = (index + 1) % buttons.length;
        if (event.key === 'ArrowLeft') nextIndex = (index - 1 + buttons.length) % buttons.length;
        if (event.key === 'Home') nextIndex = 0;
        if (event.key === 'End') nextIndex = buttons.length - 1;
        const next = buttons[nextIndex];
        ui.panelTab = next.dataset.panelTab;
        if (ui.panelTab === 'shop') markShopExplored();
        renderAll();
        document.querySelector(`[data-panel-tab="${CSS.escape(ui.panelTab)}"]`)?.focus();
      });
    });
    $$('[data-shop-tab]').forEach((button, index, buttons) => {
      button.addEventListener('click', () => {
        ui.shopTab = button.dataset.shopTab;
        renderAll();
      });
      button.addEventListener('keydown', event => {
        if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
        event.preventDefault();
        let nextIndex = index;
        if (event.key === 'ArrowRight') nextIndex = (index + 1) % buttons.length;
        if (event.key === 'ArrowLeft') nextIndex = (index - 1 + buttons.length) % buttons.length;
        if (event.key === 'Home') nextIndex = 0;
        if (event.key === 'End') nextIndex = buttons.length - 1;
        const next = buttons[nextIndex];
        ui.shopTab = next.dataset.shopTab;
        renderAll();
        document.querySelector(`[data-shop-tab="${CSS.escape(ui.shopTab)}"]`)?.focus();
      });
    });
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
    dom.placementModeSelect?.addEventListener('change', () => {
      commit(() => { state.placementMode = dom.placementModeSelect.value === 'free' ? 'free' : 'magnetic'; }, `Placement ${dom.placementModeSelect.value === 'free' ? 'libre' : 'magnétique'} activé.`);
    });
    $('#visitorsBtn').addEventListener('click', openGallery);
    $('#cleanBtn').addEventListener('click', cleanGallery);
    $('#autoArrangeBtn').addEventListener('click', autoArrange);
    dom.claimChallengeBtn.addEventListener('click', claimChallenge);
    dom.undoBtn.addEventListener('click', undo);
    dom.redoBtn.addEventListener('click', redo);
    $('#photoModeBtn').addEventListener('click', () => togglePhotoMode());
    $('#exitPhotoModeBtn')?.addEventListener('click', () => togglePhotoMode(true));
    $('#openImportBtn').addEventListener('click', () => dom.importDialog.showModal());
    dom.importForm.addEventListener('submit', importCustomItem);
    $('#exportSaveBtn').addEventListener('click', exportSave);
    dom.importSaveInput.addEventListener('change', () => importSave(dom.importSaveInput.files[0]));
    $('#restoreBackupBtn')?.addEventListener('click', restoreBackup);
    $('#resetBtn').addEventListener('click', resetGame);
    dom.soundBtn?.addEventListener('click', toggleSound);
    dom.installBtn?.addEventListener('click', installPWA);
    $('#startJourneyBtn')?.addEventListener('click', startJourney);
    $('#replayTutorialBtn')?.addEventListener('click', replayTutorial);
    $('#closeVisitReportBtn')?.addEventListener('click', () => dom.visitDialog?.close());
    document.addEventListener('keydown', event => {
      if (event.key === 'Escape' && document.body.classList.contains('photo-mode')) togglePhotoMode(true);
      const editing = ['INPUT', 'SELECT', 'TEXTAREA'].includes(document.activeElement?.tagName) || document.activeElement?.isContentEditable;
      if (!editing && (event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'z') {
        event.preventDefault();
        event.shiftKey ? redo() : undo();
      }
      if (!editing && (event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'y') {
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
  setupPWA();
  renderAll();
  if (loadNotice) {
    const noticeType = /invalide|illisible|saturé|temporaire/i.test(loadNotice) ? 'error' : 'success';
    window.setTimeout(() => toast(loadNotice, noticeType, 6000), 200);
  }
  if (!state.tutorial.welcomeSeen) {
    window.setTimeout(() => {
      if (dom.welcomeDialog && !dom.welcomeDialog.open) dom.welcomeDialog.showModal();
    }, 240);
  }
})();
