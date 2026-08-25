# Prompt maître pour poursuivre VITRINE//VERSE avec Codex

```text
Tu travailles sur le projet VITRINE//VERSE fourni dans ce dossier. Il s’agit d’un jeu 2D professionnel de collection et de décoration de vitrines geek. Ne crée pas un simple mockup : conserve le prototype jouable, audite-le, corrige-le et transforme-le progressivement en produit complet sans casser les sauvegardes ni supprimer une fonction existante.

OBJECTIF CENTRAL
Le joueur achète ou importe des figurines et objets de culture populaire, achète des étagères/vitrines, puis organise librement sa collection. Le plaisir principal vient du placement, de la mise en scène, de la chasse aux collections, de l’éclairage et de la création de petits dioramas.

RÈGLES DE TRAVAIL
1. Commence par lire README.md, GAME_DESIGN.md et OPENAI_IMAGE_PIPELINE.md.
2. Fais un audit concret du code, des données, de l’UX, de l’accessibilité, des performances et des sauvegardes.
3. Établis un plan par jalons, puis implémente réellement le jalon prioritaire.
4. Ne remplace jamais une fonction opérationnelle par un bouton factice ou un TODO.
5. Toute nouvelle fonction doit être utilisable au clavier, à la souris et sur écran tactile.
6. Garde le contenu data-driven : aucune figurine ne doit nécessiter du code spécifique pour exister.
7. Versionne le format de sauvegarde et écris les migrations nécessaires.
8. N’utilise aucun personnage, logo, objet ou nom protégé sans asset et autorisation fournis. Les contenus intégrés par défaut restent originaux.
9. N’ajoute pas de boîte mystère payante, de monnaie premium ou de mécanique prédatrice.
10. Ajoute des tests automatisés pour chaque système critique et exécute-les avant de déclarer le jalon terminé.

PRIORITÉS TECHNIQUES
- Séparer clairement moteur de placement, données, rendu, économie, sauvegarde et interface.
- Ajouter un vrai placement 2D au pointeur avec support tactile, déplacement continu, snap optionnel, grille réglable, sélection multiple et boîtes de collision.
- Ajouter des surfaces de pose définies par les meubles plutôt qu’une simple liste d’étagères.
- Gérer pivot de contact, largeur physique, hauteur physique, profondeur visuelle, poids, charge maximale et calques.
- Ajouter rehausseurs, socles, supports, boîtes acryliques et accessoires comme objets de présentation.
- Ajouter une commande annuler/rétablir robuste pour toutes les modifications de composition.
- Ajouter un éditeur de métadonnées pour les images importées et un réglage visuel du pivot/échelle.
- Ajouter sauvegardes multiples, autosauvegarde, export/import et détection de données corrompues.
- Ajouter un mode photo avec masquage d’interface, cadrage, profondeur légère et export PNG côté client.
- Ajouter PWA installable et fonctionnement hors ligne si le projet reste web.
- Préparer une architecture portable vers Godot sans lier les données au DOM.

SYSTÈMES DE JEU À DÉVELOPPER
- carrière en plusieurs pièces ;
- boutique, brocante, convention, précommandes et enchères ;
- collections, ensembles, variantes et objets emballés/déballés ;
- état, poussière, jaunissement optionnel et restauration ;
- valeur sentimentale distincte de la valeur marchande ;
- visiteurs, commandes d’exposition et défis photo ;
- décors, verre, éclairage, LED et fonds de vitrine ;
- Mode Minuit avec micro-animations data-driven ;
- galerie partageable par code de disposition ;
- bac à sable sans score ni contraintes.

QUALITÉ VISUELLE
Respecte la direction artistique existante mais améliore la hiérarchie, les animations, le retour tactile, les transitions, les matériaux de meubles, la lisibilité des objets et le responsive. Ne transforme pas l’interface en tableau de bord surchargé. La vitrine doit rester le centre visuel.

CONTENU
Prépare une structure permettant au minimum 300 objets, 30 meubles, 20 accessoires, 12 pièces et 50 défis sans ralentissement. Ajoute uniquement des exemples originaux cohérents avec les univers fictifs existants. Chaque asset doit avoir une image, une miniature, des métadonnées complètes, une échelle crédible et une collection.

TESTS OBLIGATOIRES
- achat d’objet et insuffisance de crédits ;
- achat/revente de meuble ;
- placement valide et refus par surcharge ;
- déplacement entre surfaces ;
- inventaire et filtres ;
- annulation/rétablissement ;
- calcul de prestige ;
- défis et récompenses ;
- import d’image ;
- sauvegarde, migration, export et import ;
- responsive desktop/tablette/mobile ;
- navigation clavier et lecteurs d’écran ;
- absence d’erreurs console.

LIVRABLE DE CHAQUE PASSE
- code fonctionnel ;
- tests exécutés avec résultats ;
- changelog précis ;
- liste courte des limites restantes ;
- aucune fausse affirmation sur ce qui n’a pas été testé.

Commence maintenant par l’audit, puis implémente la prochaine amélioration la plus structurante : extraire le moteur de placement dans un module indépendant et ajouter le déplacement fluide souris/tactile avec snap désactivable, sans régression sur le glisser-déposer actuel.
```
