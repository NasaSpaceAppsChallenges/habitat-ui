"use client";

import { FC, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

import { ToolsCarrousel } from "./carrousel";
import type { Asset, AssetType, IAsset, ITool, IconComponent, ToolName } from "./types";
import { toolNames } from "./types";

const assetColorMap: Record<AssetType, string> = {
  bedroom: "#38bdf8",
  food: "#f97316",
  kitchen: "#fb7185",
  living_room: "#60a5fa",
  laboratory: "#a855f7",
  workshop: "#facc15",
  storage: "#34d399",
  life_support: "#22d3ee",
  communications: "#f97316",
  exercise: "#fbbf24",
  medical: "#f472b6",
  common_area: "#93c5fd",
  bathroom: "#86efac",
};

const formatLabel = (value: string) =>
  value
    .split(/[_\s]/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

const EraseIcon: IconComponent = ({ className }) => (
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
    <path d="M3 12.5 11.5 4a2 2 0 0 1 2.83 0l5.67 5.66a2 2 0 0 1 0 2.83L13 19.5H7.5L3 15Z" />
    <path d="M2 20h12" />
  </svg>
);

const MoveIcon: IconComponent = ({ className }) => (
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
    <path d="M12 5v14" />
    <path d="M5 12h14" />
    <polyline points="9 8 12 5 15 8" />
    <polyline points="9 16 12 19 15 16" />
    <polyline points="8 9 5 12 8 15" />
    <polyline points="16 9 19 12 16 15" />
  </svg>
);

const WrenchIcon: IconComponent = ({ className }) => (
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
    <path d="M21 16.5a4.5 4.5 0 0 1-6.36 0L7.5 9.36 5.11 11.75a1.5 1.5 0 0 1-2.12-2.12l6-6a1.5 1.5 0 0 1 2.12 0L13.39 6.9l7.14 7.14a4.5 4.5 0 0 1 0 6.36Z" />
    <path d="M16 18v-2" />
    <path d="M18 16h-2" />
  </svg>
);

const TOOL_CONFIG: Record<ToolName, { label: string; icon: IconComponent }> = {
  erase: { label: "Erase", icon: EraseIcon },
  move: { label: "Move", icon: MoveIcon },
};

export type ToolsProps = {
  assets: Asset[];
  onSelectTool: (tool: ITool) => void;
  onSelectAsset: (asset: IAsset) => void;
};

export const Tools: FC<ToolsProps> = ({ assets: incomingAssets, onSelectTool, onSelectAsset }) => {
  const [drawed, setDrawed] = useState<Record<AssetType, number>[]>([]);
  const [activeTool, setActiveTool] = useState<ToolName | null>(null);
  const [activeAssetId, setActiveAssetId] = useState<string | null>(null);
  const [isPaletteOpen, setIsPaletteOpen] = useState(false);

  const boundaryRef = useRef<HTMLDivElement>(null);

  const assetCount = incomingAssets.length;

  useEffect(() => {
    setDrawed((prev) => {
      if (prev.length === assetCount) return prev;
      return Array.from({ length: assetCount }, (_, index) => prev[index] ?? {});
    });
  }, [assetCount]);

  const assets = useMemo<IAsset[]>(() => {
    return incomingAssets.map((asset, index) => {
      const drawn = drawed[index]?.[asset.type] ?? 0;
      const remaining = Math.max(asset.quantity - drawn, 0);
      const label = asset.label ?? formatLabel(asset.type);
      const color = asset.color ?? assetColorMap[asset.type] ?? "#22d3ee";

      const draw = () => {
        setDrawed((prev) => {
          const next = [...prev];
          const current = { ...(next[index] ?? {}) } as Record<AssetType, number>;
          const currentCount = current[asset.type] ?? 0;
          if (currentCount >= asset.quantity) {
            return prev;
          }
          current[asset.type] = currentCount + 1;
          next[index] = current;
          return next;
        });
      };

      return {
        id: `asset-${index}`,
        type: asset.type,
        quantity: asset.quantity,
        remaining,
        label,
        color,
        draw,
      } satisfies IAsset;
    });
  }, [incomingAssets, drawed]);

  useEffect(() => {
    if (!activeAssetId) return;
    const stillExists = assets.some((asset) => asset.id === activeAssetId);
    if (!stillExists) {
      setActiveAssetId(null);
    }
  }, [assets, activeAssetId]);

  const handleSelectTool = useCallback(
    (toolName: ToolName) => {
      setActiveTool(toolName);
      setActiveAssetId(null);
      setIsPaletteOpen(false);
      onSelectTool?.({ name: toolName });
    },
    [onSelectTool]
  );

  const handleSelectAsset = useCallback(
    (asset: IAsset) => {
      if (asset.remaining <= 0) return;
      setActiveAssetId(asset.id);
      setIsPaletteOpen(false);
      onSelectAsset?.(asset);
    },
    [onSelectAsset]
  );

  const renderToolButton = useCallback(
    (toolName: ToolName) => {
      const { label, icon: Icon } = TOOL_CONFIG[toolName];
      const isActive = activeTool === toolName;

      return (
        <button
          key={toolName}
          type="button"
          className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-cyan-300 ${
            isActive
              ? "border-cyan-300 bg-cyan-500/25 text-cyan-100 shadow"
              : "border-cyan-500/40 bg-slate-950/80 text-cyan-100 hover:border-cyan-300 hover:bg-slate-900"
          }`}
          onClick={() => handleSelectTool(toolName)}
          title={label}
          aria-label={label}
        >
          <Icon className="h-4 w-4" />
          <span>{label}</span>
        </button>
      );
    },
    [activeTool, handleSelectTool]
  );

  return (
    <>
      <div ref={boundaryRef} className="pointer-events-none fixed inset-0 z-40" />

      <motion.div
        className="pointer-events-auto fixed right-4 top-[45%] z-50"
        drag
        dragMomentum={false}
        dragElastic={0.2}
        dragConstraints={boundaryRef}
      >
        <div className="relative">
          <button
            type="button"
            className="flex h-12 w-12 items-center justify-center rounded-2xl border border-amber-300/70 bg-gradient-to-br from-amber-500 via-orange-500 to-rose-600 text-white shadow-lg shadow-amber-500/30 transition focus:outline-none focus:ring-2 focus:ring-amber-200/70"
            onClick={() => setIsPaletteOpen((prev) => !prev)}
            aria-label="Ferramentas"
          >
            <WrenchIcon className="h-7 w-7" />
          </button>

          <AnimatePresence>
            {isPaletteOpen && (
              <motion.div
                key="tool-palette"
                initial={{ opacity: 0, x: 12, scale: 0.95 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: 12, scale: 0.95 }}
                transition={{ duration: 0.18, ease: "easeOut" }}
                className="absolute right-full top-1/2 z-10 mr-3 flex -translate-y-1/2 flex-col gap-2 rounded-2xl border border-cyan-500/30 bg-slate-950/95 p-3 text-cyan-100 shadow-2xl backdrop-blur"
              >
                {toolNames.map(renderToolButton)}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      <ToolsCarrousel assets={assets} activeAssetId={activeAssetId} onSelectAsset={handleSelectAsset} />
    </>
  );
};
