// content.js — Script injecté dans toutes les pages web
// Déclencheur unique : surlignement de texte (sélection souris ou double-clic)

'use strict';

// ─── Configuration ────────────────────────────────────────────────────────────

// URL du proxy — définie dans config.js (chargé en premier par le manifest)
const PROXY_URL = LB_CONFIG.PROXY_URL;
const VOCAB_KEY = 'lb_vocab';
const VOCAB_MAX = 500;

// Noms natifs des langues supportées (pour l'affichage dans le panel)
const LANG_NAMES = {
  en: 'English',       es: 'Español',       pt: 'Português',    it: 'Italiano',
  ro: 'Română',        pl: 'Polski',         nl: 'Nederlands',   de: 'Deutsch',
  ru: 'Русский',       uk: 'Українська',     sq: 'Shqip',        sr: 'Српски',
  bg: 'Български',     tr: 'Türkçe',         el: 'Ελληνικά',     hu: 'Magyar',
  cs: 'Čeština',       sk: 'Slovenčina',     hr: 'Hrvatski',
  ar: 'العربية',       'ar-MA': 'الدارجة (المغرب)', 'ar-DZ': 'الدارجة (الجزائر)', 'ar-EG': 'العامية المصرية',
  ln: 'Lingála',       sw: 'Kiswahili',      wo: 'Wolof',        bm: 'Bamanankan',
  mos: 'Mooré',        fon: 'Fon gbè',       yo: 'Yorùbá',       ig: 'Igbo',
  am: 'አማርኛ',         ti: 'ትግርኛ',          so: 'Soomaali',     ha: 'Hausa',
  ff: 'Pulaar',        kg: 'Kikongo',        lua: 'Tshiluba',
};

// Langues à écriture droite-à-gauche
const RTL_LANGS = new Set(['ar', 'ar-MA', 'ar-DZ', 'ar-EG', 'ti']);

// ─── État global ──────────────────────────────────────────────────────────────

let activeTooltip = null;
let activePanel = null;
let currentLang = 'en';

// ─── Initialisation ───────────────────────────────────────────────────────────

// Charge la langue sauvegardée et installe les écouteurs d'événements
function init() {
  chrome.storage.sync.get('langue', ({ langue }) => {
    if (langue) currentLang = langue;
  });

  document.addEventListener('mouseup', onMouseUp);
  document.addEventListener('keydown', onKeyDown);
  document.addEventListener('click', onDocumentClick);

  chrome.runtime.onMessage.addListener((msg) => {
    if (msg.type === 'LANGUE_CHANGED') currentLang = msg.langue;
  });
}

// ─── Détection de sélection (surlignement) ───────────────────────────────────

