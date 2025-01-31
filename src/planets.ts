import { Body } from "astronomy-engine";
import type Planet from "./types/Planet.type";

export const planets: Planet[] = [
	{
		id: "mer",
		body: Body.Mercury,
		// radius: 3,
		radius: 1,
		color: "#b0b0b0",
	},
	{
		id: "ven",
		body: Body.Venus,
		// radius: 7.5,
		radius: 1,
		color: "#ffffe0",
	},
	{
		id: "mar",
		body: Body.Mars,
		// radius: 4,
		radius: 1,
		color: "#ff4500",
	},
	{
		id: "jup",
		body: Body.Jupiter,
		// radius: 88,
		radius: 4,
		color: "#e3a869",
	},
	{
		id: "sat",
		body: Body.Saturn,
		// radius: 32,
		radius: 3.5,
		color: "#66ccff",
	},
	{
		id: "nep",
		body: Body.Neptune,
		// radius: 30,
		radius: 2.2,
		color: "#3366cc",
	},
];
