import React, { useState, useRef, useEffect } from 'react';

interface DialogueTurn {
  speakerPersonaId: string;
  text: string;
}

interface DialogueParticipant {
  personaId: string;
  displayName: string;
  role: string;
}

interface DialoguePlayerProps {
  audioUrl: string;
  transcript: string;
  participants: DialogueParticipant[];
  turns: DialogueTurn[];
  language: 'en' | 'zh-TW';
  onRegenerate?: () => void;
  isRegenerating?: boolean;
}

export function DialoguePlayer({
  audioUrl,
  transcript,
  participants,
  turns,
  language,
  onRegenerate,
  isRegenerating
}: DialoguePlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showTranscript, setShowTranscript] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  const texts = {
    en: {
      title: 'Podcast Dialogue',
      loading: 'Loading audio...',
      error: 'Failed to load audio',
      showTranscript: 'Show transcript',
      hideTranscript: 'Hide transcript',
      regenerate: 'Regenerate',
      regenerating: 'Regenerating...',
      download: 'Download'
    },
    'zh-TW': {
      title: 'Podcast 對談',
      loading: '載入音訊中...',
      error: '載入音訊失敗',
      showTranscript: '顯示逐字稿',
      hideTranscript: '隱藏逐字稿',
      regenerate: '重新產生',
      regenerating: '重新產生中...',
      download: '下載'
    }
  };

  const t = texts[language];

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleLoadedMetadata = () => {
      setDuration(audio.duration);
      setIsLoading(false);
    };

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const handleEnded = () => {
      setIsPlaying(false);
    };

    const handleError = () => {
      setError(t.error);
      setIsLoading(false);
    };

    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);

    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
    };
  }, [audioUrl, t.error]);

  const togglePlayPause = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
    } else {
      audio.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const audio = audioRef.current;
    if (!audio) return;

    const newTime = parseFloat(e.target.value);
    audio.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getParticipantName = (personaId: string) => {
    const participant = participants.find(p => p.personaId === personaId);
    return participant?.displayName || personaId;
  };

  const getParticipantColor = (personaId: string) => {
    const index = participants.findIndex(p => p.personaId === personaId);
    const colors = ['text-indigo-600', 'text-emerald-600', 'text-amber-600', 'text-rose-600'];
    return colors[index % colors.length];
  };

  const servedAudioUrl = (() => {
    if (audioUrl.startsWith('/api/voice-audio/') || audioUrl.startsWith('http://') || audioUrl.startsWith('https://')) {
      return audioUrl;
    }
    if (audioUrl.startsWith('/objects/')) {
      return audioUrl.replace('/objects/', '/api/voice-audio/');
    }
    return `/api/voice-audio/${audioUrl}`;
  })();

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <audio ref={audioRef} src={servedAudioUrl} preload="metadata" />
      
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">{t.title}</h3>
          <div className="flex items-center gap-2">
            {onRegenerate && (
              <button
                onClick={onRegenerate}
                disabled={isRegenerating}
                className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                {isRegenerating ? t.regenerating : t.regenerate}
              </button>
            )}
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-8 text-gray-500">
            <svg className="animate-spin h-6 w-6 mr-2" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            {t.loading}
          </div>
        ) : error ? (
          <div className="text-center py-8 text-red-500">{error}</div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <button
                onClick={togglePlayPause}
                className="w-12 h-12 flex items-center justify-center bg-indigo-600 hover:bg-indigo-700 text-white rounded-full transition-colors"
              >
                {isPlaying ? (
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                )}
              </button>

              <div className="flex-1">
                <input
                  type="range"
                  min="0"
                  max={duration || 0}
                  value={currentTime}
                  onChange={handleSeek}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>{formatTime(currentTime)}</span>
                  <span>{formatTime(duration)}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {participants.map((p, i) => (
                <span key={p.personaId} className="flex items-center gap-1 text-sm">
                  <span className={`font-medium ${getParticipantColor(p.personaId)}`}>
                    {p.displayName}
                  </span>
                  {i < participants.length - 1 && <span className="text-gray-400 mx-1">&</span>}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="border-t border-gray-200">
        <button
          onClick={() => setShowTranscript(!showTranscript)}
          className="w-full px-6 py-3 flex items-center justify-between text-sm text-gray-600 hover:bg-gray-50 transition-colors"
        >
          <span>{showTranscript ? t.hideTranscript : t.showTranscript}</span>
          <svg
            className={`w-5 h-5 transition-transform ${showTranscript ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {showTranscript && (
          <div className="px-6 pb-6 max-h-96 overflow-y-auto">
            <div className="space-y-4">
              {turns.map((turn, index) => (
                <div key={index} className="flex gap-3">
                  <span className={`font-medium text-sm shrink-0 ${getParticipantColor(turn.speakerPersonaId)}`}>
                    {getParticipantName(turn.speakerPersonaId)}:
                  </span>
                  <p className="text-gray-700 text-sm leading-relaxed">{turn.text}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
