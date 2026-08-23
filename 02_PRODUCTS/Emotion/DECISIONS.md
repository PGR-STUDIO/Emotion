# Décisions — Emotion

| Date | Décision | Justification | Statut |
|---|---|---|---|
| 2026-08-22 | Créer un espace produit documentaire | Préparer le cadrage sans engager de fonctionnalité | Remplacée |
| 2026-08-23 | Retenir `PGR_EMOTIONS/final-simple` comme référence V0/V1 | C’est l’implémentation la plus complète, locale, documentée et partiellement auditée | Active |
| 2026-08-23 | Mettre le backend FastAPI à l’écart dans `/Users/pgr/PGR-STUDIO/archive/emotions-app-fastapi-v0.1` | Il utilise SQLite et un modèle différent ; aucun besoin de synchronisation ou multi-utilisateur n’est validé. Le déplacement est réversible et aucune donnée n’est supprimée | Active |
| 2026-08-23 | Ne pas présenter Emotion comme un outil médical | Le prototype est un support d’auto-observation ; le triage textuel et les exercices ne remplacent pas une évaluation professionnelle | Active |
