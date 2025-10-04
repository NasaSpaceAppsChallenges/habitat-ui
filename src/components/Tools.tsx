"use client";

import { FC, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

const toolNames = ["erase", "move"] as const;
type ToolName = (typeof toolNames)[number];

interface ITool {
	name: ToolName;
}

type AssetType = "bedroom" | "food";

interface Asset {
	type: AssetType;
	quantity: number;
}

interface IAsset {
	id: string;
	type: AssetType;
	quantity: number;
	remaining: number;
	goodWith: ITool[];
	badWith: ITool[];
	draw: () => void;
}

type IconProps = {
	className?: string;
};

const EraseIcon: FC<IconProps> = ({ className }) => (
	<svg
		className={className}
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
		strokeWidth={1.8}
		strokeLinecap="round"
		strokeLinejoin="round"
		aria-hidden="true"
	>
		<path d="M3 12.5 11.5 4a2 2 0 0 1 2.83 0l5.67 5.66a2 2 0 0 1 0 2.83L13 19.5H7.5L3 15Z" />
		<path d="M2 20h12" />
	</svg>
);

const MoveIcon: FC<IconProps> = ({ className }) => (
	<svg
		className={className}
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
		strokeWidth={1.8}
		strokeLinecap="round"
		strokeLinejoin="round"
		aria-hidden="true"
	>
		<path d="M12 5v14" />
		<path d="M5 12h14" />
		<polyline points="9 8 12 5 15 8" />
		<polyline points="9 16 12 19 15 16" />
		<polyline points="8 9 5 12 8 15" />
		<polyline points="16 9 19 12 16 15" />
	</svg>
);

const ChevronIcon: FC<IconProps & { direction?: "up" | "down" }> = ({ className, direction = "down" }) => (
	<svg
		className={className}
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
		strokeWidth={1.8}
		strokeLinecap="round"
		strokeLinejoin="round"
		aria-hidden="true"
	>
		{direction === "down" ? <path d="m6 9 6 6 6-6" /> : <path d="m6 15 6-6 6 6" />}
	</svg>
);

const DockIcon: FC<IconProps & { dockedBottom: boolean }> = ({ className, dockedBottom }) => (
	<svg
		className={className}
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
		strokeWidth={1.8}
		strokeLinecap="round"
		strokeLinejoin="round"
		aria-hidden="true"
	>
		<rect x="4" y="4" width="16" height="16" rx="3" ry="3" />
		{dockedBottom ? <path d="M8 9h8m-8 3h8" /> : <path d="M8 15h8m-8-3h8" />}
		{dockedBottom ? <path d="M8 17h8" /> : <path d="M8 7h8" />}
	</svg>
);

const BedroomIcon: FC<IconProps> = ({ className }) => (
	<svg
		className={className}
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
		strokeWidth={1.7}
		strokeLinecap="round"
		strokeLinejoin="round"
		aria-hidden="true"
	>
		<path d="M4 10h16" />
		<path d="M4 14h16" />
		<path d="M6 10V8a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" />
		<path d="M18 10V8a2 2 0 0 0-2-2h-2" />
		<path d="M4 18v-4" />
		<path d="M20 18v-4" />
	</svg>
);

const FoodIcon: FC<IconProps> = ({ className }) => (
	<svg
		className={className}
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
		strokeWidth={1.7}
		strokeLinecap="round"
		strokeLinejoin="round"
		aria-hidden="true"
	>
		<path d="M12 7c-2.5 0-4 2-4 4.5v5.5h8v-5.5C16 9 14.5 7 12 7Z" />
		<path d="M9 7a3 3 0 0 1 3-3" />
		<path d="M15 4s.5 2.5-1 3.5" />
	</svg>
);

const DefaultModuleIcon: FC<IconProps> = ({ className }) => (
	<svg
		className={className}
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
		strokeWidth={1.7}
		strokeLinecap="round"
		strokeLinejoin="round"
		aria-hidden="true"
	>
		<rect x="6" y="6" width="12" height="12" rx="3" />
	</svg>
);

const assetColorMap: Record<AssetType, string> = {
	bedroom: "#38bdf8",
	food: "#f97316",
};

const TOOL_CONFIG: Record<ToolName, { label: string; icon: FC<IconProps> }> = {
	erase: { label: "Erase", icon: EraseIcon },
	move: { label: "Move", icon: MoveIcon },
};

const MODULE_ICON_CONFIG: Partial<Record<AssetType, { icon: FC<IconProps>; label: string }>> = {
	bedroom: { icon: BedroomIcon, label: "Bedroom" },
	food: { icon: FoodIcon, label: "Food" },
};

const formatLabel = (value: string) =>
	value
		.split(/[_\s]/)
		.filter(Boolean)
		.map((part) => part.charAt(0).toUpperCase() + part.slice(1))
		.join(" ");

export const Tools: FC<{
	assets: Asset[];
	onSelectTool: (tool: ITool) => void;
	onSelectAsset: (tool: IAsset) => void;
}> = ({ assets: incomingAssets, onSelectTool, onSelectAsset }) => {
	const [drawed, setDrawed] = useState<Record<AssetType, number>[]>([]);
	const [activeTool, setActiveTool] = useState<ToolName | null>(null);
	const [activeAssetId, setActiveAssetId] = useState<string | null>(null);
			const [isMobileExpanded, setIsMobileExpanded] = useState(true);
	const [isDockedBottom, setIsDockedBottom] = useState(false);

	const assets = useMemo(() => {
		if (!incomingAssets) return [];
		return incomingAssets.map((asset, index) => ({
			id: `asset-${index}`,
			type: asset.type,
			quantity: asset.quantity,
			remaining: asset.quantity - (drawed[index]?.[asset.type] || 0),
			goodWith: [],
			badWith: [],
			draw: () => {
				setDrawed((prev) => {
					const next = [...prev];
					if (!next[index]) {
						next[index] = { bedroom: 0, food: 0, [asset.type]: 0 };
					}
					if (next[index][asset.type] < asset.quantity) {
						next[index][asset.type] += 1;
					}
					return next;
				});
			},
		}));
	}, [incomingAssets, drawed]);

	const handleSelectTool = (toolName: ToolName) => {
		setActiveTool(toolName);
		onSelectTool?.({ name: toolName });
	};

	const handleSelectAsset = (asset: IAsset) => {
		setActiveAssetId(asset.id);
		onSelectAsset(asset);
	};

	const renderToolButtons = (variant: "desktop" | "mobile") =>
		toolNames.map((toolName) => {
			const { label, icon: Icon } = TOOL_CONFIG[toolName];
			const isActive = activeTool === toolName;
			const baseClass =
				variant === "desktop"
					? "flex items-center justify-center gap-2 rounded-xl border px-3 py-2 text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-cyan-400"
					  : "flex h-10 w-10 items-center justify-center rounded-2xl border text-cyan-100 transition focus:outline-none focus:ring-2 focus:ring-cyan-300";
			const stateClass = isActive
				? "border-cyan-300 bg-cyan-500/25 text-cyan-100 shadow"
				: "border-cyan-500/40 bg-slate-950/80 text-cyan-100 hover:border-cyan-300 hover:bg-slate-900";

			return (
				<button
					key={toolName}
					type="button"
					className={`${baseClass} ${stateClass}`}
					onClick={() => handleSelectTool(toolName)}
					title={label}
					aria-label={label}
				>
					<Icon className={variant === "desktop" ? "h-4 w-4" : "h-5 w-5"} />
					{variant === "desktop" && <span>{label}</span>}
				</button>
			);
		});

		const renderAssetButtons = (variant: "desktop" | "mobile") =>
			assets.map((asset) => {
			const isActive = activeAssetId === asset.id;
			const color = assetColorMap[asset.type] ?? "#22d3ee";
			const iconConfig = MODULE_ICON_CONFIG[asset.type] ?? {
				icon: DefaultModuleIcon,
				label: formatLabel(asset.type),
			};
			const { icon: ModuleIcon, label } = iconConfig;
			const formattedLabel = label ?? formatLabel(asset.type);

			if (variant === "desktop") {
				return (
					<button
						key={asset.id}
						type="button"
						disabled={asset.remaining <= 0}
						className={`flex min-w-[120px] flex-1 items-center justify-center gap-2 rounded-xl border px-3 py-2 text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-cyan-400 ${
							asset.remaining <= 0
								? "cursor-not-allowed border-slate-700 bg-slate-800/70 text-slate-500"
								: isActive
								? "border-cyan-300 bg-cyan-500/30 text-cyan-100 shadow"
								: "border-cyan-500/30 bg-cyan-500/20 text-cyan-100 hover:border-cyan-300 hover:bg-cyan-500/30"
						}`}
						onClick={() => handleSelectAsset(asset)}
						title={`${formattedLabel} (${asset.remaining})`}
					>
						<ModuleIcon className="h-4 w-4" />
						<span>
							{formattedLabel} ({asset.remaining})
						</span>
					</button>
				);
			}

			return (
				<button
					key={asset.id}
					type="button"
					disabled={asset.remaining <= 0}
					  className={`relative flex h-10 w-10 items-center justify-center rounded-2xl border text-cyan-100 transition focus:outline-none focus:ring-2 focus:ring-cyan-300 ${
						asset.remaining <= 0
							? "cursor-not-allowed border-slate-700 bg-slate-800/70 text-slate-500"
							: isActive
							? "border-cyan-300 bg-cyan-500/25 shadow"
							: "border-cyan-500/40 bg-slate-950/80 hover:border-cyan-300 hover:bg-slate-900"
					}`}
					style={
						asset.remaining > 0
							? { boxShadow: isActive ? `0 0 0 1px ${color}` : undefined }
							: undefined
					}
					onClick={() => handleSelectAsset(asset)}
					title={`${formattedLabel} (${asset.remaining})`}
					aria-label={`${formattedLabel} (${asset.remaining})`}
				>
					  <ModuleIcon className="h-5 w-5" />
					<span className="sr-only">{formattedLabel}</span>
					<span
						className={`absolute -top-1 -right-1 flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-slate-900/90 px-1 text-[0.65rem] font-semibold text-cyan-100 shadow ${
							asset.remaining <= 0 ? "opacity-40" : "" }
						`}
					>
						{Math.max(asset.remaining, 0)}
					</span>
				</button>
			);
		});

	return (
		<>
			<div className="hidden w-full flex-col gap-4 rounded-2xl border border-cyan-500/30 bg-slate-900/80 p-4 shadow-lg sm:sticky sm:top-6 sm:flex sm:w-64">
				<div className="grid w-full grid-cols-2 gap-2">{renderToolButtons("desktop")}</div>

				<div className="flex flex-wrap gap-2">{renderAssetButtons("desktop")}</div>
			</div>

			<div
				className={`sm:hidden fixed left-4 z-50 flex flex-col items-center gap-3 bottom-12`}
			>

				<AnimatePresence>
					{isMobileExpanded && (
						<motion.div
							key="tools-panel"
							initial={{ opacity: 0, x: -16 }}
							animate={{ opacity: 1, x: 0 }}
							exit={{ opacity: 0, x: -16 }}
							transition={{ duration: 0.18, ease: "easeOut" }}
											className="flex w-[3.25rem] flex-col items-center rounded-3xl border border-cyan-500/30 bg-slate-900/95 py-2.5 shadow-2xl backdrop-blur"
						>
											<div className="flex flex-col items-center gap-1.5 px-1.5">
								{renderToolButtons("mobile")}
							</div>
											<div className="mt-2 h-px w-[56%] bg-cyan-500/20" />
											<div className="relative mt-2 w-full px-1.5 pb-1.5">
												<div className="max-h-[60vh] overflow-y-auto pb-1 pr-0.5">
													<div className="flex flex-col items-center gap-1.5">
										{renderAssetButtons("mobile")}
									</div>
								</div>
							</div>
						</motion.div>
					)}
				</AnimatePresence>
				<div className="flex flex-col gap-2">
					<button
						type="button"
						className="flex h-11 w-11 items-center justify-center rounded-full border border-cyan-500/60 bg-slate-900/90 text-cyan-100 shadow-lg backdrop-blur transition hover:border-cyan-300"
						onClick={() => setIsMobileExpanded((prev) => !prev)}
						aria-label={isMobileExpanded ? "Ocultar ferramentas" : "Mostrar ferramentas"}
								>
									<ChevronIcon className={`h-4 w-4 transition-transform ${isMobileExpanded ? "rotate-180" : ""}`} />
					</button>
				</div>
			</div>
		</>
	);
};