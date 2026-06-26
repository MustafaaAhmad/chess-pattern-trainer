# Chess Pattern Trainer

Static chess pattern recognition and spatial memory trainer. 100% client-side — open `index.html` in a browser to use, or deploy to GitHub Pages.

## Features

- **5 game modes**: Position Recall, Board Reconstruction, Change Detection, Missing Piece, Blindfold Trainer
- **1000 chess positions** generated from real game patterns, openings, and endgames
- **Auto-generated questions** from any FEN position
- **Spaced repetition** (SM-0 algorithm) for missed positions
- **Daily challenge** — deterministic position per day
- **Scoring** with accuracy tracking, streaks, and improvement trends
- **Dark mode**, keyboard shortcuts, mobile responsive
- All data persisted in localStorage

## Usage

1. Open `index.html` in a browser
2. Select a game mode
3. Study the position before the timer runs out
4. Answer recall questions from memory
5. Review results and track improvement

### Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `1`-`5` | Select mode |
| `Enter` | Submit answer |
| `R` | Skip study / reveal |
| `N` | Next position |
| `D` | Toggle dark mode |
| `Esc` | Back to menu |

## Project Structure

```
├── index.html           Main entry point
├── css/style.css        All styles (themes, board, responsive)
├── js/
│   ├── chess/           FEN parsing, board logic
│   ├── core/            Timer, app controller
│   ├── ui/              Board renderer, theme, components
│   ├── storage/         LocalStorage persistence
│   └── engine/          Scoring, SRS, daily challenge, game modes
├── data/positions.json  1000 FEN-based positions
└── scripts/             Position generator (Node.js + chess.js)
```

## Regenerating Positions

To regenerate `data/positions.json` with fresh positions:

```bash
npm run generate-positions
```

Requires Node.js. The generator uses chess.js to simulate random games and extract positions at various stages.

## Deployment

Push to GitHub and enable Pages from the root directory. No build step required.

## License

MIT
