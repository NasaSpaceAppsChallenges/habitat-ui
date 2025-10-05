"use client";

import type { TouchEvent } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useAtomValue, useSetAtom } from "jotai";

import {
  missionReportAtom,
  moduleMakerConfigAtom,
  type MissionReportState,
} from "@/app/jotai/moduleMakerConfigAtom";
import { playerLanunchStatusAtom, type PlayerLaunchStatus } from "@/app/jotai/playerlaunchStatusAtom";
import { makeReportFileName, normalizeImages } from "@/app/playground/functions/helpers";
const DEFAULT_PDF_URL = "/default.pdf";

const formatModuleType = (value: string | undefined) => {
  if (!value) return "Módulo";
  return value
    .toLowerCase()
    .split("_")
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ");
};

const formatDateTime = (iso: string | undefined) => {
  if (!iso) return "--";
  try {
    return new Intl.DateTimeFormat("pt-BR", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(iso));
  } catch {
    return "--";
  }
};

const mockedImages = [
  "https://media.discordapp.net/attachments/1421271697742368881/1424434729410756748/img2.png?ex=68e3efb8&is=68e29e38&hm=8345f6790f80ab09b5dbf5c785f3c0b83dd14f3d169e9fe129fca10a108d25f8&=&format=webp&quality=lossless&width=387&height=582",
  "https://media.discordapp.net/attachments/1421271697742368881/1424434730182643803/img1.png?ex=68e3efb8&is=68e29e38&hm=8bd69b5d0828802b810e4443cd5fa52f10cd956a5a62336c21fe06525a59d69f&=&format=webp&quality=lossless&width=582&height=582",
];

