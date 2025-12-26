import { Persona, AgentReport, Project } from "./types";

const FocalPointLogger = {
  info: (stage: string, data: any) => console.debug(`[FocalPoint][INFO][${stage}]`, data),
  warn: (stage: string, msg: string) => console.warn(`[FocalPoint][WARN][${stage}]`, msg),
  error: (stage: string, err: any) => console.error(`[FocalPoint][ERROR][${stage}]`, err)
};

export const fileToBytes = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    FocalPointLogger.info("Asset_Ingest", { name: file.name, size: `${(file.size / 1024 / 1024).toFixed(2)} MB` });
    
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

export const generateAgentReport = async (
  persona: Persona,
  project: Project,
  videoBase64?: string
): Promise<AgentReport> => {
  if (!project.title || project.title.trim().length === 0) {
    throw new Error("DATA_ERR_01: Invalid Project Metadata.");
  }
  if (!project.videoFile) {
    throw new Error("DATA_ERR_02: Video asset is required for multimodal appraisal.");
  }

  FocalPointLogger.info("API_Call", { persona: persona.name });

  try {
    const response = await fetch('/api/analyze', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: project.title,
        synopsis: project.synopsis,
        srtContent: project.srtContent,
        questions: project.questions,
        language: project.language,
        videoBase64: videoBase64,
        videoMimeType: project.videoFile?.type || 'video/mp4'
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `Server error: ${response.status}`);
    }

    const report = await response.json();
    FocalPointLogger.info("API_Success", "Report synthesized and parsed.");
    return report;
  } catch (error: any) {
    FocalPointLogger.error("API_Call", error);
    throw new Error(`Screening failed: ${error.message}`);
  }
};
