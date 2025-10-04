import type { FC } from "react";

import type { ModuleTypes } from "@/app/jotai/moduleMakerConfigAtom";

export const toolNames = ["erase", "move"] as const;

export type ToolName = (typeof toolNames)[number];

export interface ITool {
  name: ToolName;
}

export type AssetType = ModuleTypes;

export interface Asset {
  type: AssetType;
  quantity: number;
  label?: string;
  color?: string;
  animationSrc?: string;
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
}

export type IconComponent = FC<{ className?: string }>;
