# Base de connaissances scientifique — Émotions / Mon repère

Version : 0.7.1

Recherche temps réel : module `realtime_search.py` (PubMed E-utilities). Les
clés éventuelles sont fournies uniquement par variables d'environnement.

Cette base structure les connaissances scientifiques destinées à alimenter une application d’accompagnement émotionnel. Elle privilégie les méta-analyses, revues systématiques et essais/études publiés dans des revues à comité de lecture.

État v0.7.1 : 24 émotions scientifiques, 41 émotions guidées, 41 mappings émotion-exercice, 15 exercices et 33 études structurées. La base active est celle de `final-simple`; la copie racine historique est archivée hors du projet actif.

## Architecture

```text
scientific_knowledge_base/
  data/
    studies.json
    models.json
    emotions.json
    exercises.json
    recommendation_rules.json
    technical_schema.json
  source_config.json
  source_connectors.py
  schemas/
    study.schema.json
  docs/
    domains_to_cover.md
    methodology.md
    integration_guide.md
  audits/
    quality_audit_v0.1.md
  tests/
    test_recommendations.py
```

## Statut

Première version exploitable, volontairement prudente. Les champs `participants` sont parfois indiqués comme “voir paper extraction table” afin de ne pas inventer de nombres lorsqu'ils ne sont pas vérifiés dans cette session. Une extraction bibliographique complète doit compléter ces champs avant usage réglementaire, clinique ou commercial.

## Principe de sécurité

La base ne doit jamais produire un diagnostic. Les règles de triage sécurité passent avant toute recommandation d'exercice.

## Recherche en ligne

Exemple : `python3 realtime_search.py "emotion regulation mindfulness" --limit 10`.
Le résultat est enregistré dans `data/pubmed_live_DATE.json`. PubMed/PMC est la
source active par défaut, avec les textes intégraux PMC ouverts lorsqu'ils sont
disponibles. APA PsycNet, Cochrane et ScienceDirect sont optionnels : sans accès
officiel, l'application conserve PubMed/PMC et signale simplement la source
indisponible. La base ne contourne pas les abonnements, les protections ou les
conditions d'utilisation.

Dans l’application, la page « Confidentialité » permet d’activer un chiffrement
AES-GCM dérivé d’une phrase secrète. La phrase secrète n’est pas stockée ; si
elle est perdue, les observations chiffrées ne peuvent pas être récupérées.

Le module `source_connectors.py` permet une recherche multi-sources sans
scraping. PubMed/PMC est le socle autonome; ScienceDirect nécessite
`ELSEVIER_API_KEY`.
Pour un accès institutionnel APA PsycNet ou Cochrane, fournir l'URL HTTPS
officielle attribuée (`APA_PSYNET_API_URL` ou `COCHRANE_API_URL`) et la clé
correspondante (`APA_PSYNET_API_KEY` ou `COCHRANE_API_KEY`). Les clés restent
dans l'environnement et ne sont jamais écrites dans la base.

### Activer ScienceDirect localement

Dans le même terminal que celui qui lance la recherche ou le serveur local,
définir la clé sans la mettre dans Git, dans JSON ou dans l'interface :

```bash
export ELSEVIER_API_KEY='cle_fournie_par_Elsevier'
python3 source_connectors.py "emotion regulation" --limit 5
```

La commande ne doit afficher la clé. Si elle est définie dans un autre terminal,
le processus de l'application ne la verra pas ; il faut alors redémarrer le
serveur depuis ce terminal. Une clé déjà copiée dans une conversation ou un
dépôt doit être révoquée et remplacée.

### Objectif réaliste de la version 0.5.1

La version est exploitable avec PubMed/PMC, les études en accès ouvert et les
références vérifiables. Les connecteurs APA, Cochrane et ScienceDirect
enrichissent la recherche lorsqu'un accès est fourni, mais leur absence ne
bloque jamais le triage de sécurité, les exercices, le journal ou le mode hors
ligne.

`enrich_studies_pubmed.py --apply` complète les résumés PubMed disponibles.
L’état précédent est conservé dans `data/studies_pre_pubmed_enrichment_DATE.json`.
La présence d’un résumé ne remplace pas l’extraction critique du texte
intégral. `extract_fulltext_pubmed_central.py --apply` ajoute les sections et
références des articles PMC XML librement accessibles ; 12 études sont
actuellement vérifiées ainsi et 21 restent marquées comme nécessitant un
accès intégral ou une revue manuelle.

## Tests

Lancer `python3 -m unittest discover -s tests -v` depuis ce dossier. Les cinq
cas de recommandation de la base et les références d'exercices sont contrôlés.


## Version 0.5
Le moteur de règles est structuré dans `recommendation_rules.json`, avec triage
sécurité avant recommandation, tests automatisés, extraction PMC vérifiable et
connecteurs configurables.

## Version 0.3
Base complétée par recherche PubMed temps réel, ontologie émotionnelle élargie, grades de preuve, protocole sécurité, cas de test et schéma SQL. Voir `docs/completion_v0.3.md` et `audits/quality_audit_v0.3.md`.
