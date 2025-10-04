import type { ComponentProps } from "react";
import type { Tools } from "@/components/tools/index";

export type ToolsProps = ComponentProps<typeof Tools>;
export type SelectedAsset = Parameters<ToolsProps["onSelectAsset"]>[0];

export type FloorCell = { x: number; y: number };

export type CellData = {
  color: string;
  assetId: SelectedAsset["id"];
  assetType: SelectedAsset["type"];
  textureUrl: string;
  textureIndex: number;
};

export type FloorIdentifier = number | string;

export type FlashEffect = {
  floorKey: FloorIdentifier;
  cellKey: string;
  start: number;
};