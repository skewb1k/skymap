import type { Body } from "astronomy-engine";

type Planet = {
	id: string;
	body: Body;
	radius: number;
	color: string;
};

export default Planet;
