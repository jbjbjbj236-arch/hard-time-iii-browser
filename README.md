# Hard Time III — Browser Edition

A browser-native 3D prison-life sandbox prototype built with Three.js. This is an independent browser project and does not include proprietary game code or extracted assets.

## Play

After the GitHub Actions deployment completes:

https://jbjbjbj236-arch.github.io/hard-time-iii-browser/

Three.js is loaded from jsDelivr and fonts from Google Fonts, so an internet connection is required.

## Controls

- **WASD** — Move
- **Mouse** — Look around (click the game to capture the pointer)
- **Shift** — Run
- **Space** — Jump
- **E** — Talk / interact
- **F** — Attack
- **Esc** — Pause menu

## Prototype features

- 3D prison yard and cell-block environment
- Third-person movement and mouse camera
- NPC inmates and a guard with basic roaming and hostile behavior
- Melee combat, health, stamina, reputation, and cash
- Character customization
- Local browser save/load
- JSON mod manager with a starter template

## Mod format

Import JSON content packs through **Menu → Mod Manager**. Mods are data-only; arbitrary JavaScript execution is intentionally unsupported.

```json
{
  "name": "My Mod",
  "version": "1.0.0",
  "description": "A small gameplay pack",
  "type": "gameplay",
  "player": { "cashBonus": 10, "reputationBonus": 2 },
  "world": { "ambientColor": "#82917e" }
}
```

## Development

No bundler is required. Serve the repository root with any static web server. Three.js is imported as an ES module through the import map in `index.html`.

## Deployment

Every push to `main` validates the JavaScript and deploys the site through `.github/workflows/pages.yml`.

## Legal

Independent browser game prototype. Not affiliated with or endorsed by MDickie. Does not include proprietary Hard Time III source code or extracted game assets.
