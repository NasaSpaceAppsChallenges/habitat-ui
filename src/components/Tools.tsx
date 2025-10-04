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
		<div className="flex gap-4 items-center flex-col sm:flex-row fixed left-0 top-0 w-80 h-200 border-2 border-gray-300 bg-transparent p-4 m-4 rounded shadow">
			<div className="flex gap-2 flex-wrap">
				{['erase', 'move', 'cut'].map((toolName) => (
					<button
						key={toolName}
						className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
						onClick={() => props.onSelectTool?.({name: toolName as ITool['name']})}
					>
						{toolName.charAt(0).toUpperCase() + toolName.slice(1)}
					</button>
				))}
			</div>
			
			
			<div className="flex gap-2">
				{assets.map((asset) => (
					<button
						key={asset.id}
						className="px-4 py-2 bg-blue-200 rounded hover:bg-blue-300"
						onClick={() => props.onSelectAsset(asset)}
					>
						{asset.type.charAt(0).toUpperCase() + asset.type.slice(1)} ({asset.remaining})
					</button>
				))}
			</div>
		</div>
	)
}