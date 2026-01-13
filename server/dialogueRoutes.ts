import { Router, Request, Response } from 'express';
import { createDialogueJob, getDialogueJobStatus, getDialogueJobResult, getSessionDialogues } from './dialogueService';
import { dialogueCreateLimiter, dialogueStatusLimiter } from './middleware/rateLimiting.js';
import { FocalPointLogger } from './utils/logger.js';

const router = Router();

router.post('/create', dialogueCreateLimiter, async (req: Request, res: Response) => {
  try {
    const { sessionId, personaIdA, personaIdB, language } = req.body;

    if (!sessionId || !personaIdA || !personaIdB) {
      return res.status(400).json({ 
        error: 'Missing required fields: sessionId, personaIdA, personaIdB' 
      });
    }

    if (personaIdA === personaIdB) {
      return res.status(400).json({ 
        error: 'Must select two different personas' 
      });
    }

    const validLanguages = ['en', 'zh-TW'];
    const lang = validLanguages.includes(language) ? language : 'en';

    const result = await createDialogueJob(
      sessionId,
      personaIdA,
      personaIdB,
      lang
    );

    if (!result.success) {
      return res.status(500).json({ error: result.error });
    }

    return res.json({ jobId: result.jobId });
  } catch (error) {
    FocalPointLogger.error("Dialogue_Create", error instanceof Error ? error.message : 'Unknown error');
    return res.status(500).json({ error: 'Failed to create dialogue. Please try again.' });
  }
});

router.get('/status/:jobId', dialogueStatusLimiter, async (req: Request, res: Response) => {
  try {
    const jobId = parseInt(req.params.jobId, 10);
    
    if (isNaN(jobId)) {
      return res.status(400).json({ error: 'Invalid job ID' });
    }

    const status = await getDialogueJobStatus(jobId);
    
    if (!status) {
      return res.status(404).json({ error: 'Job not found' });
    }

    return res.json(status);
  } catch (error) {
    FocalPointLogger.error("Dialogue_Status", error instanceof Error ? error.message : 'Unknown error');
    return res.status(500).json({ error: 'Failed to get status. Please try again.' });
  }
});

router.get('/result/:jobId', dialogueStatusLimiter, async (req: Request, res: Response) => {
  try {
    const jobId = parseInt(req.params.jobId, 10);
    
    if (isNaN(jobId)) {
      return res.status(400).json({ error: 'Invalid job ID' });
    }

    const result = await getDialogueJobResult(jobId);
    
    if (!result) {
      return res.status(404).json({ error: 'Result not available' });
    }

    return res.json(result);
  } catch (error) {
    FocalPointLogger.error("Dialogue_Result", error instanceof Error ? error.message : 'Unknown error');
    return res.status(500).json({ error: 'Failed to get result. Please try again.' });
  }
});

router.get('/session/:sessionId', dialogueStatusLimiter, async (req: Request, res: Response) => {
  try {
    const sessionId = parseInt(req.params.sessionId, 10);
    
    if (isNaN(sessionId)) {
      return res.status(400).json({ error: 'Invalid session ID' });
    }

    const dialogues = await getSessionDialogues(sessionId);
    
    return res.json({ dialogues });
  } catch (error) {
    FocalPointLogger.error("Dialogue_SessionList", error instanceof Error ? error.message : 'Unknown error');
    return res.status(500).json({ error: 'Failed to get dialogues. Please try again.' });
  }
});

export default router;
