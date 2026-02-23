# LinguaBridge — Plan de développement Extension Chrome

## Stack technique

- **Extension** : JavaScript vanilla + Manifest V3 (pas de framework, pas de bundler)
- **Proxy API** : Vercel Serverless Function (Node.js)
- **LLM** : Claude API (claude-haiku-3 — rapide, coût faible)

---

## Architecture globale

```
Page web → Content Script → Vercel Proxy → Claude API
                ↑
           Popup UI (settings, langue)
```

---

## Phase 1 — Proxy Vercel (Jour 1)

**Objectif** : sécuriser la clé API, jamais exposée côté client.

### Fichiers à créer

```
/api/claude.js        ← fonction serverless
/vercel.json          ← config CORS
```

### Prompt Claude Code

> "Crée une fonction serverless Vercel en Node.js qui reçoit un POST avec `{prompt, systemPrompt}`, appelle l'API Anthropic claude-haiku-3, et retourne la réponse. La clé API est dans une variable d'environnement `ANTHROPIC_API_KEY`. Ajoute les headers CORS nécessaires pour une extension Chrome."

---

## Phase 2 — Structure de l'extension (Jour 1-2)

### Arborescence

```
/extension
  manifest.json         ← permissions, content script
  content.js            ← injection dans la page
  popup.html            ← interface utilisateur
  popup.js
  background.js         ← service worker
  styles.css            ← tooltip/panel styles
  icons/                ← 16, 48, 128px
```

### Permissions manifest.json

- `activeTab`
- `storage`
- `contextMenus`

### Prompt Claude Code

> "Crée la structure complète d'une extension Chrome Manifest V3 avec : un content script qui écoute la sélection de texte, un popup pour choisir la langue cible, et un service worker minimal."

---

## Phase 3 — Core features (Jour 2-3)

### 3 interactions utilisateur

| Geste | Action | Prompt système Claude |
|---|---|---|
| Survol d'un mot | Définition FALC + traduction | "Tu es un assistant pour apprenants FLE niveau A1. Donne une définition ultra-simple en français + traduction en {langue}." |
| Sélection + bouton "Simplifier" | Simplification du passage | "Réécris ce texte en français FALC niveau A2 max. Garde la même information." |
| Sélection + bouton "Traduire" | Traduction complète | "Traduis en {langue}. Garde aussi le texte français côte à côte." |

### Prompt Claude Code

> "Dans content.js, détecte la sélection de texte et affiche un petit tooltip flottant avec 3 boutons (définir / simplifier / traduire). Au clic, envoie le texte sélectionné + la langue stockée dans chrome.storage au proxy Vercel et affiche la réponse dans un panel latéral non-intrusif."

---

## Phase 4 — Détection de langue + UI (Jour 3-4)

- Popup permet de choisir manuellement la langue dans la liste complète
- `chrome.storage.sync` mémorise la langue entre sessions
- Interface de la popup en icônes + nom de langue en langue native :
  - `العربية` (arabe)
  - `Lingála` (lingala)
  - `Română` (roumain)
  - etc.

### Groupes de langues supportées

**Langues européennes** : Français, Anglais, Espagnol, Portugais, Italien, Roumain, Polonais, Néerlandais, Allemand, Russe, Ukrainien, Albanais, Serbe, Bulgare, Turc, Grec, Hongrois, Tchèque, Slovaque, Croate, Slovène, Macédonien, Bosniaque

**Arabe** : Arabe standard + dialectes principaux (marocain, algérien, égyptien)

**Langues africaines principales** : Lingala, Swahili, Wolof, Bambara, Mooré, Fon, Yoruba, Igbo, Amharique, Tigrigna, Somali, Haoussa, Peul, Kikongo, Tshiluba

### Prompt Claude Code

> "Crée le popup.html avec un sélecteur de langue organisé par groupe (langues européennes / arabe / langues africaines). Affiche chaque langue avec son nom dans sa propre écriture. Sauvegarde le choix dans chrome.storage.sync."

---

## Phase 5 — Polish + publication (Jour 4-5)

### Fonctionnalités additionnelles

- **Mode "défi"** : afficher d'abord la définition en français, traduction masquée avec bouton "révéler" — principe Krashen input +1
- **Carnet vocabulaire** : sauvegarde des mots consultés en localStorage + export CSV (compatible Anki)
- **Indicateur de lisibilité** : badge sur l'icône de l'extension indiquant le niveau estimé de la page (A1/A2/B1/B2+)

### Tests avant publication

- Pronote
- Wikipedia FR
- Sites d'actualités (RTBF, Le Monde)
- Pages administratives (commune, CPAS)
- YouTube (sous-titres)

### Publication Chrome Web Store

1. Générer les visuels (screenshots 1280×800, icône 128px)
2. Rédiger la description en FR + EN
3. Soumettre sur [https://chrome.google.com/webstore/devconsole](https://chrome.google.com/webstore/devconsole)
4. Frais unique : **5 USD**
5. Délai de validation : 1-3 jours ouvrables

---

## Estimation des coûts

| Poste | Coût |
|---|---|
| Vercel (proxy) | Gratuit (free tier) |
| Claude Haiku API | ~$0.25 / million tokens input |
| 30 élèves actifs | **< 2 € / mois** |
| Chrome Web Store | 5 USD unique |

---

## Ordre des commandes Claude Code

1. Lancer `claude` dans le dossier projet
2. Décrire l'architecture globale → faire créer tous les fichiers de base en une passe
3. Itérer feature par feature dans la même session
4. Tester en mode développeur Chrome : `chrome://extensions` → "Charger l'extension non empaquetée"
5. Une fois stable → empaqueter et soumettre au Chrome Web Store

---

## Références théoriques

- **García & Wei** — *Translanguaging: Language, Bilingualism and Education* (2014) — justifie le maintien de la L1 comme ressource
- **Sweller** — *Cognitive Load Theory* (1988) — justifie l'interface minimaliste déclenchée par l'élève
- **Krashen** — *The Input Hypothesis* (1985) — justifie le mode "défi" et la non-traduction systématique
- **Cummins** — *Interdependence Hypothesis* — justifie l'affichage bilingue simultané (L1 + L2)
