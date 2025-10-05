"use client";

import { FC, useCallback, useEffect, useMemo, useState } from "react";

import { ToolsCarrousel } from "./carrousel";
import { SoundToggle } from "./SoundToggle";
import type { Asset, AssetType, IAsset, ITool, IconComponent, ToolName } from "./types";
import { toolNames } from "./types";

const assetColorMap: Partial<Record<AssetType, string>> = {
  private_crew_quarters: "#38bdf8",
  common_kitchen_and_mess: "#f97316",
  work_command_station: "#facc15",
  multipurpose_science_medical_area: "#a855f7",
  dedicated_storage_logistics: "#34d399",
  radiation_shelter: "#22d3ee",
  dedicated_wcs: "#86efac",
  full_hygiene_station: "#f472b6",
  permanent_exercise_area: "#fbbf24",
  corridor: "#94a3b8",
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

const TOOL_CONFIG: Record<ToolName, { label: string; icon: IconComponent }> = {
  erase: { label: "Apagar", icon: EraseIcon },
  move: { label: "Mover", icon: MoveIcon },
};

export type ToolsProps = {
  assets: Asset[];
  onSelectTool: (tool: ITool) => void;
  onSelectAsset: (asset: IAsset) => void;
  onAssetsChange?: (assets: IAsset[]) => void;
  onLaunch?: () => void;
  launching?: boolean;
};

export const Tools: FC<ToolsProps> = ({ assets: incomingAssets, onSelectTool, onSelectAsset, onAssetsChange, onLaunch, launching }) => {
  const [drawed, setDrawed] = useState<Record<AssetType, number>[]>([]);
  const [activeTool, setActiveTool] = useState<ToolName | null>(null);
  const [activeAssetId, setActiveAssetId] = useState<string | null>(null);

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
      const isUnlimited = Boolean(asset.unlimited) || !Number.isFinite(asset.quantity);
      const baseQuantity = isUnlimited ? Number.POSITIVE_INFINITY : asset.quantity;
      const remaining = isUnlimited ? Number.POSITIVE_INFINITY : Math.max(asset.quantity - drawn, 0);
      const label = asset.label ?? formatLabel(asset.type);
  const color = asset.color ?? assetColorMap[asset.type] ?? "#22d3ee";
  const animationSrc = asset.animationSrc;

      const draw = () => {
        setDrawed((prev) => {
          const next = [...prev];
          const current = { ...(next[index] ?? {}) } as Record<AssetType, number>;
          const currentCount = current[asset.type] ?? 0;
          if (!isUnlimited && currentCount >= asset.quantity) {
            return prev;
          }
          current[asset.type] = currentCount + 1;
          next[index] = current;
          return next;
        });
      };

      const restore = () => {
        setDrawed((prev) => {
          const next = [...prev];
          const current = { ...(next[index] ?? {}) } as Record<AssetType, number>;
          const currentCount = current[asset.type] ?? 0;
          if (currentCount <= 0) {
            return prev;
          }
          current[asset.type] = currentCount - 1;
          next[index] = current;
          return next;
        });
      };

      return {
        id: `asset-${index}`,
        type: asset.type,
        quantity: baseQuantity,
        remaining,
        label,
        color,
        draw,
        restore,
        animationSrc,
        unlimited: isUnlimited,
      } satisfies IAsset;
    });
  }, [incomingAssets, drawed]);

  useEffect(() => {
    onAssetsChange?.(assets);
  }, [assets, onAssetsChange]);

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
      onSelectTool?.({ name: toolName });
    },
    [onSelectTool]
  );

  const handleSelectAsset = useCallback(
    (asset: IAsset) => {
      if (asset.remaining <= 0) return;
      setActiveAssetId(asset.id);
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
          className={`flex h-12 w-12 items-center justify-center rounded-2xl border transition focus:outline-none focus:ring-2 focus:ring-cyan-300 ${
            isActive
              ? "border-cyan-300 bg-cyan-500/25 text-cyan-100 shadow"
              : "border-cyan-500/40 bg-slate-950/80 text-cyan-100 hover:border-cyan-300 hover:bg-slate-900"
          }`}
          onClick={() => handleSelectTool(toolName)}
          title={label}
          aria-label={label}
        >
          <Icon className="h-5 w-5" />
        </button>
      );
    },
    [activeTool, handleSelectTool]
  );

  return (
    <div className="flex flex-col items-center gap-5">
      <div className="flex flex-col items-center gap-3 rounded-2xl border border-cyan-500/30 bg-slate-950/80 text-cyan-100 shadow-lg shadow-cyan-500/10 p-2">
        {toolNames.map(renderToolButton)}
      </div>

      <ToolsCarrousel
        assets={assets}
        activeAssetId={activeAssetId}
        onSelectAsset={handleSelectAsset}
        onLaunch={onLaunch}
        launching={launching}
      />

      <div className="h-px w-full max-w-[260px] bg-cyan-500/30" />

      <SoundToggle />
    </div>
  );
};
