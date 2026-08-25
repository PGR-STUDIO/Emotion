const KEY = 'pgr-simple-final';
const DRAFT_KEY = 'pgr-simple-final-draft';
const SECURE_KEY = 'pgr-simple-final-secure';
const SECURE_DRAFT_KEY = 'pgr-simple-final-draft-secure';
const BROWSER_TEST_MODE = new URLSearchParams(location.search).get('browser-test') === '1';
const $ = selector => document.querySelector(selector);
if (location.protocol !== 'file:' && 'serviceWorker' in navigator) navigator.serviceWorker.register('service-worker.js').catch(error => console.warn('Mode hors ligne indisponible.', error));
if (!document.querySelector('link[rel="manifest"]')) { const manifest = document.createElement('link'); manifest.rel = 'manifest'; manifest.href = 'manifest.json'; document.head.appendChild(manifest); }

const emotions = [
  ['calm', 'Calme', 'icon-calm.png'],
  ['anger', 'Agacé', 'icon-irritated.png'],
  ['sad', 'Triste', 'icon-sad.png'],
  ['stress', 'Stressé', 'icon-stressed.png'],
  ['rage', 'En colère', 'icon-angry.png'],
  ['urge', 'Envie à gérer', 'icon-urge.svg']
];
const labels = Object.fromEntries(emotions.map(([id, label]) => [id, label]));
labels.unknown = 'Je ne sais pas encore';

const urgeTypes = [
  ['alcohol', 'Alcool'],
  ['drugs', 'Drogue / substance'],
  ['nicotine', 'Cigarette / nicotine'],
  ['snacking', 'Grignotage / nourriture'],
  ['other', 'Autre habitude'],
  ['unspecified', 'Je ne veux pas préciser']
];
const urgeTypeLabels = Object.fromEntries(urgeTypes);
function urgeTypeLabel(type) { return urgeTypeLabels[type] || ''; }
function observationLabel(entry) {
  const base = labels[entry.emotion] || entry.emotion || 'État non précisé';
  return entry.emotion === 'urge' && entry.urgeType ? `${base} — ${urgeTypeLabel(entry.urgeType)}` : base;
}

