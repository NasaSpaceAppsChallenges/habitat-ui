"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useAtomValue } from "jotai";
import { userAtom } from "@/app/jotai/moduleMakerConfigAtom";

const infoIcon = (
  <svg
    className="h-[14px] w-[14px]"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.8}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <circle cx="12" cy="12" r="9" />
    <line x1="12" y1="8" x2="12" y2="8" />
    <line x1="12" y1="11" x2="12" y2="16" />
  </svg>
);

const closeIcon = (
  <svg
    className="h-[14px] w-[14px]"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.8}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const formatPoints = (value: number) => (value > 0 ? `+${value}` : `${value}`);

const formatModuleLabel = (value: string) =>
  value
    .split(/[_\s]/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

const renderList = (
  items: Array<{ moduleType: string; withModuleType: string; points: number; reason: string }>,
  variant: "negative" | "positive"
) => {
  if (!items.length) {
    return (
      <p className="rounded-xl border border-slate-500/30 bg-slate-800/40 p-4 text-sm text-slate-200">
        Nenhum registro disponível nesta categoria.
      </p>
    );
  }

  const itemStyles =
    variant === "negative"
      ? "border-red-500/40 bg-red-500/10 text-red-100"
      : "border-emerald-400/40 bg-emerald-400/10 text-emerald-100";

  const labelColor = variant === "negative" ? "text-red-200" : "text-emerald-200";
  const reasonColor = variant === "negative" ? "text-red-200/80" : "text-emerald-200/80";

  return (
    <ul className="flex flex-col gap-3">
      {items.map((item, index) => (
        <li key={`${item.moduleType}-${item.withModuleType}-${index}`} className={`rounded-2xl border p-4 ${itemStyles}`}>
          <div className="flex flex-col gap-2">
            <div className="flex items-start justify-between gap-3 text-sm font-semibold">
              <span className={labelColor}>
                {formatModuleLabel(item.moduleType)}
                <span className="mx-1 text-xs font-light">×</span>
                {formatModuleLabel(item.withModuleType)}
              </span>
              <span className="text-xs font-bold tracking-wide">{formatPoints(item.points)}</span>
            </div>
            <p className={`text-xs leading-relaxed ${reasonColor}`}>{item.reason}</p>
          </div>
        </li>
      ))}
    </ul>
  );
};

const PlayerScore = () => {
  const user = useAtomValue(userAtom);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"negative" | "positive">("negative");

  useEffect(() => {
    if (!isModalOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsModalOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isModalOpen]);

  useEffect(() => {
    if (!isModalOpen) return;

    setActiveTab("negative");
  }, [isModalOpen]);

  useEffect(() => {
    if (!isModalOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isModalOpen]);

  const modalContent = useMemo(() => {
    if (!isModalOpen) return null;

    const negativeItems = user.relationshipSummary.negative;
    const positiveItems = user.relationshipSummary.positive;

    const activeItems = activeTab === "negative" ? negativeItems : positiveItems;

    return createPortal(
      <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6">
        <div
          className="absolute inset-0 bg-slate-950/80 backdrop-blur"
          aria-hidden="true"
          onClick={() => setIsModalOpen(false)}
        />

        <div className="relative z-10 w-full max-w-2xl rounded-3xl border border-cyan-500/30 bg-slate-900/95 p-6 shadow-2xl">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-cyan-300/70">Pontuação por módulo</p>
              <p className="text-3xl font-semibold text-cyan-100">{user.score}</p>
            </div>

            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-cyan-500/40 bg-slate-900 text-cyan-100 transition hover:border-cyan-300 focus:outline-none focus:ring-2 focus:ring-cyan-300/70"
              aria-label="Fechar detalhes da pontuação"
            >
              {closeIcon}
            </button>
          </div>

          <div className="mt-4 flex items-center gap-3">
            <p className="text-sm text-slate-200">Detalhes das relações entre módulos</p>
          </div>

          <div className="mt-6 flex gap-3">
            <button
              type="button"
              onClick={() => setActiveTab("negative")}
              className={`rounded-2xl px-4 py-2 text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-red-400/60 ${
                activeTab === "negative"
                  ? "border border-red-400/60 bg-red-500/15 text-red-100"
                  : "border border-transparent bg-slate-800/60 text-slate-200 hover:border-red-400/40 hover:text-red-100"
              }`}
            >
              Negativos
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("positive")}
              className={`rounded-2xl px-4 py-2 text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-emerald-400/60 ${
                activeTab === "positive"
                  ? "border border-emerald-400/60 bg-emerald-400/10 text-emerald-100"
                  : "border border-transparent bg-slate-800/60 text-slate-200 hover:border-emerald-400/40 hover:text-emerald-100"
              }`}
            >
              Positivos
            </button>
          </div>

          <div className="mt-6 max-h-[60vh] overflow-y-auto pr-2">
            {renderList(activeItems, activeTab)}
          </div>
        </div>
      </div>,
      document.body
    );
  }, [activeTab, isModalOpen, user.relationshipSummary.negative, user.relationshipSummary.positive, user.score]);

  return (
    <>
      <div className="flex w-full items-center justify-between rounded-xl border border-cyan-500/30 bg-slate-950/80 px-3 py-2 text-cyan-100 shadow-lg shadow-cyan-500/10">
        <div>
          <p className="text-[10px] uppercase tracking-[0.28em] text-cyan-300/70">Pontuação</p>
          <p className="text-xl font-semibold text-cyan-50">{user.score}</p>
        </div>
        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="flex h-8 w-8 items-center justify-center rounded-full border border-cyan-500/40 bg-slate-900 text-cyan-100 transition hover:border-cyan-300 focus:outline-none focus:ring-2 focus:ring-cyan-300/70"
          aria-label="Abrir detalhes da pontuação"
        >
          {infoIcon}
        </button>
      </div>

      {modalContent}
    </>
  );
};

export default PlayerScore;
