import {Express} from "express";

import EnhancedEmcee from "./enhanced-emcee";
import TM from "./tm";

const BuildRoutes = (app: Express): void => {
	EnhancedEmcee(app);
	TM(app);
}

export default BuildRoutes;
