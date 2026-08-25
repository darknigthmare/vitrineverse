# Pipeline d’images pour les figurines et objets

## Objectif

Toutes les images doivent pouvoir être placées côte à côte sans rupture d’angle, d’échelle, de lumière ou de niveau de détail. Une belle image isolée n’est pas suffisante : elle doit fonctionner comme un véritable asset de jeu.

## Spécification principale

- Un seul objet par image.
- Objet complet, jamais coupé par le cadre.
- Fond réellement transparent.
- Vue frontale trois-quarts très légère, cohérente pour toute la collection.
- Caméra à hauteur de vitrine, sans plongée forte.
- Lumière principale douce venant du haut-gauche.
- Aucun décor, texte, logo, filigrane, emballage parasite ou main humaine.
- Socle inclus uniquement lorsque la figurine en possède réellement un.
- Ombre de contact absente de l’image principale ou très légère ; le jeu ajoute son ombre dynamique.
- Contours propres, lisibles après réduction à environ 128 pixels.
- Matériaux visibles : plastique, résine, métal peint, tissu, papier, verre ou carton.
- Pose stable et silhouette reconnaissable.
- Même style de rendu pour tous les objets d’une série.

## Format de travail

1. Générer en carré, idéalement en haute définition.
2. Conserver une marge transparente d’environ 8 % autour de l’objet.
3. Nettoyer les pixels semi-transparents indésirables.
4. Exporter un master PNG transparent.
5. Produire une version WebP ou PNG optimisée, 512 pixels maximum, pour le prototype.
6. Nommer le fichier en minuscules : `univers_collection_objet_variante.png`.
7. Renseigner les dimensions physiques et le pivot de contact dans les données du jeu.

## Gabarit de demande pour une figurine originale

```text
Asset de jeu 2D isolé d’une figurine de collection premium représentant [DESCRIPTION PRÉCISE].
Figurine complète visible de la tête au socle, pose stable, vue frontale légèrement trois-quarts,
caméra à hauteur de vitrine, lumière douce venant du haut-gauche, rendu de résine peinte très détaillé,
proportions cohérentes avec une figurine de collection, silhouette très lisible en petite taille,
fond totalement transparent, aucune scène, aucun meuble, aucun emballage, aucun texte, aucun logo,
aucune bordure, aucun filigrane, aucun élément coupé. Conserver une marge transparente régulière.
```

## Gabarit pour un objet pop culture original

```text
Asset de jeu 2D isolé de [TYPE D’OBJET] inspiré d’un univers [GENRE/ÉPOQUE], design entièrement original.
Objet complet, proportions crédibles, vue frontale légèrement trois-quarts cohérente avec une vitrine,
lumière douce haut-gauche, matériaux clairement identifiables, détails lisibles à petite taille,
fond totalement transparent, sans décor, sans texte lisible, sans logo, sans filigrane et sans recadrage.
```

## Variantes à produire pour les pièces importantes

- version normale ;
- version dans sa boîte ;
- version alternative de pose ;
- accessoire séparé ;
- effet lumineux séparé ;
- silhouette ou ombre séparée ;
- miniature d’inventaire optimisée ;
- deux à six images pour le Mode Minuit lorsque nécessaire.

## Échelle normalisée

Le jeu doit disposer d’une hauteur physique indicative. Exemple :

- cartouche : 10 à 14 cm ;
- figurine standard : 15 à 25 cm ;
- statue : 30 à 60 cm ;
- casque : taille réelle ;
- console : largeur réelle approximative ;
- diorama : empreinte et poids supérieurs.

L’image n’impose jamais seule l’échelle : les champs `width`, `height`, `weight` et les futures dimensions physiques font foi.

## Contrôle qualité

Avant intégration, vérifier :

- absence de fond opaque ;
- pieds ou socle bien visibles ;
- aucune partie anatomique ou mécanique incohérente ;
- pas d’objet fusionné avec son accessoire ;
- orientation compatible avec les autres assets ;
- source lumineuse cohérente ;
- lisibilité à 128, 96 et 64 pixels ;
- couleur non contaminée par un ancien fond ;
- nom de fichier et identifiant uniques ;
- poids et dimensions plausibles ;
- aucun élément protégé utilisé sans autorisation.

## Intégration rapide dans le prototype

Le joueur peut utiliser le bouton `+` de l’inventaire. Pour une intégration permanente :

1. copier l’image dans `assets/items/` ;
2. ajouter sa définition dans `js/game-data.js` ;
3. lui attribuer une collection et des mots-clés ;
4. tester son encombrement sur chaque type d’étagère ;
5. reconstruire le fichier autonome avec `python build_single_file.py`.
