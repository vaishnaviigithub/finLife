# FinLife

A mobile-first **financial life simulator** in 8-bit pixel-art style. Players make decisions at every life stage and watch decades of compound consequences unfold in seconds.

## Features

- Cinematic 7-beat onboarding intro
- Duolingo-style curved roadmap with 3 chapters (9 scenarios, 27 choices)
- Narrated time-acceleration sequences with animated stats
- Local-only save via AsyncStorage (no account required)
- 8-bit synthesised SFX and pixel-art UI

## Tech stack

| Layer    | Stack                                      |
| -------- | ------------------------------------------ |
| Mobile   | Expo SDK 54, React Native 0.81, expo-router |
| State    | React context + AsyncStorage               |
| Backend  | FastAPI + MongoDB (optional, unused by MVP) |

## Getting started

### Frontend (required)

```bash
cd frontend
npm install
npm start
```

Then open in Expo Go, an emulator, or the web preview.

### Backend (optional)

The current MVP runs entirely on-device. The backend is a scaffold for future features.

```bash
cd backend
python -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
```

Create `backend/.env`:

```
MONGO_URL=mongodb://localhost:27017
DB_NAME=finlife
```

Run the server:

```bash
uvicorn server:app --reload
```

## Project structure

```
finLife/
├── frontend/          # Expo app (main product)
│   ├── app/           # expo-router screens
│   └── src/           # game logic, components, UI
├── backend/           # FastAPI API scaffold
└── memory/PRD.md      # Product requirements
```

## License

Private — all rights reserved.
