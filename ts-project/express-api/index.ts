import express = require("express");
import cors = require("cors");

import CacheController from "../cache-controller";
import EnhancedEmceeRoutes from "./routes/enhanced-emcee";
import {TSProj} from "types-lib";

const reCache = new CacheController().ReturnCache();

var port = parseInt(process.env.EXPRESS_PORT || "");
if (isNaN(port)) {
	port = 7862;
}

var auth_username = process.env.EXPRESS_AUTH_USERNAME || "";
var auth_password = process.env.EXPRESS_AUTH_PASSWORD || "";
var auth_b64 = "";
if (auth_username !== "" && auth_password !== "") {
	auth_b64 = btoa(`${auth_username}:${auth_password}`);
	console.log(auth_b64);
}

const app = express();
app.use(cors());

app.use((request, response, next) => {
	console.log(`New request to ${request.path}`);
	const requestAuth = request.header("Authorization") || "";
	console.log(requestAuth);
	if (auth_b64 === "" || requestAuth === `Basic ${auth_b64}`) {
		//if we don't have authorization turned on or the authorization values match, continue to the route
		var newRequest = request as TSProj.Express.Request;
		newRequest._RE_Cache = reCache;
		next();
	}
	else {
		//failed authorization when enabled, set status code of Unauthorized and exit out
		response.status(401).send("Invalid Authorization header");
	}
});

//configure all routes that need to be used here
app.get("/", (request, response) => {
	if (request.header("Accept") === "application/json") {
		response.json([]);
	}
	else {
		response.send("<!DOCTYPE html><html><body><h1>Hello from express</h1></body></html>");
	}
});

EnhancedEmceeRoutes(app);

app.listen(port, () => {
	console.log(`Express API listening on port ${port}`);
});
