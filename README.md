# FinLife 💸
### Learn finance by living it. Not memorizing it.

##web app link:https://finlife-game.netlify.app/

##mobile app link:https://expo.dev/accounts/vaishnavichada/projects/finlife/builds/50ca4e5e-742f-413e-a69f-47ce154ab115

##live demo link:

**FinLife** is a mobile-first financial life simulator that transforms financial literacy from passive learning into an interactive experience. Instead of reading about budgeting, loans, investments, or fraud, players **live** through them.

Built as an immersive pixel-art game, FinLife lets players progress through different stages of life, from student years to retirement, making realistic financial decisions and instantly witnessing decades of consequences through a time-acceleration engine.

---

# Why FinLife?

Most financial literacy platforms focus on **teaching concepts**.

FinLife focuses on **training judgement.** Players experience how today's financial choices shape tomorrow's opportunities, stress, savings, and quality of life.
By compressing decades into minutes, FinLife makes long-term financial consequences visible, understandable, and memorable.

---

# Gameplay

Players journey through a structured life timeline where every chapter introduces new financial responsibilities and trade-offs.

## Life Progression

- Childhood Life
- Higher Education
- First Job
- Independent Living
- Family Responsibilities
- Investments & Wealth Building
- Retirement Planning

Each stage contains interactive scenarios where players choose between multiple financial decisions.

Examples include:

- Budgeting vs Impulse Spending
- Education Loans
- Credit Card Usage
- Emergency Funds
- Investments
- Insurance
- Digital Payment Fraud
- Lifestyle Inflation

---

# ⏳ Time Acceleration

FinLife's core mechanic is its **Time Acceleration Engine**.

Instead of waiting years to understand financial consequences, players watch months pass within seconds.

The simulation dynamically updates:

- 💰 Savings
- 📈 Investments
- 😌 Stress Level
- ❤️ Health
- 📊 Financial Stability

Players immediately understand the long-term impact of every decision.

# Technology Stack

| Layer | Technology |
|---------|------------|
| Mobile | Expo SDK 54 |
| Framework | React Native 0.81 |
| Navigation | Expo Router |
| State Management | React Context API |
| Local Storage | AsyncStorage |
| Design | Pixel-Art UI |
| Audio | 8-bit Synthesized SFX |

---

# Architecture

```
                    Player
                       │
                       ▼
                React Native App
                       │
        ┌──────────────┴──────────────┐
        ▼                             ▼
 Game Engine                 UI Components
        │                             │
        ▼                             ▼
 Decision System           Pixel Interface
        │
        ▼
 Time Acceleration Engine
        │
        ▼
 Financial Simulation
        │
        ▼
 AsyncStorage (Local Save)

```

---

# Project Structure

```
finLife/
│
├── frontend/
│   ├── app/                 # Expo Router screens
│   ├── assets/
│   ├── components/
│   ├── hooks/
│   ├── contexts/
│   ├── services/
│   └── game/
│
└── README.md
```

---

# Getting Started

## Frontend

```bash
cd frontend

npm install

npm start
```

Run using:

- Expo Go
- Android Emulator
- iOS Simulator
- Web Preview

---

## Backend

The current MVP is **fully offline** and stores all progress locally.

The backend is a scaffold for future features such as:

- Cloud Saves
- Leaderboards
- Analytics
- Personalized AI Feedback
- Multiplayer Challenges

---

All rights reserved © finLife
