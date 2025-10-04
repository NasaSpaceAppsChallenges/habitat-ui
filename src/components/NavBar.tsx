"use client";

import { useState, useEffect, useRef } from "react";

export default function NavBar() {
  const [isMusicPlaying, setIsMusicPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  const toggleMusic = () => {
    if (audioRef.current) {
      if (isMusicPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.volume = 0.5;
        audioRef.current.play().catch((error) => {
          console.error('Erro ao tocar música:', error);
        });
      }
      setIsMusicPlaying(!isMusicPlaying);
    }
  };

  useEffect(() => {
    const handleFirstInteraction = () => {
      if (audioRef.current && !isMusicPlaying) {
        audioRef.current.volume = 0.5;
        document.removeEventListener('click', handleFirstInteraction);
        document.removeEventListener('keydown', handleFirstInteraction);
      }
    };

    document.addEventListener('click', handleFirstInteraction);
    document.addEventListener('keydown', handleFirstInteraction);

    return () => {
      document.removeEventListener('click', handleFirstInteraction);
      document.removeEventListener('keydown', handleFirstInteraction);
    };
  }, [isMusicPlaying]);

  return (
    <>
      <audio
        ref={audioRef}
        loop
        preload="auto"
        onPlay={() => setIsMusicPlaying(true)}
        onPause={() => setIsMusicPlaying(false)}
        onError={() => console.log('Erro ao carregar áudio retro')}
        onEnded={() => {
          if (audioRef.current) {
            audioRef.current.currentTime = 0;
            audioRef.current.play().catch(console.error);
          }
        }}
      >
        <source src="/retro-song.mp3" type="audio/mpeg" />
      </audio>

      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-cyan-400/30 bg-black/25 backdrop-blur-xl">
        <div className="flex items-center justify-between px-4 py-3 sm:px-6 sm:py-4">
          <div className="flex items-center gap-3">
            <div className="relative flex h-9 w-9 items-center justify-center rounded-2xl border border-white/15 bg-gradient-to-br from-blue-500/40 via-indigo-500/30 to-purple-600/40 shadow-[0_0_25px_rgba(59,130,246,0.35)] sm:h-11 sm:w-11">
              <span className="text-sm font-semibold uppercase tracking-[0.35em] text-white sm:text-base">NA</span>
              <span className="absolute -bottom-1 right-0 h-3 w-3 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.7)]"></span>
            </div>
            <div className="flex flex-col leading-tight">
              <span className="text-xs font-semibold uppercase tracking-[0.4em] text-white sm:text-sm">Space Builder</span>
              <span className="text-[10px] font-medium text-cyan-200/80 sm:text-xs">NASA Space Apps Challenge</span>
            </div>
          </div>

          <button
            onClick={toggleMusic}
            className={`relative inline-flex items-center justify-center gap-2 rounded-full border border-cyan-400/40 bg-gradient-to-r from-purple-600/70 to-pink-600/70 p-2 text-white transition-all duration-300 hover:scale-[1.05] hover:from-purple-500/80 hover:to-pink-500/80 hover:shadow-lg hover:shadow-purple-500/40 sm:p-3 ${
              isMusicPlaying ? "ring-1 ring-cyan-400/40" : ""
            }`}
            title={isMusicPlaying ? "Desligar música" : "Ligar música"}
          >
            <span className="sr-only">{isMusicPlaying ? "Desligar música" : "Ligar música"}</span>
            {isMusicPlaying ? (
              <svg
                className="h-5 w-5 sm:h-6 sm:w-6"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M4.5 10.5v3a1.5 1.5 0 001.5 1.5h1.55c.2 0 .39.08.53.22l2.67 2.67a.6.6 0 001.03-.42V6.03a.6.6 0 00-1.03-.42l-2.67 2.67a.75.75 0 01-.53.22H6a1.5 1.5 0 00-1.5 1.5z" />
                <path d="M16 9.25c1.2.95 1.2 3.55 0 4.5" />
                <path d="M18.3 7.5c2 2.05 2 6.95 0 9" />
              </svg>
            ) : (
              <svg
                className="h-5 w-5 sm:h-6 sm:w-6"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M4.5 10.5v3a1.5 1.5 0 001.5 1.5h1.55c.2 0 .39.08.53.22l2.67 2.67a.6.6 0 001.03-.42V6.03a.6.6 0 00-1.03-.42l-2.67 2.67a.75.75 0 01-.53.22H6a1.5 1.5 0 00-1.5 1.5z" />
                <line x1="15" y1="9" x2="19" y2="13" />
                <line x1="19" y1="9" x2="15" y2="13" />
              </svg>
            )}
          </button>
        </div>
      </nav>
    </>
  );
}
