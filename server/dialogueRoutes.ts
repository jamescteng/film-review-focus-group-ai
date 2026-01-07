import { Router, Request, Response } from 'express';
import { createDialogueJob, getDialogueJobStatus, getDialogueJobResult, getSessionDialogues } from './dialogueService';

const router = Router();

router.post('/create', async (req: Request, res: Response) => {
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
    console.error('[Dialogue Route] Create error:', error);
    return res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Failed to create dialogue job' 
    });
  }
});

router.get('/status/:jobId', async (req: Request, res: Response) => {
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
    console.error('[Dialogue Route] Status error:', error);
    return res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Failed to get job status' 
    });
  }
});

router.get('/result/:jobId', async (req: Request, res: Response) => {
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
    console.error('[Dialogue Route] Result error:', error);
    return res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Failed to get job result' 
    });
  }
});

router.get('/session/:sessionId', async (req: Request, res: Response) => {
  try {
    const sessionId = parseInt(req.params.sessionId, 10);
    
    if (isNaN(sessionId)) {
      return res.status(400).json({ error: 'Invalid session ID' });
    }

    const dialogues = await getSessionDialogues(sessionId);
    
    return res.json({ dialogues });
  } catch (error) {
    console.error('[Dialogue Route] Session dialogues error:', error);
    return res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Failed to get session dialogues' 
    });
  }
});

export default router;
