# Architecture

## System Overview

```
Browser (React) → Vite Proxy → Express Backend → Gemini AI
                                    ↓
                              PostgreSQL + Object Storage + ElevenLabs
```

## Components

### Frontend (port 5000)
React + TypeScript + Vite. Handles video upload, session management, report display, and audio playback.

**Key components**: `UploadForm`, `ScreeningRoom`, `VoicePlayer`, `DialoguePlayer`

### Backend (port 3001)
Express server with modular routes. Vite proxies `/api/*` requests.

**Routes**: sessions, reports, voice, analyze, uploads, dialogue

### External Services
- **Gemini AI**: Video analysis with persona-specific prompts
- **ElevenLabs**: Text-to-speech for voice notes and podcast dialogues
- **YouTube Data API**: URL validation before analysis

## Data Flow

### Video Upload
1. Browser uploads to Object Storage (presigned URL)
2. Server compresses to 720p/10fps proxy
3. Server transfers proxy to Gemini
4. Analysis ready when Gemini file is ACTIVE

### Analysis
1. Frontend sends fileUri + selected personas
2. Backend runs parallel Gemini calls per persona
3. Each persona returns: summary, 5 highlights, 5 concerns, answers
4. Reports saved to PostgreSQL

### Voice Notes
1. Generate structured script from report
2. LLM naturalizes to speech-native prose
3. ElevenLabs converts to audio
4. Audio stored in Object Storage

## Database Tables
- `sessions` - Video metadata, questions, language
- `reports` - Analysis results per persona
- `voice_scripts` - Cached scripts + audio URLs
- `dialogue_jobs` - Podcast generation jobs
- `uploads` - Upload state machine tracking

## Personas
Four AI reviewers with distinct focus areas:
- **Acquisitions Director**: Commercial viability
- **Cultural Editor**: Artistic merit, representation
- **Mass Audience Viewer**: Clarity, engagement
- **Social Impact Viewer**: Message effectiveness
