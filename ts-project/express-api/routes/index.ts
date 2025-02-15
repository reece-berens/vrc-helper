import {Express} from "express";

import EnhancedEmcee from "./enhanced-emcee";

const BuildRoutes = (app: Express): void => {
	EnhancedEmcee(app);
}

export default BuildRoutes;
