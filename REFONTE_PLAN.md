# REFONTE_PLAN — Gauntlet Challenge

## Phase 0 — Reconnaissance

### Stack détectée
- **Framework** : Next.js 14.2.15 (App Router) + React 18 + TypeScript 5.5
- **Build** : Next CLI standard, pas de bundler tiers ajouté
- **Styling** : CSS natif (un seul fichier `app/globals.css`, ~14 ko, ~700 lignes), variables CSS custom, aucune lib UI (ni Tailwind, ni styled-components, ni Material)
- **State** : `useState` local dans `app/page.tsx`, persistance `localStorage` via `STORAGE_KEY = "gauntlet_v2"`
- **Aucune dépendance** hors `next` / `react` / `react-dom`

### Architecture actuelle (très plate)
```
app/
  layout.tsx       # 19 lignes, métadonnées + body
  page.tsx         # 610 lignes — TOUTE la logique + tout le markup en un seul Client Component
  globals.css      # ~700 lignes — design système actuel (dark + neon vert/violet)
lib/
  games.ts         # POOL[] de 80 jeux, helpers getCategories, effectiveMode
  types.ts         # GameMode, Game, Difficulty, PenaltyMode, GauntletState, DEFAULT_STATE
  icons.ts         # Mapping catégorie → emoji (à supprimer côté usage)
```

### Inventaire des composants UI implicites (à extraire en composants réutilisables)
Tout est inline dans `page.tsx` aujourd'hui :
1. **Hero** — titre + sous-titre + tentative
2. **Panel `Configuration`** — 3 inputs joueurs, select nombre de joueurs, toggle difficulté, toggle pénalité
3. **Panel `Sélection du pool`** — search input, pills de filtres par catégorie, grille de cartes de jeux (épinglables), 2 boutons d'action (générer / re-roll)
4. **Panel `Run en cours`** — progress bar, liste des 10 cartes de jeu (états : locked / current / done / pinned-run / swapped), tirage au sort animé, actions par carte (swap / tirer / validé / échoué)
5. **Empty state** quand aucune run générée
6. **Controls globaux** — Reset complet
7. **Bloc règles**
8. **Overlays** plein écran : victoire / défaite

### Flow utilisateur
```
[Accueil = page unique scroll] 
    → Saisie joueurs / difficulté / pénalité
    → Épinglage 0-5 jeux dans le pool de 80
    → "Générer la run" → 10 jeux sélectionnés (épinglés + tirage)
    → Pour chaque jeu courant :
        • si solo/duo → tirage au sort animé du champion
        • Validé → progresse, jeu suivant
        • Échoué → selon pénalité : reset complet OU recule d'un jeu
    → 10/10 done → overlay WIN
    → Échec → overlay LOSE
```

### Features à préserver (intouchables côté logique)
- Persistance `localStorage` (clé `gauntlet_v2`, schéma `GauntletState`)
- Algorithme de tirage : `shuffle` + `effectiveMode(g, difficulty)` (gestion `soloHardcore`)
- Compteurs : `attempt`, `current`, `done[]`, `champions{}`
- Modes pénalité `reset` / `stepback`
- Fonctions : `togglePin`, `generateRun`, `rerollRun`, `swapGame`, `drawChampion`, `winGame`, `loseGame`, `fullReset`, `hardReset`
- Validations / alertes existantes (max 5 pins, joueurs requis pour tirage, etc.)
- Pool des 80 jeux et leurs objectifs Normal / Hardcore (lib/games.ts)

---

## Phase 1 — Direction artistique proposée

### Identité retenue : **Néo-arcade / CRT brutalist**
Combo terminal-arcade : grille typographique massive, scanlines très subtiles (off par défaut, toggle), bordures nettes 1-2px, pas de glow excessif, contraste fort. L'ambiance évoque une borne d'arcade éditorialisée — pas un dashboard SaaS.

### Palette signée — "Blood Orange Arcade"
| Token            | Hex       | Usage                                      |
|------------------|-----------|--------------------------------------------|
| `--ink`          | `#0E0D0B` | Fond primaire (presque noir, pas pur)      |
| `--ink-2`        | `#16140F` | Surface élevée                              |
| `--ink-3`        | `#1F1B14` | Surface 2 / lignes                          |
| `--bone`         | `#F2EAD3` | Texte principal (chaud, papier vieilli)     |
| `--bone-dim`     | `#8C8472` | Texte secondaire                            |
| `--ember`        | `#FF5B1F` | **Primaire 1** — actions, accent chaud      |
| `--lime`         | `#C6FF3D` | **Primaire 2** — succès, validation         |
| `--blood`        | `#B5172A` | Échec, danger                               |
| `--gold`         | `#E8B339` | Solo / champion / pinned                    |

Choix assumé : pas de violet/bleu type Discord, pas de néon générique. Orange brûlé + lime vintage sur fond chaud pour casser le réflexe "dark dashboard".

### Typographie
- **Display** : `Space Grotesk` (700/900) — titres, numéros de jeu, gros nombres. Ouvert mais avec caractère.
- **Mono / chiffrage** : `JetBrains Mono` (500/700) — compteurs, timers, IDs.
- **Body** : `Space Grotesk` (400/500) — pas d'Inter ni Roboto.
- Servies en `next/font/google` (self-hosted, pas de FOUT, pas de dépendance ajoutée).

