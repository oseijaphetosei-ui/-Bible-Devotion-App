# Bible Devotion App

A React Native daily devotion app with AI-powered Bible study, stories, reading plans, and spiritual goal tracking.

## Features

- Daily devotions with scripture and reflection
- Full Bible reader with verse bookmarking
- AI-powered Bible assistant (Claude)
- Audio and text faith stories
- Spiritual reading plans and goal tracking
- Daily push notifications
- Firebase authentication (email, Google)

## Tech Stack

- **Frontend:** React Native (TypeScript) with Expo
- **Backend:** Firebase (Auth, Firestore, Cloud Functions, Storage)
- **AI:** Claude API (Anthropic)
- **Bible Data:** Local JSON / Bible API
- **Notifications:** Firebase Cloud Messaging

## Getting Started

### Prerequisites

- Node.js >= 18
- Expo CLI (`npm install -g expo-cli`)
- Firebase project set up
- Anthropic API key

### Setup

1. Clone the repo and run `npm install`
2. Copy `.env.example` to `.env` and fill in your keys
3. Add your `google-services.json` (Android) and `GoogleService-Info.plist` (iOS) to the respective directories
4. Run `npx expo start`

### Firebase Setup

1. Create a Firebase project at [console.firebase.google.com](https://console.firebase.google.com)
2. Enable Authentication (Email/Password, Google)
3. Create a Firestore database
4. Deploy Cloud Functions: `cd backend/functions && npm install && firebase deploy --only functions`
5. Deploy Firestore rules: `firebase deploy --only firestore:rules`

## Project Structure

```
Bible-Devotion-App/
├── src/
│   ├── assets/           # Images, fonts, and static files
│   ├── components/       # Reusable UI components
│   ├── context/          # React context providers
│   ├── firebase/         # Firebase configuration and helpers
│   ├── hooks/            # Custom React hooks
│   ├── navigation/       # Navigation setup (React Navigation)
│   ├── screens/          # App screens
│   │   ├── Auth/         # Login and registration
│   │   ├── Home/         # Home/dashboard screen
│   │   ├── Devotion/     # Daily devotion screen
│   │   ├── Bible/        # Bible reader screen
│   │   ├── Assistant/    # AI Bible assistant screen
│   │   ├── Stories/      # Faith stories screen
│   │   ├── Goals/        # Spiritual goals screen
│   │   └── Settings/     # App settings
│   ├── services/         # API and Firebase service calls
│   ├── types/            # TypeScript type definitions
│   └── utils/            # Utility/helper functions
├── App.tsx               # App entry point
└── package.json
```

## Environment Variables

See `.env` for required keys.

## License

MIT