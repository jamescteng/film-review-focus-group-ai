
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Persona } from '../types';

interface ProcessingQueueProps {
  personas: Persona[];
  currentIndex: number;
  progress: number; // 0 to 100
}

export const ProcessingQueue: React.FC<ProcessingQueueProps> = ({ personas, currentIndex, progress }) => {
  const { t } = useTranslation();
  const currentPersona = personas[currentIndex];
  
  const translatedRole = t(`personas.${currentPersona.id}.role`, { defaultValue: currentPersona.role });

  return (
    <div className="max-w-3xl mx-auto py-12 sm:py-20 md:py-40 px-4 sm:px-8 text-center">
      <div className="mb-8 sm:mb-12 md:mb-20">
        <div className="inline-flex items-center gap-2 sm:gap-4 px-4 sm:px-6 py-2 sm:py-3 rounded-full bg-white border border-zinc-100 text-[9px] sm:text-[10px] text-zinc-400 uppercase tracking-[0.3em] sm:tracking-[0.4em] mb-6 sm:mb-12 font-black shadow-sm">
          <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-black animate-ping" />
          {t('processing.activeMultiModalPass')}
        </div>
        <h2 className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 sm:mb-6 md:mb-10 text-black leading-tight tracking-tight">
          {currentPersona.name} <br/> <span className="text-zinc-300 font-medium">{t('processing.isReviewingYourFilm')}</span>
        </h2>
        <p className="text-zinc-400 text-base sm:text-lg md:text-2xl max-w-lg mx-auto leading-relaxed font-light px-2">
          {t('processing.parsingCues')}
        </p>
      </div>

      <div className="relative h-1.5 sm:h-2 w-full bg-zinc-100 rounded-full overflow-hidden mb-8 sm:mb-12 md:mb-20">
        <div 
          className="absolute top-0 left-0 h-full bg-black transition-all duration-1000 ease-in-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="flex flex-col items-center">
        <div className="relative group">
          <div className="absolute -inset-3 sm:-inset-6 bg-zinc-50 rounded-[2rem] sm:rounded-[4rem] scale-95 animate-pulse opacity-50"></div>
          <img 
            src={currentPersona.avatar} 
            alt={currentPersona.name} 
            className="relative w-24 h-24 sm:w-36 sm:h-36 md:w-48 md:h-48 rounded-[1.5rem] sm:rounded-[2.5rem] md:rounded-[3.5rem] object-cover border-4 sm:border-6 md:border-8 border-white shadow-[0_15px_30px_rgba(0,0,0,0.1)] sm:shadow-[0_30px_60px_rgba(0,0,0,0.1)] mb-4 sm:mb-6 md:mb-8" 
          />
        </div>
        <span className="text-base sm:text-lg md:text-xl font-semibold text-black">{translatedRole}</span>
        <span className="text-[10px] sm:text-xs text-zinc-400 uppercase tracking-[0.2em] sm:tracking-[0.3em] mt-2 sm:mt-3 font-black">{t('processing.statusInspecting')}</span>
      </div>
    </div>
  );
};
