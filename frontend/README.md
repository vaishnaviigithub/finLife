# FinLife — Frontend

Expo app for the FinLife financial life simulator.

## Setup

```bash
npm install
npm start
```

## Scripts

| Command        | Description              |
| -------------- | ------------------------ |
| `npm start`    | Start Expo dev server    |
| `npm run web`  | Run in browser           |
| `npm run ios`  | Run on iOS simulator     |
| `npm run android` | Run on Android emulator |
| `npm run lint` | Run ESLint               |

## Screens

- `app/intro.tsx` — Onboarding (first launch)
- `app/index.tsx` — Chapter roadmap
- `app/play.tsx` — Scenario gameplay
- `app/summary.tsx` — End-of-life summary

Game state lives in `src/game/`. Saves are local-only via AsyncStorage.
