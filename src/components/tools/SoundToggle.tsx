"use client";

import { useEffect, useRef, useState } from "react";

export function SoundToggle() {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isMusicPlaying, setIsMusicPlaying] = useState(false);

  const toggleMusic = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isMusicPlaying) {
      audio.pause();
      setIsMusicPlaying(false);
      return;
    }

    audio.volume = 0.45;
    audio
      .play()
      .then(() => {
        setIsMusicPlaying(true);
      })
      .catch((error) => {
        console.error("Erro ao tocar música:", error);
        setIsMusicPlaying(false);
      });
  };

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.volume = 0.45;

    const attemptPlay = async () => {
      try {
        await audio.play();
        setIsMusicPlaying(true);
      } catch (error) {
        console.warn("Autoplay bloqueado pelo navegador:", error);
        setIsMusicPlaying(false);
      }
    };

    void attemptPlay();
  }, []);

  return (
    <div className="flex w-full max-w-[240px] flex-col items-center gap-3">
      <audio
        ref={audioRef}
        loop
        preload="auto"
        onPlay={() => setIsMusicPlaying(true)}
        onPause={() => setIsMusicPlaying(false)}
        onError={() => console.log("Erro ao carregar áudio retro")}
        onEnded={() => {
          const audio = audioRef.current;
          if (!audio) {
            return;
          }
          audio.currentTime = 0;
          audio.play().catch(console.error);
        }}
      >
        <source src="/retro-song.mp3" type="audio/mpeg" />
      </audio>

      <button
        type="button"
        onClick={toggleMusic}
        className={`inline-flex h-11 w-11 items-center justify-center rounded-full border border-cyan-400/35 bg-gradient-to-br from-cyan-500/40 via-indigo-500/40 to-fuchsia-500/40 text-white transition-all duration-200 hover:scale-[1.03] hover:border-cyan-300 hover:shadow-lg hover:shadow-cyan-500/30 ${
          isMusicPlaying ? "ring-1 ring-cyan-400/40" : ""
        }`}
        title={isMusicPlaying ? "Desligar música" : "Ligar música"}
      >
        <span className="sr-only">{isMusicPlaying ? "Desligar música" : "Ligar música"}</span>
        {isMusicPlaying ? (
          <svg
            className="h-5 w-5"
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
            className="h-5 w-5"
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

      <p className="text-center text-xs uppercase tracking-[0.32em] text-cyan-100/80">
        {isMusicPlaying ? "Música ON" : "Música OFF"}
      </p>
    </div>
  );
}
