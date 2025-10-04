import { atom } from "jotai";

import missionModel from "@/json-model.json" assert { type: "json" };

export type HabitatFloor = {
  level: number;
  x_length: number;
  y_length: number;
};

export type ModuleTypes =
  | "kitchen"
  | "living_room"
  | "bedroom"
  | "bathroom"
  | "laboratory"
  | "workshop"
  | "storage"
  | "communications"
  | "life_support"
  | "exercise"
  | "medical"
  | "common_area"
  | (string & {});

export type ModuleRelationship = {
  uuid: string;
  type: ModuleTypes;
  reason: string;
  points: number;
};

export type HabitatModule = {
  uuid: string;
  name: string;
  description: string;
  type: ModuleTypes;
  numberOfBlocks: number;
  goodWith: ModuleRelationship[];
  badWith: ModuleRelationship[];
};

export type ModuleMissionMakerResponse = {
  name: string;
  description: string;
  duration: number;
  crewSize: number;
  habitat_floors: HabitatFloor[];
  habitat_modules: HabitatModule[];
};

const toRelationships = (
  entries: Array<Record<string, unknown>> | undefined,
  pointsKey: "positivePoints" | "negativePoints"
): ModuleRelationship[] => {
  return (entries ?? []).map((entry) => ({
    uuid: String(entry.uuid ?? ""),
    type: String(entry.type ?? "") as ModuleTypes,
    reason: String(entry.reason ?? ""),
    points: Number(entry[pointsKey] ?? 0),
  }));
};

const defaultModuleMakerConfig: ModuleMissionMakerResponse = {
  name: String(missionModel.missionName ?? ""),
  description: String(missionModel.missionDescription ?? ""),
  duration: 0,
  crewSize: 0,
  habitat_floors: (missionModel.habitat_floors ?? []).map((floor) => ({
    level: Number(floor.level ?? 0),
    x_length: Number(floor.x_length ?? 0),
    y_length: Number(floor.y_length ?? 0),
  })),
  habitat_modules: (missionModel.modules ?? []).map((module) => ({
    uuid: String(module.uuid ?? ""),
    name: String(module.name ?? ""),
    description: String(module.description ?? ""),
    type: String(module.type ?? "") as ModuleTypes,
    numberOfBlocks: Number(module.numberofBlocks ?? 0),
    goodWith: toRelationships(module.goodWith as Array<Record<string, unknown>>, "positivePoints"),
    badWith: toRelationships(module.badWith as Array<Record<string, unknown>>, "negativePoints"),
  })),
};

export const moduleMakerConfigAtom = atom<ModuleMissionMakerResponse>(defaultModuleMakerConfig);