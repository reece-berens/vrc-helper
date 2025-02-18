import {Express} from "express";
import MatchTeamRoutes from "./match-teams";
import PSRRoutes from "./PSR";

//combine all enhanced-emcee routes into this one method below
const BuildEnhancedEmceeRoutes = (app: Express): void => {
	MatchTeamRoutes(app);
	PSRRoutes(app);
};

export default BuildEnhancedEmceeRoutes;
