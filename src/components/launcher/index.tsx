"use client";

import { FC, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";
import type { DotLottie } from "@lottiefiles/dotlottie-web";

const INTRO_LOTTIE = "/json_files/controls/RocketLaunch.lottie";
const LOADING_LOTTIE = "/json_files/controls/RocketLoading.lottie";
const SUCCESS_LOTTIE = "/json_files/controls/RocketLand.lottie";
const FAILURE_LOTTIE = "/json_files/controls/Errorfailure.lottie";

export type LauncherProps = {
  loading: boolean;
  success: boolean;
};

export const Launcher: FC<LauncherProps> = ({ loading, success }) => {
  type DisplayStage = "intro" | "loading" | "success" | "failure";

  const [stage, setStage] = useState<DisplayStage>(() => {
    if (loading) return "intro";
    return success ? "success" : "failure";
  });

  const prevLoadingRef = useRef<boolean>(loading);
  const introAnimationRef = useRef<DotLottie | null>(null);

  useEffect(() => {
    const prevLoading = prevLoadingRef.current;

    if (loading && !prevLoading) {
      setStage("intro");
    }

    if (!loading) {
      setStage(success ? "success" : "failure");
    }

    prevLoadingRef.current = loading;
  }, [loading, success]);

  const handleIntroComplete = useCallback(() => {
    if (loading) {
      setStage("loading");
    } else {
      setStage(success ? "success" : "failure");
    }
  }, [loading, success]);

  const attachIntroRef = useCallback(
    (instance: DotLottie | null) => {
      if (introAnimationRef.current) {
        introAnimationRef.current.removeEventListener("complete", handleIntroComplete);
      }

      introAnimationRef.current = instance;

      if (instance) {
        instance.addEventListener("complete", handleIntroComplete);
      }
    },
    [handleIntroComplete]
  );

  useEffect(() => () => {
    if (introAnimationRef.current) {
      introAnimationRef.current.removeEventListener("complete", handleIntroComplete);
      introAnimationRef.current = null;
    }
  }, [handleIntroComplete]);

  useEffect(() => {
    if (stage !== "intro") {
      return;
    }

    let timer: number | null = null;

    if (typeof window !== "undefined") {
      timer = window.setTimeout(() => {
        if (stage === "intro") {
          handleIntroComplete();
        }
      }, 3200);
    }

    return () => {
      if (timer !== null) {
        window.clearTimeout(timer);
      }
    };
  }, [handleIntroComplete, stage]);

  const steps = useMemo(
    () => [
      { key: "intro" as const, label: "Lançamento" },
      { key: "loading" as const, label: "Propulsores" },
      {
        key: "result" as const,
        label: success ? "Resultados" : "Recálculo",
      },
    ],
    [success]
  );

  const currentStepIndex = useMemo(() => {
    switch (stage) {
      case "intro":
        return 0;
      case "loading":
        return 1;
      default:
        return 2;
    }
  }, [stage]);

  const statusCopy = useMemo(() => {
    switch (stage) {
      case "intro":
        return {
          title: "Lançando o foguete",
          description: "Motores acionando e coletando telemetria inicial.",
        };
      case "loading":
        return {
          title: "Propulsores aquecidos",
          description: "Monitorando parâmetros da missão enquanto esperamos a resposta.",
        };
      case "success":
        return {
          title: "Pouso confirmado!",
          description: "A nave se estabilizou e os relatórios estão prontos para análise.",
        };
      default:
        return {
          title: "Falha na manobra",
          description: "Reavalie o plano e tente novamente com ajustes finos.",
        };
    }
  }, [stage]);

  return (
    <div className="fixed inset-0 z-[60] bg-slate-950/95 backdrop-blur-md">
      <motion.div
        className="mx-auto flex h-full w-full max-w-6xl flex-col items-center gap-10 px-4 py-12 text-center sm:px-8"
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.98 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
      >
        <nav className="mt-4 flex w-full max-w-3xl items-center justify-center gap-4 sm:gap-6">
          {steps.map((step, index) => {
            const isActive = index === currentStepIndex;
            const isCompleted = index < currentStepIndex;
            return (
              <div key={step.key} className="flex flex-1 flex-col items-center">
                <div
                  className={`flex h-11 w-11 items-center justify-center rounded-full border text-sm font-semibold transition ${
                    isCompleted
                      ? "border-emerald-400 bg-emerald-500/25 text-emerald-100"
                      : isActive
                      ? "border-cyan-300 bg-cyan-500/25 text-cyan-100"
                      : "border-cyan-500/20 bg-slate-900/40 text-cyan-300/70"
                  }`}
                >
                  {isCompleted ? <CheckIcon className="h-5 w-5" /> : index + 1}
                </div>
                <span
                  className={`mt-2 text-xs font-semibold uppercase tracking-[0.3em] transition ${
                    isActive || isCompleted ? "text-cyan-100" : "text-cyan-400/50"
                  }`}
                >
                  {step.label}
                </span>
                {index < steps.length - 1 && (
                  <div className="hidden h-px w-full translate-y-[22px] bg-cyan-500/20 sm:block" />
                )}
              </div>
            );
          })}
        </nav>

        <AnimatePresence mode="wait" initial={false}>
          {stage === "intro" && (
            <motion.div
              key="intro"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.32, ease: "easeOut" }}
              className="flex w-full flex-col items-center gap-5"
            >
              <DotLottieReact
                src={INTRO_LOTTIE}
                loop={false}
                autoplay
                style={{ width: "100%", height: "100%" }}
                dotLottieRefCallback={attachIntroRef}
                className="max-w-[520px]"
              />
              <span className="text-base font-semibold text-cyan-100/90">Contagem regressiva finalizada...</span>
            </motion.div>
          )}

          {stage === "loading" && (
            <motion.div
              key="loading"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.28, ease: "easeOut" }}
              className="flex w-full flex-col items-center gap-5"
            >
              <DotLottieReact
                src={LOADING_LOTTIE}
                loop
                autoplay
                style={{ width: "100%", height: "100%" }}
                className="max-w-[520px]"
              />
              <span className="text-base font-medium text-cyan-200/85">Telemetria em tempo real...</span>
            </motion.div>
          )}

          {stage === "success" && (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="flex w-full flex-col items-center gap-5"
            >
              <DotLottieReact
                src={SUCCESS_LOTTIE}
                loop={false}
                autoplay
                style={{ width: "100%", height: "100%" }}
                className="max-w-[520px]"
              />
              <span className="text-base font-semibold text-emerald-300">Trajetória nominal confirmada!</span>
            </motion.div>
          )}

          {stage === "failure" && (
            <motion.div
              key="failure"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="flex w-full flex-col items-center gap-5"
            >
              <DotLottieReact
                src={FAILURE_LOTTIE}
                loop={false}
                autoplay
                style={{ width: "100%", height: "100%" }}
                className="max-w-[520px]"
              />
              <span className="text-base font-semibold text-rose-300">Abortado. Ajuste seu plano e tente novamente.</span>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="max-w-xl space-y-3">
          <h3 className="text-3xl font-semibold text-cyan-50 sm:text-4xl">{statusCopy.title}</h3>
          <p className="text-base text-cyan-100/85 sm:text-lg">{statusCopy.description}</p>
        </div>
      </motion.div>
    </div>
  );
};

const CheckIcon: FC<{ className?: string }> = ({ className }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2.2}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M5 12l4.5 4.5L19 7" />
  </svg>
);

export default Launcher;

export { LaunchController } from "./LaunchController";
