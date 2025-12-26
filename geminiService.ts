
import { GoogleGenAI, Type } from "@google/genai";
import { Persona, AgentReport, Project } from "./types";

/**
 * FocalPoint Internal Logger for Debugging & Performance Monitoring
 */
const FocalPointLogger = {
  info: (stage: string, data: any) => console.debug(`[FocalPoint][INFO][${stage}]`, data),
  warn: (stage: string, msg: string) => console.warn(`[FocalPoint][WARN][${stage}]`, msg),
  error: (stage: string, err: any) => console.error(`[FocalPoint][ERROR][${stage}]`, err)
};

/**
 * Security Audit: Ensures all necessary credentials and data points are valid.
 */
const securityAudit = (project: Project) => {
  if (!process.env.API_KEY) {
    throw new Error("SEC_ERR_01: API Configuration Missing.");
  }
  if (!project.title || project.title.trim().length === 0) {
    throw new Error("DATA_ERR_01: Invalid Project Metadata.");
  }
  if (!project.videoFile) {
    throw new Error("DATA_ERR_02: Video asset is required for multimodal appraisal.");
  }
};

/**
 * Safely converts video file to Base64 for the Gemini API.
 */
export const fileToBytes = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    FocalPointLogger.info("Asset_Ingest", { name: file.name, size: `${(file.size / 1024 / 1024).toFixed(2)} MB` });
    
    // Safety check: 1GB limit for browser strings to prevent crash
    if (file.size > 1024 * 1024 * 1024) {
      return reject(new Error("MEM_ERR: File exceeds 1GB. Please use a compressed proxy for web-based appraisal."));
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      if (!result) return reject(new Error("FILE_ERR: Stream read resulted in null output."));
      const base64 = result.split(',')[1];
      FocalPointLogger.info("Asset_Encoding", "Base64 stream generated successfully.");
      resolve(base64);
    };
    reader.onerror = () => {
      FocalPointLogger.error("Asset_Encoding", "Critical failure reading local file stream.");
      reject(new Error("FILE_ERR: Resource inaccessible or corrupted."));
    };
    reader.readAsDataURL(file);
  });
};

/**
 * Fallback parser for JSON output.
 */
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

export const generateAgentReport = async (
  persona: Persona,
  project: Project,
  videoBase64?: string
): Promise<AgentReport> => {
  // Pre-flight security and data check
  securityAudit(project);

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const modelName = "gemini-3-flash-preview"; 

  const parts: any[] = [];

  // Inject Video Modality
  if (videoBase64) {
    parts.push({
      inlineData: {
        data: videoBase64,
        mimeType: project.videoFile?.type || 'video/mp4'
      }
    });
  }

  const langName = project.language === 'zh-TW' ? 'Traditional Chinese (Taiwan)' : 'English';

  const userPrompt = `
    INSTRUCTIONS: Perform a professional indie film focus group appraisal.
    FILM: "${project.title}"
    SYNOPSIS: ${project.synopsis}
    CONTEXTUAL DIALOGUE: ${project.srtContent.substring(0, 5000)}

    GOALS:
    1. Executive critical summary (~300-500 words).
    2. Detailed timestamped observations (10 points).
    3. Direct responses to user-defined research objectives:
    ${project.questions.map((q, i) => `Objective ${i+1}: ${q}`).join('\n')}
    
    CONSTRAINTS:
    - Respond strictly in ${langName}.
    - Ensure output is structured as valid JSON.
  `;

  parts.push({ text: userPrompt });

  const systemInstruction = `
    IDENTITY: You are ${persona.name}, ${persona.role}. 
    PROFILE: ${persona.description}
    LENS: Acquisitions, pacing, and commercial viability.
    LANGUAGE: You MUST communicate your entire report in ${langName}.
  `;

  FocalPointLogger.info("API_Call", { persona: persona.name, model: modelName });

  try {
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
    return {
      personaId: persona.id,
      ...report
    };
  } catch (error: any) {
    FocalPointLogger.error("API_Call", error);
    throw new Error(`Screening failed: ${error.message}`);
  }
};
