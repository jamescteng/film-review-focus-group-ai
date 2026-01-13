# FocalPoint AI

## Overview
AI-powered focus group platform for indie filmmakers. Analyzes videos through multiple AI personas, each providing timestamped feedback. Features voice notes and podcast dialogues between reviewers.

## Tech Stack
- **Frontend**: React 19 + TypeScript + Vite (port 5000), Tailwind CSS
- **Backend**: Express (port 3001), Vite proxies `/api` requests
- **AI**: Google Gemini (`gemini-3-pro-preview`)
- **TTS**: ElevenLabs (`eleven_v3` English, `eleven_multilingual_v2` zh-TW)
- **Database**: PostgreSQL + Drizzle ORM
- **Storage**: Replit Object Storage

## Key Files

### Server
- `server/index.ts` - Express entry, mounts routes
- `server/routes/` - sessions, reports, voice, analyze endpoints
- `server/uploadRoutes.ts` - Upload flow + Gemini transfer
- `server/services/videoCompressor.ts` - FFmpeg 720p/10fps compression
- `server/personas.ts` - AI persona configs
- `server/geminiService.ts` - Gemini API integration
- `server/elevenLabsService.ts` - TTS integration

### Frontend
- `components/ScreeningRoom.tsx` - Main session view
- `components/UploadForm.tsx` - Video upload + metadata
- `components/VoicePlayer.tsx` - Voice note playback
- `components/DialoguePlayer.tsx` - Podcast playback
- `src/i18n.ts` + `src/locales/` - i18n (English, zh-TW)

### Shared
- `shared/schema.ts` - Drizzle database schema

## External Services
- **Gemini AI**: Video analysis
- **YouTube Data API v3**: URL validation
- **ElevenLabs**: Voice notes + podcast dialogues (English only for dialogues)
- **Replit Object Storage**: Video uploads, audio files

## Secrets
`GEMINI_API_KEY`, `YOUTUBE_API_KEY`, `ELEVENLABS_API_KEY`