// Détecte la sélection de texte après relâchement du bouton souris
// Définit toujours le premier mot sélectionné ; affiche la barre si multi-mots
function onMouseUp(e) {
  if (e.target.closest('#lb-tooltip, #lb-panel, #lb-action-bar')) return;

  const selection = window.getSelection();
  const text = selection?.toString().trim();

  if (!text || text.length < 2) {
    removeActionBar();
    return;
  }

  // Extrait et nettoie le premier mot de la sélection
  const firstWord = text.split(/\s+/)[0].replace(/[.,;:!?'"()[\]{}<>«»""'']/g, '');
  const isOneWord = text.split(/\s+/).filter((w) => w.length > 0).length === 1;

  // Définit le premier mot dans tous les cas
  if (firstWord.length > 1) {
    removeTooltip();
    handleWordHover(firstWord, e.clientX, e.clientY);
  }

  // Affiche la barre Simplifier/Traduire uniquement pour les multi-mots
  if (!isOneWord) {
    showActionBar(text, e.clientX, e.clientY);
  } else {
    removeActionBar();
  }
}

// ─── Barre d'actions ─────────────────────────────────────────────────────────

// Affiche la barre de boutons (Simplifier / Traduire) près de la sélection
function showActionBar(text, x, y) {
  removeActionBar();

  const bar = document.createElement('div');
  bar.id = 'lb-action-bar';
  bar.setAttribute('role', 'toolbar');
  bar.innerHTML = `
    <button class="lb-action-btn" data-action="simplifier" title="Simplifier (FALC A2)">
      <span class="lb-icon">✦</span>
    </button>
    <button class="lb-action-btn" data-action="traduire" title="Traduire">
      <span class="lb-icon">⇄</span>
    </button>
  `;

  positionElement(bar, x, y - 52);
  document.body.appendChild(bar);

  bar.addEventListener('click', (e) => {
    const action = e.target.closest('[data-action]')?.dataset.action;
    if (action) handleAction(action, text);
  });
}

// Supprime la barre d'actions
function removeActionBar() {
  document.getElementById('lb-action-bar')?.remove();
}

// ─── Tooltip de définition (survol) ──────────────────────────────────────────

// Lance la requête de définition et affiche le tooltip flottant
function handleWordHover(word, x, y) {
  removeTooltip();
  removeActionBar();

  const tooltip = document.createElement('div');
  tooltip.id = 'lb-tooltip';
  tooltip.setAttribute('role', 'tooltip');
  tooltip.innerHTML = `<div class="lb-loading"><span></span><span></span><span></span></div>`;

  positionElement(tooltip, x + 14, y + 22);
  document.body.appendChild(tooltip);
  activeTooltip = tooltip;

  fetchDefinition(word).then((raw) => {
    if (activeTooltip === tooltip) renderTooltip(tooltip, raw, word);
  });
}

// Supprime le tooltip actif
function removeTooltip() {
  activeTooltip?.remove();
  activeTooltip = null;
}

// ─── Panel latéral ───────────────────────────────────────────────────────────

// Crée ou met à jour le panel latéral avec le contenu fourni
function showPanel(html) {
  if (!activePanel) {
    const panel = document.createElement('div');
    panel.id = 'lb-panel';
    panel.setAttribute('role', 'complementary');
    panel.setAttribute('aria-label', 'LinguaBridge');
    panel.innerHTML = `
      <div id="lb-panel-header">
        <span id="lb-panel-logo">LinguaBridge</span>
        <button id="lb-panel-close" title="Fermer (Échap)" aria-label="Fermer">✕</button>
      </div>
      <div id="lb-panel-content"></div>
    `;
    document.body.appendChild(panel);
    activePanel = panel;
    document.body.classList.add('lb-panel-open');
    document.getElementById('lb-panel-close').addEventListener('click', removePanel);
  }

  const contentEl = document.getElementById('lb-panel-content');
  contentEl.innerHTML = html;

  // Délègue les clics sur les boutons "copier"
  contentEl.querySelectorAll('.lb-copy-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const text = btn.dataset.copy || '';
      navigator.clipboard.writeText(text).then(() => {
        btn.textContent = '✓';
        btn.classList.add('lb-copy-btn--done');
        setTimeout(() => {
          btn.textContent = '⎘';
          btn.classList.remove('lb-copy-btn--done');
        }, 1500);
      }).catch(() => {
        btn.textContent = '✕';
        setTimeout(() => { btn.textContent = '⎘'; }, 1500);
      });
    });
  });
}

// Ferme et supprime le panel latéral
function removePanel() {
  activePanel?.remove();
  activePanel = null;
  document.body.classList.remove('lb-panel-open');
}

// ─── Dispatch des actions ─────────────────────────────────────────────────────

// Lance l'action sélectionnée (simplifier ou traduire) sur le texte
function handleAction(action, text) {
  removeActionBar();

  const label = action === 'simplifier' ? 'Simplification' : 'Traduction';
  showPanel(`
    <div class="lb-loading-wrapper">
      <div class="lb-loading"><span></span><span></span><span></span></div>
      <div class="lb-loading-label">${label} en cours…</div>
    </div>
  `);

  if (action === 'simplifier') {
    fetchSimplification(text).then((result) => {
      showPanel(renderSimplification(result, text));
    });
  } else if (action === 'traduire') {
    fetchTranslation(text).then((raw) => {
      showPanel(renderTranslation(raw));
    });
  }
}

// ─── Appels API ───────────────────────────────────────────────────────────────

// Envoie une requête de définition pour un mot donné
async function fetchDefinition(word) {
  const systemPrompt = `Tu es un assistant pour apprenants de français langue étrangère niveau A1.
Pour le mot donné, fournis :
1. Une définition en français ultra-simple (max 1 phrase, mots courants)
2. La traduction en ${currentLang}
Format JSON : { "definition": "...", "traduction": "..." }`;

  return callProxy(word, systemPrompt);
}

