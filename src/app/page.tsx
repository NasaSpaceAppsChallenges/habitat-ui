"use client";

import { useEffect, useState } from "react";

export default function Home() {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  return (
    <div className="relative min-h-screen overflow-hidden bg-black">
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 opacity-25">
          <div className="h-full w-full bg-gradient-to-b from-blue-900/30 via-purple-900/20 to-black"></div>
        </div>

        <div className="stars absolute inset-0"></div>
        <div className="stars2 absolute inset-0"></div>
        <div className="stars3 absolute inset-0"></div>

        <div className="absolute -top-36 right-[-40%] h-[360px] w-[360px] rounded-full bg-fuchsia-500/25 blur-3xl animate-pulse-slow"></div>
        <div className="absolute bottom-[-140px] left-[-80px] h-[320px] w-[320px] rounded-full bg-cyan-500/15 blur-[140px] animate-pulse-slower"></div>
      </div>

      <div className="relative z-10 flex min-h-screen items-center justify-center px-4 pb-16 pt-24 sm:px-8 sm:pb-20 sm:pt-28">
        <div
          className={`max-w-3xl space-y-8 text-center text-white transition-all duration-700 ${
            isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
          }`}
        >
          <span className="inline-flex items-center gap-2 rounded-full border border-cyan-400/40 bg-cyan-500/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-cyan-100">
            Space Apps 2025
          </span>

          <div className="space-y-4">
            <h1 className="text-4xl font-semibold leading-tight text-white sm:text-5xl lg:text-6xl">
              Construa a próxima <span className="bg-gradient-to-r from-blue-300 via-purple-400 to-cyan-300 bg-clip-text text-transparent">nave da NASA</span>
            </h1>
            <p className="mx-auto max-w-2xl text-base text-white/80 sm:text-lg">
              Um estúdio cósmico para desenhar, iterar e lançar a nave que vai levar a próxima tripulação rumo ao desconhecido.
            </p>
          </div>

          <div className="flex justify-center">
            <button
              onClick={() => (window.location.href = "/playground")}
              className="group relative inline-flex items-center justify-center overflow-hidden rounded-xl border-2 border-cyan-400 bg-gradient-to-r from-emerald-600 to-teal-600 px-8 py-4 font-semibold text-white shadow-[0_18px_40px_-18px_rgba(16,185,129,0.75)] transition-all duration-300 hover:scale-[1.02] hover:from-emerald-500 hover:to-teal-500 hover:shadow-[0_22px_50px_-18px_rgba(34,211,238,0.6)] sm:px-10 sm:py-5"
            >
              <span className="relative z-10 flex items-center gap-3 text-lg">
                🛠️ Construir Nave Espacial
              </span>
              <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 group-hover:translate-x-full"></span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
