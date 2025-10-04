import type { ModuleTypes } from "@/app/jotai/moduleMakerConfigAtom";

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

export const DEFAULT_MODULE_LOTTIE = "/json_files/Living_Room.lottie";
