# FocalPoint AI

AI-powered focus group feedback for indie filmmakers using Google's Gemini AI.

## Features

- **Multi-Persona Analysis** - Four AI reviewers with distinct perspectives
- **YouTube URL Support** - Paste public URLs for instant analysis
- **Large Video Upload** - Up to 2GB with server-side compression
- **Timestamped Feedback** - Highlights and concerns linked to exact moments
- **Voice Notes** - Audio summaries from each reviewer
- **Podcast Dialogues** - Two-reviewer conversations (English only)
- **Multi-Language** - English and Traditional Chinese

## Personas

| Persona | Focus |
|---------|-------|
| Acquisitions Director | Commercial viability, marketability |
| Cultural Editor | Artistic merit, representation |
| Mass Audience Viewer | Clarity, engagement |
| Social Impact Viewer | Message effectiveness, ethics |

## Quick Start

```bash
npm install
npm run db:push
npm run dev
```

Set API keys: `GEMINI_API_KEY`, `ELEVENLABS_API_KEY`, `YOUTUBE_API_KEY`

Open http://localhost:5000

## Tech Stack

- React 19, TypeScript, Vite, Tailwind CSS
- Express.js backend
- Google Gemini AI, ElevenLabs TTS
- PostgreSQL + Drizzle ORM
- Replit Object Storage

## API Endpoints

| Endpoint | Description |
|----------|-------------|
| `POST /api/uploads/init` | Initialize upload |
| `POST /api/analyze` | Run video analysis |
| `GET /api/personas` | List personas |
| `POST /api/sessions/:id/reports/:personaId/voice-script` | Generate voice note |
| `POST /api/dialogue/create` | Start podcast generation |

## License

MIT
