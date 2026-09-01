import {
  Platform,
} from 'react-native';

// ==========================================
// SMARTFINE API CONFIGURATION
// ==========================================

// Public tunnel for phones/tablets.
// Keep ngrok running while testing.
const NGROK_API =
  'https://your-tunnel.example.com';

// ==========================================
// API BASE
//
// Web:
// Uses localhost because the backend is
// running on the same computer.
//
// Mobile / Tablet:
// Uses ngrok so it can work from another
// Wi-Fi or mobile data.
// ==========================================

export const API_BASE =
  Platform.OS === 'web'
    ? 'http://localhost:3000'
    : NGROK_API;