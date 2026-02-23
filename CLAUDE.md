# CLAUDE.md — LinguaBridge

## Contexte du projet

Extension Chrome pour élèves primo-arrivants non-francophones dans des établissements bruxellois (15-25 ans, formation professionnelle et technique). L'extension s'active sur toutes les pages web et aide à comprendre le français sans le remplacer.

---

## Stack technique — ne pas dévier

- **Extension** : JavaScript vanilla, Manifest V3, zéro framework, zéro bundler
- **Proxy** : Vercel Serverless Function, Node.js
- **LLM** : Anthropic Claude — modèle `claude-haiku-4-5-20251001`
- **Clé API** : variable d'environnement Vercel `ANTHROPIC_API_KEY` — jamais dans le code client

---

## Structure des fichiers

```
/
├── api/
│   └── claude.js          ← proxy Vercel (serverless function)
├── vercel.json            ← config CORS
└── extension/
    ├── manifest.json
    ├── content.js         ← injection page, détection sélection
    ├── background.js      ← service worker
    ├── popup.html
    ├── popup.js
    ├── styles.css
    └── icons/             ← 16px, 48px, 128px
```

---

## Règles de code

- Commenter chaque fonction en français
- Pas de dépendances npm côté extension
- Toujours gérer les erreurs réseau (timeout, quota API, pas de connexion)
- Pas de `console.log` en production
- Tout texte de l'interface en variables localisables (préparation i18n)

---

## Proxy Vercel — comportement attendu

- Accepte : `POST /api/claude` avec body `{ prompt, systemPrompt, langue }`
- Retourne : `{ result: "..." }` ou `{ error: "..." }`
- Headers CORS : autoriser les requêtes depuis `chrome-extension://*`
- Timeout max : 10 secondes
- Ne jamais logger le contenu des prompts

---

## Extension — 3 actions core

| Action | Déclencheur | Comportement |
|---|---|---|
| **Définir** | Survol d'un mot (300ms delay) | Tooltip flottant : définition FALC A1 + traduction |
| **Simplifier** | Sélection + clic bouton | Panel latéral : texte réécrit niveau A2 + original |
| **Traduire** | Sélection + clic bouton | Panel latéral : traduction + texte français côte à côte |

---

## Prompts système — ne pas modifier sans validation

### Définir
```
Tu es un assistant pour apprenants de français langue étrangère niveau A1.
Pour le mot donné, fournis :
1. Une définition en français ultra-simple (max 1 phrase, mots courants)
2. La traduction en {langue}
Format JSON : { "definition": "...", "traduction": "..." }
```

### Simplifier
```
Tu es un expert en FALC (Facile à Lire et à Comprendre).
Réécris le texte suivant en français niveau A2 maximum.
Conserve toute l'information. Phrases courtes. Vocabulaire courant.
Ne traduis pas. Retourne uniquement le texte simplifié.
```

### Traduire
```
Traduis le texte suivant en {langue}.
Retourne un JSON : { "original": "...", "traduction": "..." }
Ne modifie pas le texte original.
```

---

## Langues supportées

### Groupes dans le sélecteur popup

**Européennes** : Anglais, Espagnol, Portugais, Italien, Roumain, Polonais, Néerlandais, Allemand, Russe, Ukrainien, Albanais, Serbe, Bulgare, Turc, Grec, Hongrois, Tchèque, Slovaque, Croate

**Arabe** : Arabe standard, Arabe marocain, Arabe algérien, Arabe égyptien

**Africaines** : Lingala, Swahili, Wolof, Bambara, Mooré, Fon, Yoruba, Igbo, Amharique, Tigrigna, Somali, Haoussa, Peul, Kikongo, Tshiluba

### Affichage
Chaque langue affichée avec son nom dans sa propre écriture + nom en français entre parenthèses.
Support RTL automatique pour l'arabe et le tigrigna.

---

## Stockage

- `chrome.storage.sync` : langue choisie par l'élève (persiste entre sessions et appareils)
- `localStorage` : carnet de vocabulaire (mots consultés + définitions)
- Aucune donnée personnelle collectée, aucun tracking

---

## UI — principes

- Tooltip et panel non-intrusifs : ne pas cacher le contenu de la page
- Panel latéral fermable avec Échap ou clic extérieur
- Interface de l'extension elle-même en icônes prioritairement (pas de texte en français dans l'UI de contrôle)
- Mode "défi" : définition visible, traduction masquée par défaut avec bouton "révéler"

---

## Ce qu'il ne faut pas faire

- Ne pas traduire automatiquement toute la page (contre-productif pédagogiquement)
- Ne pas exposer la clé API dans le code de l'extension
- Ne pas utiliser Manifest V2
- Ne pas ajouter de frameworks (React, Vue, etc.) — garder zéro dépendance
- Ne pas stocker de données utilisateur sur le proxy Vercel

---

## Ordre de développement

1. Proxy Vercel (`/api/claude.js` + `vercel.json`)
2. Structure extension + manifest.json
3. Sélecteur de langue (popup)
4. Action "Définir" (tooltip au survol)
5. Action "Simplifier" + "Traduire" (panel latéral)
6. Mode "défi"
7. Carnet vocabulaire + export CSV
8. Tests multi-pages
9. Publication Chrome Web Store

