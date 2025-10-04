"use client";

import React from "react";
import {createComponent} from '@lit/react';
import {WelcomePage} from '@leandrodasilva/welcome-page';

const Widget = createComponent({
	tagName: 'welcome-page',
	elementClass: WelcomePage,
	react: React,
	events: {
		onactivate: 'activate',
		onchange: 'change',
	},
});

export default function Home() {
  return <Widget/>
}
