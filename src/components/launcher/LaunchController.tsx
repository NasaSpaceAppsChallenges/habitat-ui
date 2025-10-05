"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useAtomValue, useSetAtom } from "jotai";

import {
  missionReportAtom,
  type MissionEventCategory,
  type MissionEventType,
  userAtom,
} from "@/app/jotai/moduleMakerConfigAtom";
import {
  playerLanunchStatusAtom,
  type PlayerLaunchStatus,
} from "@/app/jotai/playerlaunchStatusAtom";
import { makeReportFileName, normalizeImages } from "@/app/playground/functions/helpers";
import type { LaunchMissionRequest, LaunchMissionResponse } from "@/types/api";

export type LaunchState = {
  active: boolean;
  loading: boolean;
  success: boolean;
};

type LaunchControllerRenderProps = {
  launch: () => void;
  launchState: LaunchState;
};

type LaunchControllerProps = {
  buildPayload: () => LaunchMissionRequest;
  missionName?: string | null;
  children: (renderProps: LaunchControllerRenderProps) => ReactNode;
  onLogMissionEvent?: (
    message: string,
    delta: number,
    type?: MissionEventType,
    category?: MissionEventCategory
  ) => void;
  redirectPath?: string;
  redirectDelayMs?: number;
};

export function LaunchController({
  buildPayload,
  missionName,
  children,
  onLogMissionEvent,
  redirectPath = "/relatorios",
  redirectDelayMs = 3000,
}: LaunchControllerProps) {
  const router = useRouter();
  const setMissionReport = useSetAtom(missionReportAtom);
  const setPlayerLaunchStatus = useSetAtom(playerLanunchStatusAtom);
  const user = useAtomValue(userAtom);
  const launchControllerRef = useRef<AbortController | null>(null);
  const postLaunchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [launchState, setLaunchState] = useState<LaunchState>(() => ({ active: false, loading: false, success: false }));

  const resolvedMissionName = useMemo(() => missionName?.trim() || "Missao", [missionName]);

  const persistLaunchStatus = useCallback((status: PlayerLaunchStatus) => {
    if (typeof window === "undefined") {
      return;
    }

    try {
      window.sessionStorage.setItem("player-launch-status", JSON.stringify(status));
    } catch (storageError) {
      console.warn("Não foi possível persistir o status de lançamento.", storageError);
    }
  }, []);

  const cleanupController = useCallback(() => {
    if (launchControllerRef.current) {
      launchControllerRef.current.abort();
      launchControllerRef.current = null;
    }
  }, []);

  const clearRedirectTimer = useCallback(() => {
    if (postLaunchTimerRef.current) {
      clearTimeout(postLaunchTimerRef.current);
      postLaunchTimerRef.current = null;
    }
  }, []);

  useEffect(() => () => {
    cleanupController();
    clearRedirectTimer();
  }, [cleanupController, clearRedirectTimer]);

  const handleLaunch = useCallback(async () => {
    clearRedirectTimer();
    cleanupController();

    setMissionReport(null);

    const initialStatus: PlayerLaunchStatus = { phase: "launching", response: null, lastUpdatedAt: null };
    setPlayerLaunchStatus(initialStatus);
    persistLaunchStatus(initialStatus);

    const controller = new AbortController();
    launchControllerRef.current = controller;

    setLaunchState({ active: true, loading: true, success: false });

    let payload: LaunchMissionRequest;
    try {
      payload = buildPayload();
    } catch (error) {
      console.error("Falha ao construir o payload de lançamento.", error);
      const message = "Não foi possível preparar o plano de missão.";
      const failureTimestamp = new Date().toISOString();

      const fallbackResponse: LaunchMissionResponse = {
        success: false,
        message,
        score: user.score,
        pdfBase64: "",
        images: [],
        worsePoints: [],
        improvementPoints: [],
      };

      setMissionReport({
        status: "error",
        message,
        score: user.score,
        pdf: null,
        images: [],
        gallery: [],
        worsePoints: [],
        improvementPoints: [],
      });

      const failureStatus: PlayerLaunchStatus = {
        phase: "failure",
        response: fallbackResponse,
        lastUpdatedAt: failureTimestamp,
      };

      setPlayerLaunchStatus(failureStatus);
      persistLaunchStatus(failureStatus);
      setLaunchState({ active: true, loading: false, success: false });
      onLogMissionEvent?.(message, 0, "error", "general");
      postLaunchTimerRef.current = setTimeout(() => {
        router.push(redirectPath);
      }, redirectDelayMs);
      return;
    }

    try {
      const response = await fetch("/api/launch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      if (!response.ok) {
        let fallbackMessage = `Falha ao contatar o serviço (status ${response.status}).`;
        try {
          const errorBody = (await response.json()) as Partial<LaunchMissionResponse>;
          if (errorBody?.message) {
            fallbackMessage = errorBody.message;
          }
        } catch (parseError) {
          console.warn("Não foi possível ler a resposta de erro do serviço.", parseError);
        }
        throw new Error(fallbackMessage);
      }

      const rawResult = (await response.json()) as LaunchMissionResponse;

      if (controller.signal.aborted) {
        return;
      }

      const eventTimestamp = new Date().toISOString();
      const resolvedScore = Number.isFinite(rawResult.score) ? rawResult.score : user.score;
      const normalizedImages = normalizeImages(rawResult.images);
      const hasPdfPayload = Boolean(rawResult.pdfBase64);
      const pdfMimeType = hasPdfPayload ? rawResult.pdfMimeType ?? "application/pdf" : undefined;
      const pdfFileName = hasPdfPayload
        ? rawResult.pdfFileName ?? makeReportFileName(resolvedMissionName)
        : undefined;

      const normalizedResult: LaunchMissionResponse = {
        ...rawResult,
        score: resolvedScore,
        pdfBase64: rawResult.pdfBase64 ?? "",
        pdfMimeType,
        pdfFileName,
        images: normalizedImages.map(({ name, base64, mimeType }) => ({ name, base64, mimeType })),
        worsePoints: rawResult.worsePoints ?? [],
        improvementPoints: rawResult.improvementPoints ?? [],
      };

      const launchPhase: "success" | "failure" = resolvedScore > 0 ? "success" : "failure";

      const successStatus: PlayerLaunchStatus = {
        phase: launchPhase,
        response: normalizedResult,
        lastUpdatedAt: eventTimestamp,
      };

      setPlayerLaunchStatus(successStatus);
      persistLaunchStatus(successStatus);

      setMissionReport({
        status: launchPhase === "success" ? "success" : "error",
        message:
          normalizedResult.message ??
          (launchPhase === "success" ? "Plano aprovado." : "Plano rejeitado."),
        score: resolvedScore,
        pdf: hasPdfPayload
          ? {
              base64: normalizedResult.pdfBase64,
              mimeType: normalizedResult.pdfMimeType ?? "application/pdf",
              fileName: normalizedResult.pdfFileName ?? makeReportFileName(resolvedMissionName),
            }
          : null,
        images: normalizedImages.map(({ name, base64, mimeType }) => ({ name, base64, mimeType })),
        gallery: normalizedImages.map((entry) => entry.dataUrl),
        worsePoints: normalizedResult.worsePoints,
        improvementPoints: normalizedResult.improvementPoints,
      });

      setLaunchState({ active: true, loading: false, success: launchPhase === "success" });

      if (launchPhase === "success") {
        const previousScore = user.score ?? 0;
        const delta = resolvedScore - previousScore;
        onLogMissionEvent?.(
          normalizedResult.message ?? `Plano enviado com sucesso. Nova pontuação: ${resolvedScore}.`,
          delta,
          "success",
          "general"
        );
      } else {
        onLogMissionEvent?.(normalizedResult.message ?? "Plano rejeitado pelo sistema.", 0, "error", "general");
      }

      postLaunchTimerRef.current = setTimeout(() => {
        router.push(redirectPath);
      }, redirectDelayMs);
    } catch (error) {
      if (controller.signal.aborted) {
        return;
      }

      const message =
        error instanceof Error ? error.message : "Não foi possível contatar o serviço de avaliação.";

      const failureTimestamp = new Date().toISOString();
      const fallbackResponse: LaunchMissionResponse = {
        success: false,
        message,
        score: user.score,
        pdfBase64: "",
        images: [],
        worsePoints: [],
        improvementPoints: [],
      };

      setMissionReport({
        status: "error",
        message,
        score: user.score,
        pdf: null,
        images: [],
        gallery: [],
        worsePoints: [],
        improvementPoints: [],
      });

      const failureStatus: PlayerLaunchStatus = {
        phase: "failure",
        response: fallbackResponse,
        lastUpdatedAt: failureTimestamp,
      };

      setPlayerLaunchStatus(failureStatus);
      persistLaunchStatus(failureStatus);
      setLaunchState({ active: true, loading: false, success: false });
      onLogMissionEvent?.(message, 0, "error", "general");

      postLaunchTimerRef.current = setTimeout(() => {
        router.push(redirectPath);
      }, redirectDelayMs);
    } finally {
      if (launchControllerRef.current === controller) {
        launchControllerRef.current = null;
      }
    }
  }, [
    buildPayload,
    cleanupController,
    clearRedirectTimer,
    persistLaunchStatus,
    redirectDelayMs,
    redirectPath,
    router,
    resolvedMissionName,
    setMissionReport,
    setPlayerLaunchStatus,
    user.score,
    onLogMissionEvent,
  ]);

  const triggerLaunch = useCallback(() => {
    void handleLaunch();
  }, [handleLaunch]);

  return <>{children({ launch: triggerLaunch, launchState })}</>;
}
