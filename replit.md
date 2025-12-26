# FocalPoint AI

## Overview
FocalPoint AI is a React + TypeScript + Vite application that provides advanced multimodal focus groups for professional indie creators. It uses Google's Gemini AI to analyze video content.

## Project Structure
- `/App.tsx` - Main application component
- `/index.tsx` - React entry point  
- `/index.html` - HTML template
- `/components/` - React components (Button, UploadForm, ProcessingQueue, ScreeningRoom)
- `/geminiService.ts` - Frontend service that calls the backend API
- `/server/index.ts` - Express backend server with Gemini API integration
- `/types.ts` - TypeScript type definitions
- `/constants.tsx` - Application constants and personas

## Tech Stack
- React 19
- TypeScript
- Vite 6 (build tool, dev server on port 5000)
- Express (backend API on port 3001)
- Tailwind CSS (via CDN)
- Google Gemini AI (@google/genai)

## Architecture
- Frontend runs on port 5000 (Vite dev server)
- Backend runs on port 3001 (Express server)
- Vite proxies `/api` requests to the backend
- API key is securely stored as GEMINI_API_KEY secret (never exposed to frontend)

### Video Upload Flow
1. Frontend uploads video file to `/api/upload` endpoint
2. Backend uses multer to receive file, uploads to Gemini Files API
3. Backend polls Gemini until video processing completes (up to 5 minutes)
4. Frontend receives file URI, sends to `/api/analyze` with project metadata
5. Backend uses `createPartFromUri` to reference video in Gemini request
6. Maximum video size: 2GB (enforced on frontend and backend)

## Development
- Run: `npm run dev` (starts both frontend and backend concurrently)
- Frontend only: `vite`
- Backend only: `npm run server`
- Build: `npm run build`

## Environment Variables
- `GEMINI_API_KEY` - Required Gemini API key (stored as secret, used by backend only)

## Deployment
Autoscale deployment - builds frontend with Vite, serves via Express backend.
