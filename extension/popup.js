// popup.js — Interface de sélection de langue
// Charge les langues disponibles, restaure le choix précédent, sauvegarde le nouveau

'use strict';

// ─── Catalogue des langues ────────────────────────────────────────────────────

// Chaque entrée : { code, label (nom natif), labelFr (nom français), rtl? }
const LANGUES = {
  europeennes: [
    { code: 'en',  label: 'English',    labelFr: 'Anglais' },
    { code: 'es',  label: 'Español',    labelFr: 'Espagnol' },
    { code: 'pt',  label: 'Português',  labelFr: 'Portugais' },
    { code: 'it',  label: 'Italiano',   labelFr: 'Italien' },
    { code: 'ro',  label: 'Română',     labelFr: 'Roumain' },
    { code: 'pl',  label: 'Polski',     labelFr: 'Polonais' },
    { code: 'nl',  label: 'Nederlands', labelFr: 'Néerlandais' },
    { code: 'de',  label: 'Deutsch',    labelFr: 'Allemand' },
    { code: 'ru',  label: 'Русский',    labelFr: 'Russe' },
    { code: 'uk',  label: 'Українська', labelFr: 'Ukrainien' },
    { code: 'sq',  label: 'Shqip',      labelFr: 'Albanais' },
    { code: 'sr',  label: 'Српски',     labelFr: 'Serbe' },
    { code: 'bg',  label: 'Български',  labelFr: 'Bulgare' },
    { code: 'tr',  label: 'Türkçe',     labelFr: 'Turc' },
    { code: 'el',  label: 'Ελληνικά',   labelFr: 'Grec' },
    { code: 'hu',  label: 'Magyar',     labelFr: 'Hongrois' },
    { code: 'cs',  label: 'Čeština',    labelFr: 'Tchèque' },
    { code: 'sk',  label: 'Slovenčina', labelFr: 'Slovaque' },
    { code: 'hr',  label: 'Hrvatski',   labelFr: 'Croate' },
  ],
  arabe: [
    { code: 'ar',     label: 'العربية',            labelFr: 'Arabe standard', rtl: true },
    { code: 'ar-MA',  label: 'الدارجة (المغرب)',   labelFr: 'Arabe marocain', rtl: true },
    { code: 'ar-DZ',  label: 'الدارجة (الجزائر)',  labelFr: 'Arabe algérien', rtl: true },
    { code: 'ar-EG',  label: 'العامية المصرية',    labelFr: 'Arabe égyptien', rtl: true },
  ],
  africaines: [
    { code: 'ln',  label: 'Lingála',   labelFr: 'Lingala' },
    { code: 'sw',  label: 'Kiswahili', labelFr: 'Swahili' },
    { code: 'wo',  label: 'Wolof',     labelFr: 'Wolof' },
    { code: 'bm',  label: 'Bamanankan',labelFr: 'Bambara' },
    { code: 'mos', label: 'Mooré',     labelFr: 'Mooré' },
    { code: 'fon', label: 'Fon gbè',   labelFr: 'Fon' },
    { code: 'yo',  label: 'Yorùbá',    labelFr: 'Yoruba' },
    { code: 'ig',  label: 'Igbo',      labelFr: 'Igbo' },
    { code: 'am',  label: 'አማርኛ',     labelFr: 'Amharique' },
    { code: 'ti',  label: 'ትግርኛ',     labelFr: 'Tigrigna', rtl: true },
    { code: 'so',  label: 'Soomaali',  labelFr: 'Somali' },
    { code: 'ha',  label: 'Hausa',     labelFr: 'Haoussa' },
    { code: 'ff',  label: 'Pulaar',    labelFr: 'Peul' },
    { code: 'kg',  label: 'Kikongo',   labelFr: 'Kikongo' },
    { code: 'lua', label: 'Tshiluba',  labelFr: 'Tshiluba' },
  ],
};

// Libellés des groupes dans le sélecteur
const GROUPES = {
  europeennes: 'Langues européennes',
  arabe: 'Arabe',
  africaines: 'Langues africaines',
};

// ─── Construction du sélecteur ────────────────────────────────────────────────

// Remplit le <select> avec les groupes et options de langues
function buildSelect(select) {
  Object.entries(LANGUES).forEach(([groupe, langues]) => {
    const optgroup = document.createElement('optgroup');
    optgroup.label = GROUPES[groupe];

    langues.forEach(({ code, label, labelFr }) => {
      const option = document.createElement('option');
      option.value = code;
      option.textContent = `${label} (${labelFr})`;
      optgroup.appendChild(option);
    });

    select.appendChild(optgroup);
  });
}

// ─── Persistance ──────────────────────────────────────────────────────────────

// Affiche un feedback temporaire dans la zone de statut
function showStatus(message, type = 'success') {
  const el = document.getElementById('popup-status');
  el.textContent = message;
  el.className = `popup-status popup-status--${type}`;
  setTimeout(() => {
    el.textContent = '';
    el.className = 'popup-status';
  }, 1800);
}

// ─── Initialisation ───────────────────────────────────────────────────────────

// Construit l'interface et restaure la langue mémorisée
function init() {
  const select = document.getElementById('langue-select');
  buildSelect(select);

  // Restaure le choix précédent
  chrome.storage.sync.get('langue', ({ langue }) => {
    if (langue) select.value = langue;
  });

  // Sauvegarde le nouveau choix
  select.addEventListener('change', () => {
    const langue = select.value;
    chrome.storage.sync.set({ langue }, () => {
      showStatus('✓', 'success');
    });
  });
}


// ─── Carnet de vocabulaire ────────────────────────────────────────────────────

// Interroge le content script actif pour obtenir le nombre de mots sauvegardés
function loadVocabCount() {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (!tabs[0]) return;
    chrome.tabs.sendMessage(tabs[0].id, { type: 'GET_VOCAB_COUNT' }, (res) => {
      const count = res?.count ?? 0;
      const el = document.getElementById('vocab-count');
      el.textContent = count > 0 ? `${count} mot${count > 1 ? 's' : ''}` : '—';
    });
  });
}

// Déclenche l'export CSV et propose le téléchargement
function handleExport() {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (!tabs[0]) return;
    chrome.tabs.sendMessage(tabs[0].id, { type: 'EXPORT_VOCAB' }, (res) => {
      if (!res?.csv || res.count === 0) {
        showStatus('Carnet vide', 'error');
        return;
      }
      const blob = new Blob(['\uFEFF' + res.csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `linguabridge-vocab-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      showStatus(`${res.count} mots exportés`, 'success');
    });
  });
}

// ─── Ouverture du panel latéral ───────────────────────────────────────────────

// Envoie un message au content script de l'onglet actif pour ouvrir le panel
function openPanelOnPage() {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (!tabs[0]?.id) return;
    chrome.tabs.sendMessage(tabs[0].id, { type: 'OPEN_PANEL' }).catch(() => {
      // L'onglet ne supporte pas les messages (ex: chrome://, PDF) — silencieux
    });
  });
}

// ─── Démarrage ────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  init();
  loadVocabCount();
  openPanelOnPage();
  document.getElementById('export-btn').addEventListener('click', handleExport);
});
