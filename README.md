# Gauntlet Challenge — Next.js

10 jeux à enchaîner sans une seule défaite. Version Next.js 14 (App Router + TypeScript).

## Setup

```bash
cd gauntlet-next
npm install
npm run dev
```

Ouvre http://localhost:3000

## Build statique (déployable n'importe où)

```bash
npm run build
```

Le site exporté est dans `out/`. Tu peux :
- Déployer sur Vercel : `vercel deploy`
- Déployer sur Netlify : drag-and-drop le dossier `out/`
- Héberger sur GitHub Pages : push `out/` sur la branche `gh-pages`
- Ouvrir localement : `out/index.html`

## Structure

```
app/
  layout.tsx       # Layout racine
  page.tsx         # Page principale (client component, toute la logique)
  globals.css      # Styles (theme dark + neon)
lib/
  games.ts         # Pool des 80 jeux + objectifs Normal/Hardcore
  types.ts         # Types TS partagés
  icons.ts         # Mapping catégorie → emoji
```

## Concept

Voir le rules block en bas de la page. Pénalité au choix : reset complet ou recule d'un jeu. Difficulté Normal ou Hardcore. Sélection de 0-5 jeux épinglés, le reste tiré aléatoirement dans le pool.
