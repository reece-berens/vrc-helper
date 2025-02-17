import express = require("express");
import cors = require("cors");
import fs = require("fs");

import CacheController from "../cache-controller";
import BuildRoutes from "./routes";
import {TMAPI, TSProj} from "types-lib";

const reCache = new CacheController().ReturnCache();
const authCacheFileName = "./express-tm-token-cache.json";
var TMAuthCache: TSProj.Express.TM.Auth.Response = {
	AccessToken: "",
	ExpiresAt: new Date()
};

var port = parseInt(process.env.EXPRESS_PORT || "");
if (isNaN(port)) {
	port = 7862;
}

var auth_username = process.env.EXPRESS_AUTH_USERNAME || "";
var auth_password = process.env.EXPRESS_AUTH_PASSWORD || "";
var auth_b64 = "";
if (auth_username !== "" && auth_password !== "") {
	auth_b64 = btoa(`${auth_username}:${auth_password}`);
	//console.log(auth_b64);
}

//process to get Bearer Token from DWAB authentication site
const CacheBearerToken = async (): Promise<void> => {
	console.log("starting CacheBearerToken");
	const clientID = process.env.EXPRESS_TM_AUTH_CLIENT_ID || "";
	const clientSecret = process.env.EXPRESS_TM_AUTH_CLIENT_SECRET || "";
	if (clientID === "" || clientSecret === "") {
		throw "Cannot generate TM Bearer Token - invalid client information";
	}
	else {
		const myRequest = new Request("https://auth.vextm.dwabtech.com/oauth2/token", {
			method: "POST",
			body: new URLSearchParams({
				client_id: clientID,
				client_secret: clientSecret,
				grant_type: "client_credentials",
			})
		});
		const fetchResponse = await fetch(myRequest);
		if (fetchResponse.ok) {
			const json = await fetchResponse.json() as TMAPI.TokenResponse;
			const expiresDate = new Date();
			expiresDate.setSeconds(new Date().getSeconds() + (json.expires_in * .9));
			TMAuthCache = {
				AccessToken: json.access_token,
				ExpiresAt: expiresDate
			};
			fs.writeFileSync(authCacheFileName, JSON.stringify(TMAuthCache), {encoding: "utf-8"});
		}
		else {
			const errText = await fetchResponse.text();
			const errMsg = `ERROR getting new token from server - ${fetchResponse.status} ${errText}`
			console.error(errMsg);
			throw errMsg;
		}
	}
}

//Get Bearer Token from file (if it exists)
console.log("starting to try and read cache");
try {
	const tokenCacheContents = fs.readFileSync(authCacheFileName, {encoding: "utf-8"});
	TMAuthCache = JSON.parse(tokenCacheContents);
	console.log("Found and read auth cache file");
}
catch (tokenCacheError) {
	console.log("TM Auth cache doesn't exist yet, get it now");
	CacheBearerToken();
}

const app = express();
app.use(cors());

app.use(async (request, response, next) => {
	console.log(`New request to ${request.path}`);
	const requestAuth = request.header("Authorization") || "";
	if (auth_b64 === "" || requestAuth === `Basic ${auth_b64}`) {
		//if we don't have authorization turned on or the authorization values match, continue to the route
		var newRequest = request as TSProj.Express.Request;
		newRequest._RE_Cache = reCache;

		if (TMAuthCache === null || new Date() > TMAuthCache.ExpiresAt) {
			//cache has expired or doesn't exist, get a new one
			console.log(`Getting a new cached bearer token from DWAB - ${new Date().toUTCString()}`);
			await CacheBearerToken();
		}
		//if we get this far, we know the cache has been set correctly, so safe to ignore the null option
		newRequest._TM_Auth_Token = TMAuthCache as TSProj.Express.TM.Auth.Response;

		next();
	}
	else {
		//failed authorization when enabled, set status code of Unauthorized and exit out
		console.log(`failed request received - ${requestAuth}`);
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

BuildRoutes(app);

app.listen(port, () => {
	console.log(`Express API listening on port ${port}`);
});
