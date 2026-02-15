# Emergency AI - Functionality Overview

This document lists the observable functionality of the project based on the current codebase.

## Core User Experience
- Single-page web app built with React and Vite.
- Chat-style interface for describing medical situations and receiving guidance.
- Message history displayed as user and assistant chat bubbles.
- Loading state shown while analysis is in progress.
- Emergency mode can be activated via an always-visible SOS button.

## AI Triage & Guidance
- User messages are sent to a backend `/api/analyze` endpoint for triage analysis.
- The backend uses the OpenAI Responses API with a medical triage system prompt.
- The model is instructed to return JSON only, either:
  - Follow-up questions (1–2 questions when symptoms are unclear), or
  - Severity classification, risk score, advice, and required disclaimer.
- The client parses the response:
  - If follow-up questions are present, they are shown to the user as the bot reply.
  - If severity is present, the bot shows:
    - Severity label
    - Risk score (0–100, rounded)
    - Advice and a medical disclaimer
  - If severity is `EMERGENCY`, emergency mode is automatically enabled.
- If the API request fails, a fallback message prompts the user to contact emergency services.

## First Aid Quick Guides
- The UI contains built-in, keyword-triggered first-aid cards for:
  - Heart attack
  - Stroke
  - Choking
  - Severe bleeding
  - Burns
- When a bot message contains matching keywords, a relevant first-aid card appears under the bot reply.

## Emergency Mode Actions
- Emergency panel appears when emergency mode is active.
- Displays:
  - "Possible medical emergency" banner
  - Risk score (from the most recent AI response, if available)
- Action buttons:
  - Call ambulance (`tel:108`)
  - Call selected emergency contact
  - Find nearest hospital (opens Google Maps search with current location)
  - Send location alert via SMS to selected contact
  - Show/Hide Medical Card

## Emergency Contacts
- Users can add emergency contacts (name + phone).
- Contacts are persisted in `localStorage` under `emergencyContacts`.
- The first stored contact becomes the default selection.
- Users can select a contact via radio buttons.
- "Call Emergency Contact" and "Send Location Alert" use the selected contact.

## Medical Card
- Users can enter and save a digital medical card with:
  - Full name
  - Blood group
  - Allergies
  - Medications
  - Medical conditions
  - Emergency contact
  - Insurance
- Medical card is persisted in `localStorage` under `medicalCard`.
- Card can be locked after saving (prevents editing).
- Card can be reset (clears data and unlocks).
- Medical card appears in two places:
  - Standard edit/preview section when not locked
  - A large emergency-mode card when emergency mode is active and the user toggles it on

## Voice Mode
- Optional voice input using the Web Speech API (SpeechRecognition).
- When enabled:
  - Listens continuously in English (en-US).
  - Recognized speech is sent as chat input automatically.
- If unsupported, the app shows a warning and disables voice mode.
- Bot responses can be spoken aloud using Speech Synthesis while voice mode is active.

## Location & Maps
- Uses browser geolocation:
  - "Find Nearest Hospital" opens Google Maps with a hospital search centered on user location.
  - "Send Location Alert" opens SMS with a Google Maps link to current coordinates.
- Shows error messages if geolocation is unsupported or permission is denied.

## Backend / API Endpoints
- Express server (local dev):
  - `GET /api/health` returns `{ ok: true }`.
  - `POST /api/analyze` accepts `{ messages: [...] }` and returns `{ text: "..." }`.
- Serverless API folder (for Vercel-style deployments):
  - `api/health.js` (health check).
  - `api/analyze.js` (same analysis flow as Express).
- Both endpoints require `OPENAI_API_KEY`.

## Configuration & Scripts
- `npm run dev` runs:
  - Vite dev server for the frontend
  - Express API server on port `5174` by default
- Environment:
  - `OPENAI_API_KEY` is required for analysis.
