import {
  Platform,
} from 'react-native';

// ==========================================
// SMARTFINE API CONFIGURATION
// ==========================================

// Public HTTPS address for phones/tablets (for example an ngrok tunnel to
// the backend on your computer). Set it in the project's .env file:
//
//   EXPO_PUBLIC_API_URL=https://your-tunnel.example.com
//
// EXPO_PUBLIC_ values are built into the app, so only put the URL here,
// never a secret. EAS builds do not read .env: set the same variable in
// eas.json ("env") or in the project's EAS environment variables.
const PHONE_API = (
  process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000'
).replace(/\/+$/, '');

// ==========================================
// API BASE
//
// Web:
// Uses localhost because the backend is
// running on the same computer.
//
// Mobile / Tablet:
// Uses EXPO_PUBLIC_API_URL so it can work
// from another Wi-Fi or mobile data.
// ==========================================

export const API_BASE =
  Platform.OS === 'web'
    ? 'http://localhost:3000'
    : PHONE_API;
