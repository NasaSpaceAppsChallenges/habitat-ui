import type { LaunchMissionResponse } from "@/types/api";

export type NormalizedImageAsset = {
  name: string;
  base64: string;
  mimeType: string;
  dataUrl: string;
};

export const formatModuleLabel = (value: string) =>
  value
    .split(/[_\s]/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

export const makeReportFileName = (missionName: string | undefined) => {
  const normalized = missionName?.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-") ?? "habitat";
  const safe = normalized.replace(/^-+|-+$/g, "");
  return `${safe || "habitat"}-relatorio.pdf`;
};

export const inferImageMimeType = (name: string | undefined) => {
  const reference = name?.toLowerCase() ?? "";
  if (reference.endsWith(".jpg") || reference.endsWith(".jpeg")) return "image/jpeg";
  if (reference.endsWith(".webp")) return "image/webp";
  if (reference.endsWith(".gif")) return "image/gif";
  return "image/png";
};

export const normalizeImages = (images: LaunchMissionResponse["images"] | undefined): NormalizedImageAsset[] =>
  (images ?? [])
    .map((image, index) => {
      const base64 = image?.base64 ?? "";
      if (!base64) {
        return null;
      }

      const mimeType = image?.mimeType ?? inferImageMimeType(image?.name);
      const defaultExtension = mimeType.split("/")[1] ?? "png";
      const safeName = image?.name?.trim()
        ? image.name
        : `imagem-${index + 1}.${defaultExtension}`;
      const dataUrl = `data:${mimeType};base64,${base64}`;
      return { name: safeName, base64, mimeType, dataUrl };
    })
    .filter((entry): entry is NormalizedImageAsset => Boolean(entry));
