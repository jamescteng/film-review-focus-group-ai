
import React, { useState, useEffect } from 'react';
import { AppState, Project, AgentReport } from './types';
import { PERSONAS } from './constants.tsx';
import { UploadForm } from './components/UploadForm';
import { ProcessingQueue } from './components/ProcessingQueue';
import { ScreeningRoom } from './components/ScreeningRoom';
import { generateAgentReport, fileToBytes } from './geminiService';
import { Button } from './components/Button';

const App: React.FC = () => {
  const [state, setState] = useState<AppState>(AppState.KEY_SELECTION);
  const [project, setProject] = useState<Project | null>(null);
  const [reports, setReports] = useState<AgentReport[]>([]);
  const [statusMessage, setStatusMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [processProgress, setProcessProgress] = useState(0);

  const aistudio = (window as any).aistudio;

  useEffect(() => {
    const checkKey = async () => {
      try {
        if (aistudio) {
          const hasKey = await aistudio.hasSelectedApiKey();
          if (hasKey) setState(AppState.IDLE);
        }
      } catch (e) {
        console.error("[FocalPoint] Key check bypass:", e);
      }
    };
    checkKey();
  }, [aistudio]);

  const handleOpenKeySelector = async () => {
    if (aistudio) {
      await aistudio.openSelectKey();
      setState(AppState.IDLE);
    }
  };

  const startAnalysis = async (p: Project) => {
    setErrorMessage(null);
    setProject(p);
    setState(AppState.ANALYZING);
    setProcessProgress(5);
    
    let videoBase64: string | undefined;
    
    if (p.videoFile) {
      try {
        setStatusMessage("Decoding master asset...");
        videoBase64 = await fileToBytes(p.videoFile);
        setProcessProgress(45);
      } catch (e: any) {
        setErrorMessage(e.message || "Failed to process video file.");
        setState(AppState.IDLE);
        return;
      }
    }

    const persona = PERSONAS[0];
    const isZH = p.language === 'zh-TW';
    setStatusMessage(isZH ? `正在執行深度分析: ${p.title}...` : `Running deep appraisal on ${p.title}...`);
    setProcessProgress(75);
    
    try {
      const report = await generateAgentReport(persona, p, videoBase64);
      setReports([report]);
      setProcessProgress(100);
      setTimeout(() => setState(AppState.VIEWING), 600);
    } catch (err: any) {
      console.error("[FocalPoint] Pipeline Error:", err);
      setErrorMessage(err.message || "The appraisal engine encountered a technical fault.");
      setState(AppState.IDLE);
    }
  };

  return (
    <div className="min-h-screen bg-[#fdfdfd] text-slate-900 selection:bg-slate-900 selection:text-white font-sans overflow-x-hidden">
      <nav className="fixed top-0 left-0 w-full p-8 md:p-12 flex justify-between items-center z-50 pointer-events-none">
        <div className="flex items-center gap-6 pointer-events-auto group cursor-pointer" onClick={() => window.location.reload()}>
          <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center rotate-12 shadow-xl transition-transform group-hover:rotate-0">
            <div className="w-5 h-5 bg-white rounded-lg -rotate-12 group-hover:rotate-0 transition-transform" />
          </div>
          <span className="font-serif text-4xl tracking-tighter italic font-bold">FocalPoint</span>
        </div>
      </nav>

      <div className="relative pt-24 pb-20">
        {state === AppState.KEY_SELECTION && (
          <div className="flex flex-col items-center justify-center min-h-[85vh] px-8 text-center max-w-5xl mx-auto">
            <h1 className="text-7xl md:text-[10rem] font-serif mb-12 leading-none tracking-tighter text-slate-900">
              Elevate <br/> <span className="italic text-slate-200 font-bold">Your Edit.</span>
            </h1>
            <p className="text-slate-500 text-2xl md:text-3xl mb-20 leading-relaxed max-w-3xl font-light">
              Advanced multimodal focus groups for professional indie creators. 
            </p>
            <div className="space-y-10 w-full max-w-md">
              <Button onClick={handleOpenKeySelector} className="w-full py-10 rounded-[2.5rem] text-3xl shadow-2xl hover:translate-y-[-4px] font-serif italic">
                Enter Screening Room
              </Button>
              <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" className="block text-[10px] uppercase tracking-[0.5em] text-slate-300 hover:text-slate-900 transition-colors font-black pointer-events-auto">
                Paid Tier API Key Required →
              </a>
            </div>
          </div>
        )}

        {state === AppState.IDLE && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
            {errorMessage && (
              <div className="max-w-4xl mx-auto mt-24 p-10 bg-rose-50 border border-rose-200 rounded-[2.5rem] text-rose-700 text-xl text-center font-serif italic">
                {errorMessage}
              </div>
            )}
            <UploadForm onStart={startAnalysis} />
          </div>
        )}

        {state === AppState.ANALYZING && project && (
          <div className="flex flex-col items-center">
            <ProcessingQueue 
              personas={PERSONAS} 
              currentIndex={0} 
              progress={processProgress}
            />
            <p className="text-slate-400 text-sm uppercase tracking-[0.6em] mt-12 animate-pulse font-black">{statusMessage}</p>
          </div>
        )}

        {state === AppState.VIEWING && project && reports.length > 0 && (
          <div className="animate-in fade-in duration-1000">
            <ScreeningRoom project={project} reports={reports} />
          </div>
        )}
      </div>

      {/* Aesthetic Background Elements */}
      <div className="fixed inset-0 pointer-events-none -z-10 opacity-30">
        <div className="absolute top-0 right-0 w-[80vw] h-[80vh] bg-slate-100 rounded-full blur-[200px]" />
        <div className="absolute bottom-0 left-0 w-[50vw] h-[50vh] bg-blue-50/50 rounded-full blur-[200px]" />
      </div>
    </div>
  );
};

export default App;
