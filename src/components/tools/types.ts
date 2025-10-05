import type { FC } from "react";

import type { ModuleAssetType } from "@/utils/moduleLottieMap";

export const toolNames = ["erase", "move"] as const;

export type ToolName = (typeof toolNames)[number];

export interface ITool {
  name: ToolName;
}

export type AssetType = ModuleAssetType;

export interface Asset {
  type: AssetType;
  quantity: number;
  label?: string;
  color?: string;
  animationSrc?: string;
  unlimited?: boolean;
}

export interface IAsset {
  id: string;
  type: AssetType;
  quantity: number;
  remaining: number;
  label: string;
  color?: string;
  animationSrc?: string;
  draw: () => void;
  restore: () => void;
  unlimited?: boolean;
}

export type IconComponent = FC<{ className?: string }>;
