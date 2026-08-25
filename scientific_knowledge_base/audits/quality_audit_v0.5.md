# Audit qualité v0.5 — Mon repère / Émotions

Date de contrôle : 2026-08-23
Périmètre : application web locale `final-simple` et base `scientific_knowledge_base`.

## Résultat général

La version v0.4 est un prototype local fonctionnel de support d’auto-observation. Elle n’est pas un dispositif médical, ne pose pas de diagnostic et ne doit pas être présentée comme une intervention clinique validée.

## Éléments vérifiés

- Triage de sécurité prioritaire : les formulations de danger détectées par le protocole affichent une alerte, masquent l’exercice et désactivent la poursuite vers l’étape suivante.
- Moteur de règles : `recommendation_rules.json` est chargé par l’application ; les règles sont triées par priorité et la sécurité passe avant toute suggestion.
- Cas automatisés : 22 tests Python passent, dont les 5 cas demandés, les contrôles d’intégrité scientifique, les adaptateurs de sources, les ressources PWA, la matrice émotionnelle, le parcours navigateur de confidentialité et le smoke test de tous les écrans. La matrice navigateur réelle vérifie 41 émotions × 3 intensités, soit 123/123 cas.
- Durées : les intervalles comme `1 à 3 minutes` sont conservés et présentés comme tels ; ils ne sont plus réduits arbitrairement à 120 secondes.
- Preuves : chaque exercice de la base possède une référence associée ; les grades sont affichés avec leur limite et leur statut.
- Données : 33 études structurées, 32 résumés PubMed enrichis, 24 émotions scientifiques, 41 émotions guidées et 41 parcours émotion-exercice. La base contient 15 exercices. Douze textes intégraux librement disponibles ont maintenant leurs sections XML PMC extraites et 1 453 références attachées ; 21 études restent explicitement en attente d’accès intégral ou de revue manuelle.
- Confidentialité : stockage local, export, suppression et chiffrement AES-GCM optionnel avec phrase secrète non stockée. Une phrase perdue rend les données protégées irrécupérables.
- Accessibilité : labels de champs, états `aria-pressed`, messages `aria-live`, focus visible et sélection clavier de la roue des émotions.
- Mobile : contrôle à 390 × 844 px sans débordement horizontal ; les badges de preuve de la bibliothèque se replient dans leur carte.
- Hors ligne : manifeste, service worker et 20 ressources précachées présentes ; les ressources référencées par le cache existent.
- Connecteurs : PubMed actif via NCBI E-utilities ; ScienceDirect est prévu via clé Elsevier ; APA PsycNet et Cochrane sont représentés par des adaptateurs officiels à configurer, sans scraping ni stockage de secret.

## Limites à conserver explicitement

1. Les 12 extractions PMC sont des extractions de sections et de références, pas une validation clinique automatisée : participants, effets, intervalles de confiance, outils et risque de biais restent à vérifier étude par étude. Les 21 autres études exigent encore un accès intégral ou une revue manuelle.
2. Une étude de la base n’a pas de PMID exploitable dans l’enrichissement courant (`META-SELFDETERMINATION-SLEMP-2024`).
3. Les adaptateurs APA PsycNet et Cochrane acceptent désormais un endpoint HTTPS officiel fourni par l’organisation (`APA_PSYNET_API_URL` / `COCHRANE_API_URL`) et la clé correspondante, mais ils restent non activés dans ce projet faute de ces accès. ScienceDirect nécessite `ELSEVIER_API_KEY` et les droits correspondants.
4. Le triage actuel est un filtre de sécurité par formulations ; il ne remplace ni une évaluation humaine ni les services d’urgence et peut produire des faux positifs ou faux négatifs.
5. Le chiffrement navigateur est une protection applicative optionnelle, pas une garantie équivalente à un coffre-fort système ou à une politique de sécurité de production.
6. Le service worker est préparé et ses ressources sont cohérentes ; un test d’acceptation hors ligne complet doit encore être exécuté sur les appareils et navigateurs cibles.
7. Corrections v0.7.1 : le rendu des émotions guidées ne conserve plus l’insight de l’émotion précédente ; l’exposition graduée est explicitement réservée à une planification professionnelle ; la page de définition revient en haut ; la formulation de séance utilise le déterminant adapté ; la version du cache PWA est incrémentée.
8. Avant diffusion publique : revue par un psychologue clinicien, tests utilisateurs, analyse vie privée/juridique, politique de conservation, gestion des mises à jour, test hors ligne et validation de déploiement restent nécessaires. L’installation et la validation sur iOS/Android réels ne sont pas réalisées dans cet audit.

## Commandes de reproduction

Depuis `final-simple/scientific_knowledge_base` :

```bash
python3 -m unittest discover -s tests -v
python3 source_connectors.py "emotion regulation" --limit 1
python3 extract_fulltext_pubmed_central.py --apply
python3 audits/completion_gate.py --write
```

Pour le contrôle visuel local :

```bash
python3 -m http.server 8080
```

Puis ouvrir `http://127.0.0.1:8080/`. L’ouverture directe en `file://` peut empêcher le chargement des fichiers JSON par les règles de sécurité du navigateur.
