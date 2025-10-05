"use client";

import { FC, useMemo } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";

const SUCCESS_LOTTIE = "/json_files/check_success.lottie";

export type LauncherProps = {
  loading: boolean;
  success: boolean;
};

export const Launcher: FC<LauncherProps> = ({ loading, success }) => {
  const state = useMemo<"loading" | "success" | "failure">(() => {
    if (loading) return "loading";
    return success ? "success" : "failure";
  }, [loading, success]);

  const statusCopy = useMemo(() => {
    switch (state) {
      case "loading":
        return { title: "Preparando lançamento", description: "Verificando sistemas e calibrando propulsores." };
      case "success":
        return { title: "Decolagem bem-sucedida!", description: "A nave entrou em órbita com todos os parâmetros estáveis." };
      default:
        return { title: "Falha no lançamento", description: "Reveja os módulos e tente novamente quando estiver pronto." };
    }
  }, [state]);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/90 backdrop-blur-sm">
      <motion.div
        className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(56,189,248,0.08),_transparent_65%)]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.4 }}
        aria-hidden="true"
      />

      <motion.div
        className="relative mx-4 flex max-w-xl flex-col items-center gap-4 rounded-[2.5rem] border border-cyan-400/40 bg-slate-950/80 px-10 pb-10 pt-12 text-center shadow-[0_0_120px_rgba(14,165,233,0.45)]"
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.96 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
      >
        <AnimatePresence mode="wait" initial={false}>
          {state === "loading" && (
            <motion.div
              key="loading"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="flex flex-col items-center gap-4"
            >
              <LoadingAnimation />
              <span className="text-base font-medium text-cyan-200/90">Sincronizando sistemas...</span>
            </motion.div>
          )}

          {state === "success" && (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.28, ease: "easeOut" }}
              className="flex flex-col items-center gap-4"
            >
              <SuccessAnimation />
              <span className="text-base font-semibold text-emerald-300">Trajetória nominal confirmada!</span>
            </motion.div>
          )}

          {state === "failure" && (
            <motion.div
              key="failure"
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.28, ease: "easeOut" }}
              className="flex flex-col items-center gap-4"
            >
              <FailureAnimation />
              <span className="text-base font-semibold text-rose-300">Abortado. Parâmetros fora da faixa segura!</span>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="max-w-sm">
          <h3 className="text-2xl font-semibold text-cyan-50">{statusCopy.title}</h3>
          <p className="mt-2 text-base text-cyan-100/85">{statusCopy.description}</p>
        </div>
      </motion.div>
    </div>
  );
};

const LoadingAnimation: FC = () => (
  <div className="relative flex h-24 w-24 items-center justify-center">
    <motion.div
      className="absolute inset-0 rounded-full border border-cyan-500/30"
      animate={{ rotate: 360 }}
      transition={{ repeat: Infinity, ease: "linear", duration: 3.2 }}
    />
    <motion.div
      className="relative flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-b from-cyan-500/40 via-sky-500/30 to-transparent"
      animate={{ y: [-6, 6, -6] }}
      transition={{ repeat: Infinity, duration: 1.6, ease: "easeInOut" }}
    >
      <RocketIcon className="h-8 w-8 text-cyan-100" />
      <motion.div
        className="absolute bottom-1 h-3 w-3 rounded-full bg-gradient-to-b from-amber-400 via-orange-500 to-rose-600 blur-[2px]"
        animate={{ scale: [0.9, 1.15, 0.9], opacity: [0.7, 1, 0.7] }}
        transition={{ repeat: Infinity, duration: 0.6, ease: "easeInOut" }}
      />
    </motion.div>
  </div>
);

const SuccessAnimation: FC = () => (
  <div className="flex h-24 w-24 items-center justify-center">
    <DotLottieReact src={SUCCESS_LOTTIE} autoplay loop={false} style={{ width: 90, height: 90 }} />
  </div>
);

const FailureAnimation: FC = () => (
  <div className="relative flex h-24 w-24 items-center justify-center">
    <motion.div
      className="absolute h-16 w-16 rounded-full bg-rose-500/20"
      initial={{ scale: 0.5, opacity: 0.6 }}
      animate={{ scale: [0.6, 1.1, 0.7], opacity: [0.6, 0.2, 0.6] }}
      transition={{ repeat: Infinity, duration: 1.4, ease: "easeInOut" }}
    />
    <motion.div
      className="relative flex h-12 w-12 items-center justify-center"
      animate={{ rotate: [0, 8, -8, 0] }}
      transition={{ repeat: Infinity, duration: 1.8, ease: "easeInOut" }}
    >
      <span className="absolute h-10 w-1.5 rotate-45 rounded-full bg-rose-300 shadow-lg shadow-rose-500/40" />
      <span className="absolute h-10 w-1.5 -rotate-45 rounded-full bg-rose-300 shadow-lg shadow-rose-500/40" />
    </motion.div>
  </div>
);

const RocketIcon: FC<{ className?: string }> = ({ className }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.8}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M4 12l4.5-4.5a7 7 0 019.9 9.9L14 21l-2.5-2.5" />
    <path d="M9 6l3 3" />
    <path d="M5 12l-1 5 5-1" />
    <path d="M15 9l3 3" />
  </svg>
);

export default Launcher;
