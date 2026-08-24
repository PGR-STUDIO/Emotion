# Guide d'intégration application

## Chargement recommandé
1. Charger `technical_schema.json`.
2. Indexer `studies`, `models`, `emotions`, `exercises`.
3. Appliquer `recommendation_rules.triage_rules` avant toute sortie utilisateur.
4. Utiliser les IDs comme références internes.

## Pipeline IA recommandé

Entrée utilisateur → triage sécurité → classification émotionnelle probabiliste → détection intensité → inférence des besoins → sélection d'exercices → justification scientifique → réponse accessible.

## Langage de sortie
- Utiliser des formulations probabilistes : “il est possible que…”, “cela peut indiquer…”.
- Ne pas écrire : “tu as un trouble”, “cela prouve que…”.
- Toujours préciser qu’un exercice peut être arrêté.

## Quand recommander un professionnel
- Intensité ≥ 8 fréquente ou durable.
- Risque pour soi ou autrui.
- Trauma, dissociation, attaques de panique répétées, comportements compulsifs/auto-agressifs.
- Altération importante du sommeil, travail, relations ou scolarité.
- Symptômes persistants au-delà de plusieurs semaines.
