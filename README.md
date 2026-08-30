# VITRINE//VERSE — Jeu de collection et de mise en scène

VITRINE//VERSE est un jeu 2D de collection, décoration et gestion légère dans lequel le joueur construit sa vitrine geek idéale. Il achète des figurines et objets, installe de nouvelles étagères, organise librement ses pièces, améliore le prestige de sa galerie et gagne des crédits en accueillant des visiteurs.

## Lancer le jeu

### Version autonome

Ouvrir `VITRINEVERSE_PLAY.html` dans un navigateur récent. Cette version contient le code, les styles et les visuels du catalogue dans un seul fichier.

### Méthode projet

Pour bénéficier de l’installation PWA, de la reprise hors ligne et des contrôles automatisés, lancer le serveur local multiplateforme depuis ce dossier :

```bash
npm run serve
```

Puis ouvrir `http://127.0.0.1:8098`. Après une première visite en ligne, le service worker conserve le cœur du jeu pour une reprise hors connexion.

## Fonctionnalités déjà jouables

- Une galerie de départ guidée et au moins dix meubles ou supports à débloquer.
- Placement par glisser-déposer, double-clic ou bouton de placement rapide.
- Déplacement horizontal libre, changement de taille, retournement et ordre avant/arrière.
- Capacité de poids propre à chaque étagère.
- Inventaire avec recherche et filtres par catégorie.
- Boutique d’objets, de meubles, de pièces et d’éclairages achetables.
- Au moins trente objets originaux répartis en séries cohérentes.
- Au moins huit ambiances de pièce et sept éclairages.
- Prestige calculé selon rareté, valeur, propreté, cohérence d’univers et variété.
- Journées de visite donnant des crédits, avec accumulation de poussière.
- Au moins douze défis persistants, commandes d’exposition et récompenses non répétables.
- Journal d’activité, carrière de collectionneur et progression par séries.
- Annulation/rétablissement, rangement automatique et mode photo.
- Sauvegarde locale transactionnelle, copie de secours, migration v1 vers v2 et import JSON strict.
- Export JSON réimportable, avec restauration sans écrasement si la sauvegarde principale est endommagée.
- Import de PNG, WebP ou JPEG personnalisés dans l’inventaire.
- Redimensionnement et compression locale des images importées.
- Interface adaptative pour ordinateur, tablette et téléphone.
- Installation PWA et reprise hors ligne après la première ouverture.
- Rendements décroissants sur les visites répétées et carrière acquise sans régression.

## Contrôles

- **Cliquer** sur un objet : le sélectionner.
- **Glisser-déposer** : déplacer l’objet vers une étagère ou entre deux étagères.
- **Double-cliquer** sur un objet de l’inventaire : placement automatique.
- **Flèches gauche/droite** : déplacer l’objet exposé sélectionné.
- **Ctrl/Cmd + Z** : annuler.
- **Ctrl/Cmd + Y** ou **Ctrl/Cmd + Maj + Z** : rétablir.
- **Échap** : quitter le mode photo.

Sur écran tactile, sélectionner un objet puis utiliser les commandes du panneau de détail.

Le mode photo possède également un bouton de sortie tactile fixe, en complément de la touche Échap.

## Qualité et build

Installer les dépendances une première fois :

```bash
npm install
npx playwright install chromium
```

Puis utiliser les commandes reproductibles :

```bash
npm run test:unit   # contrats de contenu, PWA et build
npm run test:e2e    # parcours Chromium réels
npm run build       # régénère VITRINEVERSE_PLAY.html
npm run qa          # build puis totalité des contrôles
```

Les tests navigateur démarrent automatiquement un serveur Python isolé sur `127.0.0.1:8098`. Le détail des parcours et des contrôles manuels complémentaires se trouve dans `QA_CHECKLIST.md`.

## Ajouter les futures images générées

Le bouton `+` de l’inventaire permet d’importer immédiatement une image détourée et de lui attribuer un nom, un univers, une catégorie, une rareté, un poids et une taille. Le fichier `OPENAI_IMAGE_PIPELINE.md` fixe les règles visuelles pour produire des figurines cohérentes entre elles.

## Structure

```text
vitrineverse/
├── index.html
├── VITRINEVERSE_PLAY.html
├── styles.css
├── js/
│   ├── game-data.js
│   └── app.js
├── assets/items/
├── preview/
├── tests/
│   ├── static-contracts.test.js
│   └── e2e.spec.js
├── manifest.webmanifest
├── sw.js
├── package.json
├── playwright.config.js
├── GAME_DESIGN.md
├── OPENAI_IMAGE_PIPELINE.md
├── CODEX_MASTER_PROMPT.md
└── QA_CHECKLIST.md
```

## Ajout d’un objet permanent au catalogue

1. Placer l’image détourée dans `assets/items/`.
2. Ouvrir `js/game-data.js`.
3. Modifier le chemin `image`, puis les métadonnées de l’objet.
4. Garder un identifiant `id` unique et stable pour ne pas casser les sauvegardes.
5. Régénérer `VITRINEVERSE_PLAY.html` avec `npm run build`.

Le catalogue du projet est original et ne doit reprendre aucune licence existante. Les personnages ou objets protégés ne peuvent être ajoutés qu’avec les droits nécessaires.
