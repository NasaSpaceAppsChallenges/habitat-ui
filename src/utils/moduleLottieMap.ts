import type { ModuleTypes } from "@/app/jotai/moduleMakerConfigAtom";

export type ModuleAssetType = ModuleTypes | "corridor";

const buildFloorTexturePaths = (folder: string, files: string[]) =>
  files.map((file) => `/textures/${folder}/${file}`);

type SpecialPatternType = "square2x2" | "vertical2" | "horizontal2" | "horizontal3";

type SpecialPatternConfig = {
  id: string;
  type: SpecialPatternType;
  textures: string[];
  minRemainingNormals?: number;
  maxOccurrences?: number;
};

type ModuleTextureConfig = {
  baseTextures: string[];
  specialPatterns?: SpecialPatternConfig[];
};

const DEFAULT_MIN_NORMAL_BLOCKS = 2;

const MODULE_TEXTURE_CONFIG: Record<ModuleAssetType, ModuleTextureConfig> = {
  private_crew_quarters: {
    baseTextures: buildFloorTexturePaths("bedroom", ["quarto_01.png", "quarto_02.png", "quarto_03.png"]),
    specialPatterns: [
      {
        id: "quarters-bed-square",
        type: "square2x2",
        textures: [
          "/textures/bedroom/quarto_cama_grande_left_top.png",
          "/textures/bedroom/quarto_cama_grande_rigth_top.png",
          "/textures/bedroom/quarto_cama_grande_left_bottom.png",
          "/textures/bedroom/quarto_cama_grande_rigth_bottom.png",
        ],
      },
      {
        id: "quarters-bed-vertical",
        type: "vertical2",
        textures: [
          "/textures/bedroom/quarto_cama_red_top.png",
          "/textures/bedroom/quarto_cama_red_bottom.png",
        ],
      },
      {
        id: "quarters-table-horizontal",
        type: "horizontal2",
        textures: [
          "/textures/bedroom/quarto_mesa_left.png",
          "/textures/bedroom/quarto_mesa_rigth.png",
        ],
      },
    ],
  },
  common_kitchen_and_mess: {
    baseTextures: buildFloorTexturePaths("kitchen", [
      "cozinha_01.png",
      "cozinha_02.png",
      "cozinha_03.png",
    ]),
    specialPatterns: [
      {
        id: "kitchen-sink-horizontal-3",
        type: "horizontal3",
        textures: [
          "/textures/kitchen/cozinha_pia_left.png",
          "/textures/kitchen/cozinha_pia_center.png",
          "/textures/kitchen/cozinha_pia_rigth.png",
        ],
      },
      {
        id: "kitchen-sink-horizontal",
        type: "horizontal2",
        textures: [
          "/textures/kitchen/cozinha_pia_left.png",
          "/textures/kitchen/cozinha_pia_rigth.png",
        ],
      },
    ],
  },
  work_command_station: {
    baseTextures: buildFloorTexturePaths("workspace", [
      "comando_01.png",
      "comando_02.png",
      "comando_03.png",
      "comando_04.png",
      "comando_05.png",
      "comando_mesa_1.png",
      "comando_mesa_2.png",
    ]),
    specialPatterns: [
      {
        id: "workspace-control-square",
        type: "square2x2",
        textures: [
          "/textures/workspace/comando_controle_left_top.png",
          "/textures/workspace/comando_controle_rigth_top.png",
          "/textures/workspace/comando_controle_left_bottom.png",
          "/textures/workspace/comando_controle_rigth_bottom.png",
        ],
      },
    ],
  },
  multipurpose_science_medical_area: {
    baseTextures: buildFloorTexturePaths("medicinal", [
      "medicinal_01.png",
      "medicinal_02.png",
      "medicinal_03.png",
    ]),
    specialPatterns: [
      {
        id: "medical-bench-square",
        type: "square2x2",
        textures: [
          "/textures/medicinal/medicinal_banca_left_top.png",
          "/textures/medicinal/medicinal_banca_rigth_top.png",
          "/textures/medicinal/medicinal_banca_left_bottom.png",
          "/textures/medicinal/medicinal_banca_rigth_bottom.png",
        ],
      },
    ],
  },
  dedicated_storage_logistics: {
    baseTextures: buildFloorTexturePaths("storage", [
      "estoque_01.png",
      "estoque_02.png",
      "estoque_03.png",
      "estoque_04.png",
      "estoque_estante_p.png",
    ]),
    specialPatterns: [
      {
        id: "storage-shelf-vertical",
        type: "vertical2",
        textures: [
          "/textures/storage/estoque_estante_top.png",
          "/textures/storage/estoque_estante_bottom.png",
        ],
      },
    ],
  },
  radiation_shelter: {
    baseTextures: buildFloorTexturePaths("safe", [
      "abrigo_01.png",
      "abrigo_02.png",
      "abrigo_03.png",
      "abrigo_04.png",
      "abrigo_05.png",
    ]),
    specialPatterns: [
      {
        id: "shelter-sofa-horizontal",
        type: "horizontal2",
        textures: [
          "/textures/safe/abrigo_sofa_left.png",
          "/textures/safe/abrigo_sofa_rigth.png",
        ],
      },
    ],
  },
  dedicated_wcs: {
    baseTextures: buildFloorTexturePaths("toilet", [
      "banheiroWCS_01.png",
      "banheiroWCS_02.png",
      "banheiroWCS_03.png",
      "banheiroWCS_04.png",
    ]),
    specialPatterns: [
      {
        id: "wcs-shower-vertical",
        type: "vertical2",
        textures: [
          "/textures/toilet/banheiroWCS_chuveiro_top.png",
          "/textures/toilet/banheiroWCS_chuveiro_bottom.png",
        ],
      },
    ],
  },
  full_hygiene_station: {
    baseTextures: buildFloorTexturePaths("bathroom", [
      "higiene_01.png",
      "higiene_02.png",
      "higiene_03.png",
    ]),
    specialPatterns: [
      {
        id: "hygiene-capsule-square",
        type: "square2x2",
        textures: [
          "/textures/bathroom/higiene_capsula_left_top.png",
          "/textures/bathroom/higiene_capsula_rigth_top.png",
          "/textures/bathroom/higiene_capsula_left_bottom.png",
          "/textures/bathroom/higiene_capsula_rigth_bottom.png",
        ],
      },
      {
        id: "hygiene-fridge-vertical",
        type: "vertical2",
        textures: [
          "/textures/bathroom/higiene_refri_top.png",
          "/textures/bathroom/higiene_refri_bottom.png",
        ],
      },
    ],
  },
  permanent_exercise_area: {
    baseTextures: buildFloorTexturePaths("gim", [
      "academia_01.png",
      "academia_02.png",
      "academia_03.png",
    ]),
  },
  corridor: {
    baseTextures: buildFloorTexturePaths("workspace", [
      "comando_01.png",
      "comando_02.png",
      "comando_03.png",
      "comando_04.png",
      "comando_05.png",
    ]),
  },
};

