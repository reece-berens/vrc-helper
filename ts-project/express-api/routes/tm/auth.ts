import {Express} from "express"

import {TSProj} from "types-lib";

const BuildAuthRoutes = (app: Express): void => {
	app.get("/tm/auth", async (req, response) => {
		var request = req as TSProj.Express.Request;
		if (typeof request._TM_Auth_Token === "undefined") {
			response.statusCode = 500;
			response.send("Bearer token has not been cached");
		}
		else {
			response.send(request._TM_Auth_Token);
		}
	});
}

export default BuildAuthRoutes;
