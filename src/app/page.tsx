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
import '@leandrodasilva/welcome-page/description-step';
import {WelcomePage} from '@leandrodasilva/welcome-page';
import {useRouter} from "next/navigation";

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
	const handleSubmit = (e: Event) => {
		console.log("form-submit event:", e);
		router.push('/playground');
	}
  return (
		<Widget
			className="welcome-page"
			submit={handleSubmit}
		/>
	)
}
