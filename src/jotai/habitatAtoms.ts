import { atom } from 'jotai';
import { type Habitat, type HabitatFloor, type Module, validateHabitat } from '../schemas/habitatSchema';

const baseHabitatAtom = atom<Habitat>({
  missionName: '',
  missionDescription: '',
  habitat_floors: [],
  modules: [],
});

export const habitatAtom = atom(
  (get) => get(baseHabitatAtom),
  (get, set, newValue: Habitat) => {
    const result = validateHabitat(newValue);
    if (result.success) {
      set(baseHabitatAtom, result.data);
    } else {
      throw new Error(`Invalid habitat data: ${result.error.issues.map(i => i.message).join(', ')}`);
    }
  }
);

export const missionInfoAtom = atom(
  (get) => {
    const habitat = get(habitatAtom);
    return {
      missionName: habitat.missionName,
      missionDescription: habitat.missionDescription,
    };
  },
  (get, set, update: { missionName?: string; missionDescription?: string }) => {
    const current = get(habitatAtom);
    set(habitatAtom, {
      ...current,
      ...update,
    });
  }
);

export const floorsAtom = atom(
  (get) => get(habitatAtom).habitat_floors,
  (get, set, floors: HabitatFloor[]) => {
    const current = get(habitatAtom);
    set(habitatAtom, {
      ...current,
      habitat_floors: floors,
    });
  }
);

export const modulesAtom = atom(
  (get) => get(habitatAtom).modules,
  (get, set, modules: Module[]) => {
    const current = get(habitatAtom);
    set(habitatAtom, {
      ...current,
      modules: modules,
    });
  }
);

export const isValidHabitatAtom = atom((get) => {
  try {
    const habitat = get(habitatAtom);
    const result = validateHabitat(habitat);
    return result.success;
  } catch {
    return false;
  }
});

export const habitatValidationErrorsAtom = atom((get) => {
  try {
    const habitat = get(habitatAtom);
    const result = validateHabitat(habitat);
    return result.success ? [] : result.error.issues;
  } catch (error) {
    return [{ message: String(error), path: [] as string[] }];
  }
});

export const updateHabitatSafely = (currentHabitat: Habitat, updates: Partial<Habitat>): Habitat => {
  const newHabitat = { ...currentHabitat, ...updates };
  const result = validateHabitat(newHabitat);
  
  if (result.success) {
    return result.data;
  } else {
    throw new Error(`Invalid habitat update: ${result.error.issues.map(i => i.message).join(', ')}`);
  }
};