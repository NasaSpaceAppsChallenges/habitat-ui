import { validateHabitat, HabitatSchema, type Habitat } from './habitatSchema';

export const exampleHabitatData = {
  "missionName": "Sample Mission",
  "missionDescription": "This is a sample mission description.",
  "habitat_floors": [
    {
      "level": 1,
      "x_length": 12,
      "y_length": 8
    },
    {
      "level": 2,
      "x_length": 8,
      "y_length": 8
    },
    {
      "level": 3,
      "x_length": 6,
      "y_length": 10
    }
  ],
  "modules": [
    {
      "numberofBlocks": 10,
      "type": "kitchen",
      "uuid": "550e8400-e29b-41d4-a716-446655440000",
      "name": "Modern Kitchen",
      "description": "A sleek modern kitchen module.",
      "goodWith": [
        {
          "uuid": "550e8400-e29b-41d4-a716-446655440001",
          "type": "living_room",
          "reason": "complementary",
          "positivePoints": 1
        }
      ],
      "badWith": [
        {
          "uuid": "550e8400-e29b-41d4-a716-446655440002",
          "type": "laboratory",
          "reason": "conflicting",
          "negativePoints": 1
        }
      ]
    }
  ]
} as const;

export function parseHabitatData(data: unknown): Habitat | null {
  const result = validateHabitat(data);
  
  if (result.success) {
    console.log('✅ Habitat data is valid!');
    return result.data;
  } else {
    console.error('❌ Validation errors:');
    result.error.issues.forEach((issue) => {
      console.error(`  - ${issue.path.join('.')}: ${issue.message}`);
    });
    return null;
  }
}

export function createHabitat(habitatData: Habitat): Habitat {
  return HabitatSchema.parse(habitatData);
}

if (typeof window === 'undefined') {
  console.log('Testing habitat validation...');
  const validatedHabitat = parseHabitatData(exampleHabitatData);
  
  if (validatedHabitat) {
    console.log('Mission Name:', validatedHabitat.missionName);
    console.log('Number of floors:', validatedHabitat.habitat_floors.length);
    console.log('Number of modules:', validatedHabitat.modules.length);
  }
}