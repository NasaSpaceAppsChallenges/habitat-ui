"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAtom } from "jotai";
import FloorSelector, { type FloorSummary } from "@/components/FloorSelector";
import { Tools } from "@/components/tools/index";
import NavBar from "@/components/NavBar";
import { moduleMakerConfigAtom } from "@/app/jotai/moduleMakerConfigAtom";
import {
  DEFAULT_MODULE_LOTTIE,
  MODULE_LOTTIE_MAP,
  MODULE_BACKGROUND_MAP,
  DEFAULT_MODULE_TEXTURES,
} from "@/utils/moduleLottieMap";
import type {
  ToolsProps,
  SelectedAsset,
  FloorCell,
  CellData,
  FloorIdentifier,
  FlashEffect,
} from "@/types/playground";
import { MODULE_COLOR_PALETTE, DEFAULT_MODULE_COLOR } from "@/constants/colors";
import { FLASH_INTERVAL, FLASH_TOTAL_DURATION } from "@/constants/flash";
import {
  MIN_CELL_SIZE,
  MAX_CELL_SIZE,
  HEIGHT_RATIO,
  MOBILE_RESERVED_HORIZONTAL,
  DESKTOP_RESERVED_HORIZONTAL,
  MOBILE_RESERVED_VERTICAL,
  DESKTOP_RESERVED_VERTICAL,
} from "@/utils/cellSizing";



