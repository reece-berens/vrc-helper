import {Express} from "express";
import RegionRoutes from "./PSR";

//combine all enhanced-emcee routes into this one method below
const BuildEnhancedEmceeRoutes = (app: Express): void => {
	RegionRoutes(app);
};

export default BuildEnhancedEmceeRoutes;
