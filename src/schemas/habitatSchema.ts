import { z } from 'zod';

const HabitatFloorSchema = z.object({
  level: z.number().int().positive().describe('Floor level number (1-based)'),
  x_length: z.number().positive().describe('Length in X dimension'),
  y_length: z.number().positive().describe('Length in Y dimension'),
});

const ModuleRelationshipSchema = z.object({
  uuid: z.string().uuid().describe('Unique identifier for the related module'),
  type: z.string().min(1).describe('Type of the related module'),
  reason: z.string().min(1).describe('Reason for the relationship'),
  positivePoints: z.number().int().nonnegative().optional().describe('Positive relationship points'),
  negativePoints: z.number().int().nonnegative().optional().describe('Negative relationship points'),
});

const ModuleTypeSchema = z.enum([
  'kitchen',
  'living_room',
  'bedroom',
  'bathroom',
  'laboratory',
  'workshop',
  'storage',
  'communications',
  'life_support',
  'exercise',
  'medical',
  'common_area'
]).or(z.string());

const ModuleSchema = z.object({
  numberofBlocks: z.number().int().positive().describe('Number of blocks this module occupies'),
  type: ModuleTypeSchema.describe('Type/category of the module'),
  uuid: z.string().uuid().describe('Unique identifier for the module'),
  name: z.string().min(1).describe('Display name of the module'),
  description: z.string().min(1).describe('Description of the module'),
  goodWith: z.array(ModuleRelationshipSchema).default([]).describe('Modules that work well with this one'),
  badWith: z.array(ModuleRelationshipSchema).default([]).describe('Modules that conflict with this one'),
});

export const HabitatSchema = z.object({
  missionName: z.string().min(1).describe('Name of the space mission'),
  missionDescription: z.string().min(1).describe('Description of the mission'),
  habitat_floors: z.array(HabitatFloorSchema).min(1).describe('Array of habitat floors'),
  modules: z.array(ModuleSchema).default([]).describe('Array of available modules'),
});

export const validateHabitat = (data: unknown) => {
  return HabitatSchema.safeParse(data);
};

export const validateModule = (data: unknown) => {
  return ModuleSchema.safeParse(data);
};

export const validateHabitatFloor = (data: unknown) => {
  return HabitatFloorSchema.safeParse(data);
};

export type HabitatFloor = z.infer<typeof HabitatFloorSchema>;
export type ModuleRelationship = z.infer<typeof ModuleRelationshipSchema>;
export type Module = z.infer<typeof ModuleSchema>;
export type Habitat = z.infer<typeof HabitatSchema>;
export type ModuleType = z.infer<typeof ModuleTypeSchema>;

export { 
  HabitatFloorSchema, 
  ModuleRelationshipSchema, 
  ModuleSchema,
  ModuleTypeSchema 
};