export default function Page() {
  const [config] = useAtom(moduleMakerConfigAtom);
  const { habitat_floors: rawFloors, habitat_modules: rawModules } = config;
  const floors = useMemo(
    () =>
      (rawFloors ?? []).map((floor) => ({
        level: floor.level,
        x: floor.x_length,
        y: floor.y_length,
      })),
    [rawFloors]
  );
  const moduleColorMap = useMemo<Record<string, string>>(() => {
    const map: Record<string, string> = {};
    (rawModules ?? []).forEach((module, index) => {
      if (!module?.type) return;
      if (!map[module.type]) {
        map[module.type] = MODULE_COLOR_PALETTE[index % MODULE_COLOR_PALETTE.length];
      }
    });
    return map;
  }, [rawModules]);
  const [selectedFloorIndex, setSelectedFloorIndex] = useState(0);
  const currentFloor = floors[selectedFloorIndex] ?? floors[0];
  const floorKey = currentFloor?.level ?? selectedFloorIndex;
  const floorIdentifier = floorKey as FloorIdentifier;

  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [paintedFloors, setPaintedFloors] = useState<Map<FloorIdentifier, Map<string, CellData>>>(new Map());
  const [selectedTool, setSelectedTool] = useState<"cut" | "erase" | "move">("cut");
  const [selectedAssetId, setSelectedAssetId] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState<string>(DEFAULT_MODULE_COLOR);
  const [assetRemaining, setAssetRemaining] = useState<number>(0);
  const assetRegistryRef = useRef<Map<string, SelectedAsset>>(new Map());
  const [assetRegistryVersion, setAssetRegistryVersion] = useState(0);
  const [flashEffects, setFlashEffects] = useState<FlashEffect[]>([]);
  const [flashTick, setFlashTick] = useState(0);
  const textureCacheRef = useRef<Map<string, HTMLImageElement>>(new Map());
  const [textureVersion, setTextureVersion] = useState(0);

  const selectedAsset = useMemo(() => {
    if (!selectedAssetId) return null;
    void assetRegistryVersion;
    return assetRegistryRef.current.get(selectedAssetId) ?? null;
  }, [selectedAssetId, assetRegistryVersion]);

  const triggerCellFlash = useCallback((targetFloorKey: FloorIdentifier, cellKey: string) => {
    const now = typeof performance !== "undefined" ? performance.now() : Date.now();
    setFlashEffects((prev) => {
      const filtered = prev.filter((effect) => !(effect.floorKey === targetFloorKey && effect.cellKey === cellKey));
      return [...filtered, { floorKey: targetFloorKey, cellKey, start: now }];
    });
  }, []);

  const ensureTexture = useCallback(
    (textureUrl: string) => {
      const cache = textureCacheRef.current;
      let image = cache.get(textureUrl);
      if (image && image.complete) {
        return image;
      }
      if (!image) {
        image = new Image();
        image.onload = () => {
          setTextureVersion((prev) => prev + 1);
        };
        image.onerror = () => {
          cache.delete(textureUrl);
        };
        image.src = textureUrl;
        cache.set(textureUrl, image);
      }
      return image.complete ? image : null;
    },
    []
  );

  const resolveTextureForPlacement = useCallback(
    (asset: SelectedAsset, newPlacedCount: number) => {
      const textures = MODULE_BACKGROUND_MAP[asset.type] ?? DEFAULT_MODULE_TEXTURES;
      if (!textures.length) {
        return { textureUrl: DEFAULT_MODULE_TEXTURES[0], textureIndex: 0 };
      }
      const totalCapacity = Math.max(asset.quantity, textures.length);
      const normalized = Math.max(0, Math.min(1, (newPlacedCount - 1) / totalCapacity));
      const variantIndex = Math.min(textures.length - 1, Math.floor(normalized * textures.length));
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

  const [cellSize, setCellSize] = useState<number>(32);
  const [isPainting, setIsPainting] = useState(false);
  const [isMovingGroup, setIsMovingGroup] = useState(false);
  const [moveAnchor, setMoveAnchor] = useState<FloorCell>({ x: 0, y: 0 });
  const [movingGroup, setMovingGroup] = useState<{
    cells: Array<FloorCell & { value: CellData }>;
    offset: FloorCell;
  } | null>(null);

  useEffect(() => {
    if (!currentFloor) return;
    setPaintedFloors((prev) => {
      if (prev.has(floorIdentifier)) return prev;
      const next = new Map(prev);
      next.set(floorIdentifier, new Map());
      return next;
    });
  }, [currentFloor, floorIdentifier]);

  useEffect(() => {
    setIsPainting(false);
    setIsMovingGroup(false);
    setMovingGroup(null);
  }, [selectedFloorIndex]);

  const currentCells = useMemo(() => paintedFloors.get(floorIdentifier) ?? new Map<string, CellData>(), [paintedFloors, floorIdentifier]);

  const floorsWithUsage = useMemo<FloorSummary[]>(
    () =>
      floors.map((floor, index) => {
        const floorKeyForUsage = floor.level ?? index;
        const paintedCells = paintedFloors.get(floorKeyForUsage)?.size ?? 0;
        const totalCells = Math.max(floor.x * floor.y, 0);
        return {
          level: floor.level,
          x: floor.x,
          y: floor.y,
          paintedCells,
          totalCells,
        };
      }),
    [floors, paintedFloors]
  );

  const assets = useMemo<ToolsProps["assets"]>(
    () =>
      (rawModules ?? [])
        .map((module) => ({
          type: module.type,
          quantity: module.numberOfBlocks ?? 0,
          label: module.name ?? module.type,
          color: moduleColorMap[module.type] ?? DEFAULT_MODULE_COLOR,
          animationSrc: MODULE_LOTTIE_MAP[module.type] ?? DEFAULT_MODULE_LOTTIE,
        }))
        .filter((asset) => asset.quantity > 0),
    [rawModules, moduleColorMap]
  );

  const defaultModuleColor = useMemo(() => {
    if (!rawModules?.length) return DEFAULT_MODULE_COLOR;
    const firstType = rawModules[0]?.type;
    if (!firstType) return DEFAULT_MODULE_COLOR;
    return moduleColorMap[firstType] ?? DEFAULT_MODULE_COLOR;
  }, [moduleColorMap, rawModules]);

  useEffect(() => {
    if (selectedAsset) return;
    if (selectedColor === defaultModuleColor) return;
    setSelectedColor(defaultModuleColor);
  }, [defaultModuleColor, selectedAsset, selectedColor]);

  const updateCellSize = useCallback(() => {
    if (typeof window === "undefined" || !currentFloor) return;
    const { innerWidth, innerHeight } = window;
    const isMobile = innerWidth < 640;

    const reservedHorizontal = isMobile ? MOBILE_RESERVED_HORIZONTAL : DESKTOP_RESERVED_HORIZONTAL;
    const reservedVertical = isMobile ? MOBILE_RESERVED_VERTICAL : DESKTOP_RESERVED_VERTICAL;

    const maxWidth = Math.max(innerWidth - reservedHorizontal, MIN_CELL_SIZE * currentFloor.x);
    const maxHeight = Math.max(innerHeight - reservedVertical, MIN_CELL_SIZE * currentFloor.y, innerHeight * HEIGHT_RATIO);

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

    for (let col = 0; col <= currentFloor.x; col++) {
      const x = col * cellSize + 0.5;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }

    for (let row = 0; row <= currentFloor.y; row++) {
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
      const image = ensureTexture(textureUrl);
      if (image) {
        if (alpha !== 1) {
          ctx.save();
          ctx.globalAlpha = alpha;
          ctx.drawImage(image, gridX * cellSize + 1, gridY * cellSize + 1, cellSize - 2, cellSize - 2);
          ctx.restore();
        } else {
          ctx.drawImage(image, gridX * cellSize + 1, gridY * cellSize + 1, cellSize - 2, cellSize - 2);
        }
        return;
      }
      if (fallbackColor) {
        ctx.fillStyle = fallbackColor;
        ctx.fillRect(gridX * cellSize + 1, gridY * cellSize + 1, cellSize - 2, cellSize - 2);
      }
    };

    const cellEntries = Array.from(currentCells.entries()) as Array<[string, CellData]>;
    cellEntries.forEach(([key, cell]) => {
      const [x, y] = key.split(",").map(Number);
      drawTexture(cell.textureUrl, x, y, cell.color);
    });

    if (movingGroup && isMovingGroup) {
      movingGroup.cells.forEach((cell) => {
        const drawX = cell.x + movingGroup.offset.x;
        const drawY = cell.y + movingGroup.offset.y;
        drawTexture(cell.value.textureUrl, drawX, drawY, cell.value.color, 0.75);
      });
    }

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
        const [x, y] = effect.cellKey.split(",").map(Number);
        ctx.save();
        ctx.strokeStyle = "#f87171";
        ctx.lineWidth = 3;
        ctx.shadowColor = "rgba(248,113,113,0.65)";
        ctx.shadowBlur = 12;
        ctx.strokeRect(x * cellSize + 1.5, y * cellSize + 1.5, cellSize - 3, cellSize - 3);
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
        const key = `${cell.x},${cell.y}`;
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
            !visited.has(`${neighbor.x},${neighbor.y}`)
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

      const key = `${x},${y}`;
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
        if (!selectedAsset || assetRemaining <= 0) return;
        const occupiedCell = currentCells.get(key);
        if (occupiedCell) {
          if (occupiedCell.assetId !== selectedAsset.id) {
            triggerCellFlash(floorIdentifier, key);
          }
          return;
        }

        const placedBefore = selectedAsset.quantity - selectedAsset.remaining;
        const { textureUrl, textureIndex } = resolveTextureForPlacement(selectedAsset, placedBefore + 1);

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
      }
    },
    [
      assetRemaining,
      currentCells,
      currentFloor,
      floorIdentifier,
      resolveTextureForPlacement,
      selectedAsset,
      selectedColor,
      selectedTool,
      triggerCellFlash,
    ]
  );

  const startInteraction = useCallback(
    (clientX: number, clientY: number) => {
      if (!currentFloor) return;
      const { x, y } = getGridCoordinatesFromClient(clientX, clientY);
      if (x < 0 || y < 0 || x >= currentFloor.x || y >= currentFloor.y) return;

      if (selectedTool === "move") {
        const key = `${x},${y}`;
        const cellData = currentCells.get(key);
        if (!cellData) return;
        const cluster = getConnectedCells(x, y, cellData.assetId);
        if (!cluster.length) return;
        const cellsWithValues = cluster.map((cell) => ({
          ...cell,
          value: currentCells.get(`${cell.x},${cell.y}`)!,
        }));
        setMovingGroup({ cells: cellsWithValues, offset: { x: 0, y: 0 } });
        setMoveAnchor({ x, y });
        setIsMovingGroup(true);
      } else {
        setIsPainting(true);
        paintCell(x, y);
      }
    },
    [currentCells, currentFloor, getConnectedCells, getGridCoordinatesFromClient, paintCell, selectedTool]
  );

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
    },
    [clampOffset, currentFloor, getGridCoordinatesFromClient, isMovingGroup, moveAnchor, movingGroup, paintCell, isPainting]
  );

  const finishInteraction = useCallback(() => {
    if (isMovingGroup && movingGroup) {
      const { offset, cells } = movingGroup;
      if (offset.x !== 0 || offset.y !== 0) {
        setPaintedFloors((prev) => {
          const next = new Map(prev);
          const floorMap = new Map(next.get(floorIdentifier) ?? []);

          cells.forEach((cell) => {
            floorMap.delete(`${cell.x},${cell.y}`);
          });

          cells.forEach((cell) => {
            const targetKey = `${cell.x + offset.x},${cell.y + offset.y}`;
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
  }, [floorIdentifier, isMovingGroup, movingGroup]);

  const handleMouseDown = useCallback(
    (event: React.MouseEvent<HTMLCanvasElement>) => {
      event.preventDefault();
      startInteraction(event.clientX, event.clientY);
    },
    [startInteraction]
  );

  const handleMouseMove = useCallback(
    (event: React.MouseEvent<HTMLCanvasElement>) => {
      if (!isPainting && !isMovingGroup) return;
      event.preventDefault();
      moveInteraction(event.clientX, event.clientY);
    },
    [isMovingGroup, isPainting, moveInteraction]
  );

  const handleTouchStart = useCallback(
    (event: React.TouchEvent<HTMLCanvasElement>) => {
      const touch = event.touches[0];
      if (!touch) return;
      event.preventDefault();
      startInteraction(touch.clientX, touch.clientY);
    },
    [startInteraction]
  );

  const handleTouchMove = useCallback(
    (event: React.TouchEvent<HTMLCanvasElement>) => {
      const touch = event.touches[0];
      if (!touch) return;
      event.preventDefault();
      moveInteraction(touch.clientX, touch.clientY);
    },
    [moveInteraction]
  );

  const handlePointerUp = useCallback(
    (event: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
      event.preventDefault();
      finishInteraction();
    },
    [finishInteraction]
  );

  const handleSelectTool: ToolsProps["onSelectTool"] = useCallback((tool) => {
    setSelectedTool(tool.name);
    setSelectedAssetId(null);
    setAssetRemaining(0);
    setIsPainting(false);
    setMovingGroup(null);
    setIsMovingGroup(false);
  }, []);

  const handleSelectAsset: ToolsProps["onSelectAsset"] = useCallback(
    (asset) => {
      setSelectedAssetId(asset.id);
      const nextColor = asset.color ?? moduleColorMap[asset.type] ?? DEFAULT_MODULE_COLOR;
      setSelectedColor(nextColor);
      setAssetRemaining(asset.remaining);
      setSelectedTool("cut");
    },
    [moduleColorMap]
  );

  const handleAssetsChange = useCallback(
    (updatedAssets: SelectedAsset[]) => {
      assetRegistryRef.current = new Map(updatedAssets.map((asset) => [asset.id, asset]));
      setAssetRegistryVersion((prev) => prev + 1);
      if (selectedAssetId) {
        const current = assetRegistryRef.current.get(selectedAssetId);
        if (current) {
          setAssetRemaining(current.remaining);
        } else {
          setSelectedAssetId(null);
          setAssetRemaining(0);
        }
      }
    },
    [selectedAssetId]
  );

  if (!currentFloor) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-cyan-200">
        Nenhuma configuração de piso disponível.
      </div>
    );
  }

  const boardPixelWidth = currentFloor ? currentFloor.x * cellSize : 0;
  const boardPixelHeight = currentFloor ? currentFloor.y * cellSize : 0;

  return (
    <>
      <NavBar />
      <div className="min-h-[100dvh] overflow-hidden bg-slate-950 pb-6 pt-14 text-cyan-100 md:pt-22">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-2 px-4 sm:px-6">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between">
            <FloorSelector
              floors={floorsWithUsage}
              selectedFloorIndex={selectedFloorIndex}
              onSelectFloor={setSelectedFloorIndex}
            />

            <div className="sm:self-start">
              <Tools
                assets={assets}
                onSelectTool={handleSelectTool}
                onSelectAsset={handleSelectAsset}
                onAssetsChange={handleAssetsChange}
              />
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-5xl rounded-3xl border border-cyan-500/20 bg-slate-900/70 px-2 pb-4 pt-2 shadow-xl">
            <div
              className="mx-auto w-full max-w-[90vw] overflow-hidden rounded-2xl border border-cyan-500/20 bg-slate-950/80"
              style={{ maxWidth: boardPixelWidth || undefined, maxHeight: boardPixelHeight || undefined }}
            >
              <canvas
                ref={canvasRef}
                className="h-auto w-full touch-none"
                style={{ touchAction: "none" }}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handlePointerUp}
                onMouseLeave={() => {
                  if (isPainting || isMovingGroup) finishInteraction();
                }}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handlePointerUp}
              />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
