"use client";
import "./page.module.css"
import React from "react";
import {createComponent} from '@lit/react';
import '@leandrodasilva/welcome-page/slider-astrounauts';
import '@leandrodasilva/welcome-page/mission-step';
import '@leandrodasilva/welcome-page/moon-icon';
import '@leandrodasilva/welcome-page/mars-icon';
import '@leandrodasilva/welcome-page/play-button';
import '@leandrodasilva/welcome-page/astronauts-step';
import '@leandrodasilva/welcome-page/floating-in-space';
import '@leandrodasilva/welcome-page/splash-screen';
import '@leandrodasilva/welcome-page/description-step';
import {WelcomePage} from '@leandrodasilva/welcome-page';
import {useRouter} from "next/navigation";
import {useAtom} from "jotai/index";
import {moduleMakerConfigAtom} from "@/app/jotai/moduleMakerConfigAtom";

const Widget = createComponent({
	tagName: 'welcome-page',
	elementClass: WelcomePage,
	react: React,
	events: {
		submit: 'form-submit',
	},
});

export default function Home() {
	const router = useRouter();
	const [, setConfig] = useAtom(moduleMakerConfigAtom);
	const handleSubmit = async (e: Event) => {
		console.log("form-submit event:", e);
		const fields = (e as CustomEvent).detail as {
			missionName: 'moon' | 'mars';
			playerName: string;
			missionDescription: string;
			astronautsQuantity: number;
			missionTitle: string;
		};
		const resp = await fetch("https://nsa2025.linkai.me/api/mission/create", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				destination: fields.missionName,
				architect_name: fields.playerName,
				name: fields.missionTitle,
				description: fields.missionDescription,
				crew_size: fields.astronautsQuantity,
			}),
		})
		if (resp.ok) {
			const data = await resp.json();
			console.log("Mission created:", data);
			setConfig(data);
			router.push(`/playground`);
		}
		// router.push('/playground');
	}
  return (
		<Widget
			className="welcome-page"
			submit={handleSubmit}
		/>
	)
}
