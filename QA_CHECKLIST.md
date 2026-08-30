# Plan de contrôle qualité

## Démarrage

- Le jeu s’ouvre sans connexion Internet.
- Les trente fichiers SVG ou plus référencés par le catalogue se chargent.
- La galerie de départ, son inventaire et le tutoriel sont visibles.
- Aucun message d’erreur JavaScript n’apparaît.
- Le manifeste est détecté et le service worker prend le contrôle après rechargement.
- Après une première visite en ligne, le jeu redémarre hors connexion.

## Inventaire et boutique

- La recherche trouve le nom, l’univers, la catégorie et la collection.
- Les filtres n’affichent que les catégories possédées.
- Un achat retire le bon nombre de crédits et ajoute une instance unique.
- Un achat impossible reste désactivé.
- Une revente rend 50 % de la valeur prévue.

## Placement

- Un objet peut passer de l’inventaire à chaque étagère compatible.
- Un objet peut passer d’une étagère à une autre.
- La position du dépôt correspond au pointeur.
- La surcharge est refusée avec un message clair.
- Taille, miroir, profondeur et déplacement horizontal persistent après sauvegarde.
- Une étagère occupée ne peut pas être revendue.
- Une étagère vide peut être réordonnée ou revendue.

## Économie et progression

- Ouvrir la galerie avance d’un jour, rapporte des crédits et réduit la propreté.
- Nettoyer coûte le montant prévu et restaure 100 %.
- Le prestige réagit à la propreté et aux ensembles thématiques.
- Le défi peut être réclamé une seule fois avant de passer au suivant.
- Un défi déjà terminé reste non réclamable après rechargement.
- Les objets personnels ne peuvent pas valider les objectifs compétitifs.

## Sauvegarde

- Recharger la page restaure toute la composition.
- Exporter produit un JSON réimportable.
- Importer ce JSON restaure la partie.
- Un JSON invalide est refusé sans perdre la sauvegarde courante.
- Une sauvegarde principale corrompue charge la copie de secours sans écraser les données brutes.
- Une sauvegarde v1 migre vers v2 sans perdre les placements.
- Un échec de quota annule intégralement l’action en cours.
- Annuler/rétablir conserve l’état et ses piles si l’écriture locale échoue.
- Les champs inconnus, volumes excessifs et créations dupliquées sont refusés ou normalisés.
- Une image personnalisée persiste après rechargement tant que le quota local le permet.

## Interface

- Desktop 1600×1000 : trois panneaux visibles, aucune superposition.
- Tablette : vitrine et inventaire restent accessibles.
- Mobile : cartes lisibles, sélection et placement possibles sans glisser-déposer.
- Tabulation : tous les boutons importants sont atteignables.
- Les sous-onglets Boutique suivent les flèches, Début et Fin avec un focus roving.
- Échap quitte le mode photo.
- Le bouton tactile quitte le mode photo sur mobile.
- Ctrl/Cmd+Z et Ctrl/Cmd+Y fonctionnent.

## Automatisation reproductible

Installer les dépendances et Chromium une première fois :

```bash
npm install
npx playwright install chromium
```

Exécuter ensuite la porte de qualité complète :

```bash
npm run qa
```

Cette commande régénère d’abord `VITRINEVERSE_PLAY.html`, contrôle les contrats statiques avec `node:test`, démarre `py -3 -m http.server 8098 --bind 127.0.0.1`, puis exécute les parcours Playwright réels :

- nouveau joueur et persistance de l’onboarding ;
- achat, placement rapide et journée de visite ;
- impossibilité de réclamer deux fois un même défi ;
- reprise exacte depuis `localStorage` ;
- migration v1 vers v2 et récupération sur copie de secours ;
- progression maximale, carrière acquise et disponibilité de tout le contenu ;
- achat et persistance d’un éclairage ;
- annulation transactionnelle complète en cas de quota saturé ;
- refus d’un JSON invalide sans perte de sauvegarde ;
- refus des identifiants de meuble ou d’objet inconnus ;
- rendements décroissants persistants même en alternant deux compositions ;
- objectif de visites fondé sur douze présentations distinctes ;
- version autonome ouverte directement sous `file://` sans erreur console ;
- placement et réorganisation tactiles à 390×844 sans glisser-déposer ;
- entrée et sortie tactile du mode photo ;
- enregistrement du service worker et redémarrage hors ligne.

Les commandes ciblées sont `npm run test:unit`, `npm run test:e2e` et `npm run build`. Un contrôle n’est considéré comme exécuté que lorsque la commande correspondante termine avec un code de sortie nul sur l’état courant du dépôt.
