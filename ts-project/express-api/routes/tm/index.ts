import {Express} from "express";

import BuildAuthRoutes from "./auth";
import BuildLocalRoutes from "./local";

const BuildTMRoutes = (app: Express): void => {
	BuildAuthRoutes(app);
	BuildLocalRoutes(app);
};

export default BuildTMRoutes;
