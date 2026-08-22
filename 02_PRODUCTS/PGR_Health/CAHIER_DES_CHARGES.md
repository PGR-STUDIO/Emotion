# Cahier des charges — PGR Health

## Statut

Document de cadrage V0 — premier produit prioritaire de PGR Studio. Ce document ne vaut pas validation clinique, autorisation de mise sur le marché ni promesse de disponibilité publique.

## Besoin

Fournir à un utilisateur individuel un outil clair pour suivre ses activités physiques, ses mesures et son évolution dans le temps, afin de mieux comprendre sa progression et d'organiser ses actions personnelles.

Le produit doit rester un outil de suivi et d'aide à l'organisation. Il ne doit pas diagnostiquer, prescrire un traitement ou remplacer un professionnel de santé.

## Utilisateurs concernés

- Utilisateur individuel suivant sa propre activité et ses indicateurs.
- En V0, le cadrage se limite à un usage personnel ; les usages professionnels, multi-utilisateurs et de partage sont hors périmètre tant qu'ils ne sont pas spécifiés.

## Périmètre initial à confirmer

- Suivi de séances ou d'activités physiques.
- Saisie et consultation de mesures personnelles.
- Historique lisible.
- Lecture de la progression à partir des données enregistrées.
- Parcours utilisable sur iPhone.
- Étude d'une intégration avec les données de santé autorisées par l'utilisateur, avec consentement explicite et règles de confidentialité documentées.

Ces éléments décrivent le périmètre de cadrage ; ils ne constituent pas encore une liste de fonctionnalités développées.

## Hors périmètre V0

- Diagnostic médical ou interprétation clinique autonome.
- Prescription d'exercices, de médicaments ou de traitements.
- Promesse de résultat médical.
- Publication ou commercialisation immédiate.
- Agent IA autonome prenant des décisions de santé.
- Synchronisation de données tant que les autorisations, le stockage et la suppression ne sont pas définis.

## Données et exigences de confiance

Les données de santé et d'activité peuvent être sensibles. Avant toute implémentation, il faudra documenter :

- les données réellement nécessaires ;
- leur source et le consentement associé ;
- le stockage, la sauvegarde et la suppression ;
- les accès et les secrets, qui ne doivent pas être déposés dans Git ;
- les avertissements, limites d'usage et règles d'escalade vers un professionnel.

## Critères de sortie du cadrage

Le cadrage sera considéré comme exploitable lorsque le besoin, l'utilisateur cible, le périmètre, les exclusions, les données, les risques et les tests associés seront relus et validés dans les documents du produit.
