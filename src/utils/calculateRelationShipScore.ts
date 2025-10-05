import { z } from "zod";

import {
  ModuleRelationSchema,
  ModuleRelationships,
  ModuleTypes,
  EvaluatorFactorSchema,
} from "./moduleRelationShip";

type ModuleCoordinate = {
  floor: number;
  x: number;
  y: number;
};

type CalculateModuleDistanceDto = [ModuleCoordinate, ModuleCoordinate];

type ModuleCell = {
  type: z.infer<typeof ModuleTypes>;
} | null;

type EvaluateHabitatPlanRequestDto = {
  floors: Array<{
    matrix: ModuleCell[][];
  }>;
};

type EvaluateHabitatPlanResponseDto = {
  score: number;
  worse_points: Array<z.infer<typeof EvaluatorFactorSchema>>;
  improvements_points: Array<z.infer<typeof EvaluatorFactorSchema>>;
};

const FLOOR_HEIGHT = 3;

const calculateModuleDistance = async (
  dto: CalculateModuleDistanceDto
): Promise<number> => {
  const [moduleA, moduleB] = dto;
  const xDistance = Math.abs(moduleA.x - moduleB.x);
  const yDistance = Math.abs(moduleA.y - moduleB.y);
  const horizontalDistance = Math.sqrt(xDistance ** 2 + yDistance ** 2);
  const floorDistance = Math.abs(moduleA.floor - moduleB.floor) * FLOOR_HEIGHT;
  const totalDistance = Math.sqrt(horizontalDistance ** 2 + floorDistance ** 2);
  return totalDistance;
};

const calculateMaxDistance = async (
  floors: number,
  xWidth: number,
  yWidth: number
): Promise<number> =>
  calculateModuleDistance([
    { floor: 1, x: 1, y: 1 },
    { floor: floors, x: xWidth, y: yWidth },
  ]);

const evaluateHabitatPlan = async (
  dto: EvaluateHabitatPlanRequestDto
): Promise<EvaluateHabitatPlanResponseDto> => {
  const relations: Array<z.infer<typeof ModuleRelationSchema>> = [];
  const modules: Array<{
    floor: number;
    module_type: z.infer<typeof ModuleTypes>;
    x: number;
    y: number;
  }> = [];

  dto.floors.forEach((floor, floorIndex) => {
    floor.matrix.forEach((row, x) => {
      row.forEach((module, y) => {
        if (module) {
          modules.push({ floor: floorIndex, module_type: module.type, x, y });
        }
      });
    });
  });

  const minDistance = 1;
  const baseFloor = dto.floors[0];
  const baseRow = baseFloor?.matrix?.[0];
  const maxDistance = await calculateMaxDistance(
    dto.floors.length,
    baseFloor?.matrix.length ?? 0,
    baseRow?.length ?? 0
  );

  for (let a = 0; a < modules.length; a += 1) {
    for (let b = 0; b < modules.length; b += 1) {
      const moduleA = modules[a];
      const moduleB = modules[b];
      if (moduleA.module_type === moduleB.module_type) continue;

      const distance = await calculateModuleDistance([
        {
          floor: moduleA.floor,
          x: moduleA.x,
          y: moduleA.y,
        },
        {
          floor: moduleB.floor,
          x: moduleB.x,
          y: moduleB.y,
        },
      ]);

      const moduleRelation = ModuleRelationships.find(
        (relation) => relation.type === moduleA.module_type && relation.with === moduleB.module_type
      );

      if (!moduleRelation || maxDistance === minDistance) continue;

      const points = Math.round(((maxDistance - distance) / (maxDistance - minDistance)) * moduleRelation.points);

      relations.push({
        type: moduleA.module_type,
        with: moduleB.module_type,
        distance,
        points,
      });
    }
  }

  const evaluatorFactors: Array<z.infer<typeof EvaluatorFactorSchema>> = [];

  for (const relation of relations) {
    const existing = evaluatorFactors.find(
      (factor) => factor.module_type === relation.type && factor.with_module_type === relation.with
    );
    if (existing) continue;

    const sameTypeRelations = relations.filter(
      (item) => item.type === relation.type && item.with === relation.with
    );
    const totalPoints = sameTypeRelations.reduce((acc, curr) => acc + curr.points, 0);
    const averagePoints = totalPoints / sameTypeRelations.length;
    const moduleRelation = ModuleRelationships.find(
      (item) => item.type === relation.type && item.with === relation.with
    );
    if (!moduleRelation) continue;

    evaluatorFactors.push({
      module_type: relation.type,
      with_module_type: relation.with,
      points: Math.round(averagePoints),
      reason: moduleRelation.reason,
    });
  }

  const orderedEvaluatorFactors = evaluatorFactors.sort((a, b) => a.points - b.points);
  const totalPoints = relations.reduce((acc, curr) => acc + curr.points, 0);
  const finalScore = relations.length ? Math.round(totalPoints / relations.length) : 0;

  return {
    score: finalScore,
    worse_points: orderedEvaluatorFactors.slice(0, 3),
    improvements_points: orderedEvaluatorFactors.slice(-3).reverse(),
  };
};

export const habitatPlanService = {
  calculateModuleDistance,
  calculateMaxDistance,
  evaluateHabitatPlan,
};