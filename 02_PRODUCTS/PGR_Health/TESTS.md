# Tests — PGR Health

## Statut

Registre initial des critères de réussite. En V0, ces critères servent à valider le cadrage ; ils ne prétendent pas valider un produit médical ou public.

## Critères de réussite du cadrage

- [ ] Le besoin et l'utilisateur cible sont compréhensibles sans explication orale.
- [ ] Chaque élément du périmètre est distingué de ce qui est hors périmètre.
- [ ] Aucune formulation ne présente PGR Health comme un outil de diagnostic ou comme un substitut médical.
- [ ] Les données nécessaires, leur source, leur stockage, leur suppression et leurs accès sont documentés avant implémentation.
- [ ] Les risques liés aux données de santé, à la confidentialité et aux erreurs d'interprétation sont enregistrés.
- [ ] Une décision explicite existe pour chaque intégration externe envisagée.

## Critères de réussite fonctionnels à valider plus tard

- [ ] Une activité ou séance peut être enregistrée avec des données compréhensibles.
- [ ] Une mesure peut être consultée dans son historique.
- [ ] L'utilisateur peut retrouver son évolution sans ambiguïté d'unité ou de date.
- [ ] Les analyses de progression sont traçables à partir des données enregistrées et ne sont pas présentées comme des conclusions médicales.
- [ ] Le parcours principal est utilisable sur iPhone avec une lecture claire et des erreurs récupérables.

## Vérifications techniques et qualité

- [ ] Les tests automatisés couvrent les règles de données et les cas limites pertinents.
- [ ] Les parcours principaux sont vérifiés manuellement sur l'environnement cible.
- [ ] Une compilation reproductible est obtenue avant toute livraison.
- [ ] Aucun secret, jeton ou donnée réelle de santé n'est commité dans GitHub.
- [ ] Les limites, avertissements et conditions de non-utilisation sont visibles avant un usage sensible.

## Règle de sortie

PGR Health ne peut être présenté comme prêt pour un usage public, commercial ou médical tant que les tests pertinents, la sécurité, la confidentialité, les validations cliniques ou réglementaires nécessaires et le déploiement réel n'ont pas été traités séparément.
