import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { MutableRefObject } from "react";

import { FLASH_INTERVAL, FLASH_TOTAL_DURATION } from "@/constants/flash";
import { habitatPlanService } from "@/utils/calculateRelationShipScore";
import {
  DEFAULT_MODULE_TEXTURES,
  MODULE_BACKGROUND_MAP,
  WALL_HORIZONTAL_TEXTURES,
  WALL_VERTICAL_TEXTURE,
  WALL_DOOR_TEXTURE,
} from "@/utils/moduleLottieMap";
import { evaluatePlacementRules, type FloorDimensions } from "@/utils/playgroundRules";
import {
  DESKTOP_RESERVED_HORIZONTAL,
  DESKTOP_RESERVED_VERTICAL,
  HEIGHT_RATIO,
  MAX_CELL_SIZE,
  MIN_CELL_SIZE,
  MOBILE_RESERVED_HORIZONTAL,
  MOBILE_RESERVED_VERTICAL,
} from "@/utils/cellSizing";
import type {
  CellData,
  FloorCell,
  FloorIdentifier,
  FlashEffect,
  SelectedAsset,
} from "@/types/playground";
import type {
  MissionEventCategory,
  MissionEventType,
} from "@/app/jotai/moduleMakerConfigAtom";

export type PlaygroundFloor = {
  level?: number | null;
  x: number;
  y: number;
};

export type PlaygroundBoardProps = {
  floors: PlaygroundFloor[];
  currentFloor?: PlaygroundFloor;
  floorIdentifier: FloorIdentifier;
  selectedFloorIndex: number;
  paintedFloors: Map<FloorIdentifier, Map<string, CellData>>;
  setPaintedFloors: React.Dispatch<
    React.SetStateAction<Map<FloorIdentifier, Map<string, CellData>>>
  >;
  selectedAsset: SelectedAsset | null;
  selectedTool: "cut" | "erase" | "move";
  selectedColor: string;
  assetRemaining: number;
  setAssetRemaining: React.Dispatch<React.SetStateAction<number>>;
  assetRegistryRef: MutableRefObject<Map<string, SelectedAsset>>;
  logMissionEvent: (
    message: string,
    delta: number,
    type?: MissionEventType,
    category?: MissionEventCategory
  ) => void;
  maxDistanceRef: MutableRefObject<number | null>;
};

const ensureFloorPresence = (
  floorsMap: Map<FloorIdentifier, Map<string, CellData>>,
  key: FloorIdentifier
) => {
  if (floorsMap.has(key)) {
    return floorsMap;
  }
  const next = new Map(floorsMap);
  next.set(key, new Map());
  return next;
};

const createCellKey = (x: number, y: number) => `${x},${y}`;

