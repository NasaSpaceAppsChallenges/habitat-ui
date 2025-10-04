import type { FC } from "react";

export const toolNames = ["erase", "move"] as const;

export type ToolName = (typeof toolNames)[number];

export interface ITool {
  name: ToolName;
}

export type AssetType = string;

export interface Asset {
  type: AssetType;
  quantity: number;
  label?: string;
  color?: string;
}

export interface IAsset {
  id: string;
  type: AssetType;
  quantity: number;
  remaining: number;
  label: string;
  color?: string;
  draw: () => void;
}

export type IconComponent = FC<{ className?: string }>;
