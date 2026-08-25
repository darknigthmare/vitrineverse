# VITRINE//VERSE — Prototype jouable

VITRINE//VERSE est un jeu 2D de collection, décoration et gestion légère dans lequel le joueur construit sa vitrine geek idéale. Il achète des figurines et objets, installe de nouvelles étagères, organise librement ses pièces, améliore le prestige de sa galerie et gagne des crédits en accueillant des visiteurs.

## Lancer le jeu

### Méthode immédiate

Ouvrir `VITRINEVERSE_PLAY.html` dans un navigateur récent. Cette version autonome contient le code, les styles et les visuels d’exemple dans un seul fichier.

### Méthode projet

Ouvrir `index.html`, ou lancer un petit serveur local dans ce dossier :

```bash
python -m http.server 8080
```

Puis ouvrir `http://localhost:8080` dans le navigateur. Le serveur local est recommandé lorsque le navigateur limite la sauvegarde depuis un fichier local.

## Fonctionnalités déjà jouables

- Deux étagères de départ et six styles d’étagères achetables.
- Placement par glisser-déposer, double-clic ou bouton de placement rapide.
- Déplacement horizontal libre, changement de taille, retournement et ordre avant/arrière.
- Capacité de poids propre à chaque étagère.
- Inventaire avec recherche et filtres par catégorie.
- Boutique d’objets, de meubles et de décors.
- Dix-huit objets originaux fournis comme contenu de démonstration.
- Quatre ambiances de pièce et quatre éclairages.
- Prestige calculé selon rareté, valeur, propreté, cohérence d’univers et variété.
- Journées de visite donnant des crédits, avec accumulation de poussière.
- Défis successifs et récompenses.
- Journal d’activité, collectionneur, progression par séries.
- Annulation/rétablissement, rangement automatique et mode photo.
- Sauvegarde locale, export JSON et import JSON.
- Import de PNG, WebP ou JPEG personnalisés dans l’inventaire.
- Redimensionnement et compression locale des images importées.
- Interface adaptative pour ordinateur, tablette et téléphone.

## Contrôles

- **Cliquer** sur un objet : le sélectionner.
- **Glisser-déposer** : déplacer l’objet vers une étagère ou entre deux étagères.
- **Double-cliquer** sur un objet de l’inventaire : placement automatique.
- **Flèches gauche/droite** : déplacer l’objet exposé sélectionné.
- **Ctrl/Cmd + Z** : annuler.
- **Ctrl/Cmd + Y** ou **Ctrl/Cmd + Maj + Z** : rétablir.
- **Échap** : quitter le mode photo.

Sur écran tactile, sélectionner un objet puis utiliser les commandes du panneau de détail.

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
├── GAME_DESIGN.md
├── OPENAI_IMAGE_PIPELINE.md
├── CODEX_MASTER_PROMPT.md
└── QA_CHECKLIST.md
```

## Remplacement d’un objet de démonstration

1. Placer l’image détourée dans `assets/items/`.
2. Ouvrir `js/game-data.js`.
3. Modifier le chemin `image`, puis les métadonnées de l’objet.
4. Garder un identifiant `id` unique et stable pour ne pas casser les sauvegardes.
5. Régénérer `VITRINEVERSE_PLAY.html` avec `build_single_file.py`.

Les objets d’exemple sont originaux et ne reprennent aucune licence existante. Les personnages ou objets protégés doivent être ajoutés uniquement avec les droits nécessaires.