// Envoie une requête de simplification FALC A2
async function fetchSimplification(text) {
  const systemPrompt = `Tu es un expert en FALC (Facile à Lire et à Comprendre).
Réécris le texte suivant en français niveau A2 maximum.
Conserve toute l'information. Phrases courtes. Vocabulaire courant.
Ne traduis pas. Retourne uniquement le texte simplifié.`;

  return callProxy(text, systemPrompt);
}

// Envoie une requête de traduction vers la langue cible
async function fetchTranslation(text) {
  const systemPrompt = `Traduis le texte suivant en ${currentLang}.
Retourne un JSON : { "original": "...", "traduction": "..." }
Ne modifie pas le texte original.`;

  return callProxy(text, systemPrompt);
}

// Appelle le proxy Vercel et retourne le texte brut de la réponse
async function callProxy(prompt, systemPrompt) {
  if (!PROXY_URL || PROXY_URL.includes('YOUR_PROJECT')) {
    return JSON.stringify({ error: 'Proxy non configuré — mettre à jour config.js' });
  }

  try {
    const response = await fetch(PROXY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, systemPrompt, langue: currentLang }),
    });

    if (!response.ok) throw new Error(`Erreur réseau (${response.status})`);

    const data = await response.json();
    if (data.error) throw new Error(data.error);
    return data.result;
  } catch (err) {
    return JSON.stringify({ error: err.message || 'Erreur inconnue' });
  }
}

// ─── Rendu des résultats ──────────────────────────────────────────────────────

// Affiche la définition et la traduction dans le tooltip (mode défi)
// Sauvegarde automatiquement le mot dans le carnet de vocabulaire
function renderTooltip(tooltip, raw, word) {
  try {
    const data = parseJsonSafe(raw);
    if (data.error) throw new Error(data.error);

    const isNew = saveWord(word, data.definition, data.traduction, currentLang);

    tooltip.innerHTML = `
      <div class="lb-tooltip-header">
        <div class="lb-tooltip-word">${escapeHtml(word)}</div>
        <span class="lb-saved-badge ${isNew ? 'lb-saved-new' : ''}" title="${isNew ? 'Ajouté au carnet' : 'Déjà dans le carnet'}">
          ${isNew ? '＋' : '✓'}
        </span>
      </div>
      <div class="lb-tooltip-definition">${escapeHtml(data.definition)}</div>
      <div class="lb-challenge">
        <span class="lb-traduction lb-hidden">${escapeHtml(data.traduction)}</span>
        <button class="lb-reveal-btn">Révéler ↓</button>
      </div>
    `;

    tooltip.querySelector('.lb-reveal-btn').addEventListener('click', () => {
      tooltip.querySelector('.lb-traduction').classList.remove('lb-hidden');
      tooltip.querySelector('.lb-reveal-btn').remove();
    });
  } catch {
    tooltip.innerHTML = `<div class="lb-error">Réessaie dans un instant</div>`;
  }
}

// Affiche le texte simplifié avec bouton copier et original en accordéon
function renderSimplification(result, original) {
  return `
    <div class="lb-result-header">
      <div class="lb-result-title">✦ Texte simplifié</div>
      <button class="lb-copy-btn" data-copy="${escapeAttr(result)}" title="Copier le texte simplifié">⎘</button>
    </div>
    <div class="lb-result-body">${escapeHtml(result)}</div>
    <details class="lb-original-toggle">
      <summary>Texte original</summary>
      <div class="lb-original-text">${escapeHtml(original)}</div>
    </details>
  `;
}

