# Gauntlet Challenge

10 jeux à enchaîner sans une seule défaite.

## Setup

```bash
npm install
npm run dev
```

Ouvre [http://localhost:3000](http://localhost:3000)

## Build

```bash
npm run build
npm run start
```

## Stack

- Next.js 14 (App Router) + React 18 + TypeScript
- CSS natif, zéro dépendance UI ajoutée
- `next/font` pour Space Grotesk + JetBrains Mono

## Structure

```
app/
  layout.tsx           # racine + fonts + grille de fond
  page.tsx             # orchestrateur — toute la logique métier
  globals.css          # design system complet
components/
  sections/            # blocs de page (Hero, ConfigPanel, PoolPanel, RunPanel, ...)
  fx/                  # transitions cinématiques + easter egg Konami
lib/
  games.ts             # pool de 80 jeux + objectifs Normal/Hardcore
  types.ts             # types partagés
  icons-svg.tsx        # icônes SVG (aucun emoji)
  timer.ts             # personal best persistant en localStorage
```

## Design system

**Identité** : néo-arcade brutalist. Bordures nettes, corner brackets, scanlines optionnelles, zéro shadow soft.

**Palette — Blood Orange Arcade**

| Token       | Hex       | Usage                          |
|-------------|-----------|--------------------------------|
| `--ink`     | `#0E0D0B` | Fond primaire                  |
| `--bone`    | `#F2EAD3` | Texte principal                |
| `--ember`   | `#FF5B1F` | Accent chaud, actions, focus   |
| `--lime`    | `#C6FF3D` | Validation, succès, PB         |
| `--blood`   | `#B5172A` | Échec, danger                  |
| `--gold`    | `#E8B339` | Solo / pin / champion          |

**Typo**

- Display : Space Grotesk (700)
- Mono : JetBrains Mono (500/700) — chiffres, timers, codes

**Tokens**

- Radius : aucun (border crisp 1-2px)
- Spacing : échelle 4-8-12-16-24-32-48-64
- Motion : `cubic-bezier(.2,.8,.2,1)` · 120 / 180 / 280 ms

## Features

### Logique métier
- Pool de **80 jeux**, run de 10 tirée aléatoirement
- **Épinglage** 0-5 jeux pour les forcer dans la run
- **Re-roll** des aléatoires en gardant les pin
- **Swap** par carte pour remplacer un jeu en cours
- **Tirage au sort** animé champion solo / duo
- **Difficulté** Normal / Hardcore (objectifs distincts par jeu)
- **Pénalité au choix** : reset complet ou recule d'un jeu
- Persistance complète en `localStorage`

### UI / UX bonus
- **Streak chain sticky** — 10 segments en haut de page, état live (current / done / flash on loss)
- **Timer global** au démarrage de la run, affiché en mono tabular-num, persistant
- **Personal best** par difficulté, stocké en local, affiché sous le timer
- **Pré-flight check** avant le lancement — overlay listant les 10 jeux à installer, avec confirmation explicite
- **Transition cinématique** countdown 3 → 2 → 1 → GO entre chaque jeu (skipable Espace)
- **Score card canvas** générée à la victoire, exportable en PNG
- **Easter egg** Konami code (↑↑↓↓←→←→BA) — bascule un mode CRT scanlines

### Accessibilité
- Contraste AA sur tous les textes
- Focus rings 2px ember sur tout interactif
- Navigation clavier complète
- `prefers-reduced-motion` respecté
- ARIA roles / labels sur progress, dialogs, listes

## Concept

10 jeux à enchaîner d'affilée. Une seule défaite et la pénalité tombe (reset complet ou recul d'un jeu, au choix). Les objectifs varient par difficulté — Hardcore est nettement plus exigeant. Certains jeux désignent un champion solo ou un duo tiré au sort parmi les joueurs configurés.
