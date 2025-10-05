import type { MissionEventType } from "@/app/jotai/moduleMakerConfigAtom";
import type { CellData, FloorIdentifier, SelectedAsset } from "@/types/playground";

export type FloorDimensions = {
  level?: number;
  x: number;
  y: number;
};

export type PlacementRuleContext = {
  key: string;
  selectedAsset: SelectedAsset | null;
  assetRemaining: number;
  currentCells: Map<string, CellData>;
  selectedFloorIndex: number;
  floors: FloorDimensions[];
  paintedFloors: Map<FloorIdentifier, Map<string, CellData>>;
};

export type PlacementRuleViolation = {
  message: string;
  type: MissionEventType;
  shouldFlash?: boolean;
};

export type PlacementRuleResult =
  | { allowed: true; violation?: undefined }
  | { allowed: false; violation: PlacementRuleViolation };

export const evaluatePlacementRules = (context: PlacementRuleContext): PlacementRuleResult => {
  const {
    key,
    selectedAsset,
    assetRemaining,
    currentCells,
    selectedFloorIndex,
    floors,
    paintedFloors,
  } = context;

  if (!selectedAsset) {
    return {
      allowed: false,
      violation: {
        message: "Selecione um módulo antes de posicionar.",
        type: "info",
      },
    };
  }

  if (assetRemaining <= 0) {
    return {
      allowed: false,
      violation: {
        message: "Você não possui mais blocos disponíveis para este módulo.",
        type: "warning",
      },
    };
  }

  const occupiedCell = currentCells.get(key);
  if (occupiedCell) {
    return {
      allowed: false,
      violation: {
        message: "Esse espaço já está ocupado por outro módulo.",
        type: "error",
        shouldFlash: true,
      },
    };
  }

  if (selectedFloorIndex > 0) {
    const supportingFloor = floors[selectedFloorIndex - 1];
    const supportingKey = (supportingFloor?.level ?? selectedFloorIndex - 1) as FloorIdentifier;
    const supportingCells = paintedFloors.get(supportingKey);
    const hasSupport = supportingCells?.has(key) ?? false;

    if (!hasSupport) {
      return {
        allowed: false,
        violation: {
          message: "Precisa de suporte no piso inferior para posicionar aqui.",
          type: "warning",
          shouldFlash: true,
        },
      };
    }
  }

  const currentFloor = floors[selectedFloorIndex];
  if (currentFloor) {
    const [cellX, cellY] = key.split(",").map((value) => Number.parseInt(value, 10));

    if (Number.isFinite(cellX) && Number.isFinite(cellY)) {
      const withinBounds = (x: number, y: number) => x >= 0 && y >= 0 && x < currentFloor.x && y < currentFloor.y;
      const neighborPositions = [
        { x: cellX, y: cellY - 1 },
        { x: cellX, y: cellY + 1 },
        { x: cellX - 1, y: cellY },
        { x: cellX + 1, y: cellY },
      ] as const;

      const neighborsInBounds = neighborPositions.filter((pos) => withinBounds(pos.x, pos.y));

      if (neighborsInBounds.length === neighborPositions.length) {
        const neighborCells = neighborsInBounds
          .map((pos) => currentCells.get(`${pos.x},${pos.y}`))
          .filter((cell): cell is CellData => Boolean(cell));

        if (neighborCells.length === neighborPositions.length) {
          const firstAssetId = neighborCells[0].assetId;
          const allSameModule = neighborCells.every((cell) => cell.assetId === firstAssetId);
          const surroundedByAnotherModule = allSameModule && firstAssetId !== selectedAsset.id;

          if (surroundedByAnotherModule) {
            return {
              allowed: false,
              violation: {
                message: "Não é possível posicionar aqui: área cercada por outro módulo.",
                type: "warning",
                shouldFlash: true,
              },
            };
          }
        }
      }
    }
  }

  return { allowed: true };
};
