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
};

export const ToolsCarrousel: FC<ToolsCarrouselProps> = ({ assets, activeAssetId, onSelectAsset }) => {
  const slides = useMemo(() => assets ?? [], [assets]);
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: false, align: "start", dragFree: true });
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);

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
      const remaining = Math.max(asset.remaining, 0);
      const isDisabled = remaining <= 0;
      const color = asset.color ?? DEFAULT_COLOR;
      const animationSrc = asset.animationSrc ?? MODULE_LOTTIE_MAP[asset.type] ?? DEFAULT_MODULE_LOTTIE;

      return (
        <button
          type="button"
          disabled={isDisabled}
          className={`relative flex w-24 h-22 shrink-0 flex-col items-center justify-center gap-1 rounded-2xl border px-4 py-3 text-center transition focus:outline-none focus:ring-2 focus:ring-cyan-300 ${
            isDisabled
              ? "cursor-not-allowed border-slate-700 bg-slate-800/70 text-slate-500"
              : isActive
              ? "border-cyan-300 bg-cyan-500/25 text-cyan-100 shadow"
              : "border-cyan-500/40 bg-slate-950/80 text-cyan-100 hover:border-cyan-300 hover:bg-slate-900"
          }`}
          style={{ boxShadow: !isDisabled && isActive ? `0 0 0 1px ${color}` : undefined }}
          onClick={() => !isDisabled && onSelectAsset(asset)}
          title={`${label} (${remaining})`}
          aria-label={`${label} (${remaining})`}
        >
          <div className={`flex h-16 w-16 items-center justify-center ${isActive ? "module-pulse" : ""}`}>
            <DotLottieReact
              key={animationSrc}
              src={animationSrc}
              loop
              autoplay
              style={{ width: 56, height: 56 }}
            />
          </div>
          <span
            className="text-[0.65rem] font-medium leading-tight text-cyan-200/90"
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
          <span
            className={`absolute -top-1 -right-1 flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-slate-900/95 px-1 text-[0.55rem] font-semibold text-cyan-100 shadow ${
              isDisabled ? "opacity-40" : ""
            }`}
          >
            {remaining}
          </span>
        </button>
      );
    },
    [activeAssetId, onSelectAsset]
  );

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-center px-2 pb-3 sm:px-4 sm:pb-4">
      <div className="pointer-events-auto w-full max-w-6xl">
        <div className="relative overflow-hidden rounded-3xl shadow-lg backdrop-blur">
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
      </div>
    </div>
  );
};