// Affiche la traduction en mode bilingue côte à côte, avec support RTL
function renderTranslation(raw) {
  try {
    const data = parseJsonSafe(raw);
    if (data.error) throw new Error(data.error);

    const langName = LANG_NAMES[currentLang] || currentLang;
    const isRtl = RTL_LANGS.has(currentLang);
    const rtlAttr = isRtl ? ' dir="rtl" class="lb-col-text lb-rtl"' : ' class="lb-col-text"';

    return `
      <div class="lb-result-header">
        <div class="lb-result-title">⇄ Traduction</div>
        <button class="lb-copy-btn" data-copy="${escapeAttr(data.traduction)}" title="Copier la traduction">⎘</button>
      </div>
      <div class="lb-bilingual">
        <div class="lb-col">
          <div class="lb-col-label">Français</div>
          <div class="lb-col-text">${escapeHtml(data.original)}</div>
        </div>
        <div class="lb-col ${isRtl ? 'lb-col--rtl' : ''}">
          <div class="lb-col-label">${escapeHtml(langName)}</div>
          <div${rtlAttr}>${escapeHtml(data.traduction)}</div>
        </div>
      </div>
    `;
  } catch {
    return `<div class="lb-error">Erreur lors de la traduction</div>`;
  }
}

// ─── Utilitaires ──────────────────────────────────────────────────────────────

// Positionne un élément en évitant les débordements hors écran
function positionElement(el, x, y) {
  el.style.position = 'fixed';
  el.style.left = `${Math.min(x, window.innerWidth - 320)}px`;
  el.style.top = `${Math.max(8, Math.min(y, window.innerHeight - 220))}px`;
  el.style.zIndex = '2147483647';
}

// Parse une réponse JSON du LLM en nettoyant les balises markdown éventuelles
function parseJsonSafe(raw) {
  if (typeof raw !== 'string') throw new Error('Réponse vide');
  // Supprime les blocs ```json ... ``` ou ``` ... ```
  const cleaned = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/, '').trim();
  return JSON.parse(cleaned);
}

// Échappe les caractères HTML pour prévenir les injections XSS
function escapeHtml(str) {
  if (typeof str !== 'string') return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// Échappe pour insertion dans un attribut HTML (data-copy)
function escapeAttr(str) {
  if (typeof str !== 'string') return '';
  return str.replace(/&/g, '&amp;').replace(/"/g, '&quot;');
}

// Ferme les éléments actifs avec la touche Échap
function onKeyDown(e) {
  if (e.key === 'Escape') {
    removeTooltip();
    removePanel();
    removeActionBar();
  }
}

// Ferme le tooltip et la barre si clic en dehors
function onDocumentClick(e) {
  if (!e.target.closest('#lb-tooltip, #lb-action-bar')) {
    removeTooltip();
    removeActionBar();
  }
}

// ─── Carnet de vocabulaire (localStorage) ────────────────────────────────────

// Sauvegarde un mot dans le carnet — retourne true si c'est une nouvelle entrée
function saveWord(word, definition, traduction, lang) {
  const vocab = loadVocab();
  const key = word.toLowerCase();
  const idx = vocab.findIndex((e) => e.word === key && e.lang === lang);

  const entry = {
    word: key,
    definition,
    traduction,
    lang,
    date: new Date().toISOString(),
  };

  const isNew = idx < 0;
  if (isNew) {
    vocab.unshift(entry);
    if (vocab.length > VOCAB_MAX) vocab.pop();
  } else {
    vocab[idx] = entry;
  }

  try {
    localStorage.setItem(VOCAB_KEY, JSON.stringify(vocab));
  } catch {
    // localStorage indisponible (page en iframe sandboxée, etc.) — silencieux
  }

  return isNew;
}

// Charge le carnet depuis localStorage
function loadVocab() {
  try {
    const raw = localStorage.getItem(VOCAB_KEY);
    return Array.isArray(JSON.parse(raw)) ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

// Exporte le carnet en CSV compatible Anki (mot;définition;traduction;langue;date)
function exportVocabCSV() {
  const vocab = loadVocab();
  if (vocab.length === 0) return '';

  const header = 'mot;définition;traduction;langue;date';
  const rows = vocab.map((e) =>
    [e.word, e.definition, e.traduction, e.lang, e.date]
      .map((v) => `"${(v || '').replace(/"/g, '""')}"`)
      .join(';')
  );

  return [header, ...rows].join('\n');
}

// Expose exportVocabCSV à la popup via messages
chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg.type === 'EXPORT_VOCAB') {
    sendResponse({ csv: exportVocabCSV(), count: loadVocab().length });
  }
  if (msg.type === 'GET_VOCAB_COUNT') {
    sendResponse({ count: loadVocab().length });
  }
});

// ─── Démarrage ────────────────────────────────────────────────────────────────
init();
