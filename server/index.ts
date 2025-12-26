import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from "@google/genai";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const isProduction = process.env.NODE_ENV === 'production';
const PORT = isProduction ? 5000 : 3001;

app.use(cors());
app.use(express.json({ limit: '100mb' }));

if (isProduction) {
  app.use(express.static(path.join(__dirname, '../dist')));
}

interface AnalyzeRequest {
  title: string;
  synopsis: string;
  srtContent: string;
  questions: string[];
  language: 'en' | 'zh-TW';
  videoBase64?: string;
  videoMimeType?: string;
}

const FocalPointLogger = {
  info: (stage: string, data: any) => console.debug(`[FocalPoint][INFO][${stage}]`, data),
  warn: (stage: string, msg: string) => console.warn(`[FocalPoint][WARN][${stage}]`, msg),
  error: (stage: string, err: any) => console.error(`[FocalPoint][ERROR][${stage}]`, err)
};

const safeParseReport = (text: string): any => {
  try {
    return JSON.parse(text);
  } catch (e) {
    FocalPointLogger.warn("Parsing", "Response not pure JSON. Attempting structural extraction.");
    const start = text.indexOf('{');
    const end = text.lastIndexOf('}');
    if (start !== -1 && end !== -1 && end > start) {
      return JSON.parse(text.substring(start, end + 1));
    }
    throw new Error("PARSE_ERR: Model response format incompatible with internal schema.");
  }
};

app.post('/api/analyze', async (req, res) => {
  try {
    const { title, synopsis, srtContent, questions, language, videoBase64, videoMimeType } = req.body as AnalyzeRequest;

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: "Server configuration error: API key not set." });
    }

    if (!title || !title.trim()) {
      return res.status(400).json({ error: "Invalid project metadata: title is required." });
    }

    if (!videoBase64) {
      return res.status(400).json({ error: "Video asset is required for multimodal appraisal." });
    }

    const ai = new GoogleGenAI({ apiKey });
    const modelName = "gemini-2.5-flash";

    const parts: any[] = [];

    if (videoBase64) {
      parts.push({
        inlineData: {
          data: videoBase64,
          mimeType: videoMimeType || 'video/mp4'
        }
      });
    }

    const langName = language === 'zh-TW' ? 'Traditional Chinese (Taiwan)' : 'English';

    const userPrompt = `
      INSTRUCTIONS: Perform a professional indie film focus group appraisal.
      FILM: "${title}"
      SYNOPSIS: ${synopsis}
      CONTEXTUAL DIALOGUE: ${srtContent.substring(0, 5000)}

      GOALS:
      1. Executive critical summary (~300-500 words).
      2. Detailed timestamped observations (10 points).
      3. Direct responses to user-defined research objectives:
      ${questions.map((q, i) => `Objective ${i + 1}: ${q}`).join('\n')}
      
      CONSTRAINTS:
      - Respond strictly in ${langName}.
      - Ensure output is structured as valid JSON.
    `;

    parts.push({ text: userPrompt });

    const systemInstruction = `
      IDENTITY: You are a Senior Acquisitions Director at a major independent film distribution company.
      LENS: Acquisitions, pacing, and commercial viability.
      LANGUAGE: You MUST communicate your entire report in ${langName}.
    `;

    FocalPointLogger.info("API_Call", { model: modelName });

    const response = await ai.models.generateContent({
      model: modelName,
      contents: { parts },
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: { type: Type.STRING },
            highlights: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  timestamp: { type: Type.STRING },
                  seconds: { type: Type.NUMBER },
                  type: { type: Type.STRING, enum: ["highlight", "lowlight"] },
                  comment: { type: Type.STRING }
                },
                required: ["timestamp", "seconds", "type", "comment"]
              }
            },
            answers: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  question: { type: Type.STRING },
                  answer: { type: Type.STRING }
                },
                required: ["question", "answer"]
              }
            }
          },
          required: ["summary", "highlights", "answers"]
        }
      }
    });

    const report = safeParseReport(response.text || "{}");
    FocalPointLogger.info("API_Success", "Report synthesized and parsed.");

    res.json({
      personaId: "acquisitions_director",
      ...report
    });

  } catch (error: any) {
    FocalPointLogger.error("API_Call", error);
    res.status(500).json({ error: `Screening failed: ${error.message}` });
  }
});

if (isProduction) {
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../dist/index.html'));
  });
}

const host = isProduction ? '0.0.0.0' : 'localhost';
app.listen(PORT, host, () => {
  console.log(`[FocalPoint] Backend server running on http://${host}:${PORT}`);
});
