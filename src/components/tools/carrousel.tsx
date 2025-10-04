"use client";

import { FC, useCallback, useEffect, useMemo, useRef } from "react";

import type { IAsset, IconComponent } from "./types";

const LOOP_SEGMENTS = 3;

const truncateLabel = (value: string, maxLength = 18) =>
  value.length > maxLength ? `${value.slice(0, Math.max(0, maxLength - 3))}...` : value;

const createDisplayLabel = (value: string) =>
  value
    .split(/[_\s]/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

const BedroomIcon: IconComponent = ({ className }) => (
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
    <path d="M4 10h16" />
    <path d="M4 14h16" />
    <path d="M6 10V8a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" />
    <path d="M18 10V8a2 2 0 0 0-2-2h-2" />
    <path d="M4 18v-4" />
    <path d="M20 18v-4" />
  </svg>
);

const FoodIcon: IconComponent = ({ className }) => (
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
    <path d="M12 7c-2.5 0-4 2-4 4.5v5.5h8v-5.5C16 9 14.5 7 12 7Z" />
    <path d="M9 7a3 3 0 0 1 3-3" />
    <path d="M15 4s.5 2.5-1 3.5" />
  </svg>
);

const DefaultModuleIcon: IconComponent = ({ className }) => (
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
    <rect x="6" y="6" width="12" height="12" rx="3" />
  </svg>
);

const MODULE_ICON_CONFIG: Partial<Record<string, { icon: IconComponent; label: string }>> = {
  bedroom: { icon: BedroomIcon, label: "Bedroom" },
  food: { icon: FoodIcon, label: "Food" },
};

const DEFAULT_COLOR = "#22d3ee";

export type ToolsCarrouselProps = {
  assets: IAsset[];
  activeAssetId: string | null;
  onSelectAsset: (asset: IAsset) => void;
};

export const ToolsCarrousel: FC<ToolsCarrouselProps> = ({ assets, activeAssetId, onSelectAsset }) => {
  const carouselRef = useRef<HTMLDivElement>(null);

  const loopedAssets = useMemo(() => {
    if (!assets.length) return [] as Array<{ key: string; asset: IAsset }>;
    return Array.from({ length: LOOP_SEGMENTS }, (_, segmentIndex) =>
      assets.map((asset) => ({ key: `${segmentIndex}-${asset.id}`, asset }))
    ).flat();
  }, [assets]);

  useEffect(() => {
    const container = carouselRef.current;
    if (!container || !assets.length) return;
    const syncPosition = () => {
      const segmentWidth = container.scrollWidth / LOOP_SEGMENTS;
      if (!Number.isFinite(segmentWidth) || segmentWidth <= 0) return;
      container.scrollLeft = segmentWidth;
    };
    const frame = requestAnimationFrame(syncPosition);
    return () => cancelAnimationFrame(frame);
  }, [assets.length]);

  const handleCarouselScroll = useCallback(() => {
    const container = carouselRef.current;
    if (!container || !assets.length) return;
    const segmentWidth = container.scrollWidth / LOOP_SEGMENTS;
    if (!Number.isFinite(segmentWidth) || segmentWidth <= 0) return;
    const { scrollLeft } = container;
    const minThreshold = segmentWidth * 0.65;
    const maxThreshold = segmentWidth * 1.35;
    if (scrollLeft < minThreshold) {
      container.scrollLeft = scrollLeft + segmentWidth;
    } else if (scrollLeft > maxThreshold) {
      container.scrollLeft = scrollLeft - segmentWidth;
    }
  }, [assets.length]);

  const renderAssetButton = useCallback(
    (asset: IAsset, key: string) => {
      const isActive = activeAssetId === asset.id;
      const iconConfig = MODULE_ICON_CONFIG[asset.type] ?? {
        icon: DefaultModuleIcon,
        label: createDisplayLabel(asset.type),
      };
      const { icon: ModuleIcon } = iconConfig;
      const label = asset.label || iconConfig.label;
      const truncatedLabel = truncateLabel(label);
      const remaining = Math.max(asset.remaining, 0);
      const isDisabled = remaining <= 0;
      const color = asset.color ?? DEFAULT_COLOR;

      return (
        <button
          key={key}
          type="button"
          disabled={isDisabled}
          className={`relative flex w-20 h-24 shrink-0 flex-col items-center justify-center gap-1 rounded-2xl border px-4 py-3 text-center transition focus:outline-none focus:ring-2 focus:ring-cyan-300 ${
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
          <ModuleIcon className="h-8 w-8" />
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
        <div className="overflow-hidden rounded-3xl shadow-lg backdrop-blur">
          {loopedAssets.length ? (
            <div
              ref={carouselRef}
              onScroll={handleCarouselScroll}
              className="flex w-full items-center gap-3 overflow-x-auto px-5 py-4 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
            >
              {loopedAssets.map(({ key, asset }) => renderAssetButton(asset, key))}
            </div>
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
