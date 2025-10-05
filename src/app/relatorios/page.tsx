"use client";

import { useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { useAtomValue } from "jotai";

import { missionReportAtom, moduleMakerConfigAtom } from "@/app/jotai/moduleMakerConfigAtom";

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

export default function RelatoriosPage() {
  const missionReport = useAtomValue(missionReportAtom);
  const missionConfig = useAtomValue(moduleMakerConfigAtom);

  const pdfHref = useMemo(() => {
    if (!missionReport?.pdf) return null;
    return `data:${missionReport.pdf.mimeType};base64,${missionReport.pdf.base64}`;
  }, [missionReport?.pdf]);

  const galleryItems = useMemo(() => {
    if (!missionReport?.gallery?.length) return [];
    const images = missionReport.images ?? [];
    return missionReport.gallery.map((src, index) => ({
      src,
      name: images[index]?.name ?? `Imagem ${index + 1}`,
    }));
  }, [missionReport?.gallery, missionReport?.images]);

  const summary = useMemo(() => {
    const statusLabel = missionReport
      ? missionReport.status === "success"
        ? "Missão nominal"
        : "Plano reprovado"
      : "Aguardando lançamento";

    const crewSize = missionConfig.crewSize ?? 0;

    const entries = [
      { label: "Status", value: statusLabel },
      {
        label: "Pontuação",
        value: missionReport ? missionReport.score.toLocaleString("pt-BR") : "--",
      },
      {
        label: "Tripulação",
        value: crewSize > 0 ? `${crewSize} integrante${crewSize > 1 ? "s" : ""}` : "Não informado",
      },
      {
        label: "Última atualização",
        value: missionReport ? formatDateTime(missionReport.receivedAt) : "--",
      },
    ];

    return entries;
  }, [missionConfig.crewSize, missionReport]);
  const insights = missionReport?.insights ?? { negative: [], positive: [] };
  const hasInsightContent = insights.positive.length > 0 || insights.negative.length > 0;

  return (
    <div className="min-h-[100dvh] bg-slate-950 text-cyan-50 overflow-y-auto">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-10 px-4 py-16 sm:px-8">
        <header className="space-y-4 text-center">
          <span className="text-xs font-semibold uppercase tracking-[0.4em] text-cyan-300/70">Relatório de Missão</span>
          <h1 className="text-3xl font-bold text-white sm:text-4xl">{missionConfig.name || "Habitat Orbital"}</h1>
          <p className="mx-auto max-w-2xl text-sm text-cyan-100/80 sm:text-base">
            {missionReport?.message ?? "Finalize o plano de habitat no playground e lance para gerar um relatório detalhado."}
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
                <a
                  href={pdfHref}
                  download={missionReport?.pdf?.fileName ?? "relatorio-habitat.pdf"}
                  className="inline-flex items-center justify-center rounded-full border border-cyan-400/50 bg-cyan-500/15 px-5 py-2 text-sm font-semibold uppercase tracking-[0.28em] text-cyan-200 transition hover:border-cyan-300 hover:text-cyan-50"
                >
                  Baixar PDF
                </a>
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

          <div className="min-h-[180px] rounded-2xl border border-cyan-500/20 bg-slate-950/60 p-4">
            {galleryItems.length ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {galleryItems.slice(0, 6).map((item, index) => (
                  <figure
                    key={`${item.src}-${index}`}
                    className="overflow-hidden rounded-2xl border border-cyan-500/15 bg-slate-900/80"
                  >
                    <Image
                      src={item.src}
                      alt={`Pré-visualização ${index + 1} - ${item.name}`}
                      width={320}
                      height={180}
                      className="h-36 w-full object-cover"
                      unoptimized
                    />
                    <figcaption className="px-3 py-2 text-xs uppercase tracking-[0.22em] text-cyan-200/70">
                      {item.name}
                    </figcaption>
                  </figure>
                ))}
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

            {hasInsightContent ? null : (
              <span className="text-xs uppercase tracking-[0.28em] text-cyan-200/70">
                Sem insights disponíveis
              </span>
            )}
          </div>

          {hasInsightContent ? (
            <div className="grid gap-5 sm:grid-cols-2">
              <div className="rounded-2xl border border-emerald-400/35 bg-emerald-950/30 p-5">
                <div className="flex items-baseline justify-between">
                  <h3 className="text-sm font-semibold uppercase tracking-[0.3em] text-emerald-300">Pontos fortes</h3>
                  <span className="text-xs font-medium text-emerald-100/80">{insights.positive.length}</span>
                </div>
                {insights.positive.length ? (
                  <ul className="mt-4 space-y-3">
                    {insights.positive.slice(0, 6).map((item, index) => (
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
                  <span className="text-xs font-medium text-rose-100/80">{insights.negative.length}</span>
                </div>
                {insights.negative.length ? (
                  <ul className="mt-4 space-y-3">
                    {insights.negative.slice(0, 6).map((item, index) => (
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
            Último relatório gerado em <strong className="text-cyan-200">{formatDateTime(missionReport?.receivedAt)}</strong>.
            Dados simulados enquanto a API oficial está indisponível.
          </p>
        </footer>
      </div>
    </div>
  );
}
