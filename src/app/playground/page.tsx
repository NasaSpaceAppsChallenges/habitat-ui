"use client";

import { useMemo } from "react";
import type { ComponentProps } from "react";
import { Tools } from "@/components/Tools";

type ToolsProps = ComponentProps<typeof Tools>;

export default function Page() {
  const assets = useMemo<ToolsProps["assets"]>(() => (
    [
      { type: "bedroom", quantity: 6 },
      { type: "food", quantity: 4 }
    ]
  ), []);

  const handleSelectTool: ToolsProps["onSelectTool"] = (tool) => {
    console.info("Ferramenta selecionada:", tool.name);
  };

  const handleSelectAsset: ToolsProps["onSelectAsset"] = (asset) => {
    asset.draw();
    console.info("Asset selecionado:", asset.type);
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-black">
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 opacity-25">
          <div className="h-full w-full bg-gradient-to-b from-blue-900/30 via-purple-900/20 to-black"></div>
        </div>

        <div className="stars absolute inset-0"></div>
        <div className="stars2 absolute inset-0"></div>
        <div className="stars3 absolute inset-0"></div>

        <div className="absolute -top-36 right-[-40%] h-[360px] w-[360px] rounded-full bg-fuchsia-500/25 blur-3xl animate-pulse-slow"></div>
        <div className="absolute bottom-[-140px] left-[-80px] h-[320px] w-[320px] rounded-full bg-cyan-500/15 blur-[140px] animate-pulse-slower"></div>
      </div>

      <div className="relative z-10 min-h-screen p-4 pt-20 sm:pt-24">
        <div className="mx-auto flex max-w-4xl flex-col items-center justify-center gap-6 text-center">
          <div className="bg-black/20 backdrop-blur-2xl border border-cyan-400/30 rounded-3xl p-6 sm:p-10 shadow-2xl shadow-cyan-500/10">
            <p className="text-sm uppercase tracking-[0.3em] text-cyan-200/80">NASA Lab Playground</p>
            <h1 className="mt-3 text-3xl sm:text-4xl font-semibold text-white drop-shadow-md">
              Painel de ferramentas espaciais
            </h1>
            <p className="mt-4 max-w-2xl text-base sm:text-lg text-white/70">
              Ajuste suas ferramentas de construção estelar e prepare o cenário para criar a próxima geração de
              módulos orbitais.
            </p>

            <div className="mt-8 flex justify-center">
              <Tools
                assets={assets}
                onSelectTool={handleSelectTool}
                onSelectAsset={handleSelectAsset}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
