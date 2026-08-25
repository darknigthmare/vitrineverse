/* VITRINE//VERSE — données de contenu originales et remplaçables. */
window.GAME_DATA = {
  version: 1,
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
    }
  ],
  shelves: [
    { id: 'wood', name: 'Étagère bois sombre', price: 120, capacity: 12, className: 'shelf-wood', description: 'Classique, chaleureuse et polyvalente.' },
    { id: 'acrylic', name: 'Étagère acrylique', price: 165, capacity: 8, className: 'shelf-acrylic', description: 'Légère, discrète et parfaite pour les petites pièces.' },
    { id: 'metal', name: 'Étagère industrielle', price: 215, capacity: 20, className: 'shelf-metal', description: 'Très solide pour les statues et dioramas lourds.' },
    { id: 'glass', name: 'Vitrine en verre', price: 295, capacity: 13, className: 'shelf-glass', description: 'Protège de la poussière et valorise les pièces rares.' },
    { id: 'neon', name: 'Étagère néon', price: 355, capacity: 15, className: 'shelf-neon', description: 'Éclairage intégré pour les collections futuristes.' },
    { id: 'museum', name: 'Socle de musée', price: 420, capacity: 18, className: 'shelf-museum', description: 'Un meuble premium pour les pièces maîtresses.' }
  ],
  themes: [
    { id: 'bedroom', name: 'Chambre de collectionneur', price: 0, description: 'Le point de départ intime et chaleureux.' },
    { id: 'neonroom', name: 'Studio néon', price: 320, description: 'Un mur urbain baigné de lumière synthétique.' },
    { id: 'museumroom', name: 'Galerie privée', price: 480, description: 'Une présentation claire et luxueuse.' },
    { id: 'retroroom', name: 'Arcade rétro', price: 390, description: 'Moquette cosmique, panneaux et souvenirs des années 90.' }
  ],
  lights: [
    { id: 'warm', name: 'Chaleureux' },
    { id: 'cool', name: 'Musée' },
    { id: 'neon', name: 'Néon' },
    { id: 'dark', name: 'Minuit' }
  ]
};
