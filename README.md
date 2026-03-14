# Plantopia 🌿

An AI-powered plant care companion for iOS and Android. Scan any plant, get instant identification, and track your garden's health — all in one place.

## Features

- **AI Plant Identification** — point your camera at any plant for instant species ID, confidence score, and care data
- **Garden Map** — visual 6×6 grid showing your plants with animated SVG icons
- **Care Reminders** — auto-generated watering and fertilizing tasks with due-date tracking
- **Health Tracking** — per-plant health rings, water/fertilizer status, and care history
- **Garden Analytics** — health score, plant-type breakdown, and care overview stats
- **AI Botanist** — chat assistant for plant care questions
- **Auth** — email/password sign-up with Supabase, onboarding flow

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | React Native + Expo (SDK 52) |
| Routing | Expo Router (file-based) |
| Backend | Supabase (auth, Postgres, storage) |
| State | TanStack Query |
| AI | Claude (plant identification, botanist chat) |
| Graphics | react-native-svg |
| Language | TypeScript |

## Getting Started

### Prerequisites

- Node.js 18+
- Expo CLI — `npm install -g expo-cli`
- Expo Go app on your phone (for development)

### Install

```bash
npm install
```

### Environment

Create a `.env` file in the project root:

```env
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Run

```bash
# Start dev server
npx expo start

# Run on iOS simulator
npx expo start --ios

# Run on Android emulator
npx expo start --android

# Run on physical device via tunnel
npx expo start --tunnel
```

## Project Structure

```
app/
├── _layout.tsx          # Root layout, auth routing
├── landing.tsx          # Landing page
├── auth/
│   ├── sign-in.tsx
│   └── sign-up.tsx
├── onboarding.tsx
├── scan.tsx             # Camera + AI identification
├── plant/[id].tsx       # Plant detail
└── (tabs)/
    ├── index.tsx        # Library (home)
    ├── garden.tsx       # Garden map + analytics
    ├── reminders.tsx    # Care task list
    ├── botanist.tsx     # AI chat
    └── profile.tsx

components/
├── garden/
│   ├── GardenGrid.tsx   # 6x6 soil grid
│   └── PlantIcon.tsx    # Animated SVG plant icons
├── ReminderItem.tsx
└── CareGuide.tsx

services/
├── aiService.ts         # Claude API calls
├── visionService.ts     # Image upload + plant save
├── plantService.ts
└── reminderService.ts

hooks/
├── usePlants.ts
└── useTasks.ts

supabase/functions/
├── identify-plant/      # Plant identification edge function
├── generate-care/       # Care plan generation
└── botanist-chat/       # AI chat edge function
```

## Database Schema

```
plants          — user's saved plants
plant_care      — care settings per plant (watering, light, fertilizer)
tasks           — watering/fertilizing reminders
chat_messages   — botanist conversation history
```

## Supabase Edge Functions

Deploy with:

```bash
supabase functions deploy identify-plant
supabase functions deploy generate-care
supabase functions deploy botanist-chat
```
