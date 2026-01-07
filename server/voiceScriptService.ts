import { createHash } from 'crypto';
import { GoogleGenAI, Type } from '@google/genai';
import { VoiceReportScript } from '../shared/schema';
import { Highlight, Concern, QuestionAnswer } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

export interface PersonaReport {
  personaId: string;
  executive_summary: string;
  highlights: Highlight[];
  concerns: Concern[];
  answers: QuestionAnswer[];
}

export interface PersonaMeta {
  personaId: string;
  name: string;
  role: string;
}

export function generateReportHash(report: PersonaReport): string {
  const content = JSON.stringify({
    personaId: report.personaId,
    executive_summary: report.executive_summary,
    highlights: report.highlights,
    concerns: report.concerns,
    answers: report.answers
  });
  return createHash('sha256').update(content).digest('hex');
}

function buildDeterministicScript(
  persona: PersonaMeta,
  report: PersonaReport,
  language: 'en' | 'zh-TW'
): VoiceReportScript {
  const sections: VoiceReportScript['sections'] = [];
  const coverage = {
    highlights: new Array(5).fill(false),
    concerns: new Array(5).fill(false),
    answers: new Array(report.answers.length).fill(false),
    timestampsUsed: [] as string[],
    wordCount: 0
  };

  const isEnglish = language === 'en';

  sections.push({
    sectionId: 'OPEN',
    lines: isEnglish ? [
      { text: `This is ${persona.name}, ${persona.role}. I just finished watching the film.`, refs: [] },
      { text: `Here are my thoughts on what stood out and what needs attention.`, refs: [{ type: 'summary' }] }
    ] : [
      { text: `這是${persona.name}，${persona.role}。我剛看完這部影片。`, refs: [] },
      { text: `以下是我對亮點與需要注意之處的想法。`, refs: [{ type: 'summary' }] }
    ]
  });

  const highlightLines: VoiceReportScript['sections'][0]['lines'] = [];
  report.highlights.slice(0, 5).forEach((h, i) => {
    coverage.highlights[i] = true;
    if (h.timestamp) coverage.timestampsUsed.push(h.timestamp);
    
    const timePhrase = isEnglish 
      ? `Around ${h.timestamp}` 
      : `大約在 ${h.timestamp}`;
    
    highlightLines.push({
      text: isEnglish 
        ? `${timePhrase}, ${h.summary}. ${h.why_it_works}`
        : `${timePhrase}，${h.summary}。${h.why_it_works}`,
      refs: [{ type: 'highlight', index: i, timestamp: h.timestamp, seconds: h.seconds }]
    });
  });
  sections.push({ sectionId: 'HIGHLIGHTS', lines: highlightLines });

  const concernLines: VoiceReportScript['sections'][0]['lines'] = [];
  report.concerns.slice(0, 5).forEach((c, i) => {
    coverage.concerns[i] = true;
    if (c.timestamp) coverage.timestampsUsed.push(c.timestamp);
    
    const timePhrase = isEnglish 
      ? `At ${c.timestamp}` 
      : `在 ${c.timestamp}`;
    
    concernLines.push({
      text: isEnglish
        ? `${timePhrase}, ${c.issue}. ${c.impact} Consider ${c.suggested_fix.toLowerCase()}.`
        : `${timePhrase}，${c.issue}。${c.impact} 建議${c.suggested_fix}。`,
      refs: [{ type: 'concern', index: i, timestamp: c.timestamp, seconds: c.seconds }]
    });
  });
  sections.push({ sectionId: 'CONCERNS', lines: concernLines });

  if (report.answers.length > 0) {
    const answerLines: VoiceReportScript['sections'][0]['lines'] = [];
    const maxAnswers = Math.min(report.answers.length, 3);
    
    for (let i = 0; i < maxAnswers; i++) {
      const a = report.answers[i];
      coverage.answers[i] = true;
      answerLines.push({
        text: isEnglish
          ? `Regarding "${a.question}" — ${a.answer}`
          : `關於「${a.question}」— ${a.answer}`,
        refs: [{ type: 'answer', index: i }]
      });
    }
    
    if (report.answers.length > 3) {
      for (let i = 3; i < report.answers.length; i++) {
        coverage.answers[i] = true;
      }
      answerLines.push({
        text: isEnglish
          ? `The remaining questions have been addressed in the written report.`
          : `其餘問題已在書面報告中回答。`,
        refs: report.answers.slice(3).map((_, idx) => ({ type: 'answer' as const, index: idx + 3 }))
      });
    }
    
    sections.push({ sectionId: 'OBJECTIVES', lines: answerLines });
  }

  sections.push({
    sectionId: 'CLOSE',
    lines: isEnglish ? [
      { text: `Overall, there's real potential here. With some focused revisions, this could really connect with audiences.`, refs: [{ type: 'summary' }] },
      { text: `Keep pushing forward.`, refs: [] }
    ] : [
      { text: `整體而言，這部作品有真正的潛力。經過一些重點修改，它能夠真正打動觀眾。`, refs: [{ type: 'summary' }] },
      { text: `繼續努力。`, refs: [] }
    ]
  });

  const allText = sections.flatMap(s => s.lines.map(l => l.text)).join(' ');
  coverage.wordCount = isEnglish 
    ? allText.split(/\s+/).length 
    : allText.length;

  return {
    version: '1.0',
    language,
    persona: {
      personaId: persona.personaId,
      name: persona.name,
      role: persona.role
    },
    runtimeTargetSeconds: 210,
    sections,
    coverage: {
      highlights: coverage.highlights,
      concerns: coverage.concerns,
      answers: coverage.answers,
      timestampsUsed: coverage.timestampsUsed,
      wordCount: coverage.wordCount
    }
  };
}

