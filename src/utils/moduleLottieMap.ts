import type { ModuleTypes } from "@/app/jotai/moduleMakerConfigAtom";

export type ModuleAssetType = ModuleTypes | "corridor";

type WallTextures = {
  up: string;
  down: string;
};

const buildFloorTexturePaths = (folder: string, files: string[]) =>
  files.map((file) => `/textures/${folder}/floor/${file}`);

const buildWallTexturePaths = (folder: string, upFile: string, downFile: string): WallTextures => ({
  up: `/textures/${folder}/wall/${upFile}`,
  down: `/textures/${folder}/wall/${downFile}`,
});

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

export const MODULE_BACKGROUND_MAP: Record<ModuleAssetType, string[]> = {
  private_crew_quarters: buildFloorTexturePaths("bedroom", ["quarto_01.png", "quarto_02.png", "quarto_03.png"]),
  common_kitchen_and_mess: buildFloorTexturePaths("kitchen", ["cozinha_01.png", "cozinha_02.png", "cozinha_03.png"]),
  work_command_station: buildFloorTexturePaths("workspace", ["comando_01.png", "comando_02.png", "comando_03.png"]),
  multipurpose_science_medical_area: buildFloorTexturePaths("medicinal", ["medicinal_01.png", "medicinal_02.png", "medicinal_03.png"]),
  dedicated_storage_logistics: buildFloorTexturePaths("storage", ["estoque_01.png", "estoque_02.png", "estoque_03.png"]),
  radiation_shelter: buildFloorTexturePaths("safe", ["abrigo_01.png", "abrigo_02.png", "abrigo_03.png"]),
  dedicated_wcs: buildFloorTexturePaths("toilet", ["banheiroWCS_01.png", "banheiroWCS_02.png", "banheiroWCS_03.png"]),
  full_hygiene_station: buildFloorTexturePaths("bathroom", ["higiene_01.png", "higiene_02.png", "higiene_03.png"]),
  permanent_exercise_area: buildFloorTexturePaths("gim", ["academia_01.png", "academia_02.png", "academia_03.png"]),
  corridor: buildFloorTexturePaths("workspace", ["comando_01.png", "comando_02.png", "comando_03.png"]),
};

export const MODULE_WALL_MAP: Record<ModuleAssetType, WallTextures> = {
  private_crew_quarters: buildWallTexturePaths("bedroom", "quarto_up.png", "quarto_down.png"),
  common_kitchen_and_mess: buildWallTexturePaths("kitchen", "cozinha_up.png", "cozinha_down.png"),
  work_command_station: buildWallTexturePaths("workspace", "comando_up.png", "comando_down.png"),
  multipurpose_science_medical_area: buildWallTexturePaths("medicinal", "medicinal_up.png", "medicinal_down.png"),
  dedicated_storage_logistics: buildWallTexturePaths("storage", "estoque_up.png", "estoque_down.png"),
  radiation_shelter: buildWallTexturePaths("safe", "abrigo_up.png", "abrigo_down.png"),
  dedicated_wcs: buildWallTexturePaths("toilet", "banheiro_up.png", "banheiro_down.png"),
  full_hygiene_station: buildWallTexturePaths("bathroom", "higiene_up.png", "higiene_down.png"),
  permanent_exercise_area: buildWallTexturePaths("gim", "academia_up.png", "academia_down.png"),
  corridor: buildWallTexturePaths("workspace", "comando_up.png", "comando_down.png"),
};

export const DEFAULT_MODULE_TEXTURES = MODULE_BACKGROUND_MAP.private_crew_quarters;
export const DEFAULT_MODULE_WALLS = MODULE_WALL_MAP.private_crew_quarters;

export const DEFAULT_MODULE_LOTTIE = "/json_files/Living_Room.lottie";