const exercises = {
  calm: { name: 'Repérer ce qui t’aide', duration: 60, kind: 'timer', text: 'Pendant une minute, remarque ce qui soutient ton calme : une personne, un lieu, une action ou une sensation.' },
  anger: { name: 'Créer un délai', duration: 60, kind: 'timer', text: 'Éloigne-toi si possible. Pose les pieds au sol et attends une minute avant de répondre ou d’agir.' },
  sad: { name: 'Nommer le besoin', duration: 45, kind: 'timer', text: 'Complète doucement : « Là, j’aurais peut-être besoin de… » Il n’y a pas besoin de trouver une solution.' },
  stress: { name: 'Revenir à l’extérieur', duration: 60, kind: 'breath', text: 'Regarde autour de toi et nomme trois choses que tu vois. Laisse ta respiration rester naturelle.' },
  rage: { name: 'Prendre de la distance', duration: 60, kind: 'timer', text: 'Mets de l’espace entre toi et la situation si possible. Ne règle pas le problème pendant le pic de colère.' },
  urge: { name: 'Créer un délai en sécurité', duration: 60, kind: 'timer', text: 'Observe l’envie sans te juger. Mets un peu de distance avec le produit ou la situation si c’est possible, puis choisis une personne ou une aide à contacter.' }
};
const urgeExercises = {
  alcohol: { name: 'Créer un délai avec l’alcool', duration: 60, kind: 'timer', text: 'Observe l’envie et éloigne-toi du contexte si possible. Si tu bois régulièrement ou en grande quantité, ne cherche pas à arrêter brutalement sans avis médical : demande un accompagnement.' },
  drugs: { name: 'T’éloigner du déclencheur', duration: 60, kind: 'timer', text: 'Mets de la distance avec le produit, le lieu ou la personne qui déclenche l’envie si possible. Contacte une personne de confiance ou un professionnel ; en cas de danger immédiat, appelle les secours.' },
  nicotine: { name: 'Laisser passer l’impulsion', duration: 60, kind: 'timer', text: 'Décale l’action de quelques instants, change de pièce, bois de l’eau ou occupe tes mains, puis réévalue l’envie sans te juger.' },
  snacking: { name: 'Vérifier le besoin', duration: 60, kind: 'timer', text: 'Observe ce qui est présent : faim, fatigue, émotion, habitude ou disponibilité. Tu peux manger consciemment ou faire une pause ; aucune punition ni compensation.' },
  other: { name: 'Créer un délai', duration: 60, kind: 'timer', text: 'Observe ce qui déclenche l’envie, mets de la distance si possible et choisis une petite action qui protège ta sécurité ou ton objectif.' },
  unspecified: { name: 'Créer un délai en sécurité', duration: 60, kind: 'timer', text: 'Observe l’envie sans te juger. Mets un peu de distance avec la situation si c’est possible et contacte une personne de confiance si tu en as besoin.' }
};
const nuanceExercises = {
  'Sérénité': { name: 'Ancrer le calme', duration: 45, kind: 'timer', text: 'Repère trois sensations agréables ou neutres et reste quelques secondes avec chacune.' },
  'Joie': { name: 'Savourer un instant', duration: 45, kind: 'timer', text: 'Rappelle-toi ce qui nourrit cette joie et observe comment elle se manifeste dans ton corps.' },
  'Extase': { name: 'Ralentir même quand c’est fort', duration: 60, kind: 'breath', text: 'Laisse l’émotion être présente sans agir tout de suite. Respire doucement et garde les pieds au sol.' },
  'Acceptation': { name: 'Cesser de lutter un instant', duration: 60, kind: 'timer', text: 'Dis-toi : « C’est ce qui est là maintenant. » Observe sans chercher à le faire disparaître.' },
  'Confiance': { name: 'Retrouver un appui', duration: 45, kind: 'timer', text: 'Nomme une personne, une compétence ou une expérience sur laquelle tu peux t’appuyer.' },
  'Admiration': { name: 'Identifier ce qui inspire', duration: 45, kind: 'timer', text: 'Note ce que tu apprécies précisément et une petite chose que tu pourrais en apprendre.' },
  'Appréhension': { name: 'Distinguer risque et pensée', duration: 60, kind: 'breath', text: 'Respire naturellement puis sépare ce que tu sais, ce que tu imagines et ce que tu peux vérifier.' },
  'Peur': { name: 'Revenir au présent', duration: 60, kind: 'breath', text: 'Regarde cinq éléments autour de toi et rappelle-toi : « Maintenant, je suis ici. »' },
  'Terreur': { name: 'Chercher la sécurité', duration: 60, kind: 'timer', text: 'Éloigne-toi du danger si nécessaire et contacte une personne de confiance ou les secours si tu n’es pas en sécurité.' },
  'Distraction': { name: 'Une chose à la fois', duration: 45, kind: 'timer', text: 'Choisis une seule chose visible et décris-la lentement avec tes cinq sens.' },
  'Surprise': { name: 'Faire une pause', duration: 30, kind: 'breath', text: 'Ne réponds pas tout de suite. Respire une fois et nomme simplement ce qui vient de se passer.' },
  'Stupéfaction': { name: 'Reprendre ses repères', duration: 60, kind: 'timer', text: 'Pose les pieds au sol, regarde autour de toi et demande-toi quelle est la prochaine petite étape.' },
  'Mélancolie': { name: 'Accueillir la baisse', duration: 45, kind: 'timer', text: 'Mets des mots simples sur ce qui pèse et choisis un geste doux pour prendre soin de toi.' },
  'Tristesse': { name: 'Nommer le besoin', duration: 45, kind: 'timer', text: 'Complète doucement : « Là, j’aurais peut-être besoin de… » sans chercher à résoudre immédiatement.' },
  'Chagrin': { name: 'Ne pas rester seul', duration: 60, kind: 'timer', text: 'Pense à une personne à prévenir et écris une phrase simple pour demander une présence ou une écoute.' },
  'Ennui': { name: 'Réactiver doucement', duration: 60, kind: 'timer', text: 'Choisis une action courte, faisable en cinq minutes, qui donne un peu de mouvement à ton moment.' },
  'Dégoût': { name: 'Créer une distance', duration: 45, kind: 'timer', text: 'Éloigne-toi de ce qui te dérange si possible, puis décris précisément ce qui a déclenché la réaction.' },
  'Aversion': { name: 'Clarifier sa limite', duration: 60, kind: 'timer', text: 'Complète : « Je ne veux pas… » puis « Ce dont j’ai besoin pour me sentir respecté est… »' },
  'Contrariété': { name: 'Repérer le grain de sable', duration: 45, kind: 'timer', text: 'Nomme le détail précis qui t’a contrarié avant de décider s’il mérite une action.' },
  'Colère': { name: 'Créer un délai', duration: 60, kind: 'timer', text: 'Pose les pieds au sol, éloigne-toi si possible et attends avant de répondre ou d’agir.' },
  'Rage': { name: 'Prendre de la distance', duration: 60, kind: 'timer', text: 'Mets de l’espace entre toi et la situation. Ne règle pas le problème pendant le pic de colère.' },
  'Intérêt': { name: 'Suivre la curiosité', duration: 45, kind: 'timer', text: 'Note une question que cette situation fait naître et une façon calme d’y répondre.' },
  'Anticipation': { name: 'Préparer la prochaine étape', duration: 60, kind: 'timer', text: 'Écris ce que tu peux réellement préparer maintenant, puis ce qui devra attendre.' },
  'Vigilance': { name: 'Observer sans se tendre', duration: 60, kind: 'breath', text: 'Balaye doucement ton environnement et distingue les signes utiles des alertes imaginées.' }
};
const scientific = { emotions: [], guidance: [], exercises: [], studies: [], rules: null, safety: null, evidence: null, sources: null, emotionExerciseMap: [], ready: false };
// Les cartes rapides gardent leur nom propre à l'accueil, tout en pointant
// vers une référence scientifique distincte pour le contenu et l'exercice.
const quickStateScientificNames = {
  calm: 'Sérénité',
  anger: 'Contrariété',
  sad: 'Tristesse',
  stress: 'Surcharge',
  rage: 'Colère'
};
const scientificAliasNames = { 'En colère': 'Colère' };
const scientificEmotionNames = { ...quickStateScientificNames, urge: 'Envie à gérer', unknown: '' };
const quickStateGuidance = {
  calm: { name: 'Calme', definition: 'État de repos et de stabilité, utilisé ici comme repère d’apaisement.', triggers: ['sécurité', 'repos', 'situation stable'], body: ['respiration régulière', 'corps relâché', 'sensation de stabilité'], response: 'Ce calme peut servir de point de repère avant ou après une émotion intense.' },
  anger: { name: 'Agacé', definition: 'Irritation liée à un petit obstacle, une contrariété ou une limite légèrement mise à l’épreuve.', triggers: ['petit obstacle', 'contrariété', 'impatience'], body: ['tension légère', 'chaleur', 'impatience'], response: 'Un signal qu’une limite ou un ajustement peut être nécessaire.' },
  sad: { name: 'Triste', definition: 'État de baisse ou de peine qui peut apparaître après une perte, une séparation ou une déception.', triggers: ['perte', 'séparation', 'déception'], body: ['gorge serrée', 'lourdeur', 'fatigue'], response: 'Un besoin possible de soutien, de lien ou de récupération.' },
  stress: { name: 'Stressé', definition: 'Réponse d’adaptation face à une demande perçue comme supérieure aux ressources disponibles.', triggers: ['trop de demandes', 'pression prolongée', 'manque de repos'], body: ['pensées rapides', 'tension', 'respiration courte'], response: 'Un signal pour ralentir, prioriser et retrouver une marge de choix.' },
  rage: { name: 'En colère', definition: 'Énergie de colère forte, souvent liée à une limite dépassée, une injustice ou une frustration importante.', triggers: ['injustice', 'limite dépassée', 'frustration'], body: ['forte chaleur', 'tension dans le corps', 'envie d’agir'], response: 'Un signal de limite ou de besoin de protection ; agir après la pause.', safety: 'Si tu crains de blesser quelqu’un ou de perdre le contrôle, éloigne-toi et contacte immédiatement une personne de confiance ou les secours.' }
};
const emotionSentenceForms = {
  'Sérénité': 'la sérénité', 'Joie': 'la joie', 'Extase': 'l’extase', 'Acceptation': 'l’acceptation', 'Confiance': 'la confiance', 'Admiration': 'l’admiration', 'Appréhension': 'l’appréhension', 'Peur': 'la peur', 'Terreur': 'la terreur', 'Distraction': 'la distraction', 'Surprise': 'la surprise', 'Stupéfaction': 'la stupéfaction', 'Mélancolie': 'la mélancolie', 'Tristesse': 'la tristesse', 'Chagrin': 'le chagrin', 'Ennui': 'l’ennui', 'Dégoût': 'le dégoût', 'Aversion': 'l’aversion', 'Contrariété': 'la contrariété', 'Colère': 'la colère', 'Rage': 'la rage', 'Intérêt': 'l’intérêt', 'Anticipation': 'l’anticipation', 'Vigilance': 'la vigilance', 'Anxiété': 'l’anxiété', 'Honte': 'la honte', 'Culpabilité': 'la culpabilité', 'Solitude': 'la solitude', 'Frustration': 'la frustration', 'Stress': 'le stress', 'Envie à gérer': 'une envie à gérer'
};
function emotionSentenceForm(name) { return emotionSentenceForms[name] || `l’émotion « ${String(name).toLowerCase()} »`; }
const scientificExerciseIds = {
  grounding: 'EX-GROUNDING-321', breathing: 'EX-MINDFUL-BREATHING', journal: 'EX-EMOTION-JOURNAL', needs: 'EX-NEEDS-IDENTIFICATION', compassion: 'EX-COMPASSION', defusion: 'EX-ACT-DEFUSION', gratitude: 'EX-GRATITUDE'
};
function parseDuration(value) {
  const raw = String(value || '').toLowerCase();
  const unit = raw.includes('minute') ? 'minute' : 'seconde';
  const factor = unit === 'minute' ? 60 : 1;
  const range = raw.match(/(\d+)\s*[-–]\s*(\d+)/);
  const single = raw.match(/(\d+)/);
  const min = Number(range?.[1] || single?.[1] || 1) * factor;
  const max = Number(range?.[2] || single?.[1] || 1) * factor;
  const labelUnit = unit === 'minute' ? 'minute' : 'seconde';
  const label = range ? `${range[1]} à ${range[2]} ${labelUnit}${Number(range[2]) > 1 ? 's' : ''}` : `${single?.[1] || 1} ${labelUnit}${Number(single?.[1] || 1) > 1 ? 's' : ''}`;
  return { seconds: Math.max(30, min), maxSeconds: Math.max(30, max), label };
}
function loadJson(path) { return fetch(path).then(response => { if (!response.ok) throw new Error(`${response.status} ${path}`); return response.json(); }); }
async function loadScientificBase() {
  try {
    const [emotionsData, guidanceData, exercisesData, rulesData, studiesData, safetyData, evidenceData, sourcesData, emotionExerciseMapData] = await Promise.all([
      loadJson('scientific_knowledge_base/data/emotions.json'),
      loadJson('scientific_knowledge_base/data/emotion_guidance.json'),
      loadJson('scientific_knowledge_base/data/exercises.json'),
      loadJson('scientific_knowledge_base/data/recommendation_rules.json'),
      loadJson('scientific_knowledge_base/data/studies.json'),
      loadJson('scientific_knowledge_base/data/safety_protocol.json'),
      loadJson('scientific_knowledge_base/data/evidence_grading.json'),
      loadJson('scientific_knowledge_base/source_config.json'),
      loadJson('scientific_knowledge_base/data/emotion_exercise_map.json')
    ]);
    scientific.emotions = emotionsData; scientific.guidance = guidanceData.emotions || []; scientific.exercises = exercisesData; scientific.rules = rulesData; scientific.studies = studiesData; scientific.safety = safetyData; scientific.evidence = evidenceData; scientific.sources = sourcesData; scientific.emotionExerciseMap = emotionExerciseMapData.mappings || []; scientific.ready = true;
  } catch (error) { console.warn('Base scientifique locale indisponible, mode de secours utilisé.', error); }
}
function normalizeText(value = '') { return String(value).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase(); }
function safetyInput() { const fields = ['situation', 'thoughts', 'need', 'reaction', 'consequence'].map(id => document.getElementById(id)?.value || ''); return normalizeText(fields.join(' ')); }
function detectSafety() {
  if (!scientific.ready || !scientific.safety) return { critical: false, matches: [] };
  const text = safetyInput();
  const matches = scientific.safety.red_flags.filter(flag => (flag.patterns || []).some(pattern => text.includes(normalizeText(pattern))));
  return { critical: matches.length > 0, matches };
}
function currentEmotionName() { return scientificEmotionNames[draft.emotion] || draft.nuance || ''; }
function ruleMatches(rule, risk) {
  const condition = rule.when || {};
  if (condition.requires_safe && risk.critical) return true;
  if (condition.requires_safe && !risk.critical) return false;
  if (condition.min_intensity != null && draft.intensity < condition.min_intensity) return false;
  if (condition.max_intensity != null && draft.intensity > condition.max_intensity) return false;
  if (condition.emotions?.length && !condition.emotions.some(item => normalizeText(item) === normalizeText(currentEmotionName()))) return false;
  return true;
}
function evaluateRecommendation() {
  const risk = detectSafety();
  if (risk.critical) return { risk, rule: { id: 'SAFETY-FIRST', action: 'safety_first', recommend: [] }, exercises: [] };
  const rules = (scientific.rules?.machine_rules || []).slice().sort((a, b) => (b.priority || 0) - (a.priority || 0));
  const rule = rules.find(candidate => ruleMatches(candidate, risk));
  return { risk, rule: rule || { id: 'FALLBACK-JOURNAL', recommend: ['EX-EMOTION-JOURNAL'] }, exercises: rule?.recommend || ['EX-EMOTION-JOURNAL'] };
}
function evidenceLabel(grade) { return scientific.evidence?.grades?.[grade] ? `Grade ${grade} · ${scientific.evidence.grades[grade]}` : `Grade ${grade || '—'}`; }
function renderSafetyTriage() {
  const result = evaluateRecommendation();
  const panels = [$('#safetyTriage'), $('#safetyTriageUnderstand')].filter(Boolean);
  panels.forEach(panel => {
    if (!result.risk.critical) { panel.classList.remove('show'); panel.innerHTML = ''; return; }
    const actions = result.risk.matches.map(match => match.action).filter(Boolean);
    panel.innerHTML = `<div class="triage-icon">!</div><div><b>Priorité à ta sécurité</b><p>Ce que tu as écrit peut signaler une situation urgente. L’application ne peut pas l’évaluer ni te protéger seule.</p><p>${escapeHtml([...new Set(actions)].join(' '))}</p><strong>Éloigne-toi du danger si possible et contacte immédiatement les secours locaux, un professionnel ou une personne de confiance.</strong></div>`;
    panel.classList.add('show');
  });
  const continueButton = $('#toAfter');
  if (continueButton) { continueButton.disabled = result.risk.critical; continueButton.firstChild.textContent = result.risk.critical ? 'Priorité à la sécurité ' : 'Voir l’exercice '; }
  const questionNext = $('#questionNext');
  if (questionNext) questionNext.disabled = result.risk.critical;
  const saveButton = $('#saveButton');
  if (saveButton) saveButton.disabled = result.risk.critical;
}
function scientificNameFor(value) { const name = scientificEmotionNames[draft.emotion] || value || ''; return scientificAliasNames[name] || name; }
function scientificEmotion() { const name = scientificNameFor(draft.nuance); return scientific.emotions.find(item => item.name.toLowerCase() === String(name).toLowerCase()) || scientific.emotions.find(item => item.plutchik_family === name); }
function emotionGuidance() { const name = scientificNameFor(draft.nuance); return scientific.guidance.find(item => normalizeText(item.name) === normalizeText(name)) || null; }
function selectedQuickStateGuidance() { return draft.emotion ? quickStateGuidance[draft.emotion] || null : null; }
function renderEmotionContext() {
  const understand = $('#understandContext');
  const after = $('#afterContext');
  const emotion = scientificEmotion();
  const guidance = emotionGuidance();
  if (draft.emotion === 'urge') {
    const type = urgeTypeLabel(draft.urgeType);
    if (understand) {
      understand.innerHTML = `<div class="emotion-summary-heading"><div class="emotion-summary-identity"><span class="emotion-summary-swatch" style="background:#b36f91" aria-hidden="true"></span><div><span class="emotion-summary-kicker">SITUATION À OBSERVER</span><b>Une envie ou une impulsion</b></div></div><div class="emotion-summary-intensity"><small>Intensité actuelle</small><strong>${draft.intensity}/10</strong></div></div><p class="emotion-summary-definition">Ce n’est pas une émotion ni un diagnostic. Une envie peut être déclenchée par une habitude, un moment, un lieu, une personne, le stress ou une autre émotion.</p><div class="urge-type-block"><b>De quelle situation veux-tu parler ?</b><div class="urge-type-grid">${urgeTypes.map(([id, label]) => `<button type="button" class="urge-type-choice ${draft.urgeType === id ? 'selected' : ''}" data-urge-type="${id}" aria-pressed="${draft.urgeType === id}">${escapeHtml(label)}</button>`).join('')}</div></div>${type ? `<p class="urge-selected"><b>Situation choisie :</b> ${escapeHtml(type)}</p>` : ''}<small class="emotion-summary-note">Tu peux choisir « Je ne veux pas préciser ». L’objectif est de comprendre ce qui se passe, pas de te juger.</small>`;
      understand.classList.add('show');
    }
    if (after) {
      after.innerHTML = `<b>Pour en parler en séance sur cette envie</b><p>Ces questions aident à relier le déclencheur, l’impulsion, le contexte, le corps et le choix possible.</p><small>Tu peux laisser une réponse vide. Il n’y a pas de bonne ou de mauvaise réponse.</small>`;
      after.classList.add('show');
    }
    const urgePlaceholders = {
      situation: 'Où, quand et avec qui l’envie est-elle apparue ?',
      thoughts: 'Qu’est-ce que tu t’es dit juste avant ?',
      need: 'Quel besoin pourrait se trouver derrière : pause, soulagement, sécurité, aide… ?',
      reaction: 'Qu’as-tu fait ou eu envie de faire ?',
      consequence: 'Qu’est-ce qui s’est passé ensuite ?',
      question: 'Qu’aimerais-tu comprendre ou préparer avec un professionnel ?'
    };
    Object.entries(urgePlaceholders).forEach(([id, placeholder]) => { const field = $('#' + id); if (field) field.placeholder = placeholder; });
    return;
  }
  if ((!emotion && !guidance) || (!draft.emotion && !draft.nuance)) {
    if (understand) { understand.classList.remove('show'); understand.innerHTML = ''; }
    if (after) { after.classList.remove('show'); after.innerHTML = ''; }
    return;
  }
  const quickGuidance = selectedQuickStateGuidance();
  const name = quickGuidance?.name || guidance?.name || emotion.name;
  const phrase = emotionSentenceForm(name);
  const triggers = (quickGuidance?.triggers || guidance?.triggers || emotion?.common_triggers || []).slice(0, 3);
  const body = (quickGuidance?.body || guidance?.body || emotion?.body_sensations || []).slice(0, 6);
  const thoughts = (emotion?.associated_thoughts || []).slice(0, 2);
  const needs = (emotion?.psychological_needs || []).slice(0, 3);
  const behaviors = (guidance?.impulse || emotion?.possible_behaviors || []).slice(0, 2);
  if (understand) {
    const mark = `<span class="emotion-summary-swatch" style="background:${emotionColor(name)}" aria-hidden="true"></span>`;
    const definition = quickGuidance?.definition || guidance?.definition || emotion?.definition;
    const safetyNote = quickGuidance?.safety || (/terreur|panique|rage|colère/.test(normalizeText(name)) ? 'Si tu n’es pas en sécurité, éloigne-toi du danger et contacte une personne fiable ou les secours.' : '');
    understand.innerHTML = `<div class="emotion-summary-heading"><div class="emotion-summary-identity">${mark}<div><span class="emotion-summary-kicker">VOUS AVEZ SÉLECTIONNÉ</span><b>${escapeHtml(name)}</b></div></div><div class="emotion-summary-intensity"><small>Intensité actuelle</small><strong>${draft.intensity}/10</strong></div></div>${definition ? `<p class="emotion-summary-definition">${escapeHtml(definition)}</p>` : ''}${triggers.length ? `<div class="emotion-related"><b>Cette émotion peut être liée à :</b><div>${triggers.map(item => `<span>${escapeHtml(item)}</span>`).join('')}</div></div>` : ''}${safetyNote ? `<p class="emotion-summary-note"><b>Sécurité :</b> ${escapeHtml(safetyNote)}</p>` : ''}<small class="emotion-summary-note">Ce sont des pistes : garde seulement ce qui correspond à ton vécu.</small>`;
    understand.classList.add('show');
  }
  if (after) {
    after.innerHTML = `<b>Pour en parler en séance sur ${escapeHtml(phrase)}</b><p>Ces questions aident à relier la situation, l’émotion, le corps et le besoin.</p><small>Tu peux laisser une réponse vide. Il n’y a pas de bonne ou de mauvaise réponse.</small>`;
    after.classList.add('show');
  }
  const placeholders = {
    situation: `Qu’est-ce qui a déclenché ${phrase} ?`,
    thoughts: `Quelles pensées ou images sont venues avec ${phrase} ?`,
    need: `De quoi aurais-tu besoin maintenant : ${needs.slice(0, 2).join(' ou ') || 'sécurité, écoute, repos'} ?`,
    reaction: `Quelle impulsion peut accompagner ${phrase} ?`,
    consequence: 'Après ta réaction, qu’est-ce qui a changé ?',
    question: `Qu’aimerais-tu comprendre sur ${phrase} ?`
  };
  Object.entries(placeholders).forEach(([id, placeholder]) => { const field = $('#' + id); if (field) field.placeholder = placeholder; });
}
function renderEmotionInsight() {
  const panel = $('#emotionInsight');
  if (!panel) return;
  const emotion = scientificEmotion();
  const guidance = emotionGuidance();
  const urge = draft.emotion === 'urge';
  if ((!emotion && !guidance && !urge) || (!draft.emotion && !draft.nuance)) { panel.classList.remove('show'); panel.innerHTML = ''; renderEmotionContext(); return; }
  const needs = urge ? ['sécurité', 'soutien', 'un délai avant d’agir'] : (emotion?.psychological_needs || []).slice(0, 4);
  const quickGuidance = selectedQuickStateGuidance();
  const name = quickGuidance?.name || guidance?.name || emotion?.name || currentEmotionName();
  const definition = urge ? 'Une envie forte peut pousser à consommer ou à manger alors qu’une autre partie de toi voudrait attendre. Elle peut être liée à une habitude, un déclencheur ou un besoin de soulagement ; elle ne confirme pas une addiction et ne commande pas forcément l’action.' : quickGuidance?.definition || guidance?.definition || emotion?.definition || 'Un état à observer avec curiosité, sans chercher à lui donner une seule interprétation.';
  const insightTitle = urge ? name : `${name} peut être un signal`;
  panel.innerHTML = `<div class="insight-heading"><span class="insight-kicker">${urge ? 'ENVIE / IMPULSION' : 'SITUATION À OBSERVER'}</span><span class="insight-intensity">${draft.intensity}/10</span></div><h3>${escapeHtml(insightTitle)}</h3><p>${escapeHtml(definition)}</p>${urge ? '<p class="urge-safety-note"><b>Sécurité :</b> si tu consommes régulièrement ou en grande quantité, ne tente pas un arrêt brutal de l’alcool ou d’un médicament sans avis médical. En cas de danger immédiat, appelle les secours.</p>' : ''}${needs.length ? `<div class="insight-needs"><b>Besoin possible</b><div>${needs.map(need => `<span>${escapeHtml(need)}</span>`).join('')}</div></div>` : ''}<small>${urge ? 'Choisis seulement ce qui correspond à ton vécu. Cette rubrique ne pose aucun diagnostic.' : 'Ce sont des pistes, pas une conclusion : ton vécu peut être différent.'}</small>`;
  panel.classList.add('show');
  renderEmotionContext();
}
function intensityBand() { return draft.intensity >= 8 ? 'high' : draft.intensity <= 3 ? 'low' : 'medium'; }
function selectedEmotionExercisePlan() {
  const name = scientificNameFor(draft.nuance);
  return scientific.emotionExerciseMap.find(item => normalizeText(item.emotion) === normalizeText(name)) || null;
}
function pickScientificExerciseId() {
  const plan = selectedEmotionExercisePlan();
  if (draft.exerciseRound === 2 && plan?.second_exercise_id) return plan.second_exercise_id;
  if (plan) return intensityBand() === 'high' ? (plan.high_intensity_exercise_id || plan.exercise_id) : plan.exercise_id;
  return evaluateRecommendation().exercises[0] || null;
}
function scientificExercise() {
  if (!scientific.ready || (!draft.emotion && !draft.nuance)) return null;
  if (detectSafety().critical) return null;
  const source = scientific.exercises.find(item => item.id === pickScientificExerciseId());
  if (!source) return null;
  const studies = (source.associated_studies || []).map(id => scientific.studies.find(study => study.id === id)).filter(Boolean);
  const duration = parseDuration(source.duration);
  const band = intensityBand();
  const durationSeconds = band === 'high' ? Math.min(duration.maxSeconds, Math.max(duration.seconds, 90)) : band === 'medium' ? Math.round((duration.seconds + duration.maxSeconds) / 2) : duration.seconds;
  const plan = selectedEmotionExercisePlan();
  const intensityNote = band === 'high' ? 'Intensité forte : commence par stabiliser et ne force pas.' : band === 'low' ? 'Intensité basse : avance doucement et observe ce qui t’aide.' : 'Intensité moyenne : essaie cette étape puis réévalue.';
  const animationById = {
    'EX-MINDFUL-BREATHING': 'breath', 'EX-MINDFULNESS-SHORT': 'mindful', 'EX-GROUNDING-321': 'grounding',
    'EX-PMR': 'relax', 'EX-RELAXATION-MUSCULAIRE-COURTE': 'relax', 'EX-PROBLEM-SOLVING': 'steps',
    'EX-BEHAVIORAL-ACTIVATION': 'activate', 'EX-COMPASSION': 'compassion', 'EX-SELF-COMPASSION': 'compassion',
    'EX-DELAY-URGE': 'delay', 'EX-EMOTION-JOURNAL': 'journal', 'EX-NEEDS-IDENTIFICATION': 'needs'
  };
  return { name: source.name, duration: durationSeconds, durationLabel: `${durationSeconds} secondes`, kind: source.name.toLowerCase().includes('respiration') ? 'breath' : 'timer', animation: animationById[source.id] || 'timer', text: (source.protocol_steps || []).slice(0, 2).join(' '), objective: source.objective || '', mechanism: source.mechanism || '', steps: source.protocol_steps || [], evidenceGrade: source.evidence_grade || 'Non classé', contraindications: source.contraindications || '', studies, sourceId: source.id, emotionPlanReason: plan?.reason || '', intensityNote };
}
function familyExerciseFallback() {
  const blend = wheelBlends.find(item => item.name === draft.nuance);
  if (blend) return { name: `Observer ${draft.nuance}`, duration: 60, kind: 'timer', text: `Observe le mélange décrit par ${blend.pair}.`, objective: 'Distinguer les deux composantes de ce ressenti pour retrouver une marge de choix.', steps: ['Nomme les deux émotions qui se mélangent.', 'Repère ce qui est le plus présent maintenant.', 'Choisis une petite action adaptée à ce besoin.'], contraindications: 'Arrête si le malaise augmente et cherche un soutien humain si tu ne te sens pas en sécurité.' };
  const family = wheelFamilies.find(item => item.emotions.includes(draft.nuance));
  if (!family) return null;
  const protocols = {
    pleasant: ['Repère ce qui est agréable ou soutenant maintenant.', 'Observe où cela se manifeste dans ton corps.', 'Note une petite façon de préserver cette ressource.'],
    sadness: ['Nomme doucement ce qui pèse.', 'Repère le besoin présent sans chercher à tout résoudre.', 'Choisis un geste de soutien faisable aujourd’hui.'],
    fear: ['Pose les pieds au sol et regarde autour de toi.', 'Distingue ce qui est certain de ce que tu imagines.', 'Identifie la prochaine action qui augmente ta sécurité.'],
    anger: ['Mets de la distance si possible.', 'Laisse retomber l’impulsion avant de répondre.', 'Formule la limite ou le besoin qui mérite ton attention.'],
    blocked: ['Reviens à un repère sensoriel concret.', 'Nomme simplement ce qui se passe, sans te juger.', 'Choisis une seule prochaine étape très petite.'],
    relational: ['Observe ce que cette situation touche dans le lien.', 'Nomme le besoin de respect, de sécurité ou de soutien.', 'Choisis une personne fiable ou une limite aidante.']
  };
  return { name: `Observer ${draft.nuance}`, duration: 60, kind: 'timer', text: protocols[family.id][0], objective: 'Mettre des mots et retrouver une marge de choix.', steps: protocols[family.id], contraindications: 'Arrête si le malaise augmente et cherche un soutien humain si tu ne te sens pas en sécurité.' };
}
function currentExercise() { if (!draft.emotion && !draft.nuance) return null; if (scientific.ready && detectSafety().critical) return null; if (draft.emotion === 'urge') return urgeExercises[draft.urgeType] || exercises.urge; return scientificExercise() || nuanceExercises[draft.nuance] || exercises[draft.emotion] || familyExerciseFallback(); }
function exerciseEmotionTheme() {
  const key = normalizeText(draft.nuance || labels[draft.emotion] || draft.emotion);
  if (/colere|agace|rage|frustration|contrariete|injustice/.test(key)) return { dark: '#d96f62', light: '#f6c3bb' };
  if (/triste|melancolie|chagrin|decouragement|desespoir/.test(key)) return { dark: '#6f91c9', light: '#cbdcf5' };
  if (/stress|anxiete|peur|panique|apprehension|vigilance/.test(key)) return { dark: '#956ac3', light: '#decaf1' };
  if (/calme|serenite|joie|soulagement|confiance|espoir|gratitude/.test(key)) return { dark: '#70a984', light: '#c8e3cc' };
  if (/envie|controler|consom/.test(key)) return { dark: '#b36f91', light: '#f1d4df' };
  return { dark: '#6d99a2', light: '#c5e0e2' };
}