export default function RelatoriosPage() {
  const missionReport = useAtomValue(missionReportAtom);
  const missionConfig = useAtomValue(moduleMakerConfigAtom);
  const playerLaunchStatus = useAtomValue(playerLanunchStatusAtom);
  const setPlayerLaunchStatus = useSetAtom(playerLanunchStatusAtom);
  const [isPdfModalOpen, setPdfModalOpen] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [imageModalIndex, setImageModalIndex] = useState<number | null>(null);
  const touchStartXRef = useRef<number | null>(null);
  const touchDeltaXRef = useRef(0);

  const defaultLaunchStatus: PlayerLaunchStatus = useMemo(() => {
    const timestamp = new Date().toISOString();
    return {
      phase: "failure",
      lastUpdatedAt: timestamp,
      response: {
        success: false,
        message: "Falha simulada: parâmetros críticos fora da faixa segura.",
        score: -25,
        pdfBase64: "",
        images: [],
        worsePoints: [
          {
            moduleType: "private_crew_quarters",
            withModuleType: "dedicated_wcs",
            points: -81,
            reason:
              "O sistema de coleta de resíduos (banheiro) é a principal fonte de contaminação biológica e odores no habitat, além de gerar ruído. Para garantir a higiene e um ambiente de descanso saudável, esta área deve ser mantida o mais longe possível dos aposentos privados.",
          },
          {
            moduleType: "dedicated_wcs",
            withModuleType: "private_crew_quarters",
            points: -81,
            reason:
              "A proximidade é inaceitável. Odores, ruído e o risco de contaminação tornam o ambiente dos aposentos insalubre e impossibilitam o descanso, comprometendo diretamente a saúde e o bem-estar da tripulação.",
          },
          {
            moduleType: "common_kitchen_and_mess",
            withModuleType: "dedicated_wcs",
            points: -79,
            reason:
              "A cozinha é a principal área \"limpa\" para preparação e consumo de alimentos. O banheiro (WCS) é a principal fonte de contaminação biológica e odores. Mantê-los o mais longe possível é fundamental para a saúde da tripulação e para evitar a contaminação cruzada.",
          },
        ],
        improvementPoints: [
          {
            moduleType: "dedicated_storage_logistics",
            withModuleType: "radiation_shelter",
            points: 77,
            reason:
              "O abrigo contra radiação precisa ser abastecido com suprimentos de emergência (comida, água, kits médicos). Além disso, a própria massa dos itens armazenados (especialmente água) pode ser usada para construir ou reforçar a blindagem do abrigo, tornando a proximidade um fator de segurança vital.",
          },
          {
            moduleType: "radiation_shelter",
            withModuleType: "dedicated_storage_logistics",
            points: 77,
            reason:
              "A massa dos suprimentos armazenados (especialmente água e comida) fornece uma excelente blindagem contra radiação. Co-localizar o abrigo com a área principal de armazenamento permite que essa massa seja usada como um componente primário da construção e reforço do abrigo.",
          },
          {
            moduleType: "permanent_exercise_area",
            withModuleType: "full_hygiene_station",
            points: 67,
            reason:
              "Esta é a combinação mais eficiente e desejável. Após o exercício, a tripulação precisa se limpar imediatamente. Ter a estação de higiene ao lado contém o suor em uma única zona \"suja\" e cria um fluxo de trabalho perfeito, melhorando o conforto e a higiene geral.",
          },
        ],
      },
    } satisfies PlayerLaunchStatus;
  }, []);


  useEffect(() => {
    if (playerLaunchStatus.response) {
      return;
    }
    if (typeof window === "undefined") {
      return;
    }

    try {
      const stored = window.sessionStorage.getItem("player-launch-status");
      if (stored) {
        const parsed = JSON.parse(stored) as PlayerLaunchStatus | null;
        if (parsed?.response) {
          setPlayerLaunchStatus(parsed);
          return;
        }
      }
      setPlayerLaunchStatus(defaultLaunchStatus);
    } catch (storageError) {
      console.warn("Não foi possível restaurar o status do lançamento da sessão.", storageError);
      setPlayerLaunchStatus(defaultLaunchStatus);
    }
  }, [defaultLaunchStatus, playerLaunchStatus.response, setPlayerLaunchStatus]);

  const fallbackReport = useMemo<MissionReportState | null>(() => {
    const response = playerLaunchStatus.response;
    if (!response) return null;

    const normalizedImages = normalizeImages(response.images);
    const pdfBase64 = response.pdfBase64?.trim() ?? "";
    const pdfMimeType = response.pdfMimeType ?? "application/pdf";
    const pdfFileName = response.pdfFileName ?? makeReportFileName(missionConfig.name);

    const status: MissionReportState["status"] =
      playerLaunchStatus.phase === "success"
        ? "success"
        : playerLaunchStatus.phase === "failure"
        ? "error"
        : response.success
        ? "success"
        : "error";

    const message =
      response.message ??
      (status === "success" ? "Plano aprovado." : "Plano rejeitado.");

    return {
      status,
      message,
      score: Number.isFinite(response.score) ? response.score : 0,
      pdf: {
        base64: pdfBase64,
        mimeType: pdfMimeType,
        fileName: pdfFileName,
      },
      images: normalizedImages.map(({ name, base64, mimeType }) => ({ name, base64, mimeType })),
      gallery: normalizedImages.map((entry) => entry.dataUrl),
      worsePoints: response.worsePoints ?? [],
      improvementPoints: response.improvementPoints ?? [],
    } satisfies MissionReportState;
  }, [missionConfig.name, playerLaunchStatus]);

  const effectiveReport = missionReport ?? fallbackReport;

  const pdfHref = useMemo(() => {
    if (!effectiveReport?.pdf) return null;
    const trimmedBase64 = effectiveReport.pdf.base64?.trim() ?? "";
    if (trimmedBase64) {
      return `data:${effectiveReport.pdf.mimeType};base64,${trimmedBase64}`;
    }
    return DEFAULT_PDF_URL || null;
  }, [effectiveReport?.pdf]);

  useEffect(() => {
    if (!pdfHref && isPdfModalOpen) {
      setPdfModalOpen(false);
    }
  }, [isPdfModalOpen, pdfHref]);

  useEffect(() => {
    if (!isPdfModalOpen) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setPdfModalOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isPdfModalOpen]);

  useEffect(() => {
    if (imageModalIndex === null) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setImageModalIndex(null);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [imageModalIndex]);

  const galleryItems = useMemo(() => {
    if (effectiveReport?.gallery?.length) {
      const images = effectiveReport.images ?? [];
      return effectiveReport.gallery.map((src, index) => ({
        src,
        name: images[index]?.name ?? `Imagem ${index + 1}`,
        isMock: false,
      }));
    }

    return mockedImages.map((src, index) => ({
      src,
      name: `Imagem ${index + 1}`,
      isMock: true,
    }));
  }, [effectiveReport]);

  useEffect(() => {
    if (!galleryItems.length) {
      setActiveImageIndex(0);
      setImageModalIndex(null);
      return;
    }

    setActiveImageIndex((current) => Math.min(current, galleryItems.length - 1));
    setImageModalIndex((current) => {
      if (current === null) {
        return current;
      }

      return current >= galleryItems.length ? galleryItems.length - 1 : current;
    });
  }, [galleryItems]);

  const showPreviousImage = () => {
    setActiveImageIndex((current) => Math.max(current - 1, 0));
  };

  const showNextImage = () => {
    setActiveImageIndex((current) => Math.min(current + 1, galleryItems.length - 1));
  };

  const handleTouchStart = (event: TouchEvent<HTMLDivElement>) => {
    touchStartXRef.current = event.touches[0].clientX;
    touchDeltaXRef.current = 0;
  };

  const handleTouchMove = (event: TouchEvent<HTMLDivElement>) => {
    if (touchStartXRef.current === null) {
      return;
    }

    touchDeltaXRef.current = event.touches[0].clientX - touchStartXRef.current;
  };

  const handleTouchEnd = () => {
    const delta = touchDeltaXRef.current;
    if (Math.abs(delta) > 50) {
      if (delta > 0) {
        showPreviousImage();
      } else {
        showNextImage();
      }
    }

    touchStartXRef.current = null;
    touchDeltaXRef.current = 0;
  };

  const statusLabel = useMemo(() => {
    if (playerLaunchStatus.phase === "launching") {
      return "Avaliando plano";
    }
    if (effectiveReport) {
      return effectiveReport.status === "success" ? "Missão nominal" : "Plano reprovado";
    }
    return "Aguardando lançamento";
  }, [effectiveReport, playerLaunchStatus.phase]);

  const summary = useMemo(() => {
    const crewSize = missionConfig.crewSize ?? 0;
    const lastUpdatedAt = playerLaunchStatus.lastUpdatedAt;

    return [
      { label: "Status", value: statusLabel },
      {
        label: "Pontuação",
        value: effectiveReport ? effectiveReport.score.toLocaleString("pt-BR") : "--",
      },
      {
        label: "Tripulação",
        value: crewSize > 0 ? `${crewSize} integrante${crewSize > 1 ? "s" : ""}` : "Não informado",
      },
      {
        label: "Última atualização",
        value: lastUpdatedAt ? formatDateTime(lastUpdatedAt) : "--",
      },
    ];
  }, [effectiveReport, missionConfig.crewSize, playerLaunchStatus.lastUpdatedAt, statusLabel]);

  const improvementPoints = effectiveReport?.improvementPoints ?? [];
  const worsePoints = effectiveReport?.worsePoints ?? [];
  const hasRelationshipContent = improvementPoints.length > 0 || worsePoints.length > 0;
  const isImageModalOpen = imageModalIndex !== null && Boolean(galleryItems[imageModalIndex]);
  const modalImage = isImageModalOpen && imageModalIndex !== null ? galleryItems[imageModalIndex] : null;

  return (
    <div className="min-h-[100dvh] bg-slate-950 text-cyan-50 overflow-y-auto">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-10 px-4 py-16 sm:px-8">
        <header className="space-y-4 text-center">
          <span className="text-xs font-semibold uppercase tracking-[0.4em] text-cyan-300/70">Relatório de Missão</span>
          <h1 className="text-3xl font-bold text-white sm:text-4xl">{missionConfig.name || "Habitat Orbital"}</h1>
          <p className="mx-auto max-w-2xl text-sm text-cyan-100/80 sm:text-base">
            {effectiveReport?.message ??
              (playerLaunchStatus.phase === "launching"
                ? "Estamos avaliando o seu plano junto ao serviço oficial. Aguarde alguns instantes."
                : "Finalize o plano de habitat no playground e lance para gerar um relatório detalhado.")}
          </p>
        </header>

        <section className="grid gap-4 sm:grid-cols-2">
          {summary.map((item) => (
            <div
              key={item.label}
              className="flex min-h-[96px] flex-col justify-between rounded-2xl border border-cyan-500/20 bg-slate-900/70 px-6 py-4 shadow-[0_0_35px_rgba(14,165,233,0.12)]"
            >
              <span className="text-xs font-medium uppercase tracking-[0.3em] text-cyan-300/70">{item.label}</span>
              <span className="text-lg font-semibold text-white">{item.value}</span>
            </div>
          ))}
        </section>

        <section className="flex flex-col gap-6 rounded-3xl border border-cyan-500/25 bg-slate-900/60 px-6 py-8 shadow-[0_0_60px_rgba(14,165,233,0.15)]">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-white">Relatório consolidado</h2>
              <p className="text-sm text-cyan-100/80">Baixe o PDF gerado com a análise do plano.</p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {pdfHref ? (
                <>
                  <button
                    type="button"
                    onClick={() => setPdfModalOpen(true)}
                    className="inline-flex items-center justify-center rounded-full border border-cyan-400/50 bg-transparent px-5 py-2 text-sm font-semibold uppercase tracking-[0.28em] text-cyan-200 transition hover:border-cyan-300 hover:text-cyan-50"
                  >
                    Visualizar PDF
                  </button>
                </>
              ) : (
                <span className="text-xs text-cyan-100/60">PDF indisponível até a próxima simulação.</span>
              )}
              <Link
                href="/playground"
                className="inline-flex items-center justify-center rounded-full border border-cyan-400/50 bg-transparent px-5 py-2 text-sm font-semibold uppercase tracking-[0.28em] text-cyan-200 transition hover:border-cyan-300 hover:text-cyan-50"
              >
                Retornar ao Playground
              </Link>
            </div>
          </div>

          <div className="min-h-[220px] rounded-2xl border border-cyan-500/20 bg-slate-950/60 p-4">
            {galleryItems.length ? (
              <div className="relative h-[18rem] sm:h-[22rem]">
                <div
                  className="relative h-full overflow-hidden rounded-2xl border border-cyan-500/15 bg-slate-900/80"
                >
                  <div
                    className="flex h-full w-full transition-transform duration-500 ease-out"
                    style={{ transform: `translateX(-${activeImageIndex * 100}%)` }}
                    onTouchStart={handleTouchStart}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={handleTouchEnd}
                  >
                    {galleryItems.map((item, index) => (
                      <figure
                        key={`${item.src}-${index}`}
                        className="relative flex h-full w-full shrink-0 flex-col"
                      >
                        <button
                          type="button"
                          className="relative h-full w-full flex-1 overflow-hidden"
                          onClick={() => setImageModalIndex(index)}
                          aria-label={`Visualizar imagem ${index + 1} em tela cheia`}
                        >
                          <Image
                            src={item.src}
                            alt={`Pré-visualização ${index + 1} - ${item.name}`}
                            fill
                            sizes="(max-width: 640px) 100vw, 600px"
                            className="object-cover"
                            unoptimized
                          />
                        </button>
                        <figcaption className="flex items-center justify-between px-4 py-3 text-xs uppercase tracking-[0.22em] text-cyan-200/70">
                          <span className="truncate" title={item.name}>
                            {item.name}
                          </span>
                        </figcaption>
                      </figure>
                    ))}
                  </div>
                </div>

                {galleryItems.length > 1 ? (
                  <>
                    <button
                      type="button"
                      onClick={showPreviousImage}
                      className="absolute left-3 top-1/2 flex -translate-y-1/2 items-center justify-center rounded-full border border-cyan-500/40 bg-slate-900/70 p-2 text-cyan-100 shadow-lg transition hover:border-cyan-300/60 hover:text-cyan-50 disabled:cursor-not-allowed disabled:border-cyan-500/10 disabled:text-cyan-500/30"
                      disabled={activeImageIndex === 0}
                      aria-label="Imagem anterior"
                    >
                      <span className="text-lg">&#8592;</span>
                    </button>
                    <button
                      type="button"
                      onClick={showNextImage}
                      className="absolute right-3 top-1/2 flex -translate-y-1/2 items-center justify-center rounded-full border border-cyan-500/40 bg-slate-900/70 p-2 text-cyan-100 shadow-lg transition hover:border-cyan-300/60 hover:text-cyan-50 disabled:cursor-not-allowed disabled:border-cyan-500/10 disabled:text-cyan-500/30"
                      disabled={activeImageIndex === galleryItems.length - 1}
                      aria-label="Próxima imagem"
                    >
                      <span className="text-lg">&#8594;</span>
                    </button>

                    <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 items-center gap-2">
                      {galleryItems.map((_, index) => (
                        <span
                          key={index}
                          className={`h-1.5 w-6 rounded-full transition ${
                            index === activeImageIndex
                              ? "bg-cyan-300"
                              : "bg-cyan-500/20"
                          }`}
                        />
                      ))}
                    </div>
                  </>
                ) : null}
              </div>
            ) : (
              <p className="text-sm text-cyan-100/70">
                Nenhuma imagem foi retornada pela simulação. Lance um novo plano para visualizar a galeria.
              </p>
            )}
          </div>
        </section>

        <section className="flex flex-col gap-6 rounded-3xl border border-cyan-500/25 bg-slate-900/60 px-6 py-8 shadow-[0_0_60px_rgba(14,165,233,0.1)]">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-white">Insights de relacionamento</h2>
              <p className="text-sm text-cyan-100/75">
                Destaques positivos e negativos entre os módulos selecionados durante a simulação.
              </p>
            </div>

            {hasRelationshipContent ? null : (
              <span className="text-xs uppercase tracking-[0.28em] text-cyan-200/70">
                Sem insights disponíveis
              </span>
            )}
          </div>

          {hasRelationshipContent ? (
            <div className="grid gap-5 sm:grid-cols-2">
              <div className="rounded-2xl border border-emerald-400/35 bg-emerald-950/30 p-5">
                <div className="flex items-baseline justify-between">
                  <h3 className="text-sm font-semibold uppercase tracking-[0.3em] text-emerald-300">Pontos fortes</h3>
                  <span className="text-xs font-medium text-emerald-100/80">{improvementPoints.length}</span>
                </div>
                {improvementPoints.length ? (
                  <ul className="mt-4 space-y-3">
                    {improvementPoints.slice(0, 6).map((item, index) => (
                      <li
                        key={`${item.moduleType}-${item.withModuleType}-${index}`}
                        className="rounded-xl border border-emerald-400/25 bg-emerald-900/20 px-4 py-3"
                      >
                        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-200">
                          {formatModuleType(item.moduleType)} + {formatModuleType(item.withModuleType)}
                        </p>
                        <p className="mt-2 text-xs text-emerald-50/80">{item.reason}</p>
                        <span className="mt-2 inline-flex rounded-full bg-emerald-500/20 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.32em] text-emerald-200">
                          +{item.points.toLocaleString("pt-BR")}
                          <span className="ml-1">pts</span>
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-4 text-xs text-emerald-100/70">Nenhum destaque positivo registrado nesta execução.</p>
                )}
              </div>

              <div className="rounded-2xl border border-rose-400/35 bg-rose-950/30 p-5">
                <div className="flex items-baseline justify-between">
                  <h3 className="text-sm font-semibold uppercase tracking-[0.3em] text-rose-300">Riscos</h3>
                  <span className="text-xs font-medium text-rose-100/80">{worsePoints.length}</span>
                </div>
                {worsePoints.length ? (
                  <ul className="mt-4 space-y-3">
                    {worsePoints.slice(0, 6).map((item, index) => (
                      <li
                        key={`${item.moduleType}-${item.withModuleType}-${index}`}
                        className="rounded-xl border border-rose-400/25 bg-rose-900/20 px-4 py-3"
                      >
                        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-rose-200">
                          {formatModuleType(item.moduleType)} + {formatModuleType(item.withModuleType)}
                        </p>
                        <p className="mt-2 text-xs text-rose-50/80">{item.reason}</p>
                        <span className="mt-2 inline-flex rounded-full bg-rose-500/20 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.32em] text-rose-200">
                          {item.points.toLocaleString("pt-BR")}
                          <span className="ml-1">pts</span>
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-4 text-xs text-rose-100/70">Nenhum ponto de atenção foi sinalizado.</p>
                )}
              </div>
            </div>
          ) : null}
        </section>

        <footer className="pb-8 text-center text-xs text-cyan-100/60">
          <p>
            Último relatório gerado em{" "}
            <span className="text-cyan-200/80">
              {playerLaunchStatus.lastUpdatedAt ? formatDateTime(playerLaunchStatus.lastUpdatedAt) : "--"}
            </span>
          </p>
        </footer>
      </div>
      {pdfHref && isPdfModalOpen ? (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/90 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          onClick={() => setPdfModalOpen(false)}
        >
          <div
            className="relative flex h-[90vh] w-[min(960px,95vw)] flex-col overflow-hidden rounded-3xl border border-cyan-500/30 bg-slate-900 shadow-[0_0_80px_rgba(14,165,233,0.35)]"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-end gap-3 border-b border-cyan-500/20 bg-slate-900/70 px-6 py-4">
              <a
                href={pdfHref}
                download={effectiveReport?.pdf?.fileName ?? makeReportFileName(missionConfig.name)}
                className="inline-flex items-center justify-center rounded-full border border-cyan-400/50 bg-transparent px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.32em] text-cyan-100 transition hover:border-cyan-300 hover:text-cyan-50"
              >
                Baixar PDF
              </a>
              <button
                type="button"
                onClick={() => setPdfModalOpen(false)}
                className="rounded-full border border-cyan-400/50 bg-transparent px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.32em] text-cyan-100 transition hover:border-cyan-300 hover:text-cyan-50"
              >
                Fechar
              </button>
            </div>
            <iframe
              src={pdfHref}
              title="Pré-visualização do relatório em PDF"
              className="h-full w-full flex-1 bg-slate-950"
            />
          </div>
        </div>
      ) : null}

      {isImageModalOpen && modalImage ? (
        <div
          className="fixed inset-0 z-[75] flex items-center justify-center bg-slate-950/95 backdrop-blur"
          role="dialog"
          aria-modal="true"
          onClick={() => setImageModalIndex(null)}
        >
          <div className="relative flex h-full w-full max-h-[95vh] max-w-5xl items-center justify-center p-6">
            <div className="relative h-full w-full overflow-hidden rounded-3xl border border-cyan-500/30 bg-slate-950/70 shadow-[0_0_80px_rgba(14,165,233,0.3)]">
              <Image
                src={modalImage.src}
                alt={modalImage.name}
                fill
                sizes="(max-width: 768px) 100vw, 900px"
                className="object-contain"
                unoptimized
              />
              <div className="absolute bottom-6 left-1/2 flex -translate-x-1/2 flex-col items-center gap-2 text-center text-cyan-100">
                <span className="rounded-full border border-cyan-400/40 bg-slate-900/70 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em]">
                  {modalImage.name}
                </span>
                <span className="text-[11px] uppercase tracking-[0.28em] text-cyan-200/70">
                  Toque em qualquer lugar para fechar
                </span>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
