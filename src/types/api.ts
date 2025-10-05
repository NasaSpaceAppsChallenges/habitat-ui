import type {
  ModuleTypes,
  RelationshipInsight,
  RelationshipSummary,
} from "@/app/jotai/moduleMakerConfigAtom";

export type LayoutModuleType = ModuleTypes | "corridor";

export type LaunchFloorCell = {
  type: ModuleTypes;
};

export type LaunchFloorMatrix = Array<Array<LaunchFloorCell | null>>;

export type LaunchMissionModule = {
  uuid: string;
  name: string;
  type: ModuleTypes;
  quantity: number;
  brief_reason: string;
};

export type LaunchMissionRequest = {
  mission: {
    name: string;
    formal_description: string;
    duration: number;
    crew_size: number;
    habitat_dimensions: {
      x_width: number;
      y_width: number;
    };
    habitat_modules: LaunchMissionModule[];
  };
  floors: Array<{
    matrix: LaunchFloorMatrix;
  }>;
};

export type ExternalRelationshipFactor = {
  module_type: ModuleTypes;
  with_module_type: ModuleTypes;
  points: number;
  reason: string;
};

export type ExternalImageAsset = {
  name?: string;
  base64?: string;
  data?: string;
  mime_type?: string;
  content_type?: string;
};

export type LaunchMissionImage = {
  name: string;
  base64: string;
  mimeType?: string;
};

export type ExternalMissionResponse = {
  score: number;
  worse_points?: ExternalRelationshipFactor[];
  improvements_points?: ExternalRelationshipFactor[];
  images?: ExternalImageAsset[];
  pdf_base64?: string;
  pdf_mime_type?: string;
  pdf_file_name?: string;
  pdf_name?: string;
};

export type LaunchMissionResponse = {
  success: boolean;
  message: string;
  score: number;
  pdfBase64: string;
  pdfMimeType?: string;
  pdfFileName?: string;
  images: LaunchMissionImage[];
  worsePoints: RelationshipInsight[];
  improvementPoints: RelationshipInsight[];
  insights: RelationshipSummary;
  receivedAt: string;
};
