# AdaptiveMind AI

An evidence-informed adaptive learning system. AdaptiveMind uses a "Learning DNA" model to track which explanation approaches — visuals, examples, analogies, stories, or challenges — measurably improve understanding for each learner. It starts with an initial hypothesis from a short assessment, then continuously refines its recommendations based on actual lesson outcomes.

## Key Features

### Learning DNA 2.0
A data model that combines **stated preference** (from the initial assessment) with **observed effectiveness** (from lesson outcomes). As you complete lessons, observed evidence gradually outweighs the initial hypothesis. The system tracks per-approach: usage count, success rate, average score, confidence calibration, hint requests, and retries.

### Mode-Effectiveness Engine (Thompson Sampling)
Uses Thompson sampling to balance **exploration** (trying approaches that haven't been tested enough) with **exploitation** (using approaches that have worked). Each approach maintains a Beta distribution; selection probability naturally widens when evidence is sparse and narrows as data accumulates.

### Bayesian Knowledge Tracing (Mastery)
Each skill tracks `P(Knows)`, `P(Learn)`, `P(Guess)`, and `P(Slip)`. After every understanding check, Bayes' theorem updates the probability that the learner has mastered the skill. Mastery labels range from "new" through "developing" to "mastered," with a "needs-review" state when recent performance drops.

### Confidence Calibration
Learners report confidence before understanding checks. The system compares self-reported confidence against actual performance to identify patterns: well-calibrated, overconfident, or underconfident. Feedback is supportive, not judgmental.

### Explain Back
After a lesson, learners can explain the concept in their own words. Ada evaluates the explanation for completeness, identifies misconceptions, and asks a follow-up question — mirroring good tutoring practice.

### Hint Ladder
Four levels of hints (nudge → direction → scaffold → full solution) with a **productive struggle gate**: after level 3, the system checks whether the learner wants to keep trying or see the answer. Hints are tracked as evidence of difficulty.

### Spaced Review (SM-2)
After each lesson, an SM-2 review card is created. Cards reschedule based on quality of recall: perfect recall extends the interval, poor recall resets it. Ease factor adjusts per card. The dashboard shows due and upcoming reviews.

### Reading Preferences
Configurable text size, line spacing, content width, visual density, and high-contrast mode. Settings persist in localStorage.

### AI Integration
Connects to any OpenAI-compatible API (configurable via `AI_API_KEY`, `AI_BASE_URL`, `AI_MODEL`). Falls back to a built-in demo mode when no API key is configured. Three AI-powered actions: lesson generation, understanding evaluation, and explain-back evaluation.

## Architecture

| Layer | Description |
|-------|-------------|
| `app/` | Next.js App Router pages: landing, assessment, tutor, dashboard |
| `components/` | React components organized by feature area |
| `lib/` | Core algorithms and data models (no React dependencies) |
| `__tests__/` | Deterministic algorithm tests (Vitest) |
| `app/api/` | API routes for AI-powered tutor interactions |

### Core Libraries (`lib/`)

| File | Purpose |
|------|---------|
| `learning-dna-v2.ts` | LD2.0 data model, migration, evidence tracking, recommendations |
| `mode-effectiveness.ts` | Thompson sampling approach selection |
| `mastery-v2.ts` | Bayesian Knowledge Tracing |
| `confidence-calibration.ts` | Self-report vs actual performance analysis |
| `spaced-review.ts` | SM-2 spaced repetition scheduler |
| `adaptive-prompt.ts` | AI prompt engineering for Ada |
| `learning-dna.ts` | Original Learning DNA assessment and scoring |

## Getting Started

### Prerequisites
- Node.js 18+
- An OpenAI-compatible API key (optional — demo mode works without one)

### Setup

```bash
npm install
```

### Environment Variables

```bash
# AI provider (optional — demo mode if omitted)
AI_API_KEY=your-api-key
AI_BASE_URL=https://generativelanguage.googleapis.com/v1beta/openai  # Gemini example
AI_MODEL=gemini-2.5-flash
```

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Tests

```bash
npm test
```

### Build

```bash
npm run build
```

## Data Storage

All learner data is stored locally in the browser via `localStorage`:

- `adaptivemind-learning-dna` — Initial assessment profile
- `adaptivemind-learning-dna-v2` — Evidence-based Learning DNA model
- `adaptivemind-current-lesson` — Active lesson session
- `adaptivemind-lesson-conversation` — Conversation history
- `adaptivemind-learning-history` — Lesson history and mastery
- `adaptivemind-spaced-review` — SM-2 review cards
- `adaptivemind-reading-preferences` — Display preferences
- `adaptivemind-study-plans` — Study plan data

No account is required. No data leaves the browser except during AI lesson generation (where the topic and Learning DNA data are sent to the configured AI provider).

## Tech Stack

- **Framework:** Next.js 16 (App Router)
- **UI:** React 19, Tailwind CSS 4
- **3D Visualization:** React Three Fiber + drei (with 2D SVG fallback)
- **Animation:** Motion (Framer Motion successor)
- **AI:** OpenAI-compatible API (supports Gemini, OpenAI, etc.)
- **Testing:** Vitest
- **Typography:** Geist & Lora fonts
