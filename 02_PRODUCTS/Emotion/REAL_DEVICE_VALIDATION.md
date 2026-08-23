# Validation appareils réels — Emotion

Statut au 23 août 2026 : **non exécutée**. Le navigateur local et le simulateur de taille 390 × 844 ne remplacent pas un iPhone/iPad et un appareil Android physiques.

Contrôle de disponibilité effectué : l’iPhone physique « iPhone pgr » apparaît comme **unavailable** dans `xcrun devicectl list devices` ; aucun appareil Android n’est exposé (`adb` absent). Aucun résultat d’installation réelle ne peut donc être déclaré.

## Préparation

- Servir `final-simple` en HTTPS sur un domaine ou une URL locale accessible par les appareils.
- Utiliser un jeu de données de test non personnel.
- Noter modèle, version iOS/Android, navigateur, date, version du cache et résultat.
- Ne pas saisir de données cliniques réelles pendant l’acceptation technique.

## Parcours obligatoire

### iOS / Safari

1. Ouvrir l’application en HTTPS.
2. Vérifier le chargement des 5 émotions principales et de la roue.
3. Sélectionner au moins une émotion dans chaque niveau, puis tester les intensités 3, 5 et 8.
4. Vérifier une situation de sécurité : l’alerte apparaît, l’exercice est masqué et la poursuite est bloquée.
5. Créer une observation, fermer Safari, revenir et relire l’historique.
6. Utiliser « Ajouter à l’écran d’accueil », lancer la PWA installée et refaire le parcours principal.
7. Activer le mode avion après chargement, vérifier les ressources locales, puis remettre le réseau.
8. Protéger une observation avec une phrase de test, verrouiller, refuser une mauvaise phrase et déverrouiller avec la bonne.
9. Vérifier l’orientation portrait/paysage, le zoom et le clavier logiciel.

### Android / Chrome

Reprendre les neuf étapes ci-dessus, puis vérifier l’invite d’installation PWA, le comportement du bouton retour Android, la reprise après mise en veille et le rendu sur une largeur inférieure à 390 px.

## Critères d’acceptation

- aucun débordement horizontal ni élément inaccessible au clavier ou au toucher ;
- aucune erreur console bloquante ;
- les données de test restent locales et réapparaissent après relance ;
- le service worker sert les ressources attendues hors ligne ;
- le triage sécurité reste prioritaire sur les recommandations ;
- l’exposition graduée reste explicitement encadrée par un professionnel ;
- une phrase secrète erronée est refusée ; une phrase perdue ne permet pas de récupérer les données chiffrées ;
- aucune phrase secrète ni observation de test n’est transmise à un serveur.

## Fiche de résultat

```text
Appareil / OS :
Navigateur :
Version Emotion :
Date :
HTTPS et installation PWA : OK / KO
Parcours 41 émotions : OK / KO
Triage sécurité : OK / KO
Historique après relance : OK / KO
Hors ligne après installation : OK / KO
Chiffrement / mauvaise phrase / phrase perdue : OK / KO
Accessibilité et clavier mobile : OK / KO
Défauts observés et captures :
Décision : accepté / corrections requises
```

Cette fiche doit être remplie sur au moins un appareil iOS et un appareil Android avant de parler de validation PWA réelle.