## # RETROFuturisme — Charte Graphique v3.0 (Claude Code CLI)

### Contexte d'usage

Ce fichier est conçu pour **Claude Code CLI** (2026). Contrairement aux artefacts claude.ai :
- Les fichiers externes peuvent être importés (Google Fonts, CSS, JS)
- Les assets peuvent être générés sur disque (SVG, CSS, HTML, PPTX, PDF...)
- Les dépendances npm/pip sont disponibles
- Plusieurs fichiers peuvent être créés et liés entre eux

---

### Déclencheurs

Appliquer cette charte quand l'utilisateur mentionne :
`retrofuturisme` · `retrofuturiste` · `charte retro` · `style retro`  
ou demande un visuel, une interface, une présentation, un document dans cet univers.

---

### Concept

Humanité augmentée, confiante, calme et déterminée dans un monde techno-futuriste  
inspiré du **pop-art** et des **années 70**.

**Mood** : Puissance tranquille · chaleur radiale · harmonie machine/humain

---

### Palette

```css
--retro-teal:   #127676   /* Techno, calme, intelligence — VALIDATION, STRUCTURE */
--retro-orange: #E4632E   /* Énergie, attention — ACTION, ERREUR, CTA */
--retro-jaune:  #E3A535   /* Lumière, optimisme — BONUS, HOVER, HIGHLIGHT */
--retro-ink:    #0D1617   /* Profondeur — TEXTE PRINCIPAL, FOND SOMBRE */
--retro-paper:  #F2EFE6   /* Humanité — FOND CLAIR, ZONES DE LECTURE */
```

#### Architecture chromatique : règle 60-30-10

| Proportion | Couleur | Rôle |
|---|---|---|
| 60% | `paper` ou `ink` | Fond principal, zones de contenu |
| 30% | `teal` | Structure, navigation, bordures, titres |
| 10% | `orange` + `jaune` | Points focaux, actions, highlights |

#### Règle d'or

**Toujours associer au moins une couleur froide (teal/ink) et une chaude (orange/jaune)** dans chaque composition.

---

### Typographie

```css
/* Google Fonts — importables dans un projet Claude Code */
@import url('https://fonts.googleapis.com/css2?family=Anton&family=Oswald:wght@400;700&family=Inter:wght@400;600&display=swap');

/* Titres */
font-family: 'Anton', 'Oswald', Impact, sans-serif;
text-transform: uppercase;
letter-spacing: 0.1em;

/* Corps */
font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
```

**Contraste minimum** : 4.5:1 (texte normal), 3:1 (texte large ≥18px bold).  
⚠️ `paper` sur `orange` = 4.3:1 — utiliser uniquement pour texte ≥18px bold, ou préférer `ink`.

---

### CSS de base (fichier `retro-base.css` à générer)

```css
:root {
  --retro-teal:   #127676;
  --retro-orange: #E4632E;
  --retro-jaune:  #E3A535;
  --retro-ink:    #0D1617;
  --retro-paper:  #F2EFE6;

  --retro-state-success:  var(--retro-teal);
  --retro-state-error:    var(--retro-orange);
  --retro-state-warning:  var(--retro-jaune);
  --retro-state-disabled: rgba(13, 22, 23, 0.4);
}

/* Bouton pill */
.retro-btn-pill {
  display: inline-flex;
  border-radius: 50px;
  border: 3px solid var(--retro-teal);
  overflow: hidden;
  cursor: pointer;
}
.retro-btn-pill .label {
  background: var(--retro-jaune);
  color: var(--retro-ink);
  padding: 0.75rem 2rem;
  font-family: 'Oswald', sans-serif;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
.retro-btn-pill .icon {
  background: var(--retro-orange);
  color: var(--retro-paper);
  width: 56px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
}

/* Carte */
.retro-card {
  background: var(--retro-paper);
  border: 3px solid var(--retro-teal);
  border-radius: 24px 8px 24px 8px;
  box-shadow: inset 0 0 0 2px var(--retro-orange);
  padding: 1.5rem;
}

/* Cadre de page */
.page-frame {
  background: var(--retro-paper);
  border: 4px solid var(--retro-orange);
  min-height: calc(100vh - 24px);
  margin: 12px;
  padding: 40px;
  position: relative;
}

/* Séparateur */
.retro-separator {
  display: flex;
  align-items: center;
  gap: 16px;
  margin: 40px 0;
  color: var(--retro-teal);
}
.retro-separator::before,
.retro-separator::after {
  content: '';
  flex: 1;
  height: 2px;
  background: linear-gradient(90deg, transparent, var(--retro-teal) 20%, var(--retro-teal) 80%, transparent);
}

/* Feedback */
.feedback-success { background: rgba(18,118,118,0.1); border-left: 4px solid var(--retro-teal); padding: 1rem; }
.feedback-error   { background: rgba(228,99,46,0.1);  border-left: 4px solid var(--retro-orange); padding: 1rem; }
.feedback-warning { background: rgba(227,165,53,0.15); border-left: 4px solid var(--retro-jaune); padding: 1rem; }
```

