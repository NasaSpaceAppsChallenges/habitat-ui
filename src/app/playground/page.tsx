"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAtom } from "jotai";
import type { ComponentProps } from "react";
import FloorSelector, { type FloorSummary } from "@/components/FloorSelector";
import { Tools } from "@/components/tools/index";
import NavBar from "@/components/NavBar";
import { moduleMakerConfigAtom } from "@/app/jotai/moduleMakerConfigAtom";
import { DEFAULT_MODULE_LOTTIE, MODULE_LOTTIE_MAP } from "@/utils/moduleLottieMap";

type ToolsProps = ComponentProps<typeof Tools>;
type SelectedAsset = Parameters<ToolsProps["onSelectAsset"]>[0];

type FloorCell = { x: number; y: number };

const MODULE_COLOR_PALETTE = [
  "#38bdf8",
  "#f97316",
  "#34d399",
  "#facc15",
  "#a855f7",
  "#f472b6",
  "#93c5fd",
  "#fb7185",
  "#22d3ee",
];

const DEFAULT_MODULE_COLOR = "#22d3ee";

const MIN_CELL_SIZE = 22;
const MAX_CELL_SIZE = 60;
const HEIGHT_RATIO = 0.6;
const MOBILE_RESERVED_HORIZONTAL = 110;
const DESKTOP_RESERVED_HORIZONTAL = 200;
const MOBILE_RESERVED_VERTICAL = 220;
const DESKTOP_RESERVED_VERTICAL = 280;

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

  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [paintedFloors, setPaintedFloors] = useState<Map<number, Map<string, string>>>(new Map());
  const [selectedTool, setSelectedTool] = useState<"cut" | "erase" | "move">("cut");
  const [selectedAsset, setSelectedAsset] = useState<SelectedAsset | null>(null);
  const [selectedColor, setSelectedColor] = useState<string>(DEFAULT_MODULE_COLOR);
  const [assetRemaining, setAssetRemaining] = useState<number>(0);

  const [cellSize, setCellSize] = useState<number>(32);
  const [isPainting, setIsPainting] = useState(false);
  const [isMovingGroup, setIsMovingGroup] = useState(false);
  const [moveAnchor, setMoveAnchor] = useState<FloorCell>({ x: 0, y: 0 });
  const [movingGroup, setMovingGroup] = useState<{
    cells: FloorCell[];
    color: string;
    offset: FloorCell;
  } | null>(null);

  useEffect(() => {
    if (!currentFloor) return;
    setPaintedFloors((prev) => {
      if (prev.has(floorKey)) return prev;
      const next = new Map(prev);
      next.set(floorKey, new Map());
      return next;
    });
  }, [currentFloor, floorKey]);

  useEffect(() => {
    setIsPainting(false);
    setIsMovingGroup(false);
    setMovingGroup(null);
  }, [selectedFloorIndex]);

  const currentCells = useMemo(() => paintedFloors.get(floorKey) ?? new Map<string, string>(), [paintedFloors, floorKey]);

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

    const cellEntries = Array.from(currentCells.entries());
    cellEntries.forEach(([key, color]) => {
      const [x, y] = key.split(",").map(Number);
      ctx.fillStyle = color;
      ctx.fillRect(x * cellSize + 1, y * cellSize + 1, cellSize - 2, cellSize - 2);
    });

    if (movingGroup && isMovingGroup) {
      ctx.save();
      ctx.globalAlpha = 0.75;
      ctx.fillStyle = movingGroup.color;
      movingGroup.cells.forEach((cell) => {
        const x = (cell.x + movingGroup.offset.x) * cellSize;
        const y = (cell.y + movingGroup.offset.y) * cellSize;
        ctx.fillRect(x + 1, y + 1, cellSize - 2, cellSize - 2);
      });
      ctx.restore();
    }
  }, [cellSize, currentCells, currentFloor, isMovingGroup, movingGroup]);

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
    (startX: number, startY: number, targetColor: string) => {
      const visited = new Set<string>();
      const queue: FloorCell[] = [{ x: startX, y: startY }];
      const cluster: FloorCell[] = [];

      while (queue.length) {
        const cell = queue.shift()!;
        const key = `${cell.x},${cell.y}`;
        if (visited.has(key)) continue;
        visited.add(key);

        if (currentCells.get(key) !== targetColor) continue;
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
        if (!currentCells.has(key)) return;
        setPaintedFloors((prev) => {
          const next = new Map(prev);
          const floorMap = new Map(next.get(floorKey) ?? []);
          floorMap.delete(key);
          next.set(floorKey, floorMap);
          return next;
        });
        return;
      }

      if (selectedTool === "cut") {
        if (!selectedAsset || assetRemaining <= 0) return;
        const existingColor = currentCells.get(key);
        if (existingColor === selectedColor) return;

        selectedAsset.draw();
        setAssetRemaining((prev) => Math.max(prev - 1, 0));

        setPaintedFloors((prev) => {
          const next = new Map(prev);
          const floorMap = new Map(next.get(floorKey) ?? []);
          floorMap.set(key, selectedColor);
          next.set(floorKey, floorMap);
          return next;
        });
      }
    },
    [assetRemaining, currentCells, currentFloor, floorKey, selectedAsset, selectedColor, selectedTool]
  );

  const startInteraction = useCallback(
    (clientX: number, clientY: number) => {
      if (!currentFloor) return;
      const { x, y } = getGridCoordinatesFromClient(clientX, clientY);
      if (x < 0 || y < 0 || x >= currentFloor.x || y >= currentFloor.y) return;

      if (selectedTool === "move") {
        const key = `${x},${y}`;
        const color = currentCells.get(key);
        if (!color) return;
        const cluster = getConnectedCells(x, y, color);
        if (!cluster.length) return;
        setMovingGroup({ cells: cluster, color, offset: { x: 0, y: 0 } });
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
      const { offset, cells, color } = movingGroup;
      if (offset.x !== 0 || offset.y !== 0) {
        setPaintedFloors((prev) => {
          const next = new Map(prev);
          const floorMap = new Map(next.get(floorKey) ?? []);

          cells.forEach((cell) => {
            floorMap.delete(`${cell.x},${cell.y}`);
          });

          cells.forEach((cell) => {
            const targetKey = `${cell.x + offset.x},${cell.y + offset.y}`;
            floorMap.set(targetKey, color);
          });

          next.set(floorKey, floorMap);
          return next;
        });
      }
    }

    setMovingGroup(null);
    setIsMovingGroup(false);
    setIsPainting(false);
  }, [floorKey, isMovingGroup, movingGroup]);

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
    setSelectedAsset(null);
    setAssetRemaining(0);
    setIsPainting(false);
    setMovingGroup(null);
    setIsMovingGroup(false);
  }, []);

  const handleSelectAsset: ToolsProps["onSelectAsset"] = useCallback(
    (asset) => {
      setSelectedAsset(asset);
      const nextColor = asset.color ?? moduleColorMap[asset.type] ?? DEFAULT_MODULE_COLOR;
      setSelectedColor(nextColor);
      setAssetRemaining(asset.remaining);
      setSelectedTool("cut");
    },
    [moduleColorMap]
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
              <Tools assets={assets} onSelectTool={handleSelectTool} onSelectAsset={handleSelectAsset} />
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
