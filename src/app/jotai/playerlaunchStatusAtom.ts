import { atom } from "jotai";

import type { LaunchMissionResponse } from "@/types/api";

export type PlayerLaunchPhase = "idle" | "launching" | "success" | "failure";

export type PlayerLaunchStatus = {
	phase: PlayerLaunchPhase;
	response: LaunchMissionResponse | null;
	lastUpdatedAt: string | null;
};

export const playerLanunchStatusAtom = atom<PlayerLaunchStatus>({
	phase: "idle",
	response: null,
	lastUpdatedAt: null,
});
