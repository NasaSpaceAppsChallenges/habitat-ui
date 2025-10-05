import { NextResponse } from "next/server";

import type {
  ExternalMissionResponse,
  ExternalRelationshipFactor,
  LaunchMissionImage,
  LaunchMissionRequest,
  LaunchMissionResponse,
} from "@/types/api";
import type { RelationshipInsight } from "@/app/jotai/moduleMakerConfigAtom";


const resolveRequestTimeout = () => {
  const raw = process.env.HABITAT_API_TIMEOUT_MS;
  if (!raw) {
    return null;
  }

  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
};

const API_TIMEOUT_MS = resolveRequestTimeout();

const mapFactorsToInsights = (factors: ExternalRelationshipFactor[] = []): RelationshipInsight[] =>
  factors
    .filter((factor) => Boolean(factor?.module_type) && Boolean(factor?.with_module_type))
    .map((factor) => ({
      moduleType: factor.module_type,
      withModuleType: factor.with_module_type,
      points: Number(factor.points ?? 0),
      reason: factor.reason ?? "",
    }));

const sanitizeImageAssets = (assets: ExternalMissionResponse["images"]): LaunchMissionImage[] => {
  if (!assets?.length) {
    return [];
  }

  return assets.reduce<LaunchMissionImage[]>((accumulator, asset, index) => {
    const base64 = asset?.base64 ?? asset?.data ?? "";
    if (!base64) {
      return accumulator;
    }

    const name = asset?.name?.trim();
    const normalizedName = name && name.length > 0 ? name : `relatorio-${index + 1}.png`;
    const candidateMime = asset?.mime_type ?? asset?.content_type;

    accumulator.push({
      name: normalizedName,
      base64,
      mimeType: candidateMime ?? undefined,
    });

    return accumulator;
  }, []);
};

const mapExternalResponse = (
  raw: ExternalMissionResponse,
  message: string
): LaunchMissionResponse => {
  const negativeInsights = mapFactorsToInsights(raw.worse_points);
  const positiveInsights = mapFactorsToInsights(raw.improvements_points);

  return {
    success: true,
    message,
    score: Number(raw.score ?? 0),
    pdfBase64: raw.pdf_base64 ?? "",
    pdfMimeType: raw.pdf_mime_type ?? undefined,
    pdfFileName: raw.pdf_file_name ?? raw.pdf_name ?? undefined,
    images: sanitizeImageAssets(raw.images),
    worsePoints: negativeInsights,
    improvementPoints: positiveInsights,
    insights: {
      negative: negativeInsights,
      positive: positiveInsights,
    },
    receivedAt: new Date().toISOString(),
  };
};

const callExternalApi = async (payload: LaunchMissionRequest): Promise<LaunchMissionResponse> => {
  let controller: AbortController | null = null;
  let timeout: NodeJS.Timeout | null = null;

  if (API_TIMEOUT_MS !== null) {
    controller = new AbortController();
    timeout = setTimeout(() => controller?.abort(), API_TIMEOUT_MS);
  }

  try {
    const response = await fetch("https://nsa2025.linkai.me/api/mission/evaluate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      cache: "no-store",
      signal: controller?.signal,
    });

    if (!response.ok) {
      throw new Error(`External API responded with status ${response.status}`);
    }

    const data = (await response.json()) as ExternalMissionResponse;
    return mapExternalResponse(data, "Plano avaliado com sucesso pelo serviço oficial.");
  } catch (error) {
    if (API_TIMEOUT_MS !== null && error instanceof Error && error.name === "AbortError") {
      throw new Error(
        `A consulta ao serviço oficial excedeu o tempo limite configurado (${API_TIMEOUT_MS / 1000} segundos).`
      );
    }

    throw error;
  } finally {
    if (timeout) {
      clearTimeout(timeout);
    }
  }
};

export async function POST(request: Request) {
  let payload: LaunchMissionRequest;

  try {
    payload = (await request.json()) as LaunchMissionRequest;
  } catch (error) {
    console.warn("Não foi possível interpretar o payload recebido em /api/launch.", error);
    return NextResponse.json<LaunchMissionResponse>(
      {
        success: false,
        message: "Corpo da requisição inválido.",
        score: 0,
        pdfBase64: "",
        images: [],
        pdfMimeType: undefined,
        pdfFileName: undefined,
        worsePoints: [],
        improvementPoints: [],
        insights: { negative: [], positive: [] },
        receivedAt: new Date().toISOString(),
      },
      { status: 400 }
    );
  }

  try {
    const externalResponse = await callExternalApi(payload);
    return NextResponse.json<LaunchMissionResponse>(externalResponse);
  } catch (error) {
    console.warn("Falha ao consultar endpoint de avaliação do habitat.", error);
    return NextResponse.json<LaunchMissionResponse>(
      {
        success: false,
        message:
          error instanceof Error ? error.message : "Não foi possível obter a avaliação da missão no momento.",
        score: 0,
        pdfBase64: "",
        pdfMimeType: undefined,
        pdfFileName: undefined,
        images: [],
        worsePoints: [],
        improvementPoints: [],
        insights: { negative: [], positive: [] },
        receivedAt: new Date().toISOString(),
      },
      { status: 502 }
    );
  }
}
