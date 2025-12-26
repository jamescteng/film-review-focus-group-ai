
import { GoogleGenAI, Type } from "@google/genai";
import { Persona, AgentReport, Project } from "./types";

/**
 * Security and Debugging Utility
 */
const FocalPointDebug = {
  log: (stage: string, message: any) => {
    console.debug(`[FocalPoint DEBUG][${stage}]`, message);
  },
  error: (stage: string, error: any) => {
    console.error(`[FocalPoint ERROR][${stage}]`, error);
  }
};

/**
 * Validates the runtime environment and project data for security.
 */
const validateContext = (project: Project) => {
  if (!process.env.API_KEY) {
    throw new Error("AUTH_ERR: API Key is not configured in the environment.");
  }
  if (!project.title || project.title.trim().length === 0) {
    throw new Error("DATA_ERR: Project title is mandatory.");
  }
  if (!project.videoFile) {
    throw new Error("DATA_ERR: No video asset provided for analysis.");
  }
};

/**
 * Converts file to Base64 with integrity and size checks.
 */
export const fileToBytes = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    FocalPointDebug.log("Ingest", `Processing ${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)`);
    
    // Safety check for browser memory limits (2GB hard cap, but 1GB is safer for strings)
    if (file.size > 1.5 * 1024 * 1024 * 1024) {
      return reject(new Error("LIMIT_ERR: File size exceeds browser memory limits for direct processing."));
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      if (!result) return reject(new Error("FILE_ERR: Null result from reader."));
      
      const base64 = result.split(',')[1];
      FocalPointDebug.log("Encoding", "Base64 conversion successful.");
      resolve(base64);
    };
    reader.onerror = () => reject(new Error("FILE_ERR: Failed to read asset stream. Check file permissions."));
    reader.readAsDataURL(file);
  });
};

/**
 * Robust JSON extraction for non-standard model outputs.
 */
const extractJSON = (text: string) => {
  try {
    return JSON.parse(text);
  } catch (e) {
    FocalPointDebug.log("Parsing", "Response not pure JSON, attempting pattern match extraction.");
    const firstBrace = text.indexOf('{');
    const lastBrace = text.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      const cleanJson = text.substring(firstBrace, lastBrace + 1);
      return JSON.parse(cleanJson);
    }
    throw new Error("PARSE_ERR: Model failed to provide a valid JSON report.");
  }
};

export const generateAgentReport = async (
  persona: Persona,
  project: Project,
  videoBase64?: string
): Promise<AgentReport> => {
  validateContext(project);

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const model = "gemini-3-flash-preview"; 

  const parts: any[] = [];

  // Add video as inline data
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
    TASK: Comprehensive Indie Film Appraisal
    TITLE: "${project.title}"
    SYNOPSIS: ${project.synopsis}
    DIALOGUE_CONTEXT: ${project.srtContent.substring(0, 5000)}

    INSTRUCTIONS:
    1. Provide an Executive Summary (approx 300-400 words).
    2. List 10 specific timestamped highlights/lowlights based on visual and narrative cues.
    3. Respond to these focus group objectives:
    ${project.questions.map((q, i) => `${i+1}. ${q}`).join('\n')}
    
    OUTPUT REQUIREMENTS:
    - Respond strictly in ${langName}.
    - Return ONLY a valid JSON object.
  `;

  parts.push({ text: userPrompt });

  const systemInstruction = `
    You are ${persona.name}, ${persona.role}. 
    PROFILE: ${persona.description}
    LENS: Acquisitions & Market Readiness.
    STRICT: You must provide your analysis in ${langName}. No English unless requested or technical terms are untranslatable.
  `;

  FocalPointDebug.log("API_REQUEST", { persona: persona.name, language: langName });

  try {
    const response = await ai.models.generateContent({
      model,
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

    const result = extractJSON(response.text || "{}");
    FocalPointDebug.log("API_SUCCESS", "Report generated and parsed successfully.");
    return {
      personaId: persona.id,
      ...result
    };
  } catch (error: any) {
    FocalPointDebug.error("API_FAILURE", error);
    throw new Error(`Report generation failed: ${error.message}`);
  }
};
