"use client";

import { FC, useMemo } from "react";

export type FloorSummary = {
  level: number;
  x: number;
  y: number;
  totalCells: number;
  paintedCells: number;
};

export type FloorSelectorProps = {
  floors: FloorSummary[];
  selectedFloorIndex: number;
  onSelectFloor: (index: number) => void;
};

const clampBarWidth = (percentage: number, paintedCells: number) => {
  if (percentage <= 0 || paintedCells <= 0) return 0;
  return Math.min(Math.max(percentage, 8), 100);
};

const formatUsageLabel = (paintedCells: number, totalCells: number) => {
  if (totalCells <= 0) return "0%";
  const percent = Math.round((paintedCells / totalCells) * 100);
  return `${percent}%`;
};

export const FloorSelector: FC<FloorSelectorProps> = ({
  floors,
  selectedFloorIndex,
  onSelectFloor,
}) => {
  const hasFloors = floors.length > 0;

  const deckContent = useMemo(
    () =>
      floors.map((floor, index) => {
        const isActive = index === selectedFloorIndex;
        const totalCells = Math.max(floor.totalCells, 0);
        const paintedCells = Math.max(floor.paintedCells, 0);
        const usagePercentage = totalCells ? Math.round((paintedCells / totalCells) * 100) : 0;
        const barWidth = clampBarWidth(usagePercentage, paintedCells);

        return (
          <button
            key={floor.level ?? index}
            type="button"
            className={`group relative flex min-w-[170px] flex-1 rounded-2xl border px-4 py-4 text-left transition duration-200 focus:outline-none focus:ring-2 focus:ring-cyan-300 sm:min-w-[200px] ${
              isActive
                ? "border-cyan-300/70 bg-cyan-500/15 text-cyan-50 shadow-inner shadow-cyan-500/30"
                : "border-cyan-500/20 bg-slate-950/70 text-cyan-100 hover:border-cyan-300/60 hover:bg-slate-900"
            }`}
            aria-pressed={isActive}
            onClick={() => onSelectFloor(index)}
          >
            <div className="flex w-full flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-widest text-cyan-200/90">
                  Level {floor.level}
                </span>
                <span className="rounded-full border border-cyan-400/40 bg-cyan-500/10 px-2 py-0.5 text-[0.6rem] font-semibold uppercase text-cyan-100">
                  {paintedCells}/{totalCells} tiles
                </span>
              </div>
              <div className="flex items-baseline gap-1 text-cyan-100">
                <span className="text-lg font-semibold leading-none">
                  {floor.x} × {floor.y}
                </span>
                <span className="text-[0.6rem] uppercase tracking-widest text-cyan-300/70">grid</span>
              </div>
              <div className="flex items-center justify-between text-[0.65rem] text-cyan-300/80">
                <span className="uppercase tracking-widest">Uso</span>
                <span className="font-semibold text-cyan-200">{formatUsageLabel(paintedCells, totalCells)}</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-slate-900/70">
                <span
                  className="block h-full rounded-full bg-gradient-to-r from-cyan-400 via-sky-400 to-emerald-400 transition-all duration-300"
                  style={{ width: `${barWidth}%` }}
                />
              </div>
            </div>
            <span className="pointer-events-none absolute inset-0 -z-10 rounded-2xl bg-gradient-to-br from-cyan-400/20 via-sky-500/10 to-transparent opacity-0 blur-sm transition duration-200 group-hover:opacity-80" />
            {isActive && (
              <span className="pointer-events-none absolute inset-0 -z-20 rounded-2xl border border-cyan-300/70 shadow-[0_0_35px_-10px_rgba(45,212,191,0.8)]" />
            )}
          </button>
        );
      }),
    [floors, onSelectFloor, selectedFloorIndex]
  );

  return (
    <div className="flex w-full flex-col gap-4 rounded-2xl border border-cyan-500/20 bg-slate-900/80 px-4 py-4">
      {hasFloors ? (
        <div className="flex w-full gap-3 overflow-x-auto pb-1 pt-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          {deckContent}
        </div>
      ) : (
        <div className="rounded-xl border border-cyan-500/20 bg-slate-950/60 px-3 py-2 text-sm text-cyan-300/80">
          Nenhum deck disponível no momento.
        </div>
      )}
    </div>
  );
};

export default FloorSelector;