export const moduleHasSpecialPatterns = (moduleType: ModuleAssetType): boolean =>
  (MODULE_TEXTURE_CONFIG[moduleType]?.specialPatterns?.length ?? 0) > 0;

export type ModuleCellInfo = {
  key: string;
  x: number;
  y: number;
};

export type ModuleTexturePlan = {
  specialAssignments: Record<string, { textureUrl: string; textureIndex: number }>;
  normalTextures: string[];
  nextIndex: number;
};

const createPositionKey = (x: number, y: number) => `${x},${y}`;

const findSquareMatch = (
  anchor: ModuleCellInfo,
  positionMap: Map<string, ModuleCellInfo>,
  usedKeys: Set<string>
): ModuleCellInfo[] | null => {
  const topLeft = anchor;
  const topRight = positionMap.get(createPositionKey(anchor.x + 1, anchor.y));
  const bottomLeft = positionMap.get(createPositionKey(anchor.x, anchor.y + 1));
  const bottomRight = positionMap.get(createPositionKey(anchor.x + 1, anchor.y + 1));

  if (!topRight || !bottomLeft || !bottomRight) return null;

  const cells = [topLeft, topRight, bottomLeft, bottomRight];
  return cells.some((cell) => usedKeys.has(cell.key)) ? null : cells;
};

const findVerticalMatch = (
  anchor: ModuleCellInfo,
  positionMap: Map<string, ModuleCellInfo>,
  usedKeys: Set<string>
): ModuleCellInfo[] | null => {
  const bottom = positionMap.get(createPositionKey(anchor.x, anchor.y + 1));
  if (!bottom) return null;
  if (usedKeys.has(anchor.key) || usedKeys.has(bottom.key)) return null;

  const [topCell, bottomCell] = anchor.y <= bottom.y ? [anchor, bottom] : [bottom, anchor];
  return [topCell, bottomCell];
};

const findHorizontalMatch = (
  anchor: ModuleCellInfo,
  positionMap: Map<string, ModuleCellInfo>,
  usedKeys: Set<string>
): ModuleCellInfo[] | null => {
  const right = positionMap.get(createPositionKey(anchor.x + 1, anchor.y));
  if (!right) return null;
  if (usedKeys.has(anchor.key) || usedKeys.has(right.key)) return null;

  const [leftCell, rightCell] = anchor.x <= right.x ? [anchor, right] : [right, anchor];
  return [leftCell, rightCell];
};

const findHorizontalTripleMatch = (
  anchor: ModuleCellInfo,
  positionMap: Map<string, ModuleCellInfo>,
  usedKeys: Set<string>
): ModuleCellInfo[] | null => {
  const middle = positionMap.get(createPositionKey(anchor.x + 1, anchor.y));
  const right = positionMap.get(createPositionKey(anchor.x + 2, anchor.y));
  if (!middle || !right) return null;

  const cells = [anchor, middle, right];
  if (cells.some((cell) => usedKeys.has(cell.key))) return null;
  return cells;
};

