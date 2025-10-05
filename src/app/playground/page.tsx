"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAtom } from "jotai";
import FloorSelector, { type FloorSummary } from "@/components/FloorSelector";
import PlayerScore from "@/components/PlayerScore";
import { Tools } from "@/components/tools/index";
import Launcher, { LaunchController } from "@/components/launcher";
import { formatModuleLabel } from "./functions/helpers";
import {
  moduleMakerConfigAtom,
  userAtom,
  type ModuleTypes as HabitatModuleType,
  type MissionEventType,
  type MissionEventCategory,
  type RelationshipInsight,
} from "@/app/jotai/moduleMakerConfigAtom";
import { ModuleRelationships } from "@/utils/moduleRelationShip";
import {
  DEFAULT_MODULE_LOTTIE,
  MODULE_LOTTIE_MAP,
  MODULE_BACKGROUND_MAP,
  DEFAULT_MODULE_TEXTURES,
  WALL_HORIZONTAL_TEXTURES,
  WALL_VERTICAL_TEXTURE,
  WALL_DOOR_TEXTURE,
  buildModuleTexturePlan,
  moduleHasSpecialPatterns,
  type ModuleAssetType,
} from "@/utils/moduleLottieMap";
import { habitatPlanService } from "@/utils/calculateRelationShipScore";
import { evaluatePlacementRules } from "@/utils/playgroundRules";
import type {
  ToolsProps,
  SelectedAsset,
  FloorCell,
  CellData,
  FloorIdentifier,
  FlashEffect,
} from "@/types/playground";
import type { LaunchFloorCell, LaunchMissionModule, LaunchMissionRequest } from "@/types/api";
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
  const [, setUser] = useAtom(userAtom);
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
    if (!map.corridor) {
      map.corridor = "#94a3b8";
    }
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
  const maxDistanceRef = useRef<number | null>(null);
  const relationshipIssuesRef = useRef<Set<string>>(new Set());

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
    },
    []
  );

  const resolveTextureForPlacement = useCallback(
    (asset: SelectedAsset, newPlacedCount: number) => {
      const textures = MODULE_BACKGROUND_MAP[asset.type] ?? DEFAULT_MODULE_TEXTURES;
      if (!textures.length) {
        return { textureUrl: DEFAULT_MODULE_TEXTURES[0], textureIndex: 0 };
      }
      const spread = Math.max(1, Math.floor(textures.length / 2));
      const variantIndex = ((newPlacedCount - 1) * spread) % textures.length;
      return { textureUrl: textures[variantIndex], textureIndex: variantIndex };
    },
    []
  );

  const updateModuleTexturesForConnectedCells = useCallback(
    (
      assetId: string,
      moduleType: ModuleAssetType,
      floorMap: Map<string, CellData>,
      force = false
    ) => {
      if (!moduleHasSpecialPatterns(moduleType)) {
        return;
      }

      const cellsWithSameAsset = Array.from(floorMap.entries())
        .filter(([, cellData]) => cellData.assetId === assetId && cellData.assetType === moduleType)
        .map(([key, cellData]) => {
          const [x, y] = key.split(",").map(Number);
          return { key, x, y, cellData };
        });

      if (!cellsWithSameAsset.length) {
        return;
      }

      if (!force && cellsWithSameAsset.length <= 1) {
        return;
      }

      const plan = buildModuleTexturePlan(
        moduleType,
        cellsWithSameAsset.map(({ key, x, y }) => ({ key, x, y }))
      );

      const fallbackTextures = MODULE_BACKGROUND_MAP[moduleType] ?? DEFAULT_MODULE_TEXTURES;
      const normalTextures = plan.normalTextures.length ? plan.normalTextures : fallbackTextures;
      const specialKeys = new Set(Object.keys(plan.specialAssignments));

      // Apply special pattern textures first to reserve their slots.
      cellsWithSameAsset.forEach(({ key, cellData }) => {
        const special = plan.specialAssignments[key];
        if (!special) {
          return;
        }

        floorMap.set(key, {
          ...cellData,
          textureUrl: special.textureUrl,
          textureIndex: special.textureIndex,
        });
      });

      const remainingCells = cellsWithSameAsset.filter(({ key }) => !specialKeys.has(key));
      if (!remainingCells.length) {
        return;
      }

  const rows = new Map<number, Array<(typeof remainingCells)[number]>>();
      remainingCells.forEach((cell) => {
        const collection = rows.get(cell.y) ?? [];
        collection.push(cell);
        rows.set(cell.y, collection);
      });

      const orderedRows = Array.from(rows.keys()).sort((a, b) => a - b);
      let runningTextureIndex = plan.nextIndex;

      orderedRows.forEach((rowY, rowIdx) => {
        const rowCells = rows.get(rowY) ?? [];
        rowCells.sort((a, b) => a.x - b.x);

        const rowStartIndex = normalTextures.length ? (rowIdx * 2) % normalTextures.length : 0;
        const spacing = normalTextures.length
          ? Math.max(1, Math.floor(normalTextures.length / Math.max(1, rowCells.length)))
          : 1;

        rowCells.forEach((cell, cellIdx) => {
          const { key, x, y, cellData } = cell;
          const candidateOffset = normalTextures.length
            ? (rowStartIndex + cellIdx * spacing) % normalTextures.length
            : 0;

          let attempts = 0;
          let chosenTexture = normalTextures.length
            ? normalTextures[candidateOffset]
            : fallbackTextures[0] ?? DEFAULT_MODULE_TEXTURES[0];

          while (normalTextures.length && attempts < normalTextures.length) {
            const attemptedTexture = normalTextures[(candidateOffset + attempts) % normalTextures.length];
            const leftNeighbor = floorMap.get(`${x - 1},${y}`);
            const topNeighbor = floorMap.get(`${x},${y - 1}`);

            const clashesWithLeft =
              leftNeighbor?.assetId === cellData.assetId && leftNeighbor.textureUrl === attemptedTexture;
            const clashesWithTop =
              topNeighbor?.assetId === cellData.assetId && topNeighbor.textureUrl === attemptedTexture;

            if (!clashesWithLeft && !clashesWithTop) {
              chosenTexture = attemptedTexture;
              break;
            }

            attempts += 1;
          }

          floorMap.set(key, {
            ...cellData,
            textureUrl: chosenTexture,
            textureIndex: runningTextureIndex,
          });
          runningTextureIndex += 1;
        });
      });
    },
    []
  );

  const createEventId = useCallback(
    () =>
      typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    []
  );

  const logMissionEvent = useCallback(
    (
      message: string,
      delta: number,
      type: MissionEventType = "info",
      category: MissionEventCategory = "general"
    ) => {
      setUser((prev) => {
        const entry = {
          id: createEventId(),
          description: message,
          delta,
          timestamp: Date.now(),
          type,
          category,
        };

        const nextHistory = [entry, ...(prev.missionHistory ?? [])].slice(0, 50);

        return {
          ...prev,
          score: Math.max(0, (prev.score ?? 0) + delta),
          missionHistory: nextHistory,
        };
      });
    },
    [createEventId, setUser]
  );

  useEffect(() => {
    let cancelled = false;

    const buildRequestFloors = () =>
      floors.map((floor, index) => {
        const floorKey = (floor.level ?? index) as FloorIdentifier;
        const floorMap = paintedFloors.get(floorKey) ?? new Map<string, CellData>();
        const matrix: ({ type: HabitatModuleType } | null)[][] = [];

        for (let x = 0; x < floor.x; x += 1) {
          const column: ({ type: HabitatModuleType } | null)[] = [];
          for (let y = 0; y < floor.y; y += 1) {
            const cell = floorMap.get(`${x},${y}`);
            if (!cell || cell.assetType === "corridor") {
              column.push(null);
              continue;
            }

            column.push({ type: cell.assetType as HabitatModuleType });
          }
          matrix.push(column);
        }

        return { matrix };
      });

    const hasModulesPlaced = (requestFloors: ReturnType<typeof buildRequestFloors>) =>
      requestFloors.some((floor) =>
        floor.matrix.some((column) => column.some((cell) => cell !== null))
      );

    const evaluateRelationships = async () => {
      if (!floors.length) {
        relationshipIssuesRef.current = new Set();
        setUser((prev) => ({
          ...prev,
          score: 0,
          relationshipSummary: { negative: [], positive: [] },
        }));
        return;
      }

      const requestFloors = buildRequestFloors();

      if (!hasModulesPlaced(requestFloors)) {
        relationshipIssuesRef.current = new Set();
        setUser((prev) => ({
          ...prev,
          score: 0,
          relationshipSummary: { negative: [], positive: [] },
        }));
        return;
      }

      try {
        const result = await habitatPlanService.evaluateHabitatPlan({ floors: requestFloors });
        if (cancelled) return;

        const negativeFactors = result.worse_points.filter((factor) => factor.points < 0);
        const nextIssues = new Set<string>();

        negativeFactors.forEach((factor) => {
          const key = `${factor.module_type}->${factor.with_module_type}`;
          nextIssues.add(key);

          if (relationshipIssuesRef.current.has(key)) return;

          const relation = ModuleRelationships.find(
            (item) => item.type === factor.module_type && item.with === factor.with_module_type
          );

          const message =
            relation?.brief_reason ??
            `Conflito entre ${formatModuleLabel(factor.module_type)} e ${formatModuleLabel(factor.with_module_type)}.`;

          logMissionEvent(message, factor.points, "error", "module_relationship");
        });

        const mappedNegative: RelationshipInsight[] = negativeFactors.map((factor) => ({
          moduleType: factor.module_type,
          withModuleType: factor.with_module_type,
          points: factor.points,
          reason: factor.reason,
        }));

        const mappedPositive: RelationshipInsight[] = result.improvements_points
          .filter((factor) => factor.points > 0)
          .map((factor) => ({
            moduleType: factor.module_type,
            withModuleType: factor.with_module_type,
            points: factor.points,
            reason: factor.reason,
          }));

        setUser((prev) => ({
          ...prev,
          score: result.score,
          relationshipSummary: {
            negative: mappedNegative,
            positive: mappedPositive,
          },
        }));

        relationshipIssuesRef.current = nextIssues;
      } catch (error) {
        if (!cancelled) {
          console.error("Failed to evaluate module relationships", error);
        }
      }
    };

    evaluateRelationships();

    return () => {
      cancelled = true;
    };
  }, [floors, logMissionEvent, paintedFloors, setUser]);

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

  const buildLaunchPayload = useCallback((): LaunchMissionRequest => {
    const moduleCounts = new Map<HabitatModuleType, number>();

    const floorsPayload = floors.map((floor, index) => {
      const floorKeyForUsage = (floor.level ?? index) as FloorIdentifier;
      const floorCells = paintedFloors.get(floorKeyForUsage) ?? new Map<string, CellData>();
      const matrix: Array<Array<LaunchFloorCell | null>> = [];

      for (let y = 0; y < floor.y; y += 1) {
        const row: Array<LaunchFloorCell | null> = [];
        for (let x = 0; x < floor.x; x += 1) {
          const cell = floorCells.get(`${x},${y}`);
          if (!cell || cell.assetType === "corridor") {
            row.push(null);
            continue;
          }

          const moduleType = cell.assetType as HabitatModuleType;
          moduleCounts.set(moduleType, (moduleCounts.get(moduleType) ?? 0) + 1);
          row.push({ type: moduleType });
        }
        matrix.push(row);
      }

      return { matrix };
    });

    const maxWidth = floors.reduce((acc, floor) => Math.max(acc, floor.x ?? 0), 0);
    const maxHeight = floors.reduce((acc, floor) => Math.max(acc, floor.y ?? 0), 0);

    const habitatModules: LaunchMissionModule[] = (rawModules ?? [])
      .map((module) => {
        const quantity = moduleCounts.get(module.type) ?? 0;
        return {
          uuid: module.uuid,
          name: module.name ?? module.type,
          type: module.type,
          quantity,
          brief_reason: module.description ?? module.name ?? module.type,
        };
  })
  .filter((module) => module.quantity > 0);

    moduleCounts.forEach((quantity, moduleType) => {
      if (quantity <= 0) {
        return;
      }

      const alreadyPresent = habitatModules.some((module) => module.type === moduleType);
      if (alreadyPresent) {
        return;
      }

      habitatModules.push({
        uuid: moduleType,
        name: formatModuleLabel(moduleType),
        type: moduleType,
        quantity,
        brief_reason: formatModuleLabel(moduleType),
      });
    });

    const duration = Number.isFinite(config.duration)
      ? Math.min(1000, Math.max(1, Math.round(config.duration)))
      : 1;

    const crewSize = Number.isFinite(config.crewSize)
      ? Math.max(0, Math.round(config.crewSize))
      : 0;

    return {
      mission: {
        name: config.name,
        formal_description: config.description,
        duration,
        crew_size: crewSize,
        habitat_dimensions: {
          x_width: maxWidth,
          y_width: maxHeight,
        },
        habitat_modules: habitatModules,
      },
      floors: floorsPayload,
    } satisfies LaunchMissionRequest;
  }, [config.description, config.duration, config.crewSize, config.name, floors, paintedFloors, rawModules]);

  const assets = useMemo<ToolsProps["assets"]>(() => {
    const moduleAssets = (rawModules ?? [])
      .map((module) => ({
        type: module.type,
        quantity: module.numberOfBlocks ?? 0,
        label: module.name ?? module.type,
        color: moduleColorMap[module.type] ?? DEFAULT_MODULE_COLOR,
        animationSrc: MODULE_LOTTIE_MAP[module.type] ?? DEFAULT_MODULE_LOTTIE,
      }))
      .filter((asset) => asset.quantity > 0);

    const corridorAsset = {
      type: "corridor" as const,
      quantity: Number.POSITIVE_INFINITY,
      label: "Corredor",
      color: moduleColorMap.corridor ?? "#94a3b8",
      animationSrc: MODULE_LOTTIE_MAP.corridor ?? DEFAULT_MODULE_LOTTIE,
      unlimited: true,
    } satisfies ToolsProps["assets"][number];

    return [...moduleAssets, corridorAsset];
  }, [moduleColorMap, rawModules]);

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
      const supportingFloor = floors[selectedFloorIndex - 1];
      const supportingKey = (supportingFloor?.level ?? selectedFloorIndex - 1) as FloorIdentifier;
      const supportingCells = paintedFloors.get(supportingKey);

      for (let y = 0; y < currentFloor.y; y++) {
        for (let x = 0; x < currentFloor.x; x++) {
          const cellKey = `${x},${y}`;
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

    const shouldPlaceDoor = (a: CellData, b: CellData) => {
      if (a.assetId === b.assetId) {
        return false;
      }
      const aIsCorridor = a.assetType === "corridor";
      const bIsCorridor = b.assetType === "corridor";
      if (aIsCorridor && bIsCorridor) {
        return false;
      }
      return (aIsCorridor && !bIsCorridor) || (bIsCorridor && !aIsCorridor);
    };

    const makeDoorPairKey = (a: CellData, b: CellData) => {
      const aIsCorridor = a.assetType === "corridor";
      const bIsCorridor = b.assetType === "corridor";
      if (!aIsCorridor && !bIsCorridor) {
        return "";
      }
      const moduleId = aIsCorridor ? b.assetId : a.assetId;
      const corridorId = aIsCorridor ? a.assetId : b.assetId;
      return `${moduleId}|${corridorId}`;
    };

    const doorPairPlaced = new Set<string>();

    cellEntries.forEach(([key, cell]) => {
      const [x, y] = key.split(",").map(Number);

      if (y > 0) {
        const neighborAbove = currentCells.get(`${x},${y - 1}`);
        if (neighborAbove && neighborAbove.assetId !== cell.assetId) {
          if (shouldPlaceDoor(cell, neighborAbove)) {
            const doorKey = makeDoorPairKey(cell, neighborAbove);
            if (doorKey && !doorPairPlaced.has(doorKey)) {
              drawWallSegment(WALL_DOOR_TEXTURE, x, y, "horizontal");
              doorPairPlaced.add(doorKey);
            } else {
              const textureUrl = selectHorizontalTexture(x, y);
              drawWallSegment(textureUrl, x, y, "horizontal");
            }
          } else {
            const textureUrl = selectHorizontalTexture(x, y);
            drawWallSegment(textureUrl, x, y, "horizontal");
          }
        }
      }

      if (x > 0) {
        const neighborLeft = currentCells.get(`${x - 1},${y}`);
        if (neighborLeft && neighborLeft.assetId !== cell.assetId) {
          if (shouldPlaceDoor(cell, neighborLeft)) {
            const doorKey = makeDoorPairKey(cell, neighborLeft);
            if (doorKey && !doorPairPlaced.has(doorKey)) {
              drawWallSegment(WALL_DOOR_TEXTURE, x, y, "vertical");
              doorPairPlaced.add(doorKey);
            } else {
              drawWallSegment(WALL_VERTICAL_TEXTURE, x, y, "vertical");
            }
          } else {
            drawWallSegment(WALL_VERTICAL_TEXTURE, x, y, "vertical");
          }
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
    floors,
    paintedFloors,
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

          if (moduleHasSpecialPatterns(existingCell.assetType)) {
            updateModuleTexturesForConnectedCells(
              existingCell.assetId,
              existingCell.assetType,
              floorMap,
              true
            );
          }

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
          floors,
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
          
          if (moduleHasSpecialPatterns(selectedAsset.type)) {
            updateModuleTexturesForConnectedCells(selectedAsset.id, selectedAsset.type, floorMap);
          }
          
          next.set(floorIdentifier, floorMap);
          return next;
        });

    const floorLabel = currentFloor?.level ?? selectedFloorIndex + 1;
    const coords = `(${x + 1}, ${y + 1})`;
    const moduleLabel = selectedAsset.label ?? selectedAsset.type;
    logMissionEvent(`Módulo ${moduleLabel} posicionado em ${coords} no piso ${floorLabel}.`, 0, "success");

        const baseFloor = floors[0];
        if (baseFloor) {
          void habitatPlanService
            .calculateMaxDistance(floors.length, baseFloor.x, baseFloor.y)
            .then((distance) => {
              maxDistanceRef.current = distance;
            })
            .catch((error) => {
              console.error("Failed to calculate max distance", error);
            });
        }
      }
    },
    [
      assetRemaining,
      currentCells,
      currentFloor,
      floorIdentifier,
      floors,
      paintedFloors,
      resolveTextureForPlacement,
      selectedAsset,
      selectedColor,
      selectedFloorIndex,
      selectedTool,
      triggerCellFlash,
      logMissionEvent,
      setAssetRemaining,
      setPaintedFloors,
      updateModuleTexturesForConnectedCells,
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

          const firstCell = cells[0];
          if (firstCell && moduleHasSpecialPatterns(firstCell.value.assetType)) {
            updateModuleTexturesForConnectedCells(
              firstCell.value.assetId,
              firstCell.value.assetType,
              floorMap,
              true
            );
          }

          next.set(floorIdentifier, floorMap);
          return next;
        });
      }
    }

    setMovingGroup(null);
    setIsMovingGroup(false);
    setIsPainting(false);
  }, [floorIdentifier, isMovingGroup, movingGroup, updateModuleTexturesForConnectedCells]);

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
      startInteraction(touch.clientX, touch.clientY);
    },
    [startInteraction]
  );

  const handleTouchMove = useCallback(
    (event: React.TouchEvent<HTMLCanvasElement>) => {
      const touch = event.touches[0];
      if (!touch) return;
      moveInteraction(touch.clientX, touch.clientY);
    },
    [moveInteraction]
  );

  const handlePointerUp = useCallback(() => {
    finishInteraction();
  }, [finishInteraction]);

  const handleAssetsChange = useCallback((assetsList: SelectedAsset[]) => {
    assetRegistryRef.current = new Map(assetsList.map((asset) => [asset.id, asset]));
    setAssetRegistryVersion((prev) => prev + 1);
  }, []);

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


  const boardPixelWidth = currentFloor ? currentFloor.x * cellSize : 0;
  const boardPixelHeight = currentFloor ? currentFloor.y * cellSize : 0;

  return (
    <LaunchController
      buildPayload={buildLaunchPayload}
      missionName={config.name}
      onLogMissionEvent={logMissionEvent}
    >
      {({ launch, launchState }) => (
        <>
          <div className="min-h-[100dvh] overflow-hidden bg-slate-950 pb-6 pt-8 text-cyan-100 md:pt-14">
            <div className="mx-auto flex w-full max-w-6xl flex-col gap-2 px-4 sm:px-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex flex-col gap-3">
                  <PlayerScore />
                  <FloorSelector
                    floors={floorsWithUsage}
                    selectedFloorIndex={selectedFloorIndex}
                    onSelectFloor={setSelectedFloorIndex}
                  />
                </div>
              </div>

              <div className="mx-auto flex w-full max-w-5xl flex-row items-start overflow-x-auto">
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

                <div className="flex-shrink-0 lg:sticky lg:top-28">
                  <Tools
                    assets={assets}
                    onSelectTool={handleSelectTool}
                    onSelectAsset={handleSelectAsset}
                    onAssetsChange={handleAssetsChange}
                    onLaunch={launch}
                    launching={launchState.active}
                  />
                </div>
              </div>

              {launchState.active && (
                <div className="mx-auto w-full max-w-5xl">
                  <Launcher loading={launchState.loading} success={launchState.success} />
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </LaunchController>
  );
}
