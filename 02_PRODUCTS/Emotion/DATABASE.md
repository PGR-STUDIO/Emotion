# Base de données — Emotion

## Statut

Modèle V0 retenu pour la PWA locale. La source de vérité applicative est le stockage local du navigateur.

## Entités

### Observation

Une observation contient notamment :

- identifiant local ;
- date ;
- émotion principale ou nuance ;
- intensité initiale ;
- situation ;
- pensées ;
- signes corporels ;
- besoin possible ;
- réaction et conséquence ;
- exercice essayé ;
- durée et statut de l’exercice ;
- intensité après exercice ;
- ressenti après exercice ;
- question à reprendre en séance.

Le format est un objet JavaScript stocké dans `localStorage`. Les clés actuelles sont `pgr-simple-final` et `pgr-simple-final-draft` en mode non chiffré.

### Base scientifique

La base locale séparée contient les émotions, exercices, règles de recommandation, protocole de sécurité, niveaux de preuve, études et configuration des sources. Elle sert à guider l’interface ; elle ne constitue pas un dossier médical.

La source canonique est `/Users/pgr/PGR-STUDIO/PGR_EMOTIONS/final-simple/scientific_knowledge_base`. Elle comprend 24 émotions scientifiques, 41 émotions guidées, 41 mappings émotion-exercice, 15 exercices et 33 études structurées. La copie racine historique a été déplacée dans `/Users/pgr/PGR-STUDIO/archive/scientific_knowledge_base-legacy-2026-08-23` pour éviter deux sources concurrentes.

## Conservation et sécurité

- aucune donnée d’observation n’est envoyée par la PWA ;
- les données restent sur l’appareil et le profil du navigateur ;
- chiffrement AES-GCM optionnel avec phrase secrète non conservée ;
- perte de phrase secrète = impossibilité de récupérer les données protégées ;
- export et suppression sont déclenchés explicitement par l’utilisateur ;
- aucune synchronisation ou sauvegarde distante n’est prévue en V0.

Le schéma SQLite du backend FastAPI archivé est expérimental et ne doit pas être considéré comme le modèle produit retenu.
