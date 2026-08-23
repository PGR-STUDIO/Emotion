# Tests — Emotion

## Statut

Des vérifications techniques existent déjà pour `final-simple`. La matrice navigateur est exécutée ; la validation sur appareils cibles reste séparée et documentée dans [REAL_DEVICE_VALIDATION.md](REAL_DEVICE_VALIDATION.md).

## Tests déjà réalisés

- syntaxe JavaScript vérifiée ;
- base scientifique chargée avec 33 études, 24 émotions scientifiques, 41 émotions guidées / parcours et 15 exercices ;
- triage de sécurité testé sur un texte de danger ;
- affichage mobile vérifié à 390 × 844 px sans débordement ;
- rechargement hors ligne vérifié localement ;
- 22 tests Python de la base scientifique réussis ;
- matrice navigateur réelle réussie : 41 émotions × intensités 3, 5 et 8, soit 123/123 cas ;
- test navigateur confidentialité réussi : protection, rechargement, mauvaise phrase refusée, bonne phrase acceptée et verrouillage ;
- smoke test navigateur réussi sur les écrans accueil, observation, compréhension, séance, sauvegarde, historique, science, outils, bibliothèque et confidentialité ;
- parcours guidé mobile vérifié : émotion → compréhension/intensité → exercice → questions une par une ;
- contrôle ciblé des composants longs à 390 × 844 px : badge de preuve, références d’exercice et quatre statuts de sources sans débordement ;
- backend FastAPI V0.1 : 4 tests annoncés réussis.

Les trois tests navigateur sont disponibles dans `final-simple/tests/browser-emotion-matrix.html`, `final-simple/tests/browser-privacy-encryption.html` et `final-simple/tests/browser-screen-smoke.html`. Pour le test confidentialité, utiliser une nouvelle origine/port de test afin de ne pas réutiliser des données chiffrées d’un passage précédent.

## Critères d’acceptation V0

- une observation peut être créée sans serveur ;
- l’observation réapparaît après rechargement ;
- l’intensité et les champs saisis sont conservés ;
- une émotion principale et une nuance peuvent être sélectionnées ;
- un exercice adapté est affiché lorsque la sécurité le permet ;
- l’exercice peut être arrêté ;
- une situation à risque bloque la poursuite et affiche l’orientation de sécurité ;
- l’historique peut être relu et une observation supprimée ;
- l’utilisateur peut exporter puis supprimer ses données ;
- l’application ne prétend ni diagnostiquer ni gérer une urgence.

## Validations restantes

- revue clinique par un psychologue ;
- tests sur appareils iOS et Android réels ;
- test de perte, changement et oubli de phrase secrète ;
- test hors ligne après installation PWA ;
- audit accessibilité manuel ;
- revue vie privée et conservation ;
- revue clinique et réglementaire avant toute diffusion publique.

Dossier de relecture : [CLINICAL_REVIEW_PACKET.md](CLINICAL_REVIEW_PACKET.md). Fiche appareils réels : [REAL_DEVICE_VALIDATION.md](REAL_DEVICE_VALIDATION.md).
