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
          {stage === "intro" && (
            <motion.div
              key="intro"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.32, ease: "easeOut" }}
              className="flex flex-col items-center gap-5"
            >
              <DotLottieReact
                src={INTRO_LOTTIE}
                loop={false}
                autoplay
                style={{ width: 140, height: 140 }}
                dotLottieRefCallback={attachIntroRef}
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
              className="flex flex-col items-center gap-5"
            >
              <DotLottieReact
                src={LOADING_LOTTIE}
                loop
                autoplay
                style={{ width: 130, height: 130 }}
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
              className="flex flex-col items-center gap-5"
            >
              <DotLottieReact src={SUCCESS_LOTTIE} loop={false} autoplay style={{ width: 140, height: 140 }} />
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
              className="flex flex-col items-center gap-5"
            >
              <DotLottieReact src={FAILURE_LOTTIE} loop={false} autoplay style={{ width: 140, height: 140 }} />
              <span className="text-base font-semibold text-rose-300">Abortado. Ajuste seu plano e tente novamente.</span>
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

export default Launcher;

export { LaunchController } from "./LaunchController";
