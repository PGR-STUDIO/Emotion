# Emotion

Support d’auto-observation émotionnelle et de préparation de séance.

## État au 23 août 2026

Le produit n’est pas à créer depuis zéro. Le prototype fonctionnel de référence se trouve dans [PGR_EMOTIONS/final-simple](/Users/pgr/PGR-STUDIO/PGR_EMOTIONS/final-simple).

La base scientifique canonique est [final-simple/scientific_knowledge_base](/Users/pgr/PGR-STUDIO/PGR_EMOTIONS/final-simple/scientific_knowledge_base). L’ancienne copie racine est conservée, sans suppression, dans `/Users/pgr/PGR-STUDIO/archive/scientific_knowledge_base-legacy-2026-08-23`.

Cette documentation décrit le périmètre réellement présent, les limites à respecter et le travail restant avant une diffusion plus large.

Les deux validations externes restantes sont préparées dans [CLINICAL_REVIEW_PACKET.md](CLINICAL_REVIEW_PACKET.md) et [REAL_DEVICE_VALIDATION.md](REAL_DEVICE_VALIDATION.md).

## Lancement local

Depuis le dossier du prototype :

```bash
cd /Users/pgr/PGR-STUDIO/PGR_EMOTIONS/final-simple
python3 -m http.server 8080
```

Ouvrir ensuite `http://127.0.0.1:8080/`. Le chargement direct en `file://` peut empêcher la lecture des fichiers JSON et le fonctionnement normal du service worker.

Le backend expérimental a été mis à l’écart, sans suppression, dans `/Users/pgr/PGR-STUDIO/archive/emotions-app-fastapi-v0.1`. Il ne fait plus partie de l’arborescence active du produit.

La version contrôlée le 23 août 2026 contient 41 émotions guidées, 41 parcours émotion-exercice, 15 exercices et 33 études structurées. La matrice navigateur 41 × 3 intensités a réussi 123/123 cas.

## Décision de référence

La PWA locale `final-simple` est retenue comme base V0/V1. Le backend FastAPI archivé dans `/Users/pgr/PGR-STUDIO/archive/emotions-app-fastapi-v0.1` est conservé uniquement pour référence et réversibilité.

## Positionnement

Emotion aide à observer une expérience émotionnelle, à la mettre en mots, à essayer un exercice court et à préparer un échange avec un professionnel. L’application ne pose pas de diagnostic et ne remplace pas les soins ni les services d’urgence.
