# Plan de contrôle qualité

## Démarrage

- Le jeu s’ouvre sans connexion Internet.
- Les dix-huit fichiers SVG se chargent.
- Deux étagères et six objets exposés sont visibles.
- Aucun message d’erreur JavaScript n’apparaît.

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

## Sauvegarde

- Recharger la page restaure toute la composition.
- Exporter produit un JSON lisible.
- Importer ce JSON restaure la partie.
- Un JSON invalide est refusé sans perdre la sauvegarde courante.
- Une image personnalisée persiste après rechargement tant que le quota local le permet.

## Interface

- Desktop 1600×1000 : trois panneaux visibles, aucune superposition.
- Tablette : vitrine et inventaire restent accessibles.
- Mobile : cartes lisibles, sélection et placement possibles sans glisser-déposer.
- Tabulation : tous les boutons importants sont atteignables.
- Échap quitte le mode photo.
- Ctrl/Cmd+Z et Ctrl/Cmd+Y fonctionnent.

## Test automatique déjà exécuté sur cette livraison

La livraison a été chargée dans Chromium via Playwright. Le contrôle a vérifié :

- rendu de cinq cartes d’inventaire, six objets exposés et deux étagères ;
- achat d’un objet ;
- placement rapide ;
- passage au jour suivant ;
- annulation ;
- achat d’une étagère ;
- entrée et sortie du mode photo ;
- absence d’erreur JavaScript pendant le scénario.
