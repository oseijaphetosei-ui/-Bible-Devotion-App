# Daily Devotion

A React Native daily devotion app with Bible reading, AI-powered Scripture study, stories, notes, community features, and spiritual goal tracking.

## Features

- Daily devotions with scripture and reflection
- Full Bible reader with local and API-backed translations
- AI-powered Scripture chat and devotion generation
- Audio and text faith stories
- Spiritual reading plans and goal tracking
- Notes, community posts, and chat screens
- Profile and appearance customization
- Text-to-speech support through Firebase Cloud Functions

## Tech Stack

- **Frontend:** React Native with TypeScript and Expo
- **Backend:** Firebase / Cloud Functions
- **AI:** Google Gemini via Firebase Functions
- **Text to speech:** Google Cloud Text-to-Speech
- **Bible Data:** Local JSON plus API.Bible configuration

## Getting Started

### Prerequisites

- Node.js >= 18
- Expo CLI through `npx expo`
- Firebase project with Cloud Functions enabled
- Gemini API key stored as a Firebase Functions secret
- Google Cloud Text-to-Speech credentials available to the Functions runtime
- Optional API.Bible key for remote Bible data

### Setup

1. Clone the repo and run `npm install`
2. Copy the config examples in `src/config/*.example.ts` to their non-example filenames and fill in local values
3. Install Functions dependencies with `cd functions && npm install`
4. Set the Gemini Functions secret with `firebase functions:secrets:set GEMINI_API_KEY`
5. Run the app with `npx expo start`

### Firebase Setup

1. Create a Firebase project at [console.firebase.google.com](https://console.firebase.google.com)
2. Create a Firestore database if you plan to use community, chat, notes, or profile persistence
3. Enable Google Cloud Text-to-Speech for the project
4. Deploy Cloud Functions: `cd functions && npm run build && firebase deploy --only functions`

## Project Structure

```
Bible-Devotion-App/
├── src/
│   ├── assets/           # Images, fonts, and static files
│   ├── components/       # Reusable UI components
│   ├── context/          # React context providers
│   ├── config/           # Local API and Firebase config
│   ├── hooks/            # Custom React hooks
│   ├── screens/          # App screens
│   │   ├── Home/         # Home/dashboard screen
│   │   ├── Devotion/     # Daily devotion screen
│   │   ├── Bible/        # Bible reader screen
│   │   ├── ScriptureChat/# AI Scripture study screen
│   │   ├── Stories/      # Faith stories screen
│   │   ├── Goals/        # Spiritual goals screen
│   │   ├── Notes/        # Notes screens
│   │   ├── Community/    # Community feed screens
│   │   └── Profile/      # Profile and settings screens
│   ├── services/         # API and Firebase service calls
│   ├── types/            # TypeScript type definitions
│   └── data/             # Local Bible and app data
├── functions/            # Firebase Cloud Functions
├── App.tsx               # App entry point
└── package.json
```

## Environment Variables

Do not commit `.env` or local config files. The app uses ignored local config files in `src/config/`, and Cloud Functions use Firebase secrets for server-side keys.

## API Access

- Client-facing API calls are centralized in `src/services/appApi.ts`.
- Bible chat, devotion generation, and TTS all go through Firebase callable functions.
- Server-side secrets stay in Firebase Functions, so the app never needs direct Gemini or TTS credentials in the client.
- `src/services/ttsService.ts` handles caching and playback for spoken Bible content.

## License

MIT
