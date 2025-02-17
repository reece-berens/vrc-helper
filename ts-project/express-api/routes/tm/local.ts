import {createHmac} from "crypto";
import {Express} from "express"

import {TMAPI, TSProj} from "types-lib";

const BuildLocalRoutes = (app: Express): void => {
	app.get("/tm/local/fields", async (req, response) => {
		var request = req as TSProj.Express.Request;
		const tmLocalURL = process.env.EXPRESS_TM_LOCAL_URL || "";
		const tmLocalAPIKey = process.env.EXPRESS_TM_LOCAL_API_KEY || "";
		if (tmLocalURL === "" || tmLocalAPIKey === "") {
			response.status(500);
			response.send("Cannot load field information - invalid server configuration");
		}
		else {
			const fieldSetID = request.query["fieldSetID"];
			if (typeof fieldSetID === "string" && !isNaN(parseInt(fieldSetID))) {
				const url = new URL(`/api/fieldsets/${fieldSetID}/fields`, tmLocalURL);
				const results = await MakeTMAPIRequest<TMAPI.API.Fields.Response>(url, "GET", request._TM_Auth_Token.AccessToken, tmLocalAPIKey);
				response.json(results);
			}
			else {
				response.status(400);
				response.send("Cannot load field information - invalid field set parameter");
			}
		}
	});

	app.get("/tm/local/matches", async (req, response) => {
		var request = req as TSProj.Express.Request;
		const tmLocalURL = process.env.EXPRESS_TM_LOCAL_URL || "";
		const tmLocalAPIKey = process.env.EXPRESS_TM_LOCAL_API_KEY || "";
		if (tmLocalURL === "" || tmLocalAPIKey === "") {
			response.status(500);
			response.send("Cannot load match information - invalid server configuration");
		}
		else {
			const divisionParam = request.query["divisionID"];
			if (typeof divisionParam === "string" && !isNaN(parseInt(divisionParam))) {
				const url = new URL(`/api/matches/${divisionParam}`, tmLocalURL);
				const results = await MakeTMAPIRequest<TMAPI.API.Matches.Response>(url, "GET", request._TM_Auth_Token.AccessToken, tmLocalAPIKey);
				response.json(results);
			}
			else {
				response.status(400);
				response.send("Cannot load match information - invalid division parameter");
			}
		}
	});
}

async function MakeTMAPIRequest<T>(url: URL, method: "GET" | "POST", accessToken: string, apiKey: string): Promise<T> {
	const request = new Request(url, {
		method: method,
		headers: {
			"Content-Type": "application/json"
		}
	});
	const headers = GetAuthHeaders(url, method, accessToken, apiKey);
	/*
	Do caching on express server later
	if (typeof this.dataCache[urlPath] !== "undefined") {
		headers.append("If-Modified-Since", this.dataCache[urlPath].LastModified);
	}
	*/
	const response = await fetch(request, {headers});
	if (response.status === 200) {
		//this is a successful response with data in it
		const resultJson = await response.json() as T;
		const lastModified = response.headers.get("Last-Modified");
		if (lastModified !== null && lastModified !== "") {
			//update the local cache with this request data - do this later on express server
			/*
			this.dataCache[urlPath] = {
				Data: resultJson,
				LastModified: lastModified
			};
			*/
		}
		//cache the data
		return resultJson;
	}
	/*
	Do this on express server later
	else if (response.status === 304) {
		//data is cached, so load it from the cache
		if (typeof this.dataCache[urlPath] === "undefined") {
			const errText = `ERROR Received a 304 response but don't have cached data locally`;
			console.error(errText);
			throw errText;
		}
		else {
			return this.dataCache[urlPath].Data as T;
		}
	}
	*/
	else {
		//received some unknown status from TM, show it here
		const responseText = await response.text();
		const errText = `ERROR Received unknown response from TM - ${response.status} ${responseText}`;
		console.error(errText);
		throw errText;
	}
}

function GetAuthHeaders(url: URL, method: "GET" | "POST", accessToken: string, apiKey: string): Headers {
	//help from https://github.com/brenapp/vex-tm-client
	const tmDate = new Date().toUTCString();

	let stringToSign = [
	method,
	url.pathname + url.search,
		`token:${accessToken}`,
		`host:${url.host}`,
		`x-tm-date:${tmDate}`
	].join("\n");
	stringToSign += "\n";

	const signature = createHmac("sha256", apiKey)
	.update(stringToSign)
	.digest("hex");

	const headers = new Headers();
	headers.append("Authorization", `Bearer ${accessToken}`)
	headers.append("x-tm-date", tmDate);
	headers.append("x-tm-signature", signature);
	headers.append("Host", url.host);

	return headers;
}

export default BuildLocalRoutes;