const bodySignOptions = ['Mâchoire ou muscles tendus', 'Respiration courte', 'Pensées rapides', 'Chaleur ou agitation', 'Envie de fuir ou d’agir', 'Poids ou fatigue'];
const bodySignsByEmotion = {
  calm: ['Respiration régulière', 'Corps relâché', 'Sensation de stabilité', 'Chaleur agréable', 'Envie de rester comme ça'],
  anger: ['Mâchoire serrée', 'Poings ou muscles tendus', 'Chaleur', 'Cœur qui accélère', 'Envie de répondre'],
  sad: ['Gorge serrée', 'Lourdeur ou fatigue', 'Larmes', 'Poitrine serrée', 'Envie de rester seul'],
  stress: ['Respiration courte', 'Ventre noué', 'Pensées rapides', 'Agitation', 'Difficulté à rester immobile'],
  rage: ['Très forte chaleur', 'Tension dans tout le corps', 'Tremblements', 'Respiration forte', 'Envie d’exploser'],
  unknown: bodySignOptions,
  urge: ['Envie forte ou insistante', 'Pensées qui reviennent', 'Tension ou agitation', 'Difficulté à attendre', 'Besoin de soulagement']
};
const wheelItems = ['Joie', 'Confiance', 'Peur', 'Surprise', 'Tristesse', 'Dégoût', 'En colère', 'Anticipation'];
const wheelBlends = [
  { name: 'Amour', angle: 22.5, pair: 'Joie + confiance' },
  { name: 'Optimisme', angle: 337.5, pair: 'Joie + anticipation' },
  { name: 'Soumission', angle: 67.5, pair: 'Confiance + peur' },
  { name: 'Effroi', angle: 112.5, pair: 'Peur + surprise' },
  { name: 'Déception', angle: 157.5, pair: 'Surprise + tristesse' },
  { name: 'Remords', angle: 202.5, pair: 'Tristesse + colère' },
  { name: 'Agressivité', angle: 292.5, pair: 'Colère + anticipation' },
  { name: 'Ambition', angle: 0, pair: 'Anticipation + confiance' }
];
const extraEmotionOptions = ['Anxiété', 'Honte', 'Culpabilité', 'Solitude', 'Frustration', 'Amour / affection', 'Espoir', 'Soulagement', 'Gratitude', 'Fierté', 'Curiosité', 'Panique', 'Impuissance', 'Confusion', 'Surcharge', 'Découragement', 'Rejet'];
const wheelFamilies = [
  { id: 'pleasant', label: 'Agréables', color: '#dff2d5', emotions: ['Sérénité', 'Joie', 'Plaisir', 'Soulagement', 'Confiance', 'Espoir', 'Gratitude', 'Affection', 'Fierté', 'Curiosité', 'Enthousiasme', 'Émerveillement'] },
  { id: 'sadness', label: 'Tristesse et perte', color: '#e2e8fc', emotions: ['Mélancolie', 'Tristesse', 'Chagrin', 'Nostalgie', 'Déception', 'Regret', 'Découragement', 'Désespoir'] },
  { id: 'fear', label: 'Peur et alerte', color: '#e0f6f7', emotions: ['Appréhension', 'Peur', 'Terreur', 'Anxiété', 'Panique', 'Vigilance', 'Insécurité', 'Méfiance'] },
  { id: 'anger', label: 'Colère et rejet', color: '#ffe1dd', emotions: ['Contrariété', 'Agacement', 'Colère', 'Rage', 'Frustration', 'Dégoût', 'Aversion', 'Jalousie', 'Envie', 'Injustice'] },
  { id: 'blocked', label: 'Blocage et débordement', color: '#f1e4ff', emotions: ['Sidération', 'Stupéfaction', 'Confusion', 'Impuissance', 'Surcharge', 'Épuisement', 'Vide intérieur', 'Inhibition', 'Détachement'] },
  { id: 'relational', label: 'Relationnel', color: '#fff1c9', emotions: ['Solitude', 'Honte', 'Culpabilité', 'Rejet', 'Abandon', 'Embarras', 'Humiliation', 'Exclusion', 'Attachement', 'Besoin de reconnaissance'] }
];
let selectedWheelFamily = 'pleasant';
const wheelData = [
  { levels: ['Sérénité', 'Joie', 'Extase'], colors: ['#fff5cd', '#ffdf75', '#f6bf35'] },
  { levels: ['Acceptation', 'Confiance', 'Admiration'], colors: ['#e4f5da', '#9cd792', '#50a55e'] },
  { levels: ['Appréhension', 'Peur', 'Terreur'], colors: ['#e0f6f7', '#7ed1db', '#329aa9'] },
  { levels: ['Distraction', 'Surprise', 'Stupéfaction'], colors: ['#f1e4ff', '#c69aef', '#8d61c9'] },
  { levels: ['Mélancolie', 'Tristesse', 'Chagrin'], colors: ['#e2e8fc', '#9db2e6', '#627fc3'] },
  { levels: ['Ennui', 'Dégoût', 'Aversion'], colors: ['#edf0cc', '#b9c36d', '#79862e'] },
  { levels: ['Contrariété', 'En colère', 'Rage'], colors: ['#ffe1dd', '#f39b93', '#d9534f'] },
  { levels: ['Intérêt', 'Anticipation', 'Vigilance'], colors: ['#fff0cf', '#ffca65', '#e89028'] }
];
const wheelDisplayLabel = word => word;
function emotionColor(name) {
  const key = normalizeText(name);
  for (const family of wheelData) {
    const level = family.levels.findIndex(word => normalizeText(word) === key);
    if (level >= 0) return family.colors[level];
  }
  if (/trist|melancolie|chagrin|solitude|decouragement|deception/.test(key)) return '#9db2e6';
  if (/colere|rage|agac|contrariete|frustration|injustice/.test(key)) return '#f39b93';
  if (/peur|anxiete|panique|terreur|vigilance|alerte/.test(key)) return '#7ed1db';
  if (/surprise|stupefaction|sideration|confusion/.test(key)) return '#c69aef';
  if (/degout|aversion|rejet|ennui/.test(key)) return '#b9c36d';
  if (/interet|anticipation|curiosite/.test(key)) return '#ffca65';
  return '#9cd792';
}
function emotionIcon(name) {
  const key = normalizeText(name);
  let family = 'relational';
  if (/joie|serenite|extase|acceptation|confiance|admiration|espoir|soulagement|gratitude|fierte|amour|affection|plaisir/.test(key)) family = 'joy';
  else if (/trist|melancolie|chagrin|solitude|decouragement|regret|deception|abandon/.test(key)) family = 'sad';
  else if (/colere|rage|agac|contrariete|frustration|irrit|injustice/.test(key)) family = 'anger';
  else if (/peur|apprehension|terreur|anxiete|panique|vigilance|alerte/.test(key)) family = 'fear';
  else if (/surprise|sideration|stupefaction|distraction/.test(key)) family = 'surprise';
  else if (/degout|aversion|mepris|rejet/.test(key)) family = 'disgust';
  else if (/interet|anticipation|curiosite|enthousiasme/.test(key)) family = 'anticipation';
  else if (/stress|stresse|confusion|impuissance|surcharge|epuisement|vide|ennui/.test(key)) family = 'blocked';
  const specs = {
    joy: { bg: '#fff1c9', accent: '#8bbf78', eyes: '<path d="M40 50c4 5 9 5 13 0M67 50c4 5 9 5 13 0"/>', mouth: '<path d="M39 64c11 16 31 16 42 0"/>' },
    sad: { bg: '#e2e8fc', accent: '#6d91d7', eyes: '<path d="M40 50c4-5 9-5 13 0M67 50c4-5 9-5 13 0"/>', mouth: '<path d="M42 77c11-14 25-14 36 0"/>' },
    anger: { bg: '#ffe1dd', accent: '#ef5751', eyes: '<path d="M39 43l16 9M81 43L65 52"/>', mouth: '<path d="M42 77c11-14 25-14 36 0"/>' },
    fear: { bg: '#e0f6f7', accent: '#55b9c6', eyes: '<circle cx="45" cy="49" r="7"/><circle cx="75" cy="49" r="7"/>', mouth: '<ellipse cx="60" cy="73" rx="8" ry="11"/>' },
    surprise: { bg: '#f1e4ff', accent: '#a779df', eyes: '<circle cx="45" cy="49" r="5"/><circle cx="75" cy="49" r="5"/>', mouth: '<ellipse cx="60" cy="73" rx="9" ry="12"/>' },
    disgust: { bg: '#edf0cc', accent: '#a9b957', eyes: '<path d="M39 51c5-6 10-6 15 0M66 51c5-6 10-6 15 0"/>', mouth: '<path d="M42 70c8-9 14 9 36 0"/>' },
    anticipation: { bg: '#fff0cf', accent: '#e9a235', eyes: '<path d="M40 49h14M66 49h14"/>', mouth: '<path d="M43 68c10 7 24 7 34 0"/>' },
    relational: { bg: '#f7e5e7', accent: '#df8da0', eyes: '<path d="M40 51h14M66 51h14"/>', mouth: '<path d="M44 75c9-6 23-6 32 0"/>' },
    blocked: { bg: '#eee5fb', accent: '#9e76df', eyes: '<path d="M40 50h14M66 50h14"/>', mouth: '<path d="M50 72h20"/>' }
  };
  const spec = specs[family];
  const decorations = {
    serenite: '<path d="M28 78c-11-8-12-22-5-29 12 2 18 13 13 25"/><path d="M27 75l12-17"/>',
    joie: '<path d="M60 12v13M60 95v13M12 60h13M95 60h13M25 25l9 9M86 86l9 9"/>',
    extase: '<path d="M27 27l7 7M86 27l-7 7M21 60h13M99 60H86"/><path d="M60 10l3 9 9 3-9 3-3 9-3-9-9-3 9-3z"/>',
    acceptation: '<path d="M28 62c-8-5-12-13-9-21 9 0 16 5 18 13M92 62c8-5 12-13 9-21-9 0-16 5-18 13"/>',
    confiance: '<path d="M60 13l18 7v20c0 15-8 26-18 32-10-6-18-17-18-32V20z"/><path d="M50 40l7 7 14-15"/>',
    admiration: '<path d="M60 10l4 12 12 4-12 4-4 12-4-12-12-4 12-4zM91 54l2 6 6 2-6 2-2 6-2-6-6-2 6-2z"/>',
    apprehension: '<path d="M31 30l8 7M89 30l-8 7M60 12v12"/><path d="M60 62v12M60 80v3"/>',
    peur: '<path d="M25 29l7 8M95 29l-7 8M60 12v12"/><path d="M90 72c-4 8-12 8-12 0 0-7 6-10 6-16 0 6 6 9 6 16z"/>' ,
    terreur: '<path d="M26 22l8 10M94 22l-8 10M60 8v16M16 53h13M104 53H91"/><path d="M47 88c8 6 18 6 26 0"/>',
    distraction: '<path d="M20 48c10-14 25-14 35 0-10 14-25 14-35 0zM65 48c10-14 25-14 35 0-10 14-25 14-35 0z"/><circle cx="48" cy="48" r="4"/><circle cx="72" cy="48" r="4"/>',
    surprise: '<path d="M60 10v16M28 26l10 10M92 26L82 36M15 60h16M105 60H89"/>',
    stupefaction: '<path d="M25 28l10 10M95 28L85 38M60 10v16"/><path d="M60 91c-6 0-11-5-11-11s5-11 11-11 11 5 11 11-5 11-11 11z"/>',
    melancolie: '<path d="M22 28c8-7 18-6 23 2 8-5 19-1 21 8 9-2 17 5 17 14H22c-5-8-3-18 5-24z"/><path d="M37 66v13M53 66v13M69 66v13"/>',
    tristesse: '<path d="M88 67c-3 8-12 8-12 0 0-7 6-10 6-16 0 6 6 9 6 16z"/>',
    chagrin: '<path d="M60 87L43 70c-11-12 4-25 17-12 13-13 28 0 17 12z"/><path d="M60 58l-3 10 6 6-3 8"/>',
    ennui: '<path d="M25 86h70M34 94h52"/><path d="M50 70h20"/>',
    degout: '<path d="M24 36c8-9 16-8 22 0M96 36c-8-9-16-8-22 0"/><path d="M86 75l5 5m0-5l-5 5"/>',
    aversion: '<path d="M24 60h25M96 60H71M39 49L50 60 39 71M81 49L70 60l11 11"/>',
    contrariete: '<path d="M24 32l6 8M96 32l-6 8M60 14v11"/><path d="M86 27l-5 8 7 2-6 10"/>',
    colere: '<path d="M25 24l8 12M95 24l-8 12M60 9v18"/><path d="M86 29l-7 12 8 2-8 13"/>',
    rage: '<path d="M21 26l10 16M99 26L89 42M60 8v22"/><path d="M85 20l-8 17 9 2-10 19M35 20l8 17-9 2 10 19"/>',
    interet: '<circle cx="76" cy="34" r="12"/><path d="M85 43l11 11M20 76c8-9 18-9 26 0"/>',
    anticipation: '<path d="M28 60h55M70 44l16 16-16 16M30 34l8 8M44 24l4 11"/>',
    vigilance: '<path d="M60 11l19 8v19c0 16-9 28-19 34-10-6-19-18-19-34V19z"/><path d="M60 30v14M60 51v3"/>',
    anxiete: '<circle cx="25" cy="27" r="3"/><circle cx="95" cy="27" r="3"/><circle cx="18" cy="67" r="3"/><circle cx="102" cy="67" r="3"/>',
    honte: '<path d="M32 26c8 9 17 13 28 13s20-4 28-13"/><path d="M48 81c8 5 16 5 24 0"/>',
    culpabilite: '<path d="M60 18c-18 16-23 27-23 39 0 14 10 25 23 25s23-11 23-25c0-12-5-23-23-39z"/><path d="M60 37v22M60 67v3"/>',
    solitude: '<circle cx="60" cy="22" r="7"/><path d="M60 31v30M45 48l15 9 15-9M49 91l11-30 11 30"/><path d="M27 94h66"/>',
    frustration: '<path d="M24 30h72M24 45h52M24 60h64M24 75h40"/><path d="M88 69l-8 10 8 10"/>',
    'amour / affection': '<path d="M60 87L42 68c-13-14 4-31 18-16 14-15 31 2 18 16z"/>',
    espoir: '<path d="M60 92V55M60 65c-14-2-21-10-21-19 12-1 21 5 21 19M60 74c14-2 21-10 21-19-12-1-21 5-21 19"/>',
    soulagement: '<path d="M26 44c8 10 18 10 26 0M42 60c8 10 18 10 26 0M58 76c8 10 18 10 26 0"/>',
    gratitude: '<path d="M60 86L43 68c-11-12 4-26 17-13 13-13 28 1 17 13z"/><path d="M60 21l3 9 9 3-9 3-3 9-3-9-9-3 9-3z"/>',
    fierte: '<path d="M60 13l5 15 16 1-12 10 4 16-13-9-13 9 4-16-12-10 16-1z"/><path d="M60 69v23M46 92h28"/>',
    curiosite: '<circle cx="54" cy="47" r="18"/><path d="M67 60l18 18M30 82c8-9 18-9 26 0"/>',
    panique: '<path d="M60 10l27 49-27 49L33 59z"/><path d="M60 43v18M60 70v3"/>',
    impuissance: '<path d="M30 36l30 25 30-25M30 36v40h60V36"/><path d="M42 91h36"/>',
    confusion: '<path d="M47 44c0-13 25-14 25-1 0 9-12 9-12 18M60 71v2"/><path d="M31 27l7 7M89 27l-7 7"/>',
    surcharge: '<path d="M28 78h64M28 63h64M28 48h64M28 33h64"/><path d="M42 89l-5 8M60 89v10M78 89l5 8"/>',
    decouragement: '<path d="M24 28l18 18 17-14 16 18 21-21"/><path d="M82 29h14v14"/>',
    rejet: '<circle cx="60" cy="60" r="31"/><path d="M39 39l42 42"/>'
  };
  const familyDecorations = {
    joy: '<path d="M18 28l7 7M102 28l-7 7"/>', sad: '<path d="M92 72c-3 8-12 8-12 0 0-7 6-10 6-16 0 6 6 9 6 16z"/>',
    anger: '<path d="M87 23l-7 13 8 2-8 13"/>', fear: '<path d="M60 12v14M25 30l9 9M95 30l-9 9"/>',
    surprise: '<path d="M60 10v14M28 28l9 9M92 28l-9 9"/>', disgust: '<path d="M88 34l5 5m0-5l-5 5"/>',
    anticipation: '<path d="M26 80h68M81 68l13 12-13 12"/>', relational: '<path d="M60 14l3 9 9 3-9 3-3 9-3-9-9-3 9-3z"/>',
    blocked: '<path d="M25 30h70M25 90h70"/>'
  };
  const decoration = decorations[key] || familyDecorations[family];
  return `<svg class="emotion-logo" viewBox="0 0 120 120" role="img" aria-label="Icône ${escapeHtml(name)}"><circle cx="60" cy="60" r="47" fill="${spec.bg}"/><circle cx="60" cy="60" r="31" fill="#fffefa" stroke="#0b2f6b" stroke-width="6"/><g fill="none" stroke="#0b2f6b" stroke-width="5.5" stroke-linecap="round" stroke-linejoin="round">${spec.eyes}${spec.mouth}</g><g fill="none" stroke="${spec.accent}" stroke-width="5" stroke-linecap="round" stroke-linejoin="round">${decoration}</g></svg>`;
}
let state = { entries: [] };
let secureMode = !BROWSER_TEST_MODE && Boolean(localStorage.getItem(SECURE_KEY));
let stateLocked = secureMode;
if (!BROWSER_TEST_MODE && !secureMode) { try { state = JSON.parse(localStorage.getItem(KEY) || '{"entries":[]}'); } catch { state = { entries: [] }; } }
state.entries = Array.isArray(state.entries) ? state.entries : [];
state.entries.forEach(entry => { if (!entry.id) entry.id = crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`; });
let draft = freshDraft();
let exerciseInterval = null;
let sessionPassphrase = null;
let questionStepIndex = 0;
let bodyOptionsKey = '';
let stableBodyOptions = [];

function freshDraft() { return { emotion: null, nuance: '', urgeType: '', intensity: 5, bodySigns: [], exercise: '', exerciseDuration: null, exerciseStatus: '', exerciseAfterIntensity: null, exerciseResult: '' }; }
function escapeHtml(value = '') { return String(value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[c])); }
function base64(bytes) { return btoa(String.fromCharCode(...new Uint8Array(bytes))); }
function fromBase64(value) { return Uint8Array.from(atob(value), char => char.charCodeAt(0)); }
async function deriveStorageKey(passphrase, salt) { const material = await crypto.subtle.importKey('raw', new TextEncoder().encode(passphrase), 'PBKDF2', false, ['deriveKey']); return crypto.subtle.deriveKey({ name: 'PBKDF2', salt, iterations: 150000, hash: 'SHA-256' }, material, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']); }
async function encryptPayload(value, passphrase) { const salt = crypto.getRandomValues(new Uint8Array(16)); const iv = crypto.getRandomValues(new Uint8Array(12)); const key = await deriveStorageKey(passphrase, salt); const data = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, new TextEncoder().encode(JSON.stringify(value))); return JSON.stringify({ version: 1, salt: base64(salt), iv: base64(iv), data: base64(data) }); }
async function decryptPayload(payload, passphrase) { const parsed = JSON.parse(payload); const key = await deriveStorageKey(passphrase, fromBase64(parsed.salt)); const data = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: fromBase64(parsed.iv) }, key, fromBase64(parsed.data)); return JSON.parse(new TextDecoder().decode(data)); }
async function saveState() { if (BROWSER_TEST_MODE || stateLocked) return; try { if (secureMode && sessionPassphrase && crypto.subtle) localStorage.setItem(SECURE_KEY, await encryptPayload(state, sessionPassphrase)); else if (!secureMode) localStorage.setItem(KEY, JSON.stringify(state)); } catch (error) { console.warn('Enregistrement local indisponible.', error); } }
function stopExercise(markStopped = false) { if (exerciseInterval) clearInterval(exerciseInterval); exerciseInterval = null; if (markStopped && draft.exerciseStatus === 'en cours') draft.exerciseStatus = 'arrêté'; }
function show(id) {
  if (exerciseInterval) { stopExercise(true); saveDraft(); }
  document.querySelectorAll('.screen').forEach(screen => screen.classList.toggle('active', screen.id === id));
  document.querySelectorAll('[data-nav]').forEach(button => button.toggleAttribute('aria-current', button.dataset.nav === id));
  const heading = document.querySelector(`#${id} h2`);
  if (heading) { heading.setAttribute('tabindex', '-1'); heading.focus({ preventScroll: true }); }
  window.scrollTo(0, 0);
  if (id === 'after') renderQuestionStep();
  if (id === 'exercise') renderExercise();
}
function saveDraft() {
  if (BROWSER_TEST_MODE) return;
  const fields = Object.fromEntries(['situation', 'thoughts', 'need', 'reaction', 'consequence', 'question'].map(id => [id, $('#' + id).value]));
  const value = { ...draft, ...fields };
  if (stateLocked) return;
  if (secureMode && sessionPassphrase && crypto.subtle) encryptPayload(value, sessionPassphrase).then(payload => localStorage.setItem(SECURE_DRAFT_KEY, payload)).catch(error => console.warn('Brouillon local indisponible.', error));
  else if (!secureMode) localStorage.setItem(DRAFT_KEY, JSON.stringify(value));
}
function clearDraft() { localStorage.removeItem(DRAFT_KEY); localStorage.removeItem(SECURE_DRAFT_KEY); }
function openPassphraseDialog(mode) { const dialog = $('#passphraseDialog'); if (!dialog) return; dialog.dataset.mode = mode; dialog.hidden = false; $('#passphraseTitle').textContent = mode === 'protect' ? 'Protéger mes observations' : 'Déverrouiller mes observations'; $('#passphraseHelp').textContent = mode === 'protect' ? 'Choisis une phrase de 8 caractères minimum. Elle ne sera jamais enregistrée.' : 'Entre ta phrase secrète. Elle n’est jamais envoyée ni conservée.'; $('#passphraseConfirmField').hidden = mode !== 'protect'; $('#passphrase').value = ''; $('#passphraseConfirm').value = ''; $('#passphrase').focus(); }
function closePassphraseDialog() { const dialog = $('#passphraseDialog'); if (dialog) dialog.hidden = true; }
async function submitPassphrase() { const mode = $('#passphraseDialog').dataset.mode; const passphrase = $('#passphrase').value; if (!crypto.subtle) { alert('Le chiffrement n’est pas disponible dans ce navigateur.'); return; } if (passphrase.length < 8) { $('#passphraseError').textContent = 'La phrase secrète doit contenir au moins 8 caractères.'; return; } if (mode === 'protect' && passphrase !== $('#passphraseConfirm').value) { $('#passphraseError').textContent = 'Les deux phrases secrètes sont différentes.'; return; } $('#passphraseError').textContent = ''; if (mode === 'protect') { sessionPassphrase = passphrase; secureMode = true; stateLocked = false; await saveState(); const draftPayload = localStorage.getItem(DRAFT_KEY); if (draftPayload) localStorage.setItem(SECURE_DRAFT_KEY, await encryptPayload(JSON.parse(draftPayload), sessionPassphrase)); localStorage.removeItem(KEY); localStorage.removeItem(DRAFT_KEY); } else { try { const unlocked = await decryptPayload(localStorage.getItem(SECURE_KEY), passphrase); state = { entries: Array.isArray(unlocked.entries) ? unlocked.entries : [] }; sessionPassphrase = passphrase; secureMode = true; stateLocked = false; await restoreDraft(); renderHistory(); renderEmotions(); renderBodySigns(); renderEmotionInsight(); renderSafetyTriage(); renderExercise(); } catch { $('#passphraseError').textContent = 'Phrase secrète incorrecte ou données illisibles.'; return; } } closePassphraseDialog(); renderPrivacyStatus(); }

function renderEmotions() {
  $('#emotionChoices').innerHTML = emotions.map(([id, label, image]) => `<button type="button" class="emotion ${draft.emotion === id ? 'selected' : ''}" data-emotion="${id}" aria-pressed="${draft.emotion === id}"><img class="emotion-image" src="assets/${image}" alt="">${label}</button>`).join('');
  document.querySelectorAll('[data-emotion]').forEach(button => button.onclick = () => {
    draft.emotion = button.dataset.emotion;
    draft.exercise = ''; draft.exerciseStatus = ''; draft.exerciseAfterIntensity = null; draft.nuance = ''; draft.urgeType = ''; draft.bodySigns = [];
    $('#observe').classList.remove('wheel-mode'); $('#wheelPanel').classList.remove('open'); $('#wheelToggle').textContent = 'Préciser avec la roue des émotions';
    saveDraft(); renderEmotions(); renderBodySigns(); renderEmotionInsight(); renderWheel(); renderExercise(); syncContinueButton();
  });
  syncFlowCopy();
}
function syncFlowCopy() {
  const urge = draft.emotion === 'urge';
  const copy = {
    observeTitle: urge ? 'Qu’est-ce qui se passe ?' : 'Que ressens-tu ?',
    observeHint: urge ? 'Choisis l’envie ou l’impulsion qui ressemble le plus à ce que tu vis.' : 'Choisis l’état le plus proche.',
    understandTitle: urge ? 'Comprendre cette envie' : 'Comprendre',
    understandHint: urge ? 'Observe ce qui déclenche l’envie et ce qui peut t’aider à garder une marge de choix.' : 'Lis ce que cette émotion peut signaler.',
    senseTitle: urge ? 'Que remarques-tu ?' : 'Que ressens-tu ?',
    senseHint: urge ? 'Repère ce qui se passe dans ton corps, tes pensées ou ton impulsion.' : 'Repère les signes présents, puis situe ton intensité.',
    exerciseTitle: urge ? 'Une pause pour choisir' : 'Exercice maintenant',
    afterTitle: urge ? 'Après cette pause' : 'Après l’exercice'
  };
  if ($('#observe h2')) $('#observe h2').textContent = copy.observeTitle;
  if ($('#observe .hint')) $('#observe .hint').textContent = copy.observeHint;
  if ($('#understand h2')) $('#understand h2').textContent = copy.understandTitle;
  if ($('#understand .hint')) $('#understand .hint').textContent = copy.understandHint;
  if ($('#sense h2')) $('#sense h2').textContent = copy.senseTitle;
  if ($('#sense .hint')) $('#sense .hint').textContent = copy.senseHint;
  if ($('#exercise h2')) $('#exercise h2').textContent = copy.exerciseTitle;
  if ($('#exerciseResult h2')) $('#exerciseResult h2').textContent = copy.afterTitle;
}
function syncContinueButton() { const button = $('#toUnderstand'); const hasChoice = Boolean(draft.emotion || draft.nuance); button.disabled = !hasChoice; button.firstChild.textContent = hasChoice ? (draft.emotion === 'urge' ? 'Comprendre cette envie ' : 'Comprendre cette émotion ') : 'Choisis un état '; }
function syncQuickLevels() { $('#level').value = draft.intensity; $('#levelValue').textContent = draft.intensity; document.querySelectorAll('[data-level]').forEach(button => button.classList.toggle('active', Number(button.dataset.level) === draft.intensity)); }
function renderBodySigns() {
  const currentBodyOptionsKey = `${draft.emotion || ''}|${draft.nuance || ''}`;
  if (bodyOptionsKey !== currentBodyOptionsKey || !stableBodyOptions.length) {
    const scientificOptions = scientificEmotion()?.body_sensations;
    const guidanceOptions = emotionGuidance()?.body;
    stableBodyOptions = [...new Set(scientificOptions?.length ? scientificOptions : guidanceOptions?.length ? guidanceOptions : (bodySignsByEmotion[draft.emotion] || bodySignOptions))];
    bodyOptionsKey = currentBodyOptionsKey;
  }
  const options = stableBodyOptions;
  const otherValue = draft.bodySigns.find(sign => sign === 'Autre' || sign.startsWith('Autre : ')) || '';
  $('#bodySigns').innerHTML = `${options.map(sign => `<button type="button" class="choice-chip ${draft.bodySigns.includes(sign) ? 'selected' : ''}" data-body-sign="${escapeHtml(sign)}" aria-pressed="${draft.bodySigns.includes(sign)}">${escapeHtml(sign)}</button>`).join('')}<button type="button" class="choice-chip body-other-choice ${otherValue ? 'selected' : ''}" data-body-sign="__other__" aria-pressed="${Boolean(otherValue)}">Autre</button>${otherValue ? `<label class="body-other-field">Précise si tu le souhaites<input id="bodyOther" type="text" maxlength="80" value="${escapeHtml(otherValue.replace(/^Autre\s*:\s*/, ''))}" placeholder="Ex. gorge serrée, vertige…"></label>` : ''}`;
  document.querySelectorAll('[data-body-sign]').forEach(button => button.onclick = () => {
    const sign = button.dataset.bodySign;
    if (sign === '__other__') {
      const existing = draft.bodySigns.find(item => item === 'Autre' || item.startsWith('Autre : '));
      draft.bodySigns = existing ? draft.bodySigns.filter(item => item !== existing) : [...draft.bodySigns, 'Autre'];
      saveDraft(); renderBodySigns();
      return;
    } else {
      draft.bodySigns = draft.bodySigns.includes(sign) ? draft.bodySigns.filter(item => item !== sign) : [...draft.bodySigns, sign];
    }
    const selected = draft.bodySigns.includes(sign);
    button.classList.toggle('selected', selected);
    button.setAttribute('aria-pressed', String(selected));
    saveDraft();
  });
  $('#bodyOther')?.addEventListener('input', event => {
    const value = event.target.value.trim();
    draft.bodySigns = draft.bodySigns.filter(item => item !== 'Autre' && !item.startsWith('Autre : '));
    draft.bodySigns.push(value ? `Autre : ${value}` : 'Autre');
    saveDraft();
  });
}
function renderWheel() {
  const point = (radius, angle) => [180 + radius * Math.sin(angle * Math.PI / 180), 180 - radius * Math.cos(angle * Math.PI / 180)];
  const sector = (inner, outer, start, end) => { const [x1, y1] = point(outer, start); const [x2, y2] = point(outer, end); const [x3, y3] = point(inner, end); const [x4, y4] = point(inner, start); return `M ${x1} ${y1} A ${outer} ${outer} 0 0 1 ${x2} ${y2} L ${x3} ${y3} A ${inner} ${inner} 0 0 0 ${x4} ${y4} Z`; };
  const rings = [[122, 156], [86, 118], [50, 82]];
  const svg = wheelData.map((family, familyIndex) => family.levels.map((word, levelIndex) => {
    const start = familyIndex * 45 - 21.7; const end = start + 43.4;
    const displayLabel = wheelDisplayLabel(word);
    return `<path class="interactive-sector ${draft.nuance === word ? 'selected' : ''}" data-nuance="${escapeHtml(word)}" role="button" tabindex="0" aria-label="Choisir ${escapeHtml(displayLabel)}" aria-pressed="${draft.nuance === word}" d="${sector(rings[levelIndex][0], rings[levelIndex][1], start, end)}" fill="${family.colors[levelIndex]}"><title>${escapeHtml(displayLabel)}</title></path>`;
  }).join('')).join('');
  let selectedOverlay = '';
  wheelData.forEach((family, familyIndex) => family.levels.forEach((word, levelIndex) => { if (draft.nuance !== word) return; const start = familyIndex * 45 - 21.7; const end = start + 43.4; const selectedShape = sector(rings[levelIndex][0], rings[levelIndex][1], start, end); selectedOverlay = `<path class="wheel-selection-halo" d="${selectedShape}"></path><path class="wheel-selection-overlay" d="${selectedShape}" stroke="${family.colors[1]}"></path>`; }));
  const labelPaths = wheelData.map((family, familyIndex) => family.levels.map((word, levelIndex) => { const radius = [139, 102, 66][levelIndex]; const start = familyIndex * 45 - 17; const end = start + 34; const defaultForward = familyIndex < 4; const forward = [3, 6, 7].includes(familyIndex) ? !defaultForward : defaultForward; const [x1, y1] = point(radius, forward ? start : end); const [x2, y2] = point(radius, forward ? end : start); return `<path id="wheel-label-path-${familyIndex}-${levelIndex}" class="wheel-label-path" d="M ${x1} ${y1} A ${radius} ${radius} 0 0 ${forward ? 1 : 0} ${x2} ${y2}"/>`; }).join('')).join('');
  const labelsInWheel = wheelData.map((family, familyIndex) => family.levels.map((word, levelIndex) => `<text class="wheel-arc-label wheel-arc-label-${levelIndex}"><textPath href="#wheel-label-path-${familyIndex}-${levelIndex}" startOffset="50%">${wheelDisplayLabel(word)}</textPath></text>`).join('')).join('');
  const legend = wheelData.map((family, index) => `<span><i style="background:${family.colors[1]}"></i>${wheelItems[index]}</span>`).join('');
  $('#wheelPanel').innerHTML = `<p>Touche directement une zone. Plus elle est proche du centre, plus l’intensité est forte.</p><div class="interactive-wheel-wrap"><svg class="interactive-wheel" viewBox="20 20 320 320" role="group" aria-label="Roue interactive des émotions de Plutchik"><defs>${labelPaths}</defs>${svg}${selectedOverlay}<circle cx="180" cy="180" r="43" class="wheel-center"></circle>${labelsInWheel}</svg></div><div class="wheel-legend">${legend}</div><div class="wheel-extra-emotions"><b>Autres émotions disponibles · 17 nuances</b><div>${extraEmotionOptions.map(word => `<button type="button" class="extra-emotion ${draft.nuance === word ? 'selected' : ''}" data-nuance="${escapeHtml(word)}" aria-pressed="${draft.nuance === word}"><span>${escapeHtml(word)}</span></button>`).join('')}</div></div><details class="wheel-blends"><summary>8 mélanges émotionnels</summary><div>${wheelBlends.map(blend => `<span style="display:flex;flex-direction:column;align-items:flex-start;gap:2px;min-width:0"><b>${escapeHtml(blend.name)}</b><small>${escapeHtml(blend.pair)}</small></span>`).join('')}</div></details><div class="wheel-selection">${draft.nuance ? `Émotion choisie : ${escapeHtml(wheelDisplayLabel(draft.nuance))}` : 'Aucune émotion choisie pour le moment.'}</div><p class="wheel-credit">Roue interactive inspirée du modèle de Robert Plutchik. 41 émotions disposent d’un exercice adapté.</p>`;
}
document.addEventListener('click', event => {
  const urgeTypeButton = event.target.closest('#understandContext [data-urge-type]');
  if (urgeTypeButton) {
    draft.urgeType = urgeTypeButton.dataset.urgeType;
    draft.exercise = ''; draft.exerciseStatus = ''; draft.exerciseAfterIntensity = null;
    saveDraft(); renderEmotionContext(); renderExercise();
    return;
  }
  const part = event.target.closest('#wheelPanel .interactive-sector, #wheelPanel .extra-emotion');
  if (!part) return;
  draft.emotion = null;
  draft.nuance = part.dataset.nuance;
  draft.urgeType = '';
  saveDraft();
  renderEmotions();
  renderBodySigns();
  renderWheel();
  syncContinueButton();
  renderEmotionInsight();
  renderExercise();
});
document.addEventListener('keydown', event => {
  const part = event.target.closest?.('#wheelPanel .interactive-sector, #wheelPanel .extra-emotion');
  if (!part || (event.key !== 'Enter' && event.key !== ' ')) return;
  event.preventDefault();
  part.click();
});
function renderExercise() {
  stopExercise(false);
  renderSafetyTriage();
  const exercise = currentExercise();
  const card = $('#exerciseRecommendation');
  if (!exercise) { card.classList.remove('show'); return; }
  $('#exerciseName').textContent = exercise.name;
  $('#exerciseText').textContent = exercise.text;
  $('#exerciseRunName').textContent = exercise.name;
  $('#exerciseRunText').textContent = exercise.text;
  const detail = $('#exerciseDetail');
  if (detail) detail.innerHTML = exercise.objective ? `<b>Pourquoi cette proposition</b><span>${escapeHtml(exercise.emotionPlanReason || exercise.objective)}</span>${exercise.emotionPlanReason && exercise.emotionPlanReason !== exercise.objective ? `<small>${escapeHtml(exercise.objective)}</small>` : ''}${exercise.intensityNote ? `<span class="intensity-note">${escapeHtml(exercise.intensityNote)}</span>` : ''}<b>Comment faire</b><ol>${(exercise.steps || []).slice(0, 3).map(step => `<li>${escapeHtml(step)}</li>`).join('')}</ol><b>Quand arrêter</b><span>${escapeHtml(exercise.contraindications || 'Arrête si le malaise augmente ou si tu ne te sens pas en sécurité.')}</span>` : '';
  const evidence = $('#exerciseEvidence');
  if (evidence) {
    const studies = (exercise.studies || []).slice(0, 2);
    const sourceLinks = studies.map(study => `<a href="${escapeHtml(study.pubmed_url || study.source_url || '#')}" target="_blank" rel="noreferrer">${escapeHtml(study.title || study.authors?.slice?.(0, 2)?.join(', ') || 'Référence scientifique')}</a>`).join(' · ');
    evidence.innerHTML = scientific.ready && exercise.evidenceGrade ? `<span class="evidence-badge">${escapeHtml(evidenceLabel(exercise.evidenceGrade))}</span>${studies.length ? `<span>Sources : ${sourceLinks}</span>` : '<span>Référence détaillée à compléter.</span>'}${draft.intensity >= 8 ? '<span class="safety-inline">Intensité forte : crée d’abord de la distance et vérifie que tu es en sécurité. En cas de danger, contacte une personne de confiance ou les secours.</span>' : ''}<small>Ces références éclairent la proposition ; elles ne permettent pas de poser un diagnostic.</small>` : '';
  }
  const breathWarning = $('#exerciseBreathWarning');
  if (breathWarning) { breathWarning.hidden = exercise.kind !== 'breath'; breathWarning.textContent = exercise.kind === 'breath' ? 'Respire naturellement, sans forcer. Arrête immédiatement en cas de vertige, de panique ou d’inconfort, puis reviens à un repère externe ou demande de l’aide.' : ''; }
  $('#exerciseStart').disabled = false;
  $('#exerciseStart').textContent = `Essayer pendant ${exercise.durationLabel || `${exercise.duration} secondes`}`;
  $('#exerciseRunRestart').hidden = true;
  $('#exerciseAnimation').classList.remove('show');
  $('#exerciseAfter').classList.remove('show');
  card.classList.add('show');
}
function renderExerciseResult() {
  const output = $('#exerciseResultMeaning');
  if (!output) return;
  const after = draft.exerciseAfterIntensity;
  document.querySelectorAll('[data-exercise-result]').forEach(button => button.classList.toggle('selected', button.dataset.exerciseResult === draft.exerciseResult));
  if (after == null) { output.textContent = 'Après l’exercice, observe simplement ce qui a changé — ou pas changé.'; return; }
  const second = after >= 7 && draft.exerciseRound !== 2 && scientific.ready && !detectSafety().critical && selectedEmotionExercisePlan()?.second_exercise_id;
  let followUp = $('#secondExercisePrompt');
  if (!followUp) {
    $('#exerciseResultQuestions').insertAdjacentHTML('beforebegin', '<div id="secondExercisePrompt" class="second-exercise-prompt" hidden></div>');
    followUp = $('#secondExercisePrompt');
  }
  if (second) {
    const next = scientific.exercises.find(item => item.id === selectedEmotionExercisePlan().second_exercise_id);
    followUp.innerHTML = `<b>L’intensité reste élevée.</b><p>Tu peux essayer une deuxième étape différente : <strong>${escapeHtml(next?.name || 'un autre exercice adapté')}</strong>.</p><button type="button" id="trySecondExercise" class="secondary-action">Essayer la deuxième étape</button>`;
    followUp.hidden = false;
    $('#trySecondExercise').onclick = () => { draft.exerciseRound = 2; draft.exerciseAfterIntensity = null; draft.exerciseResult = ''; saveDraft(); renderExercise(); show('exercise'); };
  } else if (followUp) { followUp.hidden = true; followUp.innerHTML = ''; }
  const delta = after - Number(draft.intensity);
  output.textContent = delta < 0 ? `Ton intensité est passée de ${draft.intensity}/10 à ${after}/10. Une baisse peut être utile, sans garantir que l’exercice conviendra toujours.` : delta > 0 ? `Ton intensité est passée de ${draft.intensity}/10 à ${after}/10. Si le malaise augmente, arrête l’exercice et choisis un repère plus simple ou demande de l’aide.` : `Ton intensité reste à ${after}/10. Cela donne une information utile : l’exercice n’a pas forcément changé l’état cette fois-ci.`;
}
function finishExercise(status) {
  stopExercise(false);
  draft.exerciseStatus = status;
  $('#exerciseStop').hidden = true;
  $('#exerciseRunRestart').hidden = false;
  $('#exerciseRunRestart').textContent = 'Recommencer';
  $('#exercisePhase').innerHTML = `<span class="exercise-finished">${status === 'arrêté' ? 'Exercice arrêté. Tu peux noter ce que tu ressens.' : 'C’est terminé. Observe simplement ce qui a changé.'}</span>`;
  $('#exerciseAfter').classList.add('show');
  $('#exerciseLevel').value = draft.intensity;
  $('#exerciseLevelValue').textContent = draft.intensity;
  draft.exerciseAfterIntensity = null; draft.exerciseResult = ''; renderExerciseResult();
  saveDraft();
  show('exerciseResult');
}
function renderQuestionStep() {
  const steps = [...document.querySelectorAll('#questionFlow .question-step')];
  if (!steps.length) return;
  questionStepIndex = Math.max(0, Math.min(questionStepIndex, steps.length - 1));
  steps.forEach((step, index) => step.classList.toggle('active', index === questionStepIndex));
  const progress = $('#questionProgress');
  if (progress) progress.textContent = `QUESTION ${questionStepIndex + 1} SUR ${steps.length}`;
  const next = $('#questionNext');
  const save = $('#saveButton');
  const last = questionStepIndex === steps.length - 1;
  if (next) { next.hidden = last; next.disabled = detectSafety().critical; next.textContent = 'Continuer →'; }
  if (save) { save.hidden = !last; save.disabled = detectSafety().critical; }
}
function advanceQuestion() {
  const steps = [...document.querySelectorAll('#questionFlow .question-step')];
  if (!steps.length || detectSafety().critical) return;
  if (questionStepIndex < steps.length - 1) { questionStepIndex += 1; renderQuestionStep(); }
  else $('#saveButton')?.focus();
}
function runExercise() {
  const exercise = currentExercise();
  if (!exercise) return;
  stopExercise(false);
  draft.exercise = exercise.name; draft.exerciseDuration = exercise.duration; draft.exerciseStatus = 'en cours'; draft.exerciseAfterIntensity = null; draft.exerciseResult = ''; saveDraft();
  $('#exerciseAfter').classList.remove('show');
  const theme = exerciseEmotionTheme();
  const runScreen = $('#exerciseRun');
  runScreen.style.setProperty('--exercise-dark', theme.dark);
  runScreen.style.setProperty('--exercise-light', theme.light);
  runScreen.classList.remove('exercise-theme-active');
  void runScreen.offsetWidth;
  runScreen.classList.add('exercise-theme-active');
  show('exerciseRun');
  let remaining = exercise.duration;
  const isBreathing = exercise.kind === 'breath';
  $('#exerciseAnimation').classList.add('show');
  $('#exerciseOrb').className = `${isBreathing ? 'breath-orb' : 'timer-orb'} animation-${exercise.animation || 'timer'}`;
  $('#exerciseOrb').setAttribute('aria-label', `Animation : ${exercise.name}`);
  $('#exerciseOrb').style.setProperty('--breath-duration', isBreathing ? '10s' : '8s');
  $('#exerciseSeconds').textContent = remaining;
  $('#exercisePhase').textContent = isBreathing ? 'Inspire doucement…' : exercise.animation === 'steps' ? 'Étape 1 : clarifier ce qui se passe.' : exercise.animation === 'activate' ? 'Choisis une petite action possible.' : exercise.animation === 'grounding' ? 'Regarde autour de toi, doucement.' : exercise.animation === 'relax' ? 'Contracte doucement, puis relâche.' : exercise.animation === 'compassion' ? 'Adresse-toi avec douceur.' : exercise.animation === 'delay' ? 'Laisse passer quelques instants avant d’agir.' : 'Tu peux simplement rester avec ce qui est présent.';
  if ($('#exerciseBreathWarning')) $('#exerciseBreathWarning').hidden = !isBreathing;
  $('#exerciseStart').disabled = true; $('#exerciseStart').textContent = 'Exercice en cours…'; $('#exerciseRunRestart').hidden = true; $('#exerciseStop').hidden = false;
  let elapsed = 0;
  exerciseInterval = setInterval(() => {
    remaining -= 1;
    elapsed += 1;
    $('#exerciseSeconds').textContent = remaining;
    if (isBreathing) $('#exercisePhase').textContent = elapsed % 10 < 4 ? 'Inspire doucement…' : 'Expire naturellement…';
    if (remaining <= 0) finishExercise('terminé');
  }, 1000);
}
function clearFields() {
  stopExercise(false); draft = freshDraft();
  questionStepIndex = 0;
  ['situation', 'thoughts', 'need', 'reaction', 'consequence', 'question'].forEach(id => $('#' + id).value = '');
  clearDraft(); renderEmotions(); renderBodySigns(); renderEmotionInsight(); renderSafetyTriage(); renderWheel(); renderExercise(); syncQuickLevels(); syncContinueButton();
}
function renderHistory() {
  const list = $('#historyList');
  if (stateLocked) { list.innerHTML = '<p class="empty">Tes observations sont verrouillées. Ouvre la page Confidentialité pour les déverrouiller.</p>'; return; }
  if (!state.entries.length) { list.innerHTML = '<p class="empty">Aucune observation pour le moment.<br>Quand quelque chose déborde, commence une observation.</p>'; return; }
  list.innerHTML = state.entries.slice().reverse().map(entry => `<article class="record"><time>${new Date(entry.date).toLocaleString('fr-FR')}</time><h3>${escapeHtml(observationLabel(entry))} · ${entry.intensity}/10</h3>${entry.nuance ? `<p><b>Nuance :</b> ${escapeHtml(entry.nuance)}</p>` : ''}<p>${escapeHtml(entry.situation || 'Situation non renseignée')}</p>${entry.bodySigns?.length ? `<p><b>Signes et ressentis :</b> ${escapeHtml(entry.bodySigns.join(', '))}</p>` : ''}${entry.exercise ? `<p><b>Exercice :</b> ${escapeHtml(entry.exercise)}${entry.exerciseAfterIntensity != null ? ` · après : ${entry.exerciseAfterIntensity}/10` : ''}${entry.exerciseResult ? ` · ressenti : ${entry.exerciseResult === 'helpful' ? 'un peu aidant' : entry.exerciseResult === 'harder' ? 'plus difficile' : 'plutôt pareil'}` : ''}</p>` : ''}${entry.question ? `<p><b>Question :</b> ${escapeHtml(entry.question)}</p>` : ''}<button type="button" class="record-delete" data-delete-entry="${entry.id}">Supprimer cette observation</button></article>`).join('');
  document.querySelectorAll('[data-delete-entry]').forEach(button => button.onclick = () => { if (!confirm('Supprimer cette observation de cet appareil ?')) return; state.entries = state.entries.filter(entry => entry.id !== button.dataset.deleteEntry); saveState(); renderHistory(); });
}
function report() {
  if (stateLocked) { alert('Déverrouille d’abord tes observations dans la page Confidentialité.'); return; }
  const text = value => escapeHtml(value || 'Non renseigné');
  const resultLabel = result => result === 'helpful' ? 'Un peu aidant' : result === 'harder' ? 'Plus difficile' : result === 'same' ? 'Plutôt pareil' : 'Non renseigné';
  const observationCards = state.entries.slice().reverse().map((entry, index) => `<article class="observation"><div class="observation-head"><div><p class="eyebrow">OBSERVATION ${state.entries.length - index}</p><h2>${text(observationLabel(entry))}</h2></div><strong>${entry.intensity}/10</strong></div><p class="date">${text(new Date(entry.date).toLocaleString('fr-FR'))}</p><div class="grid"><section><h3>Type de situation</h3><p>${text(entry.emotion === 'urge' ? urgeTypeLabel(entry.urgeType) : '')}</p></section><section><h3>Nuance</h3><p>${text(entry.nuance)}</p></section><section><h3>Situation</h3><p>${text(entry.situation)}</p></section><section><h3>Pensées</h3><p>${text(entry.thoughts)}</p></section><section><h3>Signes et ressentis</h3><p>${text((entry.bodySigns || []).join(', '))}</p></section><section><h3>Exercice essayé</h3><p>${text(entry.exercise)}</p></section><section><h3>Durée prévue</h3><p>${entry.exerciseDuration ? `${entry.exerciseDuration} secondes` : 'Non renseignée'}</p></section><section><h3>Statut de l’exercice</h3><p>${text(entry.exerciseStatus)}</p></section><section><h3>Intensité après l’exercice</h3><p>${entry.exerciseAfterIntensity == null ? 'Non renseignée' : `${entry.exerciseAfterIntensity}/10`}</p></section><section><h3>Ressenti après exercice</h3><p>${resultLabel(entry.exerciseResult)}</p></section><section><h3>Besoin possible</h3><p>${text(entry.need)}</p></section><section><h3>Réaction</h3><p>${text(entry.reaction)}</p></section><section><h3>Après</h3><p>${text(entry.consequence)}</p></section></div><p class="question"><b>Question pour la séance :</b> ${text(entry.question === 'Aucune' ? '' : entry.question)}</p></article>`).join('');
  const html = `<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Résumé de séance — Émotions</title><style>:root{color-scheme:light}*{box-sizing:border-box}body{margin:0;background:#f5f6f1;color:#29435f;font:16px/1.55 -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}.page{max-width:860px;margin:0 auto;padding:48px 24px}.cover,.observation{background:#fffefa;border:1px solid #dce8df;border-radius:24px;box-shadow:0 10px 30px #29435f12}.cover{padding:38px;margin-bottom:22px}.brand{color:#85b79b;font-size:13px;font-weight:800;letter-spacing:.18em}.cover h1{margin:8px 0 10px;font-size:38px;line-height:1.1}.cover p{color:#627586;margin:0}.summary{display:inline-block;margin-top:24px;padding:9px 14px;border-radius:999px;background:#e7f2e7;color:#38734b;font-weight:700}.observation{padding:28px;margin:18px 0;break-inside:avoid}.observation-head{display:flex;align-items:flex-start;justify-content:space-between;gap:16px;border-bottom:1px solid #e3ece4;padding-bottom:14px}.eyebrow{margin:0;color:#85b79b;font-size:12px;font-weight:800;letter-spacing:.16em}.observation h2{margin:4px 0 0;font-size:28px}.observation-head strong{color:#85b79b;font-size:27px}.date{color:#7a8994;font-size:13px;margin:12px 0 18px}.grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}.grid section{background:#f7faf5;border-radius:14px;padding:12px 14px;min-height:76px}.grid h3{font-size:13px;margin:0 0 4px;color:#6d987d}.grid p{margin:0}.question{padding:12px 14px;border-left:4px solid #9ac4a7;background:#f7faf5;margin-bottom:0}@media(max-width:600px){.page{padding:24px 14px}.cover{padding:26px 20px}.cover h1{font-size:31px}.grid{grid-template-columns:1fr}}@media print{body{background:#fff}.page{padding:0}.cover,.observation{box-shadow:none}}</style></head><body><main class="page"><header class="cover"><div class="brand">ÉMOTIONS</div><h1>Résumé de séance</h1><p>Une trace claire de ce que tu as observé, ressenti et essayé.</p><div class="summary">Nombre d’observations : ${state.entries.length}</div></header>${observationCards || '<p>Aucune observation enregistrée.</p>'}</main></body></html>`;
  const link = document.createElement('a'); link.href = URL.createObjectURL(new Blob([html], { type: 'text/html;charset=utf-8' })); link.download = 'resume-seance-emotions.html'; link.click(); URL.revokeObjectURL(link.href);
}
async function restoreDraft() {
  if (BROWSER_TEST_MODE) return;
  try {
    let saved = null;
    if (secureMode && !stateLocked && localStorage.getItem(SECURE_DRAFT_KEY) && sessionPassphrase) saved = await decryptPayload(localStorage.getItem(SECURE_DRAFT_KEY), sessionPassphrase);
    else if (!secureMode) saved = JSON.parse(localStorage.getItem(DRAFT_KEY) || 'null');
    if (!saved) return;
    draft = { ...freshDraft(), ...saved, bodySigns: Array.isArray(saved.bodySigns) ? saved.bodySigns : [] };
    ['situation', 'thoughts', 'need', 'reaction', 'consequence', 'question'].forEach(id => $('#' + id).value = saved[id] || '');
  } catch { if (!stateLocked) clearDraft(); }
}
function insertDynamicPanels() {
  $('#understand .hint').insertAdjacentHTML('afterend', '<div id="understandContext" class="emotion-context" aria-live="polite"></div>');
  $('#after .hint').insertAdjacentHTML('afterend', '<div id="afterContext" class="emotion-context" aria-live="polite"></div>');
  $('#saved').insertAdjacentHTML('beforebegin', '<section id="exercise" class="screen"><button id="exerciseBack" class="back-inline">← Que ressens-tu ?</button><div class="progress"><span class="active"></span><span class="active"></span><span class="active"></span><span class="active"></span><span></span></div><p class="step">ÉTAPE 4 SUR 5</p><h2>Exercice maintenant</h2><p class="hint">Tu peux essayer seulement si cela semble possible. Tu peux aussi passer directement aux questions.</p><div id="exercisePageContent"></div><button id="toQuestions" class="main-action">Passer aux questions <span>→</span></button></section>');
  $('#exercise').insertAdjacentHTML('beforebegin', '<section id="sense" class="screen"><button id="senseBack" class="back-inline">← Comprendre</button><div class="progress"><span class="active"></span><span class="active"></span><span class="active"></span><span></span><span></span></div><p class="step">ÉTAPE 3 SUR 5</p><h2>Observer ton corps</h2><p class="hint">Repère les signes présents, puis situe ton intensité.</p><div id="senseContent"></div></section>');
  $('#saved').insertAdjacentHTML('beforebegin', '<section id="exerciseRun" class="screen"><button id="exerciseRunBack" class="back-inline">← Voir l’exercice</button><div class="progress"><span class="active"></span><span class="active"></span><span class="active"></span><span class="active"></span><span></span></div><p class="step">EXERCICE GUIDÉ</p><h2 id="exerciseRunName">Ton exercice</h2><p id="exerciseRunText" class="hint"></p><p class="exercise-run-note">Reste avec ce qui est possible pour toi. Tu peux arrêter à tout moment.</p><div id="exerciseAnimation" class="exercise-animation show" aria-live="polite"><div id="exerciseOrb" class="timer-orb" role="img" aria-label="Animation de l’exercice"><span id="exerciseSeconds"></span></div><div id="exercisePhase" class="exercise-phase" aria-live="polite"></div></div><div class="exercise-action-row"><button type="button" id="exerciseStop" class="exercise-stop" hidden>Arrêter l’exercice</button><button type="button" id="exerciseRunRestart" class="secondary-action" hidden>Recommencer</button></div></section>');
  $('#saved').insertAdjacentHTML('beforebegin', '<section id="exerciseResult" class="screen"><button id="exerciseResultBack" class="back-inline">← Exercice</button><div class="progress"><span class="active"></span><span class="active"></span><span class="active"></span><span class="active"></span><span class="active"></span></div><p class="step">BILAN RAPIDE</p><h2>Après l’exercice</h2><div id="exerciseAfter" class="exercise-after"><label>Après, quelle est ton intensité ? <strong><span id="exerciseLevelValue">5</span>/10</strong><input id="exerciseLevel" type="range" min="0" max="10" value="5" aria-label="Intensité après l’exercice"></label><div class="exercise-result-choice"><b>Comment c’était pour toi ?</b><div><button type="button" data-exercise-result="helpful">Un peu aidant</button><button type="button" data-exercise-result="same">Plutôt pareil</button><button type="button" data-exercise-result="harder">Plus difficile</button></div></div><p id="exerciseResultMeaning" class="exercise-result-meaning" aria-live="polite"></p></div><button id="exerciseResultQuestions" class="main-action">Passer aux questions <span>→</span></button></section>');
  $('#tools').insertAdjacentHTML('beforeend', '<button id="definitionButton" class="text-link">Comprendre ce qu’est une émotion</button><section id="definitionPanel" class="definition-panel"><button id="definitionBack" class="back">← Retour au repère</button><p class="overline">UN REPÈRE POUR COMPRENDRE</p><h2>Une émotion, c’est un signal.</h2><p class="definition-lead">Une émotion donne une information. Elle ne commande pas forcément l’action.</p><p class="definition-lead">Touche une étape pour voir ce qu’elle peut vouloir dire.</p><div class="definition-flow"><button type="button" class="definition-step" data-definition="trigger"><b>1 · Déclencheur</b><span>Situation, pensée, souvenir ou sensation.</span></button><button type="button" class="definition-step" data-definition="feeling"><b>2 · Ressenti</b><span>Ce que tu éprouves à l’intérieur.</span></button><button type="button" class="definition-step" data-definition="body"><b>3 · Corps</b><span>Les changements physiques que tu peux remarquer.</span></button><button type="button" class="definition-step" data-definition="urge"><b>4 · Envie d’agir</b><span>L’impulsion de fuir, parler, se fermer ou se protéger.</span></button><button type="button" class="definition-step" data-definition="choice"><b>5 · Choix possible</b><span>Le petit délai pour choisir la prochaine action.</span></button></div><div id="definitionDetail" class="definition-detail" aria-live="polite">Choisis une étape ci-dessus.</div><div class="definition-evidence"><p class="overline">CE QUE CELA PEUT AIDER À FAIRE</p><div><b>Observer tôt</b><span>Repérer un signe peut aider à choisir une action de soutien avant que l’intensité augmente.</span></div><div><b>Mettre des mots</b><span>Nommer ce qui est vécu peut aider à l’observer, sans garantir une baisse immédiate.</span></div><div><b>Respecter les différences</b><span>Une sensation corporelle ne prouve pas une émotion : chacun peut la ressentir différemment.</span></div><div><b>Tester avec prudence</b><span>Un exercice peut aider certaines personnes. On arrête s’il augmente le malaise.</span></div><small>Ce contenu s’appuie sur les références affichées dans la base scientifique du projet.</small></div><p class="definition-footer">Le but n’est pas de ne plus avoir d’émotions : c’est de les repérer plus tôt pour retrouver une marge de choix.</p></section>');
  $('#emotionChoices').insertAdjacentHTML('afterend', '<div class="emotion-options"><button type="button" id="unknownButton" class="unknown-button">Je ne sais pas encore</button><button type="button" id="wheelToggle" class="wheel-toggle">Préciser avec la roue des émotions</button></div><div id="wheelPanel" class="wheel-panel"></div>');
  $('#wheelPanel').insertAdjacentHTML('afterend', '<section id="emotionInsight" class="emotion-insight" aria-live="polite"></section>');
  $('#emotionInsight').insertAdjacentHTML('afterend', '<section id="safetyTriage" class="safety-triage" role="alert" aria-live="assertive"></section>');
  $('#toAfter').insertAdjacentHTML('beforebegin', '<section id="safetyTriageUnderstand" class="safety-triage" role="alert" aria-live="assertive"></section>');
  $('#toUnderstand').insertAdjacentHTML('beforebegin', '<section id="exerciseRecommendation" class="exercise-recommendation" role="region" aria-labelledby="exerciseName"><p class="overline">UN REPÈRE POUR MAINTENANT</p><h3 id="exerciseName" tabindex="-1"></h3><p id="exerciseText"></p><div id="exerciseDetail" class="exercise-detail"></div><button type="button" id="exerciseStart" class="exercise-start"></button><div id="exerciseEvidence" class="exercise-evidence"></div><div id="exerciseBreathWarning" class="breath-warning" role="alert" hidden></div></section>');
  $('#science').querySelector('.science-grid').insertAdjacentHTML('beforebegin', '<div id="scienceLivePanel" class="science-live-panel"></div>');
  document.querySelector('nav').insertAdjacentHTML('beforebegin', '<section id="library" class="screen"><button id="libraryBack" class="back">← Retour</button><p class="overline">OUTILS GUIDÉS</p><h2>Les exercices<br>de la base</h2><p class="hint">Chaque exercice a un objectif, des limites et un niveau de preuve. Choisis seulement ce qui te semble possible maintenant.</p><div id="exerciseLibrary" class="exercise-library"></div></section>');
  $('#saved').querySelector('.hint').insertAdjacentHTML('afterend', '<div id="savedSummary" class="saved-summary" aria-live="polite"></div>');
  document.querySelector('nav').insertAdjacentHTML('beforebegin', '<section id="privacy" class="screen"><button id="privacyBack" class="back">← Retour</button><p class="overline">MES DONNÉES</p><h2>Confidentialité<br>et suppression</h2><div class="privacy-card"><b>Ce qui reste sur cet appareil</b><p>Les observations et le brouillon sont enregistrés dans le stockage local de ce navigateur. Ils ne sont pas envoyés à un serveur par cette application.</p><p>Les liens PubMed et les recherches documentaires externes sont des actions séparées. Ne saisis jamais de données personnelles dans une recherche scientifique.</p></div><div id="privacyStatus" class="privacy-status"></div><button id="privacyExport" class="secondary-action">Préparer une copie de mes observations</button><button id="privacyDelete" class="danger-action">Supprimer toutes mes observations</button><p class="small-note">La suppression efface les observations et le brouillon de cet appareil. Elle ne peut pas être annulée.</p></section>');
  $('#privacy').insertAdjacentHTML('beforeend', '<form id="passphraseDialog" class="passphrase-dialog" hidden><h3 id="passphraseTitle"></h3><p id="passphraseHelp"></p><label>Phrase secrète<input id="passphrase" type="password" autocomplete="new-password" minlength="8" required></label><label id="passphraseConfirmField">Confirmation<input id="passphraseConfirm" type="password" autocomplete="new-password" minlength="8"></label><p id="passphraseError" class="passphrase-error" aria-live="polite"></p><div><button type="submit" class="main-action">Valider</button><button type="button" id="passphraseCancel" class="secondary-action">Annuler</button></div></form>');
  $('#tools').insertAdjacentHTML('beforeend', '<button id="libraryButton" class="text-link">Découvrir les exercices</button>');
  $('#start').insertAdjacentHTML('beforeend', '<button id="privacyButton" class="text-link">Voir mes données et les supprimer</button>');
  const intensity = $('#observe .intensity-block');
  const context = $('#understandContext');
  const bodyField = $('#understand .body-field');
  const insight = $('#emotionInsight');
  const senseContent = $('#senseContent');
  if (context) context.insertAdjacentHTML('afterend', '<button type="button" id="toSense" class="main-action">Que ressens-tu ? <span>→</span></button>');
  if (senseContent && bodyField) {
    senseContent.append(bodyField);
    bodyField.querySelector('strong').textContent = 'Que remarques-tu ?';
    bodyField.querySelector('.field-hint').textContent = 'Dans ton corps, tes pensées ou tes réactions. Choisis ce qui correspond à ton vécu.';
  }
  if (senseContent && intensity) senseContent.append(intensity);
  if (senseContent && $('#toAfter')) senseContent.append($('#toAfter'));
  if (insight && intensity) intensity.insertAdjacentElement('afterend', insight);
  const recommendation = $('#exerciseRecommendation');
  if (recommendation) {
    $('#exercisePageContent').append(recommendation);
    const detail = $('#exerciseDetail');
    const evidence = $('#exerciseEvidence');
    if (detail && evidence) {
      detail.insertAdjacentHTML('beforebegin', '<details id="exerciseMore" class="exercise-more"><summary>Voir les étapes, les précautions et les sources</summary></details>');
      $('#exerciseMore').append(detail, evidence);
    }
  }
  $('#toUnderstand').firstChild.textContent = 'Comprendre cette émotion ';
  $('#toAfter').firstChild.textContent = 'Voir l’exercice ';
  const after = $('#after');
  const questionFlow = document.createElement('div');
  questionFlow.id = 'questionFlow';
  questionFlow.className = 'question-flow';
  $('#afterContext').insertAdjacentElement('afterend', questionFlow);
  ['situation', 'thoughts', 'need', 'reaction', 'consequence', 'question'].forEach((id, index) => {
    const field = id === 'bodySigns' ? $('#bodySigns')?.closest('.body-field') : $('#' + id)?.closest('.field');
    if (!field) return;
    field.classList.add('question-step');
    field.dataset.questionIndex = String(index);
    questionFlow.append(field);
  });
  questionFlow.insertAdjacentHTML('afterend', '<p id="questionProgress" class="question-progress"></p><button id="questionNext" class="main-action">Continuer →</button>');
  $('#saveButton').hidden = true;
  $('#observe .step').textContent = 'ÉTAPE 1 SUR 5';
  $('#observe h2').textContent = 'Que ressens-tu ?';
  $('#observe .hint').textContent = 'Choisis l’état le plus proche.';
  $('#understand .step').textContent = 'ÉTAPE 2 SUR 5';
  $('#understand h2').textContent = 'Comprendre';
  $('#understand .hint').textContent = 'Lis ce que cette émotion peut signaler.';
  $('#after .step').textContent = 'ÉTAPE 5 SUR 5';
  $('#after h2').innerHTML = 'Qu’est-ce que<br>cela raconte ?';
  $('#after .hint').textContent = 'Une question à la fois. Tu peux laisser vide ce qui ne te vient pas maintenant.';
  $('#afterBack').textContent = '← Exercice';
  document.querySelectorAll('.progress').forEach(progress => { while (progress.children.length < 5) progress.insertAdjacentHTML('beforeend', '<span></span>'); });
  $('#safetyTriageUnderstand').remove();
  $('#afterContext').insertAdjacentHTML('afterend', '<div id="safetyTriageUnderstand" class="safety-triage" role="alert" aria-live="assertive"></div>');
  renderQuestionStep();
}

function renderScienceLivePanel() {
  const panel = $('#scienceLivePanel');
  if (!panel) return;
  const liveDate = scientific.sources?.data_snapshot_date || '2026-08-23';
  if (!scientific.ready) { panel.innerHTML = '<div><b>Base scientifique de secours</b></div><p>Les données locales n’ont pas pu être chargées ; l’application continue sans recommandation scientifique dynamique.</p>'; return; }
  const sourceLabels = { pubmed: 'PubMed / PMC', apa_psycnet: 'APA PsycInfo', cochrane: 'Cochrane', sciencedirect: 'ScienceDirect' };
  const sourceStatus = Object.entries(scientific.sources?.sources || {}).map(([id, source]) => {
    const isBase = id === 'pubmed';
    const state = source.enabled ? (isBase ? 'base locale disponible' : 'connecteur optionnel configuré') : (isBase ? 'base locale indisponible' : 'optionnel · accès à configurer');
    return `<span class="source-status ${source.enabled ? 'enabled' : 'limited'}"><b>${sourceLabels[id] || id}</b> : ${state} · <a href="${escapeHtml(source.official_url || '#')}" target="_blank" rel="noreferrer">site officiel</a></span>`;
  }).join('');
  const fullTextVerified = scientific.studies.filter(study => study.full_text_extraction_status === 'pmc_full_text_xml_verified').length;
  const fullTextPending = scientific.studies.filter(study => study.full_text_extraction_status !== 'pmc_full_text_xml_verified').length;
  panel.innerHTML = `<div><span class="science-live-dot"></span><b>Base scientifique locale disponible</b></div><p>${scientific.studies.length} études structurées · ${scientific.emotionExerciseMap.length} parcours émotion-exercice · ${scientific.exercises.length} exercices.</p><p><b>${fullTextVerified}</b> textes PMC vérifiés · <b>${fullTextPending}</b> accès intégraux à compléter.</p><div class="source-status-list">${sourceStatus}</div><p class="science-fallback-note"><b>Fonctionnement garanti :</b> les références locales et le socle PubMed enregistré restent utilisables sans les connecteurs optionnels.</p><small>Dernière recherche PubMed enregistrée : ${liveDate}. Les nouvelles références doivent être relues avant intégration. Aucun accès protégé n’est contourné et aucune clé n’est stockée dans l’application.</small>`;
}
function renderExerciseLibrary() {
  const list = $('#exerciseLibrary');
  if (!list) return;
  if (!scientific.ready) { list.innerHTML = '<p class="empty">La base scientifique est encore en chargement.</p>'; return; }
  list.innerHTML = scientific.exercises.map(exercise => {
    const studies = (exercise.associated_studies || []).map(id => scientific.studies.find(study => study.id === id)).filter(Boolean).slice(0, 2);
    const professionalOnly = exercise.id === 'EX-GRADED-EXPOSURE';
    const badge = professionalOnly ? 'Avec un professionnel' : evidenceLabel(exercise.evidence_grade);
    const warning = professionalOnly ? '<p class="professional-warning"><b>À ne pas pratiquer seul :</b> cet exercice doit être planifié avec un professionnel qualifié, surtout en cas de trauma, dissociation, crise ou danger réel.</p>' : '';
    return `<details class="library-card${professionalOnly ? ' professional-only' : ''}"><summary><span><b>${escapeHtml(exercise.name)}</b><small>${escapeHtml(exercise.objective || '')} · ${escapeHtml(exercise.duration || 'Durée à préciser')}</small></span><em>${escapeHtml(badge)}</em></summary><div class="library-body">${warning}<p><b>Comment cela peut aider :</b> ${escapeHtml(exercise.mechanism || 'Mécanisme à préciser.')}</p><ol>${(exercise.protocol_steps || []).map(step => `<li>${escapeHtml(step)}</li>`).join('')}</ol><p class="library-caution"><b>Quand arrêter / prudence :</b> ${escapeHtml(exercise.contraindications || 'Arrêter si le malaise augmente.')}</p><small>${exercise.evidence_status ? escapeHtml(exercise.evidence_status) : ''}${studies.length ? ` · Sources : ${studies.map(study => `<a href="${escapeHtml(study.pubmed_url || study.source_url || '#')}" target="_blank" rel="noreferrer">${escapeHtml(study.title || study.authors?.slice?.(0, 2)?.join(', ') || 'Référence scientifique')}</a>`).join(' · ')}` : ' · Référence à compléter'}</small></div></details>`;
  }).join('');
}
function renderToolsExercises() {
  const list = $('#toolsExerciseList');
  if (!list) return;
  if (!scientific.ready) { list.innerHTML = '<p class="empty">Les exercices scientifiques sont encore en chargement.</p>'; return; }
  const featured = ['EX-MINDFUL-BREATHING', 'EX-DELAY-URGE', 'EX-NEEDS-IDENTIFICATION', 'EX-COMPASSION'];
  const exercises = featured.map(id => scientific.exercises.find(exercise => exercise.id === id)).filter(Boolean);
  list.innerHTML = `<p class="overline tools-section-label">EXERCICES COURTS VÉRIFIÉS</p>${exercises.map(exercise => `<details class="tool-card tool-exercise-card"><summary><span><b>${escapeHtml(exercise.name)}</b><small>${escapeHtml(exercise.duration || 'Durée à préciser')} · ${escapeHtml(evidenceLabel(exercise.evidence_grade))}</small></span></summary><p>${escapeHtml(exercise.objective || '')}</p><ol>${(exercise.protocol_steps || []).slice(0, 4).map(step => `<li>${escapeHtml(step)}</li>`).join('')}</ol><p class="tool-caution"><b>Prudence :</b> ${escapeHtml(exercise.contraindications || 'Arrête si le malaise augmente.')}</p></details>`).join('')}`;
}
function renderSavedSummary(entry) {
  const summary = $('#savedSummary');
  if (!summary) return;
  const after = entry.exerciseAfterIntensity;
  const resultText = entry.exerciseResult === 'helpful' ? 'Tu as indiqué que c’était un peu aidant.' : entry.exerciseResult === 'harder' ? 'Tu as indiqué que c’était plus difficile ; c’est une information importante à partager.' : entry.exerciseResult === 'same' ? 'Tu as indiqué que c’était plutôt pareil ; cela reste une observation utile.' : 'Tu n’as pas renseigné le ressenti après l’exercice.';
  summary.innerHTML = entry.exercise ? `<b>${escapeHtml(entry.exercise)}</b><p>${after == null ? 'Tu pourras noter plus tard ce qui a changé.' : `Intensité : ${entry.intensity}/10 → ${after}/10.`} ${resultText}</p><small>Ce résultat décrit ce moment précis. Il ne permet pas de conclure si un exercice est bon ou mauvais pour toi en général.</small>` : '<p>Aucune technique n’a été enregistrée : ton observation reste complète et peut être reprise en séance.</p>';
}
function renderPrivacyStatus() {
  const status = $('#privacyStatus');
  if (!status) return;
  if (stateLocked) status.innerHTML = `<b>Observations protégées</b><p>Les données sont chiffrées et verrouillées. Déverrouille-les avec ta phrase secrète pour les relire.</p><button id="privacyUnlock" class="secondary-action">Déverrouiller mes observations</button>`;
  else if (secureMode) status.innerHTML = `<b>Observations protégées pour cette session</b><p>Les données sont chiffrées sur cet appareil. La phrase secrète n’est pas enregistrée.</p><button id="privacyLock" class="secondary-action">Verrouiller maintenant</button>`;
  else status.innerHTML = `<b>Protection actuelle</b><p>${state.entries.length} observation${state.entries.length > 1 ? 's' : ''} enregistrée${state.entries.length > 1 ? 's' : ''} sur cet appareil.</p><small>${secureMode ? 'Les observations sont chiffrées avec une phrase secrète qui n’est pas enregistrée.' : 'Les observations restent locales, mais le stockage actuel n’est pas chiffré.'}</small><button id="privacyProtect" class="secondary-action">Protéger avec une phrase secrète</button>`;
  if ($('#privacyUnlock')) $('#privacyUnlock').onclick = () => openPassphraseDialog('unlock');
  if ($('#privacyLock')) $('#privacyLock').onclick = () => { stateLocked = true; sessionPassphrase = null; renderPrivacyStatus(); renderHistory(); };
  if ($('#privacyProtect')) $('#privacyProtect').onclick = () => openPassphraseDialog('protect');
}

insertDynamicPanels(); restoreDraft(); draft.nuance = ''; saveDraft();
loadScientificBase().finally(() => { renderEmotions(); renderBodySigns(); renderEmotionInsight(); renderSafetyTriage(); renderWheel(); renderExercise(); renderScienceLivePanel(); renderExerciseLibrary(); renderToolsExercises(); syncQuickLevels(); syncContinueButton(); });

$('#startButton').onclick = () => show('observe');
$('#observeBack').onclick = () => show('start');
$('#understandBack').onclick = () => show('observe');
$('#senseBack').onclick = () => show('understand');
$('#afterBack').onclick = () => show('exercise');
$('#exerciseBack').onclick = () => show('sense');
$('#exerciseRunBack').onclick = () => show('exercise');
$('#exerciseResultBack').onclick = () => show('exerciseRun');
$('#historyButton').onclick = () => { renderHistory(); show('history'); };
$('#backButton').onclick = () => show('start');
$('#newButton').onclick = () => { clearFields(); show('observe'); };
$('#toolsBack').onclick = () => show('start');
$('#scienceButton').onclick = () => show('science');
$('#libraryButton').onclick = () => { renderExerciseLibrary(); show('library'); };
$('#libraryBack').onclick = () => show('start');
$('#privacyButton').onclick = () => { renderPrivacyStatus(); show('privacy'); };
$('#privacyBack').onclick = () => show('start');
$('#privacyExport').onclick = report;
$('#privacyDelete').onclick = () => { if (!confirm('Supprimer les observations et le brouillon de cet appareil ?')) return; state.entries = []; localStorage.removeItem(KEY); localStorage.removeItem(SECURE_KEY); localStorage.removeItem(DRAFT_KEY); localStorage.removeItem(SECURE_DRAFT_KEY); secureMode = false; stateLocked = false; sessionPassphrase = null; clearDraft(); renderPrivacyStatus(); renderHistory(); };
$('#passphraseDialog').onsubmit = event => { event.preventDefault(); submitPassphrase(); };
$('#passphraseCancel').onclick = closePassphraseDialog;
$('#scienceBack').onclick = () => show('start');
const toolStep = document.querySelector('.tool-step');
const toolSteps = ['Regarde 3 choses autour de toi.', 'Écoute 2 sons.', 'Repère 1 sensation dans ton corps.', 'C’est fait. Observe si quelque chose a changé.'];
let stepIndex = 0;
if (toolStep) { toolStep.onclick = () => { toolStep.textContent = toolSteps[stepIndex]; stepIndex = (stepIndex + 1) % toolSteps.length; }; }
document.querySelectorAll('[data-nav]').forEach(button => button.onclick = () => { if (button.dataset.nav === 'history') renderHistory(); show(button.dataset.nav); });
$('#definitionButton').onclick = () => { $('#definitionPanel').classList.add('open'); $('#tools').classList.add('show-definition'); window.scrollTo(0, 0); $('#definitionPanel h2')?.focus({ preventScroll: true }); };
$('#definitionBack').onclick = () => { $('#definitionPanel').classList.remove('open'); $('#tools').classList.remove('show-definition'); };
const definitionDetails = { trigger: 'Exemple : un message, une remarque, une pensée ou un souvenir peut lancer la réaction.', feeling: 'Exemple : tu peux ressentir de la peur, de la tristesse, de la colère ou plusieurs émotions à la fois.', body: 'Exemple : mâchoire serrée, gorge nouée, chaleur, fatigue ou respiration plus courte.', urge: 'Une impulsion peut pousser à répondre, partir, consommer, manger, fumer ou demander de l’aide. Elle n’est pas une émotion et ne commande pas forcément l’action.', choice: 'Le délai permet de choisir une action plus utile : respirer, s’éloigner, parler ou attendre.' };
document.querySelectorAll('[data-definition]').forEach(button => button.onclick = () => { document.querySelectorAll('[data-definition]').forEach(item => item.classList.remove('selected')); button.classList.add('selected'); $('#definitionDetail').textContent = definitionDetails[button.dataset.definition]; });
$('#unknownButton').onclick = () => { draft.emotion = 'unknown'; draft.nuance = ''; draft.urgeType = ''; draft.exercise = ''; saveDraft(); renderEmotions(); renderBodySigns(); renderEmotionInsight(); renderExercise(); syncContinueButton(); };
$('#wheelToggle').onclick = () => { const open = !$('#wheelPanel').classList.contains('open'); $('#wheelPanel').classList.toggle('open', open); $('#observe').classList.toggle('wheel-mode', open); $('#wheelToggle').textContent = open ? 'Revenir aux émotions principales' : 'Préciser avec la roue des émotions'; draft.emotion = null; draft.nuance = ''; draft.urgeType = ''; draft.exercise = ''; draft.exerciseStatus = ''; draft.exerciseAfterIntensity = null; saveDraft(); renderEmotions(); renderEmotionInsight(); renderExercise(); renderWheel(); syncContinueButton(); };
document.querySelectorAll('[data-level]').forEach(button => button.onclick = () => { draft.intensity = Number(button.dataset.level); syncQuickLevels(); renderEmotionInsight(); renderExercise(); saveDraft(); });
$('#level').oninput = event => { draft.intensity = Number(event.target.value); syncQuickLevels(); renderEmotionInsight(); renderExercise(); saveDraft(); };
$('#exerciseStart').onclick = runExercise;
$('#exerciseStop').onclick = () => finishExercise('arrêté');
$('#exerciseRunRestart').onclick = runExercise;
$('#exerciseLevel').oninput = event => { draft.exerciseAfterIntensity = Number(event.target.value); $('#exerciseLevelValue').textContent = event.target.value; saveDraft(); };
document.querySelectorAll('[data-exercise-result]').forEach(button => button.onclick = () => { draft.exerciseResult = button.dataset.exerciseResult; renderExerciseResult(); saveDraft(); });
['situation', 'thoughts', 'need', 'reaction', 'consequence', 'question'].forEach(id => $('#' + id).addEventListener('input', () => { saveDraft(); renderSafetyTriage(); }));
document.querySelectorAll('[data-fill]').forEach(button => button.onclick = () => { const field = $('#' + button.dataset.fill); const text = button.dataset.text; field.value = field.value.trim() ? `${field.value.trim()} ${text}` : text; field.focus(); saveDraft(); });
$('#toUnderstand').onclick = () => show('understand');
$('#toSense').onclick = () => show('sense');
$('#toAfter').onclick = () => show('exercise');
$('#toQuestions').onclick = () => show('after');
$('#exerciseResultQuestions').onclick = () => show('after');
$('#questionNext').onclick = advanceQuestion;
$('#saveButton').onclick = () => {
  const fields = Object.fromEntries(['situation', 'thoughts', 'need', 'reaction', 'consequence', 'question'].map(id => [id, $('#' + id).value.trim()]));
  const entry = { id: crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`, date: new Date().toISOString(), ...draft, ...fields };
  state.entries.push(entry);
  renderSavedSummary(entry);
  saveState(); clearDraft(); stopExercise(false); show('saved');
};
$('#reportButton').onclick = () => { renderHistory(); show('history'); setTimeout(report, 0); };
$('#downloadButton').onclick = report;
$('#clearButton').onclick = () => { if (!confirm('Effacer toutes les observations de cet appareil ?')) return; state.entries = []; saveState(); renderHistory(); renderPrivacyStatus(); };
const toolAdvice = { calm: 'Tu peux prendre un instant pour repérer ce qui t’aide à rester dans cet état.', anger: 'Si possible, crée un délai avant de répondre : éloigne-toi quelques instants et reviens quand tu seras prêt.', sad: 'Commence doucement : nomme ce dont tu aurais besoin maintenant, même si tu n’as pas encore de solution.', stress: 'Choisis un repère externe : regarde autour de toi et laisse ta respiration revenir naturellement.', rage: 'La priorité est de créer de la distance et de la sécurité avant toute discussion.', urge: 'Si possible, crée un délai et éloigne-toi du déclencheur. Pour l’alcool ou un médicament pris régulièrement, demande un avis médical avant tout arrêt brutal.' };
$('#toolsButton').onclick = () => { $('#tools').classList.remove('show-definition'); $('#definitionPanel').classList.remove('open'); $('#toolRecommendation').textContent = (draft.nuance && nuanceExercises[draft.nuance] ? `Pour « ${draft.nuance} » : ${nuanceExercises[draft.nuance].text}` : toolAdvice[draft.emotion]) || 'Choisis une petite pause qui te semble possible maintenant.'; $('#toolRecommendation').classList.add('show'); if (toolStep) { stepIndex = 0; toolStep.textContent = 'Commencer par 3–2–1'; } renderToolsExercises(); show('tools'); };