---

### Cohérence sémantique

| État | Couleur | Jamais |
|---|---|---|
| Succès / Correct | `teal` | orange, jaune |
| Erreur / Incorrect | `orange` | teal, jaune |
| Avertissement / Nuance | `jaune` | teal pour erreur |
| Action principale (CTA) | `orange` + `jaune` | paper seul |
| Hover / Focus | `jaune` | ink (trop froid) |
| Désactivé | `ink` 40% opacité | orange (confusion avec action) |

---

### Instructions par type de sortie

#### Pages web / HTML

1. Créer `retro-base.css` avec les variables et composants ci-dessus
2. Importer Google Fonts via `<link>` dans `<head>`
3. Appliquer la structure `.page-frame` comme wrapper principal
4. Composition asymétrique : illustration gauche · contenu centre · déco droite
5. Coins ornés : SVG floral en `teal` en `position: absolute` aux 4 coins du `.page-frame`
6. Vérifier contraste avec un outil (ex: `npx axe-cli` ou validation manuelle)

#### Composants React / TypeScript

1. Créer `retro-tokens.ts` exportant les couleurs comme constantes
2. Utiliser Tailwind ou CSS Modules avec les variables
3. Storybook recommandé pour documenter les composants

#### Présentations (PPTX via python-pptx)

```python
RETRO = {
    "teal":   (18, 118, 118),
    "orange": (228, 99, 46),
    "jaune":  (227, 165, 53),
    "ink":    (13, 22, 23),
    "paper":  (242, 239, 230),
}
##### Slides alternent fond paper (clair) et ink (sombre)
##### Max 3 couleurs par slide
##### Titres toujours teal ou orange, uppercase
```

#### Documents / PDF (WeasyPrint ou reportlab)

- En-tête : bandeau `teal` + titre blanc uppercase
- Corps : `ink` sur `paper`
- Callouts : fond `orange` + texte `ink` (≥18px)
- Pied de page : filet `teal`

#### Images / Affiches (Pillow, Cairo, SVG)

- Fond dominant : `ink` (thème sombre) ou `paper` (thème clair)
- Motifs géométriques et courbes organiques en `teal`
- Titre en typographie d'impact massive, `orange` ou `jaune`
- Éléments humains / silhouettes si pertinent

---

### Ornements Art Nouveau (SVG réutilisable)

```svg
<!-- Motif floral coin (à placer en top-left, rotation pour les autres coins) -->
<svg xmlns="http://www.w3.org/2000/svg" width="60" height="60" viewBox="0 0 60 60" opacity="0.6">
  <path d="M5,5 C5,5 20,5 30,15 C40,25 35,40 35,40 C35,40 25,30 15,30 C5,30 5,5 5,5 Z"
        fill="none" stroke="#127676" stroke-width="1.5"/>
  <circle cx="8" cy="8" r="3" fill="#127676"/>
  <path d="M15,15 Q20,10 25,18" fill="none" stroke="#127676" stroke-width="1"/>
</svg>
```

Caractères décoratifs séparateurs : `❧` `✿` `❀` `⚘` `✾` `❁`

---

### Checklist de validation

#### Obligatoire (tous artefacts)

- [ ] Tension froid/chaud présente (teal/ink + orange/jaune)
- [ ] Contraste texte/fond ≥ 4.5:1 (vérifiable via `npx lighthouse` ou axe)
- [ ] Titres en typographie géométrique uppercase espacée
- [ ] Ratio ~60% neutre / ~30% teal / ~10% orange+jaune respecté
- [ ] Succès = teal · Erreur = orange · Warning = jaune (sans inversion)
- [ ] Fond principal neutre (paper ou ink), jamais une couleur saturée

#### Pages web

- [ ] `retro-base.css` généré et lié
- [ ] Cadre `.page-frame` avec bordure orange et coins ornés
- [ ] Google Fonts importé (Anton/Oswald + Inter)
- [ ] Boutons pill avec section jaune+orange
- [ ] Séparateurs ornementaux entre sections

#### Documents / Présentations

- [ ] Max 3 couleurs par slide/page
- [ ] Alternance thème clair/sombre si multi-pages
- [ ] Callouts avec couleur sémantique correcte

---

### Anti-patterns à bannir

| ❌ | ✅ |
|---|---|
| `orange` pour succès | `teal` pour succès |
| `teal` pour erreur | `orange` pour erreur |
| Fond saturé (orange/teal plein) comme fond principal | `paper` ou `ink` comme fond |
| Paper sur orange en petit texte | Ink sur orange, ou paper ≥18px bold |
| Gradients orange→teal | Gradients teal→orange→jaune |
| Trop de jaune (fatigue) | Jaune réservé aux highlights ponctuels |
| Même couleur = deux sens opposés | Une couleur = un sens constant |

## Adaptations du fichier CLAUDE.md

Adapte toujours ce fichier CLAUDE.md quand l'utilisateur prend une décision qui modifie son contenu

