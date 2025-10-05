import Link from "next/link";

const missionSummary = [
  { label: "Status", value: "Missão nominal" },
  { label: "Tripulação", value: "8 integrantes" },
  { label: "Energia", value: "Carga em 93%" },
];

export default function RelatoriosPage() {
  return (
    <div className="flex h-screen items-center justify-center bg-slate-950 text-cyan-50 overflow-hidden">
      <div className="relative flex h-[540px] pr-2 pl-2 w-[min(640px,88vw)] flex-col items-center justify-between rounded-[2.75rem] border border-cyan-500/25 bg-slate-900/70 px-10 py-12 text-center shadow-[0_0_80px_rgba(14,165,233,0.18)]">
        <header className="space-y-4">
          <span className="text-xs font-semibold uppercase tracking-[0.4em] text-cyan-300/70">Relatório de Missão</span>
          <h1 className="text-3xl font-bold text-white sm:text-4xl">Habitat Orbital</h1>
          <p className="text-sm text-cyan-100/80 sm:text-base">
            Telemetria consolidada confirma operação estável do habitat. Todos os módulos essenciais respondem dentro das margens
            planejadas.
          </p>
        </header>

        <section className="flex w-full flex-col gap-3">
          {missionSummary.map((item) => (
            <div
              key={item.label}
              className="flex items-center justify-between rounded-2xl border border-cyan-500/20 bg-slate-950/50 px-5 py-3 text-left text-sm text-cyan-100/85"
            >
              <span className="font-medium uppercase tracking-[0.25em] text-cyan-300/80">{item.label}</span>
              <span className="text-base font-semibold text-white">{item.value}</span>
            </div>
          ))}
        </section>

        <footer className="flex flex-col items-center gap-4 text-sm text-cyan-100/75">
          <p className="max-w-xs">
            Próximo checkpoint automático em <strong className="text-cyan-200">T+06h</strong>. Nenhuma ação manual requisitada.
          </p>
          <Link
            href="/playground"
            className="inline-flex items-center justify-center rounded-full border border-cyan-400/50 bg-cyan-500/15 px-5 py-2 text-sm font-semibold uppercase tracking-[0.35em] text-cyan-200 transition hover:border-cyan-300 hover:text-cyan-50"
          >
            Retornar ao Playground
          </Link>
        </footer>
      </div>
    </div>
  );
}
