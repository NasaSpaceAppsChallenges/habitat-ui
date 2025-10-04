import type { ModuleTypes } from "@/app/jotai/moduleMakerConfigAtom";

const buildTexturePaths = (folder: string, files: string[]) =>
  files.map((file) => `/textures/${folder}/floor/${file}`);

export const MODULE_LOTTIE_MAP: Record<ModuleTypes, string> = {
  private_crew_quarters: "/json_files/Living_Room.lottie",
  common_kitchen_and_mess: "/json_files/Kitchen.lottie",
  work_command_station: "/json_files/Workshop.lottie",
  multipurpose_science_medical_area: "/json_files/Laboratory.lottie",
  dedicated_storage_logistics: "/json_files/Workshop.lottie",
  radiation_shelter: "/json_files/Laboratory.lottie",
  dedicated_wcs: "/json_files/Toilet.lottie",
  full_hygiene_station: "/json_files/Bathtub.lottie",
  permanent_exercise_area: "/json_files/Living_Room.lottie",
};

export const MODULE_BACKGROUND_MAP: Record<ModuleTypes, string[]> = {
  private_crew_quarters: buildTexturePaths("bedroom", ["quarto_01.png", "quarto_02.png", "quarto_03.png"]),
  common_kitchen_and_mess: buildTexturePaths("kitchen", ["cozinha_01.png", "cozinha_02.png", "cozinha_03.png"]),
  work_command_station: buildTexturePaths("workspace", ["comando_01.png", "comando_02.png", "comando_03.png"]),
  multipurpose_science_medical_area: buildTexturePaths("medicinal", ["medicinal_01.png", "medicinal_02.png", "medicinal_03.png"]),
  dedicated_storage_logistics: buildTexturePaths("storage", ["estoque_01.png", "estoque_02.png", "estoque_03.png"]),
  radiation_shelter: buildTexturePaths("safe", ["abrigo_01.png", "abrigo_02.png", "abrigo_03.png"]),
  dedicated_wcs: buildTexturePaths("toilet", ["banheiroWCS_01.png", "banheiroWCS_02.png", "banheiroWCS_03.png"]),
  full_hygiene_station: buildTexturePaths("bathroom", ["higiene_01.png", "higiene_02.png", "higiene_03.png"]),
  permanent_exercise_area: buildTexturePaths("gim", ["academia_01.png", "academia_02.png", "academia_03.png"]),
};

export const DEFAULT_MODULE_TEXTURES = MODULE_BACKGROUND_MAP.private_crew_quarters;

export const DEFAULT_MODULE_LOTTIE = "/json_files/Living_Room.lottie";