### Tokens
- Radius : `2px` (cards) / `4px` (boutons), volontairement faible — pas de bulles soft
- Espacements : échelle 4-8-12-16-24-32-48-64
- Shadows : aucune ombre douce diffuse, plutôt offset solides `4px 4px 0 var(--ink-3)` sur les éléments interactifs
- Borders : `1px solid var(--ink-3)` par défaut, `2px solid var(--ember)` sur focus
- Animations : durées courtes (120ms / 180ms / 280ms), easings `cubic-bezier(.2,.8,.2,1)`

### Accessibilité
- Tous contrastes vérifiés AA (bone sur ink = ratio > 12)
- Focus visibles 2px ember sur tous les interactifs
- Navigation clavier complète (tab order naturel + shortcuts pour validé/échoué)
- `prefers-reduced-motion` respecté sur toutes les animations

---

## Phase 2 — Découpage en composants

```
app/
  layout.tsx                          # + next/font, theme provider
  page.tsx                            # SEUL container — orchestration logique inchangée
  globals.css                         # tokens + reset
  components/
    ui/
      Button.tsx                      # variants: primary, ghost, danger, success
      Card.tsx
      Badge.tsx
      Toggle.tsx                      # toggle group réutilisable
      Modal.tsx                       # overlay accessible (focus trap, ESC)
      Progress.tsx                    # barre + version "chain" 10 segments
      Icon.tsx                        # SVG inline (pas d'emoji nulle part)
    sections/
      Hero.tsx
      ConfigPanel.tsx                 # joueurs, difficulté, pénalité
      PoolPanel.tsx                   # search, filtres, grille
      RunPanel.tsx                    # progress + liste jeux
      GameCard.tsx                    # carte d'un jeu dans la run
      PoolCard.tsx                    # carte épinglable du pool
      RulesBlock.tsx
      WinOverlay.tsx
      LoseOverlay.tsx
    fx/
      ChampionDraw.tsx                # animation du tirage
      Transition.tsx                  # transition cinématique entre jeux
  styles/
    tokens.css                        # variables CSS
    typography.css
    animations.css
  lib/
    icons-svg.tsx                     # icônes SVG par catégorie (remplace lib/icons.ts)
    sound.ts                          # helpers audio (bonus)
    timer.ts                          # bonus
```

**Contrat préservé** : `page.tsx` continue d'orchestrer toute la logique et passe les props aux components présentationnels. Aucune modif de signature des handlers métier.

---

## Phase 3 — Bonus retenus (4)

1. **Streak counter visuel** — chaîne 10 segments en haut sticky, chaque segment se "verrouille" en lime sur win, flash blood sur lose. Survole un segment = peek du jeu.
2. **Timer global + temps par jeu** — chrono en JetBrains Mono dans le hero, split par jeu sauvegardé dans `localStorage` sous nouvelle clé `gauntlet_v2_timing` (ne touche pas au state principal). Personal best run affiché.
3. **Transition cinématique inter-jeux** — quand un `winGame` valide et qu'un suivant existe : countdown 3-2-1 plein écran avec nom du prochain jeu, scanline qui balaie. Skipable au clavier (Espace).
4. **Score card de fin partageable** — overlay WIN remplacé par une "carte" générée via `<canvas>` (export PNG download), reprenant temps total, nb de tentatives, players, signature visuelle.

**Easter egg** : Konami code → bascule un mode "bone" (couleurs inversées, scanlines on). Discret, non documenté côté UI.

**Sound design** : reporté hors scope initial (bonus optionnel à la fin si temps). Toggle préparé dans le panel config mais désactivé par défaut.

---

## Phase 4 — Plan de commits

1. `chore(ui): setup design system — tokens, fonts, reset`
2. `feat(ui): primitives — Button, Card, Badge, Toggle, Modal, Progress, Icon`
3. `refactor(ui): extract Hero + ConfigPanel into components`
4. `refactor(ui): redesign PoolPanel + PoolCard with new identity`
5. `refactor(ui): redesign RunPanel + GameCard + chain progress`
6. `refactor(ui): redesign Win/Lose overlays`
7. `feat(ui): inter-game cinematic transition`
8. `feat(ui): champion draw animation polish`
9. `feat(bonus): global + per-game timer with PB persistence`
10. `feat(bonus): streak chain header (sticky)`
11. `feat(bonus): shareable score card on win`
12. `feat(bonus): konami easter egg`
13. `chore(a11y): focus rings, keyboard shortcuts, prefers-reduced-motion`
14. `chore(responsive): mobile + tablet pass`
15. `docs: README + screenshots + changelog`

---

## Contraintes respectées
- Stack identique, **0 dépendance runtime ajoutée** (next/font fait partie de Next)
- CSS natif conservé (variables CSS + CSS modules pour les composants)
- Aucun emoji dans le code livré final (icônes SVG via composant `Icon`)
- `lib/games.ts`, `lib/types.ts`, fonctions de logique : **aucun changement de signature**
- Branche cible : `feat/ui-refonte`

---

## STOP — En attente de validation
Avant de coder la moindre ligne, je veux ton feu vert sur :
- L'identité **Néo-arcade / Blood Orange Arcade** (sinon propose une autre piste)
- Les **4 bonus** retenus (à ajouter / retirer)
- Le découpage en composants
- Le plan de commits