async function naturalizeScript(
  draftScript: VoiceReportScript,
  persona: PersonaMeta,
  language: 'en' | 'zh-TW'
): Promise<VoiceReportScript> {
  const isEnglish = language === 'en';
  
  const systemPrompt = isEnglish
    ? `You are ${persona.name}, a ${persona.role}. You are recording a brief voice memo about a film you just watched.
       
Your task: Rewrite the provided script lines to sound more natural and conversational, as if you're actually speaking.

CRITICAL RULES:
- Keep the SAME language (English)
- Keep EXACT same structure: same number of sections, same number of lines per section
- Do NOT add new timestamps or film events not in the original
- Do NOT remove any content - you must cover everything
- Each line must be MAX 2 sentences
- Preserve the persona's professional but warm tone
- Make it sound like natural speech, not a list being read aloud
- Vary sentence openings - don't start every line the same way`
    : `你是${persona.name}，一位${persona.role}。你正在錄製一段關於剛看完的影片的簡短語音備忘錄。

你的任務：將提供的腳本行改寫得更自然、更口語化，就像你真的在說話一樣。

重要規則：
- 保持相同語言（繁體中文）
- 保持完全相同的結構：相同數量的段落，每個段落相同數量的行
- 不要添加原文中沒有的新時間戳或影片事件
- 不要刪除任何內容——必須涵蓋所有內容
- 每行最多2句話
- 保持角色專業但溫暖的語調
- 讓它聽起來像自然的語音，而不是朗讀列表
- 變化句子開頭——不要每行都用相同的方式開始`;

  const userPrompt = `Here is the draft script to naturalize. Return ONLY a JSON object with the same structure, but with rewritten "text" fields for each line.

Draft script:
${JSON.stringify(draftScript.sections, null, 2)}

Return format:
{
  "sections": [
    {
      "sectionId": "OPEN",
      "lines": [
        { "text": "naturalized text here", "refs": [...] }
      ]
    },
    ...
  ]
}`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: { parts: [{ text: userPrompt }] },
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            sections: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  sectionId: { type: Type.STRING },
                  lines: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        text: { type: Type.STRING },
                        refs: { type: Type.ARRAY, items: { type: Type.OBJECT } }
                      },
                      required: ['text']
                    }
                  }
                },
                required: ['sectionId', 'lines']
              }
            }
          },
          required: ['sections']
        }
      }
    });

    const result = JSON.parse(response.text || '{}');
    
    if (!result.sections || !Array.isArray(result.sections)) {
      console.warn('[VoiceScript] LLM naturalization failed, using draft');
      return draftScript;
    }

    const naturalizedSections = draftScript.sections.map((origSection, sIdx) => {
      const newSection = result.sections[sIdx];
      if (!newSection || newSection.sectionId !== origSection.sectionId) {
        return origSection;
      }
      
      return {
        sectionId: origSection.sectionId,
        lines: origSection.lines.map((origLine, lIdx) => {
          const newLine = newSection.lines?.[lIdx];
          return {
            text: newLine?.text || origLine.text,
            refs: origLine.refs
          };
        })
      };
    });

    const allText = naturalizedSections.flatMap(s => s.lines.map(l => l.text)).join(' ');
    const wordCount = isEnglish 
      ? allText.split(/\s+/).length 
      : allText.length;

    const naturalizedScript: VoiceReportScript = {
      ...draftScript,
      sections: naturalizedSections,
      coverage: {
        ...draftScript.coverage,
        wordCount
      }
    };

    recomputeCoverage(naturalizedScript, draftScript.coverage);

    return naturalizedScript;
  } catch (error) {
    console.error('[VoiceScript] Naturalization error:', error);
    return draftScript;
  }
}

