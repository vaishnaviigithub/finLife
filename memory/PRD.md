# FinLife — Product Requirements Document

A mobile-first **financial life simulator** in 8-bit / Minecraft pixel-art style. Players make decisions at every life stage and watch decades of compound consequences unfold in seconds.

## Current Status: MVP v0.3 — 3 chapters polished + cinematic 7-beat onboarding

### Implemented
- **Cinematic 7-beat onboarding intro** (`app/intro.tsx`) — plays on first launch, gated by `state.introCompleted`. A skip button is always visible top-right with a confirmation modal that still funnels users into the name-entry beat (never skips identity).
  - **Beat 1 — Hook**: Rising glowing ₹ symbols, word-by-word tagline "Everyone earns money. Almost nobody is taught what to do with it.", then a chunky 8-bit glass-shatter that reveals the pixel village world with the avatar peeking through.
  - **Beat 2 — What is Personal Finance?**: Pixel-art TV cycles through 6 animated icons (Earning, Spending, Saving, Investing, Protecting, Planning), arranges them in a circle, then displays the definition. Avatar reacts with a lightbulb.
  - **Beat 3 — The Real Problem**: Split-screen comic strip (WITH vs WITHOUT money sense), four life-panels per side, ending with the grey side bleeding into colour and "UNTIL NOW." in orange.
  - **Beat 4 — The World**: A zooming 7-stage life map with emoji vignettes (Childhood → Retirement) lighting up sequentially with full-sentence narration that ends on "THIS IS YOUR FINANCIAL LIFE. YOU'RE IN CHARGE."
  - **Beat 5 — How It Works**: Three interactive tutorial cards (SITUATION / DECISION / CONSEQUENCE). Each requires interaction — tap to open the gift box, choose one of two pixel options, press play to see a 2-second mini time-acceleration with rolling counters.
  - **Beat 6 — The Stakes**: Two parallel consequence chains animate side-by-side (WITH HABITS vs WITHOUT). The same age-43 health crisis ends with ₹0 vs ₹12L gone. Ends with "ONE DECISION. DECADES OF DIFFERENCE."
  - **Beat 7 — Let's Begin**: Speech-bubble name capture with pixel avatar. Confetti burst on submit. "Skip — call me Player" option for the impatient. Personalised greeting appears, then auto-redirects into the roadmap.
  - Progress dots at bottom (current = glowing orange), 8-bit SFX, haptics, pulsing "TAP TO CONTINUE", auto-advance where appropriate.
- **Duolingo-style curved roadmap home** with personalised "HI [NAME] ▸ YOUR JOURNEY" header, winding stepping-stone paths between 3 zig-zagged nodes per chapter, 3 illustrated Indian landscapes (VILLAGE/NEIGHBOURHOOD/CAMPUS), avatar bobbing on current node, locked future chapters dim with padlocks.
- **Explicit 4-beat scenario structure** (`app/play.tsx`): SITUATION → DECISION → CONSEQUENCE (narrated) → LESSON (with concept tag). Top progress indicator + sectioned headers.
- **Narrated Time Acceleration**: STEP X / N progress bar, one event per card, one stat at a time with animated counter + ± delta pill, turning-point card for future-triggered compound bonuses.
- **3 chapters, 9 scenarios, 27 hand-crafted choices** with `consequenceText` + `lesson` + `concept` per choice. 15 consequence-chain flags carry forward.
- **Local-only AsyncStorage** save (no auth, no backend writes). Reset preserves player name + intro flag so users never repeat onboarding.
- **8-bit synthesised SFX** (base64 WAV, no audio assets), pixel art components, pixel fonts (Silkscreen + VT323) loaded locally.
- **Summary screen** with letter grade, stats grid, flag chips, life timeline.

### Next Action Items
1. Add Chapters 4-7 (First Job, Mid-life, Crisis, Retirement)
2. Replay individual completed nodes from the roadmap (today's tap restarts the whole chapter)
3. Shareable "Financial DNA" card at end of life (organic Instagram/WhatsApp story growth)
4. Optional "Watch intro again" link on roadmap for users who want to replay the onboarding
5. Note: 8-bit SFX play correctly on native (Expo Go) but may be muted on web preview due to browser autoplay policies — no impact on functionality

## Tech Stack
- Expo SDK 54, React Native 0.81, expo-router
- React-native-reanimated (intro animations, time-acceleration, roadmap)
- AsyncStorage (local save)
- expo-audio + base64 WAVs (SFX)
- FastAPI/Mongo (unchanged, unused by current MVP)
