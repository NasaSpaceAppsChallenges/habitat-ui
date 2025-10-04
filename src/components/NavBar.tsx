"use client";

import { useState, useEffect, useRef } from "react";

export default function NavBar() {
  const [isMusicPlaying, setIsMusicPlaying] = useState(false);
  const [autoPlayFailed, setAutoPlayFailed] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  const toggleMusic = () => {
    if (audioRef.current) {
      if (isMusicPlaying) {
        audioRef.current.pause();
        setIsMusicPlaying(false);
      } else {
        audioRef.current.volume = 0.45;
        audioRef.current
          .play()
          .then(() => {
            setAutoPlayFailed(false);
            setIsMusicPlaying(true);
          })
          .catch((error) => {
            console.error("Erro ao tocar música:", error);
            setAutoPlayFailed(true);
            setIsMusicPlaying(false);
          });
      }
    }
  };

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.volume = 0.45;
    const attemptPlay = async () => {
      try {
        await audio.play();
        setIsMusicPlaying(true);
        setAutoPlayFailed(false);
      } catch (error) {
        console.warn("Autoplay bloqueado pelo navegador:", error);
        setAutoPlayFailed(true);
        setIsMusicPlaying(false);
      }
    };

    void attemptPlay();
  }, []);

  return (
    <>
      <audio
        ref={audioRef}
        loop
        preload="auto"
        onPlay={() => setIsMusicPlaying(true)}
        onPause={() => setIsMusicPlaying(false)}
        onError={() => console.log("Erro ao carregar áudio retro")}
        onEnded={() => {
          if (audioRef.current) {
            audioRef.current.currentTime = 0;
            audioRef.current.play().catch(console.error);
          }
        }}
      >
        <source src="/retro-song.mp3" type="audio/mpeg" />
      </audio>

      <nav className="fixed left-0 right-0 top-0 z-50 border-b border-cyan-400/20 bg-slate-950/55 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-end px-4 py-2 sm:px-6 sm:py-3">
          <button
            onClick={toggleMusic}
            className={`inline-flex h-10 w-10 items-center justify-center rounded-full border border-cyan-400/35 bg-gradient-to-br from-cyan-500/40 via-indigo-500/40 to-fuchsia-500/40 text-white transition-all duration-200 hover:scale-[1.03] hover:border-cyan-300 hover:shadow-lg hover:shadow-cyan-500/30 sm:h-11 sm:w-11 ${
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
        </div>
      </nav>
    </>
  );
}