function recomputeCoverage(script: VoiceReportScript, originalCoverage: VoiceReportScript['coverage']): void {
  script.coverage.highlights = [...originalCoverage.highlights];
  script.coverage.concerns = [...originalCoverage.concerns];
  script.coverage.answers = [...originalCoverage.answers];
  script.coverage.timestampsUsed = [...originalCoverage.timestampsUsed];
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export function validateScript(script: VoiceReportScript, report: PersonaReport): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const isEnglish = script.language === 'en';

  const highlightsCovered = script.coverage.highlights.filter(Boolean).length;
  const concernsCovered = script.coverage.concerns.filter(Boolean).length;
  
  if (highlightsCovered < 5) {
    errors.push(`Only ${highlightsCovered}/5 highlights covered`);
  }
  if (concernsCovered < 5) {
    errors.push(`Only ${concernsCovered}/5 concerns covered`);
  }

  const reportTimestamps = new Set([
    ...report.highlights.map(h => h.timestamp),
    ...report.concerns.map(c => c.timestamp)
  ]);
  
  for (const ts of script.coverage.timestampsUsed) {
    if (!reportTimestamps.has(ts)) {
      errors.push(`Invalid timestamp used: ${ts}`);
    }
  }

  const wordCount = script.coverage.wordCount;
  if (isEnglish) {
    if (wordCount < 500) warnings.push(`Word count low (${wordCount}), may be under 3 minutes`);
    if (wordCount > 1000) warnings.push(`Word count high (${wordCount}), may exceed 4 minutes`);
  } else {
    if (wordCount < 700) warnings.push(`Character count low (${wordCount}), may be under 3 minutes`);
    if (wordCount > 1600) warnings.push(`Character count high (${wordCount}), may exceed 4 minutes`);
  }

  for (const section of script.sections) {
    for (const line of section.lines) {
      const sentences = line.text.split(/[.!?。！？]/).filter(s => s.trim().length > 0);
      if (sentences.length > 2) {
        warnings.push(`Line exceeds 2 sentences in ${section.sectionId}: "${line.text.slice(0, 50)}..."`);
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}

export async function generateVoiceScript(
  persona: PersonaMeta,
  report: PersonaReport,
  language: 'en' | 'zh-TW'
): Promise<{ script: VoiceReportScript; validation: ValidationResult; hash: string }> {
  const hash = generateReportHash(report);
  
  const draftScript = buildDeterministicScript(persona, report, language);
  
  const naturalizedScript = await naturalizeScript(draftScript, persona, language);
  
  const validation = validateScript(naturalizedScript, report);
  
  if (!validation.valid) {
    console.warn('[VoiceScript] Validation errors, falling back to draft:', validation.errors);
    const draftValidation = validateScript(draftScript, report);
    return { script: draftScript, validation: draftValidation, hash };
  }
  
  return { script: naturalizedScript, validation, hash };
}

export function getFullTranscript(script: VoiceReportScript): string {
  return script.sections
    .flatMap(section => section.lines.map(line => line.text))
    .join('\n\n');
}
