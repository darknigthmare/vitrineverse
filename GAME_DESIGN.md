# VITRINE//VERSE — Game Design complet

## Vision

**Genre :** décoration 2D, collection, gestion légère et jeu cosy.

**Promesse :** créer la vitrine geek dont on rêve, avec une liberté de placement immédiate et une vraie profondeur de collectionneur : mobilier, raretés, ensembles thématiques, éclairage, entretien, exposition et souvenirs personnels.

Le jeu ne doit pas ressembler à un simple menu d’inventaire. Chaque objet doit avoir une présence physique, une échelle crédible, un poids, une place dans la composition et une histoire d’acquisition. Le plaisir vient autant de la chasse aux pièces que du temps passé à les aligner, les superposer sur des rehausseurs et fabriquer de petits dioramas.

## Piliers

### Liberté de mise en scène

Le joueur place les objets horizontalement avec une profondeur simulée par calques. Il peut les agrandir légèrement, les retourner, les envoyer au premier plan ou à l’arrière-plan et déplacer les étagères entières. La version complète ajoute le placement vertical, les rehausseurs, supports muraux, socles, boîtes transparentes et zones aimantées.

### Collection lisible et gratifiante

Chaque pièce possède un univers, une collection, une catégorie, une rareté, une valeur, un poids, un matériau, un état, une taille et des mots-clés. Les séries complétées débloquent des plaques, éclairages, fonds de vitrine et variantes de pose plutôt qu’un simple pourcentage.

### Galerie vivante

La galerie reçoit des visiteurs et des commandes d’exposition. La poussière, la lumière, le verre et la densité influencent la présentation. En « Mode Minuit », certaines combinaisons de figurines déclenchent de petites scènes animées ou des effets visuels, sans transformer le jeu en combat.

### Création personnelle

Le joueur peut importer ses propres images détourées. Le pipeline de production permet d’ajouter ensuite des centaines de figurines générées dans un style cohérent, sans modifier le code principal.

## Boucle de jeu

1. Consulter la boutique, un vide-grenier, une convention ou une vente aux enchères.
2. Acheter une figurine, une réplique, un jeu, un livre ou un élément de mobilier.
3. Déballer ou restaurer la pièce.
4. Choisir la bonne étagère selon son poids et son format.
5. Composer la mise en scène et profiter des synergies de collection.
6. Ouvrir la galerie aux visiteurs ou réaliser un défi photo.
7. Gagner des crédits, de la réputation et des récompenses décoratives.
8. Agrandir la pièce, débloquer un nouveau mur et recommencer avec plus de possibilités.

## Modes

### Carrière

Le joueur commence dans une petite chambre avec une vieille étagère. Il développe successivement un salon de collectionneur, un studio néon, une galerie privée, une salle d’arcade et enfin un musée personnel. Des personnages non-joueurs proposent des défis : exposition rétro, vitrine monochrome, scène de science-fiction, budget limité ou objet imposé.

### Bac à sable

Tous les meubles et objets débloqués sont disponibles sans économie. Les contraintes de poids, poussière et score peuvent être désactivées indépendamment.

### Défi quotidien

Une sélection identique pour tous les joueurs, un budget donné et un thème. Le résultat est évalué sur la lisibilité, la cohérence, l’originalité et le respect des contraintes. Aucun achat en argent réel n’est nécessaire.

### Studio créatif

Import d’images, création de métadonnées, réglage du pivot, de l’échelle et de la boîte de collision, génération de variantes emballée/déballée et export d’un paquet de contenu.

### Galerie partagée

Publication d’une image ou d’un code de disposition. La version réseau doit partager la composition et les identifiants, pas les fichiers protégés sans autorisation.

## Système de placement final

Chaque meuble contient une ou plusieurs surfaces. Une surface possède une largeur, une profondeur visuelle, une charge maximale et des zones autorisées. Un objet possède un point de contact, une empreinte, une masse et un ordre de rendu.

Le placement offre deux modes :

- **Magnétique :** alignement automatique, espacement régulier et prévention des collisions.
- **Libre :** chevauchement autorisé, déplacement fin et contrôle manuel de la profondeur.

Les outils professionnels incluent sélection multiple, duplication d’un agencement, règles d’alignement, grille réglable, annulation illimitée pour la session, copie d’une étagère et sauvegarde de modèles.

## Mobilier

La version complète contient notamment :