export function PlaygroundBoard({
  floors,
  currentFloor,
  floorIdentifier,
  selectedFloorIndex,
  paintedFloors,
  setPaintedFloors,
  selectedAsset,
  selectedTool,
  selectedColor,
  assetRemaining,
  setAssetRemaining,
  assetRegistryRef,
  logMissionEvent,
  maxDistanceRef,
}: PlaygroundBoardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const textureCacheRef = useRef<Map<string, HTMLImageElement>>(new Map());
  const [textureVersion, setTextureVersion] = useState(0);

  const [flashEffects, setFlashEffects] = useState<FlashEffect[]>([]);
  const [flashTick, setFlashTick] = useState(0);

  const [cellSize, setCellSize] = useState<number>(32);
  const [isPainting, setIsPainting] = useState(false);
  const [isMovingGroup, setIsMovingGroup] = useState(false);
  const [moveAnchor, setMoveAnchor] = useState<FloorCell>({ x: 0, y: 0 });
  const [movingGroup, setMovingGroup] = useState<{
    cells: Array<FloorCell & { value: CellData }>;
    offset: FloorCell;
  } | null>(null);

  const normalizedFloors = useMemo<FloorDimensions[]>(
    () =>
      floors.map((floor) => ({
        level: floor.level ?? undefined,
        x: floor.x,
        y: floor.y,
      })),
    [floors]
  );

  const currentCells = useMemo(
    () => paintedFloors.get(floorIdentifier) ?? new Map<string, CellData>(),
    [paintedFloors, floorIdentifier]
  );

  useEffect(() => {
    setPaintedFloors((prev) => ensureFloorPresence(prev, floorIdentifier));
  }, [floorIdentifier, setPaintedFloors]);

  const triggerCellFlash = useCallback((targetFloorKey: FloorIdentifier, cellKey: string) => {
    const now = typeof performance !== "undefined" ? performance.now() : Date.now();
    setFlashEffects((prev) => {
      const filtered = prev.filter(
        (effect) => !(effect.floorKey === targetFloorKey && effect.cellKey === cellKey)
      );
      return [...filtered, { floorKey: targetFloorKey, cellKey, start: now }];
    });
  }, []);

  const ensureTexture = useCallback((textureUrl: string) => {
    const cache = textureCacheRef.current;
    let image = cache.get(textureUrl);

    if (image && image.complete) {
      if (image.naturalWidth > 0 && image.naturalHeight > 0) {
        return image;
      }
      cache.delete(textureUrl);
      image = undefined;
    }

    if (!image) {
      image = new Image();
      image.decoding = "async";
      image.onload = () => {
        if (image && image.naturalWidth > 0 && image.naturalHeight > 0) {
          setTextureVersion((prev) => prev + 1);
        } else {
          cache.delete(textureUrl);
        }
      };
      image.onerror = () => {
        cache.delete(textureUrl);
      };
      image.src = textureUrl;
      cache.set(textureUrl, image);
    }

    return image.complete && image.naturalWidth > 0 && image.naturalHeight > 0 ? image : null;
  }, []);

  const resolveTextureForPlacement = useCallback(
    (asset: SelectedAsset, newPlacedCount: number) => {
      const textures = MODULE_BACKGROUND_MAP[asset.type] ?? DEFAULT_MODULE_TEXTURES;
      if (!textures.length) {
        return { textureUrl: DEFAULT_MODULE_TEXTURES[0], textureIndex: 0 };
      }
      const capacity = Number.isFinite(asset.quantity)
        ? Math.max(asset.quantity, textures.length)
        : Math.max(textures.length, 1);
      const normalized = Math.max(0, Math.min(1, (newPlacedCount - 1) / capacity));
      const variantIndex = Math.min(
        textures.length - 1,
        Math.floor(normalized * textures.length)
      );
      return { textureUrl: textures[variantIndex], textureIndex: variantIndex };
    },
    []
  );

  useEffect(() => {
    if (!flashEffects.length) return;
    if (typeof window === "undefined") return;
    const interval = window.setInterval(() => {
      setFlashTick((prev) => prev + 1);
    }, FLASH_INTERVAL / 2);
    return () => {
      window.clearInterval(interval);
    };
  }, [flashEffects.length]);

  useEffect(() => {
    if (!flashEffects.length) return;
    const now = typeof performance !== "undefined" ? performance.now() : Date.now();
    const active = flashEffects.filter((effect) => now - effect.start <= FLASH_TOTAL_DURATION);
    if (active.length !== flashEffects.length) {
      setFlashEffects(active);
    }
  }, [flashEffects, flashTick]);

  const updateCellSize = useCallback(() => {
    if (typeof window === "undefined" || !currentFloor) return;
    const { innerWidth, innerHeight } = window;
    const isMobile = innerWidth < 640;

    const reservedHorizontal = isMobile ? MOBILE_RESERVED_HORIZONTAL : DESKTOP_RESERVED_HORIZONTAL;
    const reservedVertical = isMobile ? MOBILE_RESERVED_VERTICAL : DESKTOP_RESERVED_VERTICAL;

    const maxWidth = Math.max(innerWidth - reservedHorizontal, MIN_CELL_SIZE * currentFloor.x);
    const maxHeight = Math.max(
      innerHeight - reservedVertical,
      MIN_CELL_SIZE * currentFloor.y,
      innerHeight * HEIGHT_RATIO
    );

    const sizeFromWidth = Math.floor(maxWidth / currentFloor.x);
    const sizeFromHeight = Math.floor(maxHeight / currentFloor.y);
    const computed = Math.max(
      MIN_CELL_SIZE,
      Math.min(MAX_CELL_SIZE, sizeFromWidth, sizeFromHeight)
    );
    setCellSize(computed || MIN_CELL_SIZE);
  }, [currentFloor]);

  useEffect(() => {
    updateCellSize();
    if (typeof window === "undefined") return;
    window.addEventListener("resize", updateCellSize);
    return () => {
      window.removeEventListener("resize", updateCellSize);
    };
  }, [updateCellSize]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !currentFloor) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = currentFloor.x * cellSize;
    const height = currentFloor.y * cellSize;
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "#020617";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = "rgba(56,189,248,0.25)";
    ctx.lineWidth = 1;

    for (let col = 0; col <= currentFloor.x; col += 1) {
      const x = col * cellSize + 0.5;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }

    for (let row = 0; row <= currentFloor.y; row += 1) {
      const y = row * cellSize + 0.5;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }

    const drawTexture = (
      textureUrl: string,
      gridX: number,
      gridY: number,
      fallbackColor: string,
      alpha = 1
    ) => {
      const destX = gridX * cellSize;
      const destY = gridY * cellSize;
      const image = ensureTexture(textureUrl);
      if (image) {
        if (alpha !== 1) {
          ctx.save();
          ctx.globalAlpha = alpha;
          ctx.drawImage(image, destX, destY, cellSize, cellSize);
          ctx.restore();
        } else {
          ctx.drawImage(image, destX, destY, cellSize, cellSize);
        }
        return;
      }
      if (fallbackColor) {
        ctx.fillStyle = fallbackColor;
        ctx.fillRect(destX, destY, cellSize, cellSize);
      }
    };

    const cellEntries = Array.from(currentCells.entries()) as Array<[string, CellData]>;
    cellEntries.forEach(([key, cell]) => {
      const [x, y] = key.split(",").map(Number);
      drawTexture(cell.textureUrl, x, y, cell.color);
    });

    if (selectedFloorIndex > 0 && currentFloor) {
      const supportingFloor = normalizedFloors[selectedFloorIndex - 1];
      const supportingKey = (supportingFloor?.level ?? selectedFloorIndex - 1) as FloorIdentifier;
      const supportingCells = paintedFloors.get(supportingKey);

      for (let y = 0; y < currentFloor.y; y += 1) {
        for (let x = 0; x < currentFloor.x; x += 1) {
          const cellKey = createCellKey(x, y);
          const isOccupied = currentCells.has(cellKey);
          const hasSupport = supportingCells?.has(cellKey) ?? false;
          if (!isOccupied && !hasSupport) {
            const destX = x * cellSize;
            const destY = y * cellSize;
            ctx.save();
            ctx.fillStyle = "rgba(15,23,42,0.55)";
            ctx.fillRect(destX, destY, cellSize, cellSize);
            ctx.strokeStyle = "rgba(148,163,184,0.32)";
            ctx.lineWidth = Math.max(1, cellSize * 0.065);
            ctx.beginPath();
            ctx.moveTo(destX + cellSize * 0.2, destY + cellSize * 0.2);
            ctx.lineTo(destX + cellSize * 0.8, destY + cellSize * 0.8);
            ctx.moveTo(destX + cellSize * 0.8, destY + cellSize * 0.2);
            ctx.lineTo(destX + cellSize * 0.2, destY + cellSize * 0.8);
            ctx.stroke();
            ctx.restore();
          }
        }
      }
    }

    if (movingGroup && isMovingGroup) {
      movingGroup.cells.forEach((cell) => {
        const drawX = cell.x + movingGroup.offset.x;
        const drawY = cell.y + movingGroup.offset.y;
        drawTexture(cell.value.textureUrl, drawX, drawY, cell.value.color, 0.75);
      });
    }

    const wallThickness = Math.max(4, cellSize * 0.22);

    const drawWallSegment = (
      textureUrl: string,
      cellX: number,
      cellY: number,
      orientation: "horizontal" | "vertical"
    ) => {
      const image = ensureTexture(textureUrl);
      if (!image) {
        return;
      }
      const anchorX = cellX * cellSize;
      const anchorY = cellY * cellSize;
      ctx.save();
      ctx.beginPath();
      if (orientation === "horizontal") {
        ctx.rect(anchorX, anchorY, cellSize, wallThickness);
      } else {
        ctx.rect(anchorX, anchorY, wallThickness, cellSize);
      }
      ctx.clip();
      ctx.drawImage(image, anchorX, anchorY, cellSize, cellSize);
      ctx.restore();
    };

    const horizontalTextures = WALL_HORIZONTAL_TEXTURES.length
      ? WALL_HORIZONTAL_TEXTURES
      : [WALL_VERTICAL_TEXTURE];

    const selectHorizontalTexture = (gridX: number, gridY: number) =>
      horizontalTextures[(gridX + gridY) % horizontalTextures.length] ?? horizontalTextures[0];

    const shouldPlaceDoor = (a: CellData, b: CellData) =>
      a.assetType === "corridor" || b.assetType === "corridor";

    cellEntries.forEach(([key, cell]) => {
      const [x, y] = key.split(",").map(Number);

      if (y > 0) {
        const neighborAbove = currentCells.get(createCellKey(x, y - 1));
        if (neighborAbove && neighborAbove.assetId !== cell.assetId) {
          const textureUrl = selectHorizontalTexture(x, y);
          drawWallSegment(textureUrl, x, y, "horizontal");
        }
      }

      if (x > 0) {
        const neighborLeft = currentCells.get(createCellKey(x - 1, y));
        if (neighborLeft && neighborLeft.assetId !== cell.assetId) {
          const textureUrl = shouldPlaceDoor(cell, neighborLeft)
            ? WALL_DOOR_TEXTURE
            : WALL_VERTICAL_TEXTURE;
          drawWallSegment(textureUrl, x, y, "vertical");
        }
      }
    });

    const activeFlashes = flashEffects.filter((effect) => effect.floorKey === floorIdentifier);
    if (activeFlashes.length) {
      const timeNow = typeof performance !== "undefined" ? performance.now() : Date.now();
      activeFlashes.forEach((effect) => {
        const elapsed = timeNow - effect.start;
        if (elapsed > FLASH_TOTAL_DURATION) {
          return;
        }
        const phase = Math.floor(elapsed / FLASH_INTERVAL);
        if (phase % 2 !== 0) {
          return;
        }
        const [fx, fy] = effect.cellKey.split(",").map(Number);
        ctx.save();
        ctx.strokeStyle = "#f87171";
        ctx.lineWidth = 3;
        ctx.shadowColor = "rgba(248,113,113,0.65)";
        ctx.shadowBlur = 12;
        ctx.strokeRect(fx * cellSize + 1.5, fy * cellSize + 1.5, cellSize - 3, cellSize - 3);
        ctx.restore();
      });
    }
  }, [
    cellSize,
    currentCells,
    currentFloor,
    ensureTexture,
    flashEffects,
    flashTick,
    floorIdentifier,
    isMovingGroup,
    movingGroup,
  paintedFloors,
    normalizedFloors,
    selectedFloorIndex,
    textureVersion,
  ]);

  const floorBounds = useCallback(
    (cells: FloorCell[]) => {
      if (!currentFloor) return { minX: 0, maxX: 0, minY: 0, maxY: 0 };
      const xs = cells.map((cell) => cell.x);
      const ys = cells.map((cell) => cell.y);
      return {
        minX: Math.min(...xs),
        maxX: Math.max(...xs),
        minY: Math.min(...ys),
        maxY: Math.max(...ys),
      };
    },
    [currentFloor]
  );

  const clampOffset = useCallback(
    (offset: FloorCell, cells: FloorCell[]) => {
      if (!currentFloor) return { x: 0, y: 0 };
      const bounds = floorBounds(cells);
      const minOffsetX = -bounds.minX;
      const maxOffsetX = currentFloor.x - 1 - bounds.maxX;
      const minOffsetY = -bounds.minY;
      const maxOffsetY = currentFloor.y - 1 - bounds.maxY;
      return {
        x: Math.min(Math.max(offset.x, minOffsetX), maxOffsetX),
        y: Math.min(Math.max(offset.y, minOffsetY), maxOffsetY),
      };
    },
    [currentFloor, floorBounds]
  );

  const getGridCoordinatesFromClient = useCallback(
    (clientX: number, clientY: number) => {
      const canvas = canvasRef.current;
      if (!canvas || !currentFloor) return { x: -1, y: -1 };
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      const canvasX = (clientX - rect.left) * scaleX;
      const canvasY = (clientY - rect.top) * scaleY;
      const x = Math.floor(canvasX / cellSize);
      const y = Math.floor(canvasY / cellSize);
      return { x, y };
    },
    [cellSize, currentFloor]
  );

  const getConnectedCells = useCallback(
    (startX: number, startY: number, targetAssetId: string) => {
      const visited = new Set<string>();
      const queue: FloorCell[] = [{ x: startX, y: startY }];
      const cluster: FloorCell[] = [];

      while (queue.length) {
        const cell = queue.shift()!;
        const key = createCellKey(cell.x, cell.y);
        if (visited.has(key)) continue;
        visited.add(key);

        const cellData = currentCells.get(key);
        if (!cellData || cellData.assetId !== targetAssetId) continue;
        cluster.push(cell);

        const neighbors: FloorCell[] = [
          { x: cell.x + 1, y: cell.y },
          { x: cell.x - 1, y: cell.y },
          { x: cell.x, y: cell.y + 1 },
          { x: cell.x, y: cell.y - 1 },
        ];

        neighbors.forEach((neighbor) => {
          if (
            neighbor.x >= 0 &&
            neighbor.y >= 0 &&
            currentFloor &&
            neighbor.x < currentFloor.x &&
            neighbor.y < currentFloor.y &&
            !visited.has(createCellKey(neighbor.x, neighbor.y))
          ) {
            queue.push(neighbor);
          }
        });
      }

      return cluster;
    },
    [currentCells, currentFloor]
  );

  const paintCell = useCallback(
    (x: number, y: number) => {
      if (!currentFloor) return;
      if (x < 0 || y < 0 || x >= currentFloor.x || y >= currentFloor.y) return;

      const key = createCellKey(x, y);
      if (selectedTool === "erase") {
        const existingCell = currentCells.get(key);
        if (!existingCell) return;

        const assetToRestore = assetRegistryRef.current.get(existingCell.assetId);
        assetToRestore?.restore();

        if (selectedAsset && assetToRestore && assetToRestore.id === selectedAsset.id) {
          setAssetRemaining((prev) => Math.min(prev + 1, selectedAsset.quantity));
        }

        setPaintedFloors((prev) => {
          const next = new Map(prev);
          const floorMap = new Map(next.get(floorIdentifier) ?? []);
          floorMap.delete(key);
          next.set(floorIdentifier, floorMap);
          return next;
        });
        return;
      }

      if (selectedTool === "cut") {
        const validation = evaluatePlacementRules({
          key,
          selectedAsset,
          assetRemaining,
          currentCells,
          selectedFloorIndex,
          floors: normalizedFloors,
          paintedFloors,
        });

        if (!validation.allowed) {
          const { violation } = validation;
          if (violation.shouldFlash) {
            triggerCellFlash(floorIdentifier, key);
          }
          logMissionEvent(violation.message, 0, violation.type);
          return;
        }

        if (!selectedAsset) {
          return;
        }

        const placedBefore =
          Number.isFinite(selectedAsset.quantity) && Number.isFinite(selectedAsset.remaining)
            ? selectedAsset.quantity - selectedAsset.remaining
            : 0;
        const { textureUrl, textureIndex } = resolveTextureForPlacement(
          selectedAsset,
          placedBefore + 1
        );

        selectedAsset.draw();
        setAssetRemaining((prev) => Math.max(prev - 1, 0));

        setPaintedFloors((prev) => {
          const next = new Map(prev);
          const floorMap = new Map(next.get(floorIdentifier) ?? []);
          const cellValue: CellData = {
            color: selectedColor,
            assetId: selectedAsset.id,
            assetType: selectedAsset.type,
            textureUrl,
            textureIndex,
          };
          floorMap.set(key, cellValue);
          next.set(floorIdentifier, floorMap);
          return next;
        });

        const floorLabel = currentFloor?.level ?? selectedFloorIndex + 1;
        const coords = `(${x + 1}, ${y + 1})`;
        const moduleLabel = selectedAsset.label ?? selectedAsset.type;
        logMissionEvent(
          `Módulo ${moduleLabel} posicionado em ${coords} no piso ${floorLabel}.`,
          0,
          "success"
        );

        const baseFloor = normalizedFloors[0];
        if (baseFloor) {
          void habitatPlanService
            .calculateMaxDistance(normalizedFloors.length, baseFloor.x, baseFloor.y)
            .then((distance) => {
              maxDistanceRef.current = distance;
            })
            .catch((error) => {
              console.error("Failed to calculate max distance", error);
            });
        }
      }
    }, [
    assetRemaining,
    assetRegistryRef,
    currentCells,
    currentFloor,
    floorIdentifier,
    logMissionEvent,
    maxDistanceRef,
    normalizedFloors,
    paintedFloors,
    resolveTextureForPlacement,
    selectedAsset,
    selectedColor,
    selectedFloorIndex,
    selectedTool,
    setAssetRemaining,
    setPaintedFloors,
    triggerCellFlash,
  ]);

  const startInteraction = useCallback(
    (clientX: number, clientY: number) => {
      if (!currentFloor) return;
      const { x, y } = getGridCoordinatesFromClient(clientX, clientY);
      if (x < 0 || y < 0 || x >= currentFloor.x || y >= currentFloor.y) return;

      if (selectedTool === "move") {
        const key = createCellKey(x, y);
        const cellData = currentCells.get(key);
        if (!cellData) return;
        const cluster = getConnectedCells(x, y, cellData.assetId);
        if (!cluster.length) return;
        const cellsWithValues = cluster.map((cell) => ({
          ...cell,
          value: currentCells.get(createCellKey(cell.x, cell.y))!,
        }));
        setMovingGroup({ cells: cellsWithValues, offset: { x: 0, y: 0 } });
        setMoveAnchor({ x, y });
        setIsMovingGroup(true);
      } else {
        setIsPainting(true);
        paintCell(x, y);
      }
    }, [
    currentCells,
    currentFloor,
    getConnectedCells,
    getGridCoordinatesFromClient,
    paintCell,
    selectedTool,
  ]);

  const moveInteraction = useCallback(
    (clientX: number, clientY: number) => {
      if (!currentFloor) return;
      const { x, y } = getGridCoordinatesFromClient(clientX, clientY);
      if (x < 0 || y < 0 || x >= currentFloor.x || y >= currentFloor.y) return;

      if (isMovingGroup && movingGroup) {
        const delta = { x: x - moveAnchor.x, y: y - moveAnchor.y };
        const clamped = clampOffset(delta, movingGroup.cells);
        setMovingGroup((prev) => (prev ? { ...prev, offset: clamped } : prev));
      } else if (isPainting) {
        paintCell(x, y);
      }
    }, [
    clampOffset,
    currentFloor,
    getGridCoordinatesFromClient,
    isMovingGroup,
    moveAnchor,
    movingGroup,
    paintCell,
    isPainting,
  ]);

  const finishInteraction = useCallback(() => {
    if (isMovingGroup && movingGroup) {
      const { offset, cells } = movingGroup;
      if (offset.x !== 0 || offset.y !== 0) {
        setPaintedFloors((prev) => {
          const next = new Map(prev);
          const floorMap = new Map(next.get(floorIdentifier) ?? []);

          cells.forEach((cell) => {
            floorMap.delete(createCellKey(cell.x, cell.y));
          });

          cells.forEach((cell) => {
            const targetKey = createCellKey(cell.x + offset.x, cell.y + offset.y);
            floorMap.set(targetKey, cell.value);
          });

          next.set(floorIdentifier, floorMap);
          return next;
        });
      }
    }

    setMovingGroup(null);
    setIsMovingGroup(false);
    setIsPainting(false);
  }, [floorIdentifier, isMovingGroup, movingGroup, setPaintedFloors]);

  const handlePointerDown = useCallback(
    (clientX: number, clientY: number) => {
      startInteraction(clientX, clientY);
    },
    [startInteraction]
  );

  const handlePointerMove = useCallback(
    (clientX: number, clientY: number) => {
      if (!isPainting && !isMovingGroup) return;
      moveInteraction(clientX, clientY);
    },
    [isPainting, isMovingGroup, moveInteraction]
  );

  useEffect(() => {
    setIsPainting(false);
    setIsMovingGroup(false);
    setMovingGroup(null);
  }, [selectedFloorIndex, selectedTool]);

  const boardPixelWidth = currentFloor ? currentFloor.x * cellSize : 0;
  const boardPixelHeight = currentFloor ? currentFloor.y * cellSize : 0;

  return (
    <div className="flex-1 min-w-0 pr-3">
      <div className="relative w-full rounded-3xl border border-cyan-500/20 bg-slate-900/70 px-2 pb-4 pt-2 shadow-xl">
        <div
          className="mx-auto w-full max-w-[90vw] overflow-hidden rounded-2xl border border-cyan-500/20 bg-slate-950/80"
          style={{ maxWidth: boardPixelWidth || undefined, maxHeight: boardPixelHeight || undefined }}
        >
          <canvas
            ref={canvasRef}
            className="h-auto w-full touch-none"
            style={{ touchAction: "none" }}
            onMouseDown={(event) => {
              event.preventDefault();
              handlePointerDown(event.clientX, event.clientY);
            }}
            onMouseMove={(event) => {
              if (!isPainting && !isMovingGroup) return;
              event.preventDefault();
              handlePointerMove(event.clientX, event.clientY);
            }}
            onMouseUp={finishInteraction}
            onMouseLeave={() => {
              if (isPainting || isMovingGroup) finishInteraction();
            }}
            onTouchStart={(event) => {
              const touch = event.touches[0];
              if (!touch) return;
              handlePointerDown(touch.clientX, touch.clientY);
            }}
            onTouchMove={(event) => {
              const touch = event.touches[0];
              if (!touch) return;
              handlePointerMove(touch.clientX, touch.clientY);
            }}
            onTouchEnd={finishInteraction}
          />
        </div>
      </div>
    </div>
  );
}
