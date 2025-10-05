"use client";

import { FC, useCallback, useEffect, useMemo, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";

import { DotLottieReact } from "@lottiefiles/dotlottie-react";
import { DEFAULT_MODULE_LOTTIE, MODULE_LOTTIE_MAP } from "@/utils/moduleLottieMap";

import type { IAsset } from "./types";

const truncateLabel = (value: string, maxLength = 18) =>
  value.length > maxLength ? `${value.slice(0, Math.max(0, maxLength - 3))}...` : value;

const createDisplayLabel = (value: string) =>
  value
    .split(/[_\s]/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

const DEFAULT_COLOR = "#22d3ee";

const ArrowIcon: FC<{ direction: "left" | "right"; className?: string }> = ({ direction, className }) => (
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
    {direction === "left" ? <path d="M15 6l-6 6 6 6" /> : <path d="M9 18l6-6-6-6" />}
  </svg>
);

export type ToolsCarrouselProps = {
  assets: IAsset[];
  activeAssetId: string | null;
  onSelectAsset: (asset: IAsset) => void;
  onLaunch?: () => void;
  launching?: boolean;
};

export const ToolsCarrousel: FC<ToolsCarrouselProps> = ({ assets, activeAssetId, onSelectAsset, onLaunch, launching }) => {
  const slides = useMemo(() => assets ?? [], [assets]);
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: false, align: "start", dragFree: true });
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);
  const [completedAssets, setCompletedAssets] = useState<Set<string>>(new Set());
  const [failedAnimations, setFailedAnimations] = useState<Record<string, boolean>>({});
  const allPlaced = useMemo(
    () => slides.length > 0 && slides.every((asset) => asset.unlimited || asset.remaining === 0),
    [slides]
  );

  const markAnimationFailed = useCallback((src: string) => {
    if (!src) return;
    setFailedAnimations((prev) => (prev[src] ? prev : { ...prev, [src]: true }));
  }, []);

  const updateScrollState = useCallback(() => {
    if (!emblaApi) return;
    setCanScrollPrev(emblaApi.canScrollPrev());
    setCanScrollNext(emblaApi.canScrollNext());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    updateScrollState();
    emblaApi.on("select", updateScrollState);
    emblaApi.on("reInit", updateScrollState);
    return () => {
      emblaApi.off("select", updateScrollState);
      emblaApi.off("reInit", updateScrollState);
    };
  }, [emblaApi, updateScrollState]);

  useEffect(() => {
    const newCompletedAssets = new Set<string>();
    assets.forEach((asset) => {
      const totalQuantity = asset.quantity ?? 0;
      const remaining = Math.max(asset.remaining, 0);
      const isComplete = totalQuantity > 0 && remaining === 0;
      if (isComplete && !completedAssets.has(asset.id)) {
        newCompletedAssets.add(asset.id);
      }
    });
    if (newCompletedAssets.size > 0) {
      setCompletedAssets(prev => new Set([...prev, ...newCompletedAssets]));
    }
  }, [assets, completedAssets]);

  const scrollPrev = useCallback(() => {
    if (!emblaApi) return;
    emblaApi.scrollPrev();
  }, [emblaApi]);

  const scrollNext = useCallback(() => {
    if (!emblaApi) return;
    emblaApi.scrollNext();
  }, [emblaApi]);

  const renderAssetButton = useCallback(
    (asset: IAsset) => {
      const isActive = activeAssetId === asset.id;
      const label = asset.label || createDisplayLabel(asset.type);
      const truncatedLabel = truncateLabel(label);
  const totalQuantity = asset.quantity ?? 0;
  const isUnlimited = Boolean(asset.unlimited) || !Number.isFinite(totalQuantity);
  const remaining = isUnlimited ? Number.POSITIVE_INFINITY : Math.max(asset.remaining, 0);
  const remainingLabel = isUnlimited ? "∞" : remaining;
  const isComplete = !isUnlimited && totalQuantity > 0 && remaining === 0;
  const isDepleted = !isUnlimited && remaining <= 0;
  const disableButton = isDepleted;
      const color = asset.color ?? DEFAULT_COLOR;
      const animationSrc = asset.animationSrc ?? MODULE_LOTTIE_MAP[asset.type] ?? DEFAULT_MODULE_LOTTIE;
      const checkAnimationSrc = "/json_files/check_success.lottie";
      const shouldShowAnimation = !!animationSrc && !failedAnimations[animationSrc];

      const buttonStateClass = disableButton
        ? isComplete
          ? "cursor-default border-emerald-300/60 bg-emerald-900/20 text-emerald-100/90 shadow-lg shadow-emerald-500/15"
          : "cursor-not-allowed border-slate-700 bg-slate-800/70 text-slate-500"
        : isActive
        ? "border-cyan-300 bg-cyan-500/25 text-cyan-100 shadow"
        : "border-cyan-500/40 bg-slate-950/80 text-cyan-100 hover:border-cyan-300 hover:bg-slate-900";

      const highlightShadow = isComplete
        ? "0 0 18px rgba(34,197,94,0.45)"
        : !disableButton && isActive
        ? `0 0 0 1px ${color}`
        : undefined;

      const renderFallbackBadge = (text: string) => (
        <div
          className="flex h-12 w-12 items-center justify-center rounded-full border border-cyan-300/30 bg-slate-900/70 text-xs font-semibold text-cyan-200"
          aria-hidden="true"
        >
          {text.slice(0, 2).toUpperCase() || "--"}
        </div>
      );

      return (
        <button
          type="button"
          disabled={disableButton}
          className={`relative flex w-24 h-26 shrink-0 flex-col items-center justify-center rounded-2xl border px-4 py-4 text-center transition focus:outline-none focus:ring-2 focus:ring-cyan-300 ${buttonStateClass}`}
          style={{ boxShadow: highlightShadow }}
          onClick={() => !disableButton && onSelectAsset(asset)}
          title={`${label} (${remainingLabel})`}
          aria-label={`${label} (${remainingLabel})`}
        >
          <span
            className={`absolute -top-1.5 -right-1.5 z-20 flex h-5 min-w-[1.35rem] items-center justify-center rounded-full bg-slate-900/95 px-1 text-[0.55rem] font-semibold text-cyan-100 shadow transition ${
              disableButton && !isComplete ? "opacity-40" : ""
            }`}
          >
            {remainingLabel}
          </span>

          <div className={`relative z-10 flex w-full flex-1 flex-col items-center justify-center gap-2 ${isComplete ? "opacity-80" : ""}`}>
            <div
              className={`flex h-14 w-14 items-center justify-center rounded-full transition ${
                isActive && !isComplete ? "module-pulse" : ""
              } ${
                isComplete ? "bg-emerald-500/15 ring-2 ring-emerald-400/60" : ""
              }`}
            >
              {isComplete ? (
                failedAnimations[checkAnimationSrc]
                  ? renderFallbackBadge("OK")
                  : (
                    <DotLottieReact
                      key={`check-${asset.id}`}
                      src={checkAnimationSrc}
                      loop={false}
                      autoplay={!completedAssets.has(asset.id)}
                      style={{ width: 50, height: 50 }}
                      onError={() => markAnimationFailed(checkAnimationSrc)}
                    />
                  )
              ) : shouldShowAnimation ? (
                <DotLottieReact
                  key={animationSrc}
                  src={animationSrc}
                  loop={isActive}
                  autoplay={isActive}
                  style={{ width: 50, height: 50 }}
                  onError={() => markAnimationFailed(animationSrc)}
                />
              ) : (
                renderFallbackBadge(truncatedLabel)
              )}
            </div>
            <span
              className="text-[0.75rem] font-semibold leading-tight text-cyan-100"
              style={{
                display: "-webkit-box",
                WebkitBoxOrient: "vertical",
                WebkitLineClamp: 2,
                overflow: "hidden",
                textOverflow: "ellipsis",
                wordBreak: "break-word",
              }}
            >
              {truncatedLabel}
            </span>
          </div>
        </button>
      );
    },
    [activeAssetId, completedAssets, failedAnimations, markAnimationFailed, onSelectAsset]
  );

  return (
    <div
      className={`fixed inset-x-0 bottom-0 z-40 flex justify-center px-2 pb-3 sm:px-4 sm:pb-4 ${
        allPlaced ? "pointer-events-auto" : "pointer-events-none"
      }`}
    >
      <div className="pointer-events-auto w-full max-w-6xl">
        <div className="relative overflow-hidden rounded-3xl shadow-lg backdrop-blur">
          <div
            className={`transition-all duration-300 ease-out ${
              allPlaced ? "max-h-0 opacity-0 translate-y-6 pointer-events-none" : "max-h-[320px] opacity-100"
            }`}
          >
            {slides.length ? (
              <>
                <div className="absolute inset-y-0 left-2 z-10 hidden items-center sm:flex">
                  <button
                    type="button"
                    onClick={scrollPrev}
                    disabled={!canScrollPrev}
                    className={`flex h-9 w-9 items-center justify-center rounded-full border border-cyan-500/30 bg-slate-950/80 text-cyan-100 shadow transition focus:outline-none focus:ring-2 focus:ring-cyan-300 ${
                      canScrollPrev ? "hover:border-cyan-300 hover:text-cyan-50" : "opacity-40"
                    }`}
                  >
                    <ArrowIcon direction="left" className="h-4 w-4" />
                  </button>
                </div>
                <div className="absolute inset-y-0 right-2 z-10 hidden items-center sm:flex">
                  <button
                    type="button"
                    onClick={scrollNext}
                    disabled={!canScrollNext}
                    className={`flex h-9 w-9 items-center justify-center rounded-full border border-cyan-500/30 bg-slate-950/80 text-cyan-100 shadow transition focus:outline-none focus:ring-2 focus:ring-cyan-300 ${
                      canScrollNext ? "hover:border-cyan-300 hover:text-cyan-50" : "opacity-40"
                    }`}
                  >
                    <ArrowIcon direction="right" className="h-4 w-4" />
                  </button>
                </div>
                <div className="px-4 py-4">
                  <div className="overflow-hidden" ref={emblaRef}>
                    <div className="flex w-full gap-3">
                      {slides.map((asset) => (
                        <div key={asset.id} className="flex-[0_0_auto]">
                          {renderAssetButton(asset)}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex h-16 w-full items-center justify-center text-xs text-cyan-300/80 sm:text-sm">
                Nenhum módulo disponível
              </div>
            )}
          </div>
          {allPlaced && (
            <div className="flex flex-col items-center gap-3 px-6 py-6">
              <LaunchButton onLaunch={onLaunch} disabled={Boolean(launching)} launching={Boolean(launching)} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const LaunchButton: FC<{ onLaunch?: () => void; disabled?: boolean; launching?: boolean }> = ({ onLaunch, disabled, launching }) => (
  <button
    type="button"
    disabled={disabled}
    onClick={() => !disabled && onLaunch?.()}
    className={`group inline-flex items-center gap-2 rounded-full border px-5 py-2.5 text-sm font-semibold uppercase tracking-widest transition focus:outline-none focus:ring-2 focus:ring-emerald-200 ${
      disabled
        ? "cursor-not-allowed border-emerald-500/30 bg-emerald-500/10 text-emerald-200/60"
        : "border-emerald-300/70 bg-emerald-500/15 text-emerald-100 hover:border-emerald-200 hover:bg-emerald-400/20"
    }`}
  >
    <span
      className={`relative flex h-7 w-7 items-center justify-center rounded-full text-emerald-200 shadow-inner shadow-emerald-500/30 transition ${
        disabled ? "bg-emerald-500/10" : "bg-emerald-500/20 group-hover:bg-emerald-400/25"
      }`}
    >
      {launching ? <SpinnerIcon className="h-4 w-4 animate-spin" /> : <RocketIcon className="h-4 w-4" />}
    </span>
    {launching ? "Lançando..." : "Zarpar"}
  </button>
);

const RocketIcon: FC<{ className?: string }> = ({ className }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.7}
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

const SpinnerIcon: FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4a8 8 0 108 8" />
  </svg>
);
