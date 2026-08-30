/* VITRINE//VERSE — données de contenu originales et remplaçables. */
window.GAME_DATA = {
  version: 2,
  rarity: {
    common: { label: 'Commun', points: 8 },
    uncommon: { label: 'Inhabituel', points: 14 },
    rare: { label: 'Rare', points: 24 },
    epic: { label: 'Épique', points: 38 },
    legendary: { label: 'Légendaire', points: 62 }
  },
  items: [
    {
      id: 'neon_ronin', name: 'Ronin du Néon', category: 'Figurine', universe: 'Chroniques Néon',
      collection: 'Clan Kage', rarity: 'epic', price: 220, weight: 1.4, width: 78, height: 132,
      image: 'assets/items/neon_ronin.svg', description: 'Un samouraï urbain dont l’armure réagit aux éclairages colorés.',
      tags: ['figurine', 'cyber', 'samouraï', 'néon']
    },
    {
      id: 'orbit_guardian', name: 'Gardienne Orbitale', category: 'Figurine', universe: 'Frontière Orbitale',
      collection: 'Sentinelles du Périgée', rarity: 'rare', price: 165, weight: 1.2, width: 74, height: 128,
      image: 'assets/items/orbit_guardian.svg', description: 'Une exploratrice en armure blanche issue des confins du système solaire.',
      tags: ['figurine', 'espace', 'armure']
    },
    {
      id: 'pixel_mage', name: 'Mage 16-Bit', category: 'Figurine', universe: 'Royaume 16-Bit',
      collection: 'Compagnie du Pixel', rarity: 'uncommon', price: 92, weight: 0.7, width: 68, height: 112,
      image: 'assets/items/pixel_mage.svg', description: 'Un mage carré capable de transformer les bugs en sorts.',
      tags: ['figurine', 'fantasy', 'pixel']
    },
    {
      id: 'void_cat', name: 'Chat du Vide', category: 'Figurine', universe: 'Anomalies du Vide',
      collection: 'Bestiaire Impossible', rarity: 'rare', price: 145, weight: 0.8, width: 82, height: 104,
      image: 'assets/items/void_cat.svg', description: 'Un félin cosmique qui semble regarder derrière l’écran.',
      tags: ['figurine', 'chat', 'cosmique']
    },
    {
      id: 'mecha_scout', name: 'Éclaireur Mécha M-08', category: 'Figurine', universe: 'Mecha Rally',
      collection: 'Écurie Ferromobile', rarity: 'epic', price: 245, weight: 2.3, width: 96, height: 126,
      image: 'assets/items/mecha_scout.svg', description: 'Un mécha compact prévu pour la course et la reconnaissance.',
      tags: ['figurine', 'mécha', 'robot']
    },
    {
      id: 'crypt_keeper', name: 'Buste du Gardien Cryptique', category: 'Buste', universe: 'Manoir Cryptique',
      collection: 'Galerie Interdite', rarity: 'rare', price: 155, weight: 2.0, width: 88, height: 105,
      image: 'assets/items/crypt_keeper.svg', description: 'Le gardien d’un musée qui ne devrait ouvrir qu’à minuit.',
      tags: ['buste', 'horreur', 'gothique']
    },
    {
      id: 'retro_console', name: 'Console Nova-32', category: 'Console', universe: 'Archive 90',
      collection: 'Matériel Rétro', rarity: 'uncommon', price: 84, weight: 1.8, width: 96, height: 66,
      image: 'assets/items/retro_console.svg', description: 'Une console culte aux boutons surdimensionnés.',
      tags: ['console', 'rétro', 'jeu vidéo']
    },
    {
      id: 'arcade_cart', name: 'Cartouche Turbo Quest', category: 'Jeu', universe: 'Archive 90',
      collection: 'Matériel Rétro', rarity: 'common', price: 38, weight: 0.2, width: 58, height: 70,
      image: 'assets/items/arcade_cart.svg', description: 'Une cartouche robuste couverte d’autocollants de tournois.',
      tags: ['cartouche', 'rétro', 'jeu vidéo']
    },
    {
      id: 'star_helmet', name: 'Casque du Périgée', category: 'Réplique', universe: 'Frontière Orbitale',
      collection: 'Sentinelles du Périgée', rarity: 'epic', price: 270, weight: 2.8, width: 112, height: 102,
      image: 'assets/items/star_helmet.svg', description: 'Une réplique de casque spatial avec visière polarisée.',
      tags: ['casque', 'espace', 'réplique']
    },
    {
      id: 'plasma_blaster', name: 'Propulseur Plasma P-7', category: 'Réplique', universe: 'Frontière Orbitale',
      collection: 'Arsenal de Convention', rarity: 'rare', price: 172, weight: 1.1, width: 120, height: 70,
      image: 'assets/items/plasma_blaster.svg', description: 'Une réplique lumineuse totalement inoffensive.',
      tags: ['réplique', 'espace', 'accessoire']
    },
    {
      id: 'spellbook', name: 'Grimoire des 256 Sorts', category: 'Livre', universe: 'Royaume 16-Bit',
      collection: 'Compagnie du Pixel', rarity: 'rare', price: 126, weight: 1.0, width: 76, height: 82,
      image: 'assets/items/spellbook.svg', description: 'Chaque page ressemble à un niveau secret.',
      tags: ['livre', 'fantasy', 'pixel']
    },
    {
      id: 'holo_crystal', name: 'Cristal Holographique', category: 'Prop', universe: 'Chroniques Néon',
      collection: 'Reliques Synthétiques', rarity: 'rare', price: 138, weight: 0.9, width: 70, height: 102,
      image: 'assets/items/holo_crystal.svg', description: 'Une relique luminescente montée sur un socle miroir.',
      tags: ['cristal', 'néon', 'prop']
    },
    {
      id: 'comic_stack', name: 'Pile de Comics Multivers', category: 'Comic', universe: 'Multivers Papier',
      collection: 'Premières Éditions', rarity: 'common', price: 46, weight: 1.3, width: 86, height: 58,
      image: 'assets/items/comic_stack.svg', description: 'Des numéros colorés, classés dans un ordre très personnel.',
      tags: ['comic', 'papier', 'collection']
    },
    {
      id: 'vhs_night', name: 'VHS Nuit 13', category: 'VHS', universe: 'Manoir Cryptique',
      collection: 'Archives Maudites', rarity: 'uncommon', price: 64, weight: 0.4, width: 70, height: 82,
      image: 'assets/items/vhs_night.svg', description: 'La jaquette promet une fin que personne ne se rappelle.',
      tags: ['vhs', 'horreur', 'rétro']
    },
    {
      id: 'alien_plush', name: 'Peluche Mini-Visiteur', category: 'Peluche', universe: 'Anomalies du Vide',
      collection: 'Bestiaire Impossible', rarity: 'uncommon', price: 78, weight: 0.4, width: 76, height: 94,
      image: 'assets/items/alien_plush.svg', description: 'Une créature extraterrestre beaucoup trop douce pour être honnête.',
      tags: ['peluche', 'alien', 'mignon']
    },
    {
      id: 'pinboard', name: 'Cadre de Pins Portails', category: 'Pins', universe: 'Multivers Papier',
      collection: 'Petits Trésors', rarity: 'uncommon', price: 72, weight: 0.8, width: 94, height: 86,
      image: 'assets/items/pinboard.svg', description: 'Un cadre rempli de symboles de mondes imaginaires.',
      tags: ['pins', 'cadre', 'collection']
    },
    {
      id: 'moon_diorama', name: 'Diorama Base Lunaire', category: 'Diorama', universe: 'Frontière Orbitale',
      collection: 'Sentinelles du Périgée', rarity: 'legendary', price: 440, weight: 4.5, width: 142, height: 112,
      image: 'assets/items/moon_diorama.svg', description: 'Une scène complète avec véhicule, cratère et balise lumineuse.',
      tags: ['diorama', 'espace', 'lune']
    },
    {
      id: 'robot_dog', name: 'Chien-Robot K9-Z', category: 'Figurine', universe: 'Chroniques Néon',
      collection: 'Reliques Synthétiques', rarity: 'epic', price: 235, weight: 1.9, width: 104, height: 92,
      image: 'assets/items/robot_dog.svg', description: 'Un compagnon mécanique conçu pour protéger les vitrines rares.',
      tags: ['robot', 'chien', 'néon']
    },
    {
      id: 'kage_mask', name: 'Masque Kage Prismatique', category: 'Réplique', universe: 'Chroniques Néon',
      collection: 'Clan Kage', rarity: 'rare', price: 158, weight: 0.8, width: 86, height: 90,
      image: 'assets/items/kage_mask.svg', description: 'Un masque de cérémonie aux liserés lumineux, exposé sur un discret support noir.',
      tags: ['masque', 'cyber', 'néon', 'réplique']
    },
    {
      id: 'perigee_probe', name: 'Sonde Périgée P-3', category: 'Maquette', universe: 'Frontière Orbitale',
      collection: 'Sentinelles du Périgée', rarity: 'uncommon', price: 118, weight: 1.2, width: 94, height: 84,
      image: 'assets/items/perigee_probe.svg', description: 'Une sonde miniature montée sur bras orbital, fidèle aux relevés de la frontière.',
      tags: ['sonde', 'espace', 'maquette', 'science']
    },
    {
      id: 'pixel_knight', name: 'Chevalière du Pixel', category: 'Figurine', universe: 'Royaume 16-Bit',
      collection: 'Compagnie du Pixel', rarity: 'rare', price: 134, weight: 0.9, width: 72, height: 112,
      image: 'assets/items/pixel_knight.svg', description: 'Une héroïne en armure mosaïque qui protège les sauvegardes du royaume.',
      tags: ['figurine', 'fantasy', 'pixel', 'chevalière']
    },
    {
      id: 'void_moth', name: 'Phalène du Vide', category: 'Figurine', universe: 'Anomalies du Vide',
      collection: 'Bestiaire Impossible', rarity: 'epic', price: 228, weight: 0.6, width: 100, height: 96,
      image: 'assets/items/void_moth.svg', description: 'Ses ailes constellées changent de couleur selon l’angle de la vitrine.',
      tags: ['figurine', 'insecte', 'cosmique', 'constellation']
    },
    {
      id: 'mecha_pit_drone', name: 'Drone de Stand M-2', category: 'Maquette', universe: 'Mecha Rally',
      collection: 'Écurie Ferromobile', rarity: 'uncommon', price: 108, weight: 1.1, width: 96, height: 72,
      image: 'assets/items/mecha_pit_drone.svg', description: 'Le petit assistant mécanique qui ravitaille les champions entre deux courses.',
      tags: ['drone', 'mécha', 'course', 'maquette']
    },
    {
      id: 'cryptic_portrait', name: 'Portrait aux Trois Regards', category: 'Cadre', universe: 'Manoir Cryptique',
      collection: 'Galerie Interdite', rarity: 'epic', price: 238, weight: 2.2, width: 86, height: 118,
      image: 'assets/items/cryptic_portrait.svg', description: 'Un portrait lenticulaire dont le sujet semble suivre les visiteurs dans la pièce.',
      tags: ['cadre', 'portrait', 'gothique', 'mystère']
    },
    {
      id: 'nova_controller', name: 'Manette Nova Pulse', category: 'Manette', universe: 'Archive 90',
      collection: 'Matériel Rétro', rarity: 'common', price: 52, weight: 0.4, width: 92, height: 56,
      image: 'assets/items/nova_controller.svg', description: 'Une manette translucide aux boutons colorés, patinée par des centaines de parties.',
      tags: ['manette', 'rétro', 'jeu vidéo', 'transparent']
    },
    {
      id: 'plasma_scanner', name: 'Scanner Plasma S-4', category: 'Prop', universe: 'Frontière Orbitale',
      collection: 'Arsenal de Convention', rarity: 'uncommon', price: 96, weight: 0.7, width: 104, height: 64,
      image: 'assets/items/plasma_scanner.svg', description: 'Un accessoire lumineux conçu pour analyser les météorites de convention.',
      tags: ['scanner', 'espace', 'prop', 'lumière']
    },
    {
      id: 'synth_orb', name: 'Orbe des Échos Synthétiques', category: 'Prop', universe: 'Chroniques Néon',
      collection: 'Reliques Synthétiques', rarity: 'legendary', price: 395, weight: 1.5, width: 92, height: 104,
      image: 'assets/items/synth_orb.svg', description: 'Une sphère rare qui rejoue silencieusement les couleurs des objets voisins.',
      tags: ['orbe', 'néon', 'relique', 'holographique']
    },
    {
      id: 'multiverse_issue_zero', name: 'Multivers Zéro', category: 'Comic', universe: 'Multivers Papier',
      collection: 'Premières Éditions', rarity: 'rare', price: 132, weight: 0.3, width: 72, height: 96,
      image: 'assets/items/multiverse_issue_zero.svg', description: 'Le numéro pilote d’une aventure où chaque marge ouvre une réalité différente.',
      tags: ['comic', 'papier', 'première édition', 'multivers']
    },
    {
      id: 'night_13_ticket', name: 'Ticket de la Séance 13', category: 'Souvenir', universe: 'Manoir Cryptique',
      collection: 'Archives Maudites', rarity: 'common', price: 42, weight: 0.1, width: 84, height: 54,
      image: 'assets/items/night_13_ticket.svg', description: 'Un billet ancien dont l’encre réapparaît seulement sous une lumière tamisée.',
      tags: ['ticket', 'cinéma', 'horreur', 'souvenir']
    },
    {
      id: 'portal_badge', name: 'Badge Portail Boréal', category: 'Badge', universe: 'Multivers Papier',
      collection: 'Petits Trésors', rarity: 'uncommon', price: 68, weight: 0.2, width: 68, height: 70,
      image: 'assets/items/portal_badge.svg', description: 'Un badge émaillé aux reflets boréaux, souvenir d’une convention imaginaire.',
      tags: ['badge', 'portail', 'convention', 'collection']
    }
  ],
  shelves: [
    { id: 'wood', name: 'Étagère bois sombre', price: 120, capacity: 12, className: 'shelf-wood', unlockLevel: 1, prestigeBonus: 1, dustProtection: 0, visitorBonus: 0, description: 'Classique, chaleureuse et polyvalente.' },
    { id: 'acrylic', name: 'Étagère acrylique', price: 165, capacity: 8, className: 'shelf-acrylic', unlockLevel: 1, prestigeBonus: 2, dustProtection: 0, visitorBonus: 0.01, description: 'Légère, discrète et parfaite pour les petites pièces.' },
    { id: 'metal', name: 'Étagère industrielle', price: 215, capacity: 20, className: 'shelf-metal', unlockLevel: 2, prestigeBonus: 4, dustProtection: 0, visitorBonus: 0.02, description: 'Très solide pour les statues et dioramas lourds.' },
    { id: 'glass', name: 'Vitrine en verre', price: 295, capacity: 13, className: 'shelf-glass', unlockLevel: 2, prestigeBonus: 7, dustProtection: 5, visitorBonus: 0.04, description: 'Protège de la poussière et valorise les pièces rares.' },
    { id: 'neon', name: 'Étagère néon', price: 355, capacity: 15, className: 'shelf-neon', unlockLevel: 3, prestigeBonus: 9, dustProtection: 1, visitorBonus: 0.06, description: 'Éclairage intégré pour les collections futuristes.' },
    { id: 'museum', name: 'Socle de musée', price: 420, capacity: 18, className: 'shelf-museum', unlockLevel: 4, prestigeBonus: 12, dustProtection: 2, visitorBonus: 0.08, description: 'Un meuble premium pour les pièces maîtresses.' },
    { id: 'floating_oak', name: 'Tablette de chêne flottante', price: 260, capacity: 10, className: 'shelf-wood', unlockLevel: 2, prestigeBonus: 5, dustProtection: 0, visitorBonus: 0.03, description: 'Une ligne de chêne clair qui laisse respirer les petites compositions.' },
    { id: 'modular_cube', name: 'Cube modulaire fumé', price: 310, capacity: 14, className: 'shelf-acrylic', unlockLevel: 3, prestigeBonus: 8, dustProtection: 1, visitorBonus: 0.05, description: 'Un module empilable pour fabriquer des rythmes de vitrine très personnels.' },
    { id: 'archive_case', name: 'Vitrine des Archives', price: 460, capacity: 22, className: 'shelf-glass', unlockLevel: 4, prestigeBonus: 14, dustProtection: 6, visitorBonus: 0.09, description: 'Une vitrine fermée pensée pour les ensembles fragiles et les éditions rares.' },
    { id: 'holo_plinth', name: 'Socle Halo Boréal', price: 560, capacity: 16, className: 'shelf-neon', unlockLevel: 5, prestigeBonus: 18, dustProtection: 2, visitorBonus: 0.12, description: 'Un socle lumineux qui dessine un halo doux autour d’une pièce maîtresse.' }
  ],
  themes: [
    { id: 'bedroom', name: 'Chambre de collectionneur', price: 0, unlockLevel: 1, prestigeBonus: 0, dustProtection: 0, visitorBonus: 0, description: 'Le point de départ intime et chaleureux.' },
    { id: 'neonroom', name: 'Studio néon', price: 320, unlockLevel: 3, prestigeBonus: 8, dustProtection: 0, visitorBonus: 0.04, description: 'Un mur urbain baigné de lumière synthétique.' },
    { id: 'museumroom', name: 'Galerie privée', price: 480, unlockLevel: 4, prestigeBonus: 14, dustProtection: 2, visitorBonus: 0.08, description: 'Une présentation claire et luxueuse.' },
    { id: 'retroroom', name: 'Arcade rétro', price: 390, unlockLevel: 3, prestigeBonus: 10, dustProtection: 0, visitorBonus: 0.06, description: 'Moquette cosmique, panneaux et souvenirs des années 90.' },
    { id: 'atticroom', name: 'Grenier aux trésors', price: 260, unlockLevel: 2, prestigeBonus: 6, dustProtection: 0, visitorBonus: 0.03, description: 'Bois miel, cartons étiquetés et trouvailles baignées de soleil.' },
    { id: 'botanicalroom', name: 'Verrière botanique', price: 520, unlockLevel: 4, prestigeBonus: 13, dustProtection: 1, visitorBonus: 0.08, description: 'Une pièce calme où les feuillages encadrent la collection sans la masquer.' },
    { id: 'observatoryroom', name: 'Observatoire domestique', price: 650, unlockLevel: 5, prestigeBonus: 18, dustProtection: 1, visitorBonus: 0.12, description: 'Un plafond étoilé et des boiseries profondes pour les récits cosmiques.' },
    { id: 'midnightroom', name: 'Salon de Minuit', price: 720, unlockLevel: 5, prestigeBonus: 20, dustProtection: 3, visitorBonus: 0.1, description: 'Velours sombre, vitrines feutrées et halos discrets pour les collections mystérieuses.' }
  ],
  lights: [
    { id: 'warm', name: 'Chaleureux', price: 0, unlockLevel: 1, prestigeBonus: 0, visitorBonus: 0, maintenanceCost: 0 },
    { id: 'cool', name: 'Musée', price: 90, unlockLevel: 2, prestigeBonus: 2, visitorBonus: 0.01, maintenanceCost: 1 },
    { id: 'neon', name: 'Néon', price: 170, unlockLevel: 3, prestigeBonus: 5, visitorBonus: 0.03, maintenanceCost: 2 },
    { id: 'dark', name: 'Minuit', price: 210, unlockLevel: 4, prestigeBonus: 6, visitorBonus: 0.04, maintenanceCost: 1 },
    { id: 'sunset', name: 'Couchant ambré', price: 130, unlockLevel: 2, prestigeBonus: 3, visitorBonus: 0.02, maintenanceCost: 1 },
    { id: 'aurora', name: 'Aurore boréale', price: 260, unlockLevel: 4, prestigeBonus: 8, visitorBonus: 0.05, maintenanceCost: 3 },
    { id: 'constellation', name: 'Constellations', price: 340, unlockLevel: 5, prestigeBonus: 11, visitorBonus: 0.07, maintenanceCost: 3 }
  ],
  careerChapters: [
    {
      id: 'bedroom_corner', level: 1, title: 'Coin de chambre',
      description: 'Apprends à composer une première vitrine propre et lisible avec les trésors déjà présents.',
      prestigeRequired: 0, collectionsRequired: 0, challengesRequired: 0, reward: 0,
      unlocks: { shelves: ['wood', 'acrylic'], themes: ['bedroom'], lights: ['warm'] }
    },
    {
      id: 'organized_collection', level: 2, title: 'Collection organisée',
      description: 'Classe les séries, diversifie les catégories et accueille les premiers visiteurs réguliers.',
      prestigeRequired: 220, collectionsRequired: 1, challengesRequired: 2, reward: 250,
      unlocks: { shelves: ['metal', 'glass', 'floating_oak'], themes: ['atticroom'], lights: ['cool', 'sunset'] }
    },
    {
      id: 'themed_studio', level: 3, title: 'Studio thématique',
      description: 'Crée des scènes fortes grâce aux modules, aux couleurs et aux premiers éclairages expressifs.',
      prestigeRequired: 430, collectionsRequired: 2, challengesRequired: 4, reward: 420,
      unlocks: { shelves: ['neon', 'modular_cube'], themes: ['neonroom', 'retroroom'], lights: ['neon'] }
    },
    {
      id: 'private_gallery', level: 4, title: 'Galerie privée',
      description: 'Protège les pièces rares et répond à des commandes d’exposition plus exigeantes.',
      prestigeRequired: 680, collectionsRequired: 4, challengesRequired: 7, reward: 650,
      unlocks: { shelves: ['museum', 'archive_case'], themes: ['museumroom', 'botanicalroom'], lights: ['dark', 'aurora'] }
    },
    {
      id: 'multiverse_museum', level: 5, title: 'Musée du multivers',
      description: 'Fais dialoguer les univers dans une scénographie de musée chaleureuse et personnelle.',
      prestigeRequired: 980, collectionsRequired: 6, challengesRequired: 10, reward: 900,
      unlocks: { shelves: ['holo_plinth'], themes: ['observatoryroom', 'midnightroom'], lights: ['constellation'] }
    },
    {
      id: 'living_archive', level: 6, title: 'Archive vivante',
      description: 'Achève la carrière en transformant chaque vitrine en souvenir vivant de ton parcours.',
      prestigeRequired: 1200, collectionsRequired: 10, challengesRequired: 12, reward: 1400,
      unlocks: { shelves: [], themes: [], lights: [] }
    }
  ],
  challenges: [
    { id: 'same_universe', title: 'Trilogie thématique', description: 'Expose trois objets du même univers sur une seule étagère.', metric: 'same_universe', target: 3, reward: 180, minLevel: 1 },
    { id: 'category_mix', title: 'Culture sans frontières', description: 'Réunis quatre catégories différentes dans ta galerie.', metric: 'category_mix', target: 4, reward: 220, minLevel: 1 },
    { id: 'prestige_300', title: 'Galerie remarquée', description: 'Atteins 300 points de prestige avec ta mise en scène.', metric: 'prestige', target: 300, reward: 260, minLevel: 2 },
    { id: 'rare_five', title: 'Pièces de choix', description: 'Expose cinq objets rares, épiques ou légendaires.', metric: 'rare_display', target: 5, reward: 300, minLevel: 2 },
    { id: 'four_shelves', title: 'La grande extension', description: 'Possède au moins quatre étagères dans la galerie.', metric: 'shelves', target: 4, reward: 350, minLevel: 2 },
    { id: 'collector_18', title: 'Inventaire passionné', description: 'Réunis dix-huit modèles différents dans ta collection.', metric: 'owned_unique', target: 18, reward: 420, minLevel: 3 },
    { id: 'theme_triad', title: 'Trois atmosphères', description: 'Débloque trois décors de galerie différents.', metric: 'themes', target: 3, reward: 360, minLevel: 3 },
    { id: 'gallery_regular', title: 'Carnet de visites', description: 'Ouvre la galerie avec douze présentations réellement différentes.', metric: 'unique_presentations', target: 12, reward: 390, minLevel: 3 },
    { id: 'collection_keeper', title: 'Séries réunies', description: 'Complète trois collections originales.', metric: 'collections', target: 3, reward: 480, minLevel: 4 },
    { id: 'day_25', title: 'Un mois de passion', description: 'Fais vivre la galerie jusqu’au vingt-cinquième jour.', metric: 'day', target: 25, reward: 450, minLevel: 4 },
    { id: 'grand_display', title: 'Vitrine foisonnante', description: 'Expose simultanément vingt pièces sans perdre la lisibilité.', metric: 'displayed', target: 20, reward: 520, minLevel: 4 },
    { id: 'curator_level_5', title: 'Signature de conservateur', description: 'Atteins le cinquième niveau de carrière.', metric: 'level', target: 5, reward: 700, minLevel: 5 }
  ],
  exhibitionBriefs: [
    { id: 'frontier_signal', title: 'Signal de la Frontière', description: 'Compose une scène orbitale lisible autour des Sentinelles du Périgée.', metric: 'universe', value: 'Frontière Orbitale', target: 4, creditBonus: 180, reputationBonus: 22 },
    { id: 'neon_echoes', title: 'Échos synthétiques', description: 'Rassemble une famille visuelle issue des Chroniques Néon.', metric: 'universe', value: 'Chroniques Néon', target: 3, creditBonus: 150, reputationBonus: 18 },
    { id: 'cabinet_kaleidoscope', title: 'Cabinet kaléidoscope', description: 'Fais dialoguer six catégories différentes dans une même exposition.', metric: 'category_mix', target: 6, creditBonus: 210, reputationBonus: 26 },
    { id: 'jewels_after_dark', title: 'Joyaux après la fermeture', description: 'Présente six pièces de haute rareté comme les vedettes de la soirée.', metric: 'rare_display', target: 6, creditBonus: 260, reputationBonus: 32 },
    { id: 'morning_glass', title: 'Verre du matin', description: 'Accueille les visiteurs avec une galerie presque impeccable.', metric: 'clean', target: 90, creditBonus: 120, reputationBonus: 15 },
    { id: 'midnight_whispers', title: 'Murmures de Minuit', description: 'Éteins la lumière principale et laisse les silhouettes raconter la scène.', metric: 'light_dark', target: 1, creditBonus: 190, reputationBonus: 24 },
    { id: 'collector_panorama', title: 'Panorama du collectionneur', description: 'Expose quinze modèles différents dans une composition cohérente.', metric: 'unique_items', target: 15, creditBonus: 240, reputationBonus: 30 },
    { id: 'museum_crossroads', title: 'Carrefour des imaginaires', description: 'Mêle huit catégories sans qu’aucune ne perde sa place dans la vitrine.', metric: 'category_mix', target: 8, creditBonus: 300, reputationBonus: 38 }
  ]
};