- étagères flottantes en bois, métal, verre et acrylique ;
- bibliothèques modulaires ;
- vitrines fermées anti-poussière ;
- cubes empilables ;
- pegboards et panneaux muraux ;
- socles de musée ;
- rehausseurs transparents ;
- supports pour casques, armes factices, manettes et cartes ;
- tiroirs de stockage hors exposition ;
- rails LED, spots orientables et bandes lumineuses ;
- fonds imprimés, miroirs et écrans holographiques.

Chaque meuble peut recevoir une finition, une couleur, un type de verre, un éclairage et éventuellement des portes.

## Catégories de contenu

Figurines articulées, statues, bustes, dioramas, maquettes, véhicules, peluches, répliques, casques, consoles, ordinateurs, manettes, jeux en boîte, cartouches, disques, VHS, DVD, Blu-ray, steelbooks, comics, mangas, romans, artbooks, cartes, pins, badges, tickets de convention, affiches, vinyles, cassettes, objets promotionnels et souvenirs personnels.

## Score de prestige

Le score combine :

- valeur et rareté des pièces ;
- visibilité de chaque silhouette ;
- cohérence de série ou d’univers ;
- narration visuelle créée par les voisinages ;
- variété de catégories ;
- équilibre de la composition ;
- qualité du mobilier et de l’éclairage ;
- état et propreté ;
- respect du thème d’exposition.

Un **mode libre sans note** doit toujours rester disponible. Le score récompense une approche mais ne doit jamais déclarer qu’une vitrine personnelle est « mauvaise ».

## Objets et états

Une pièce peut être neuve, ouverte, exposée, poussiéreuse, jaunie, incomplète, restaurée ou signée. L’état affecte la valeur marchande mais une valeur sentimentale distincte empêche le jeu de réduire toute collection à son prix.

Les boîtes peuvent être conservées, exposées derrière l’objet ou rangées. Certaines pièces possèdent des accessoires interchangeables, poses, visages, mains, armes factices ou socles alternatifs.

## Acquisition

- boutique spécialisée avec stock tournant ;
- précommandes et livraisons programmées ;
- conventions avec exclusivités purement virtuelles ;
- vide-greniers et brocantes ;
- ventes aux enchères avec plafond choisi par le joueur ;
- échanges avec personnages non-joueurs ;
- récompenses de défis ;
- restauration d’objets endommagés.

Les boîtes mystères n’utilisent jamais d’argent réel et leurs probabilités sont toujours visibles.

## Progression

La progression suit cinq paliers :

1. **Coin de chambre :** découverte du placement et du nettoyage.
2. **Collection organisée :** filtres, ensembles, supports et première convention.
3. **Studio thématique :** éclairage avancé, fonds et vitrines fermées.
4. **Galerie privée :** visiteurs spécialisés, prêts d’objets et expositions temporaires.
5. **Musée du multivers :** plusieurs salles, scénographies animées et collections maîtresses.

Le joueur débloque de l’espace et des outils, jamais une augmentation artificielle de puissance.

## Mode Minuit

Après avoir éteint la pièce, les figurines compatibles peuvent prendre vie pendant quelques secondes : duel simulé, salut, poursuite, concert miniature, ouverture de portail ou apparition holographique. Techniquement, ces moments utilisent des variantes de sprites, effets séparés et quelques images d’animation. Ils récompensent la composition sans déplacer définitivement les objets.

## Direction artistique

Vue frontale 2D avec profondeur légère, silhouettes très lisibles et matériaux différenciés. Les objets peuvent mélanger plusieurs styles d’univers, mais leur rendu doit conserver :

- même angle de caméra ;
- même direction de lumière ;
- même niveau de détail ;
- échelle physique normalisée ;
- ombre de contact séparée ;
- contour suffisamment propre pour les petits écrans.

Les décors utilisent une parallaxe discrète. Le verre, les LED et la poussière sont des effets de jeu et non intégrés définitivement aux images des figurines.

## Contenu recommandé pour une version 1.0

- 8 univers originaux de 30 objets : 240 pièces.
- 60 objets de culture générale hors figurines.
- 30 meubles ou modules.
- 24 accessoires de présentation.
- 12 décors de pièce.
- 16 éclairages.
- 50 défis scénarisés.
- 25 défis photo renouvelables.
- 40 scènes de Mode Minuit.
- 6 chapitres de carrière.

## Extensions possibles

- atelier de peinture et personnalisation ;
- magasin de collection avec clients et commandes ;
- chambre d’enfant devenue musée au fil des années ;
- objets musicaux réagissant à la bande-son ;
- collection de trophées de jeux vidéo ;
- animaux de compagnie risquant de déplacer les objets, option entièrement désactivable ;
- mode réalité augmentée pour prévisualiser une composition sur une vraie étagère.
