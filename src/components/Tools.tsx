"use client"
import {FC, useMemo, useState} from "react";

interface ITool {
	name: 'erase' | 'move' | 'cut'
}

type AssetType = 'bedroom' | 'food'

interface Asset {
	type: AssetType
	quantity: number
}

interface IAsset {
	id: string
	type: AssetType
	quantity: number
	remaining: number
	goodWith: ITool[]
	badWith: ITool[]
	draw: () => void
}

export const Tools: FC<{
	assets: Asset[]
	onSelectTool: (tool: ITool) => void
	onSelectAsset: (tool: IAsset) => void
}> = props => {
	const [drawed, setDrawed] = useState<Record<AssetType, number>[]>([])
	const [activeTool, setActiveTool] = useState<ITool['name'] | null>(null)
	const [activeAssetId, setActiveAssetId] = useState<string | null>(null)

	const assets = useMemo(() => {
		if (!props.assets) return []
		return props.assets.map((asset, index) => ({
			id: `asset-${index}`,
			type: asset.type,
			quantity: asset.quantity,
			remaining: asset.quantity - (drawed[index]?.[asset.type] || 0),
			goodWith: [],
			badWith: [],
			draw: () => {
				setDrawed(prev => {
					const newDrawed = [...prev]
					if (!newDrawed[index]) {
						newDrawed[index] = {bedroom: 0, food: 0, [asset.type]: 0}
					}
					if (newDrawed[index][asset.type] < asset.quantity) {
						newDrawed[index][asset.type] += 1
					}
					return newDrawed
				})
			}
		}))
	}, [props.assets, drawed])
	return (
		<div className="flex w-full flex-col gap-4 rounded-2xl border border-cyan-500/30 bg-slate-900/80 p-4 shadow-lg sm:sticky sm:top-6 sm:w-64">
			<div className="grid w-full grid-cols-3 gap-2">
				{['erase', 'move', 'cut'].map((toolName) => (
					<button
						key={toolName}
						className={`rounded-xl border px-3 py-2 text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-cyan-400 ${
							activeTool === toolName
								? 'border-cyan-300 bg-cyan-500/25 text-cyan-100 shadow'
								: 'border-cyan-500/40 bg-slate-950/80 text-cyan-100 hover:border-cyan-300 hover:bg-slate-900'
						}`}
						onClick={() => {
							setActiveTool(toolName as ITool['name'])
							props.onSelectTool?.({name: toolName as ITool['name']})
						}}
					>
						{toolName.charAt(0).toUpperCase() + toolName.slice(1)}
					</button>
				))}
			</div>

			<div className="flex flex-wrap gap-2">
				{assets.map((asset) => (
					<button
						key={asset.id}
						disabled={asset.remaining <= 0}
						className={`flex-1 min-w-[120px] rounded-xl border px-3 py-2 text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-cyan-400 ${
							asset.remaining <= 0
								? 'cursor-not-allowed border-slate-700 bg-slate-800/70 text-slate-500'
								: activeAssetId === asset.id
									? 'border-cyan-300 bg-cyan-500/30 text-cyan-100 shadow'
									: 'border-cyan-500/30 bg-cyan-500/20 text-cyan-100 hover:border-cyan-300 hover:bg-cyan-500/30'
						}`}
						onClick={() => {
							setActiveAssetId(asset.id)
							props.onSelectAsset(asset)
						}}
					>
						{asset.type.charAt(0).toUpperCase() + asset.type.slice(1)} ({asset.remaining})
					</button>
				))}
			</div>
		</div>
	)
}