const resolvePatternMatch = (
  type: SpecialPatternType,
  anchor: ModuleCellInfo,
  positionMap: Map<string, ModuleCellInfo>,
  usedKeys: Set<string>
): ModuleCellInfo[] | null => {
  switch (type) {
    case "square2x2":
      return findSquareMatch(anchor, positionMap, usedKeys);
    case "vertical2":
      return findVerticalMatch(anchor, positionMap, usedKeys);
    case "horizontal2":
      return findHorizontalMatch(anchor, positionMap, usedKeys);
    case "horizontal3":
      return findHorizontalTripleMatch(anchor, positionMap, usedKeys);
    default:
      return null;
  }
};

const sortCells = (cells: ModuleCellInfo[]) =>
  [...cells].sort((a, b) => (a.y === b.y ? a.x - b.x : a.y - b.y));

export const buildModuleTexturePlan = (
  moduleType: ModuleAssetType,
  cells: ModuleCellInfo[]
): ModuleTexturePlan => {
  const config = MODULE_TEXTURE_CONFIG[moduleType] ?? MODULE_TEXTURE_CONFIG.private_crew_quarters;
  const sortedCells = sortCells(cells);
  const positionMap = new Map(sortedCells.map((cell) => [createPositionKey(cell.x, cell.y), cell]));
  const specialAssignments: Record<string, { textureUrl: string; textureIndex: number }> = {};
  const usedKeys = new Set<string>();
  let nextIndex = 0;

  const patterns = config.specialPatterns ?? [];

  patterns.forEach((pattern) => {
    const maxOccurrences = pattern.maxOccurrences ?? 1;
    const minRemaining = pattern.minRemainingNormals ?? DEFAULT_MIN_NORMAL_BLOCKS;
    let occurrences = 0;

    for (const cell of sortedCells) {
      if (usedKeys.has(cell.key) || occurrences >= maxOccurrences) continue;

      const matchedCells = resolvePatternMatch(pattern.type, cell, positionMap, usedKeys);
      if (!matchedCells) continue;

      const patternSize = matchedCells.length;
      if (pattern.textures.length !== patternSize) continue;

      const remainingNormals = sortedCells.length - (usedKeys.size + patternSize);
      if (remainingNormals < minRemaining) continue;

      matchedCells.forEach((matchedCell, idx) => {
        specialAssignments[matchedCell.key] = {
          textureUrl: pattern.textures[idx],
          textureIndex: nextIndex++,
        };
        usedKeys.add(matchedCell.key);
      });

      occurrences += 1;
      if (occurrences >= maxOccurrences) break;
    }
  });

  const baseTextures = config.baseTextures.length
    ? config.baseTextures
    : MODULE_TEXTURE_CONFIG.private_crew_quarters.baseTextures;

  return {
    specialAssignments,
    normalTextures: Array.from(baseTextures),
    nextIndex,
  };
};

export const MODULE_LOTTIE_MAP: Record<ModuleAssetType, string> = {
  private_crew_quarters: "/json_files/Living_Room.lottie",
  common_kitchen_and_mess: "/json_files/Kitchen.lottie",
  work_command_station: "/json_files/Workshop.lottie",
  multipurpose_science_medical_area: "/json_files/Laboratory.lottie",
  dedicated_storage_logistics: "/json_files/Workshop.lottie",
  radiation_shelter: "/json_files/Laboratory.lottie",
  dedicated_wcs: "/json_files/Toilet.lottie",
  full_hygiene_station: "/json_files/Bathtub.lottie",
  permanent_exercise_area: "/json_files/Living_Room.lottie",
  corridor: "/json_files/Workshop.lottie",
};

export const MODULE_BACKGROUND_MAP: Record<ModuleAssetType, string[]> = Object.keys(
  MODULE_TEXTURE_CONFIG
).reduce((acc, key) => {
  const moduleKey = key as ModuleAssetType;
  acc[moduleKey] = MODULE_TEXTURE_CONFIG[moduleKey].baseTextures;
  return acc;
}, {} as Record<ModuleAssetType, string[]>);
export const DEFAULT_MODULE_TEXTURES = MODULE_TEXTURE_CONFIG.private_crew_quarters.baseTextures;

export const WALL_HORIZONTAL_TEXTURES = [
  "/textures/wall/wall_horizon_1.png",
  "/textures/wall/wall_horizon_2.png",
  "/textures/wall/wall_horizon_3.png",
];

export const WALL_VERTICAL_TEXTURE = "/textures/wall/wall_vertical.png";
export const WALL_DOOR_TEXTURE = "/textures/wall/horizontal_door.png";

export const DEFAULT_MODULE_LOTTIE = "/json_files/Living_Room.lottie";
