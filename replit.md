# FocalPoint AI

## Overview
FocalPoint AI is a React + TypeScript + Vite application that provides advanced multimodal focus groups for professional indie creators. It uses Google's Gemini AI to analyze video content.

## Project Structure
- `/App.tsx` - Main application component
- `/index.tsx` - React entry point
- `/index.html` - HTML template
- `/components/` - React components (Button, UploadForm, ProcessingQueue, ScreeningRoom)
- `/geminiService.ts` - Gemini AI integration service
- `/types.ts` - TypeScript type definitions
- `/constants.tsx` - Application constants and personas

## Tech Stack
- React 19
- TypeScript
- Vite 6 (build tool)
- Tailwind CSS (via CDN)
- Google Gemini AI (@google/genai)

## Development
- Run: `npm run dev` (starts on port 5000)
- Build: `npm run build` (outputs to dist/)
- Preview: `npm run preview`

## Environment Variables
- `GEMINI_API_KEY` - Required for Gemini AI functionality (paid tier API key needed)

## Deployment
Static deployment configured - builds with Vite and serves from `dist/` directory.
