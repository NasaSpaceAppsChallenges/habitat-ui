import { atom } from "jotai";

export type HabitatFloors = {
  level: Number;
  x_length: Number;
  y_length: Number;
}
export type ModuleTypes =
  | 'kitchen'
  | 'living_room'
  | 'bedroom'
  | 'bathroom'
  | 'laboratory'
  | 'workshop'
  | 'storage'
  | 'communications'
  | 'life_support'
  | 'exercise'
  | 'medical'
  | 'common_area'
  | String;

export type HabitatModules = {
  uuid: String;
  name: String;
  reason: String;
  type: ModuleTypes;
  relationship_with: {
    type: ModuleTypes;
    points: Number;
    reason: String;
  }
}

export type ModuleMissionMakerResponse = {
  name: String;
  description: String;
  duration: String;
  crewSize: Number;
  habitat_floors: HabitatFloors[];
  habitat_modules: HabitatModules[];
}

export const ModuleMakerConfigAtom = atom<ModuleMissionMakerResponse>(
  {
    name: '',
    description: '',
    duration: '',
    crewSize: 0,
    habitat_floors: [],
    habitat_modules: []
  }
)