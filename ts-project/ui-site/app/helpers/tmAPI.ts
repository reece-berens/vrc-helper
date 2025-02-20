import {createHmac} from "crypto";

import {TMAPI, TSProj} from "types-lib";

class TM_API {
	public bearerToken: string | null = "";
	public tokenExpiration: Date = new Date();
	public baseTMURL: string = "";
	public tmAPIKey: string = "";

	private expressAPIURL: string = "";
	private expressAPIUsername: string = "";
	private expressAPIPassword: string = "";

	private dataCache: TMAPI.API.DataCache;

	constructor() {
		this.expressAPIURL = process.env.NEXT_PUBLIC_API_URL || "";
		this.expressAPIUsername= process.env.NEXT_PUBLIC_API_USERNAME || "";
		this.expressAPIPassword = process.env.NEXT_PUBLIC_API_PASSWORD || "";

		this.baseTMURL = process.env.NEXT_PUBLIC_TM_URL || "";
		this.tmAPIKey = process.env.NEXT_PUBLIC_TM_API_KEY || "";

		this.dataCache = {};

		if (this.expressAPIURL === "") {
			throw "Express API URL is not defined, cannot build API object";
		}
		if (this.baseTMURL === "" || this.tmAPIKey === "") {
			throw "TM API URL and/or API Key is not defined, cannot build API object";
		}
	}

	private async MakeExpressRequest<T>(url: URL, method: "GET" | "POST"): Promise<T> {
		const request = new Request(url, {
			method: method,
		});
		if (this.expressAPIUsername !== "" && this.expressAPIPassword !== "") {
			request.headers.append("Authorization", "Basic " + btoa(`${this.expressAPIUsername}:${this.expressAPIPassword}`));
		}
		const response = await fetch(request);
		if (response.ok) {
			const jsonResult = await response.json() as T;
			return jsonResult;
		}
		else {
			const responseBody = await response.text();
			const errText = `ERROR when getting data from express API ${url.pathname} - ${response.status} ${responseBody}`
			console.error(errText);
			throw errText;
		}
	}

	private async MakeTMAPIRequest<T>(urlPath: string, method: "GET" | "POST"): Promise<T> {
		if (this.tokenExpiration < new Date()) {
			//if our cached token has expired, get a new one from the server
			await this.GetBearerToken();
		}
		if (this.bearerToken === null || this.bearerToken === "") {
			const errText = `ERROR No Bearer Token in request for TM API data, failing - ${urlPath}`;
			console.error(errText);
			throw errText;
		}
		const url = new URL(urlPath, this.baseTMURL);
		const request = new Request(url, {
			method: method,
			headers: {
				"Content-Type": "application/json"
			}
		});
		const headers = this.GetAuthHeaders(url, method);
		if (typeof this.dataCache[urlPath] !== "undefined") {
			headers.append("If-Modified-Since", this.dataCache[urlPath].LastModified);
		}
		const response = await fetch(request, {headers});
		if (response.status === 200) {
			//this is a successful response with data in it
			const resultJson = await response.json() as T;
			const lastModified = response.headers.get("Last-Modified");
			if (lastModified !== null && lastModified !== "") {
				//update the local cache with this request data
				this.dataCache[urlPath] = {
					Data: resultJson,
					LastModified: lastModified
				};
			}
			//cache the data
			return resultJson;
		}
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
		else {
			//received some unknown status from TM, show it here
			const responseText = await response.text();
			const errText = `ERROR Received unknown response from TM - ${response.status} ${responseText}`;
			console.error(errText);
			throw errText;
		}
	}

	private GetAuthHeaders(url: URL, method: "GET" | "POST"): Headers {
		//help from https://github.com/brenapp/vex-tm-client
		const tmDate = new Date().toUTCString();

		console.log(this.bearerToken);

		let stringToSign = [
		method,
		url.pathname + url.search,
			`token:${this.bearerToken}`,
			`host:${url.host}`,
			`x-tm-date:${tmDate}`
		].join("\n");
		stringToSign += "\n";

		const signature = createHmac("sha256", this.tmAPIKey)
		.update(stringToSign)
		.digest("hex");

		const headers = new Headers();
		headers.append("Authorization", `Bearer ${this.bearerToken}`)
		headers.append("x-tm-date", tmDate);
		headers.append("x-tm-signature", signature);
		headers.append("Host", url.host);

		return headers;
	}

	//Get the DWAB Bearer Token from the Express API
	//Express API will hold the client ID and secret value used to connect to DWAB server, as well as cache the Bearer Token
	private async GetBearerToken(): Promise<void> {
		const url: URL = new URL("/tm/auth", this.expressAPIURL);
		const response = await this.MakeExpressRequest<TSProj.Express.TM.Auth.Response>(url, "GET");
		this.bearerToken = response.AccessToken as string;
		this.tokenExpiration = new Date(response.ExpiresAt);
	}

	async GetDivisionList(): Promise<TMAPI.API.Divisions.Response> {
		try {
			const response = await this.MakeTMAPIRequest<TMAPI.API.Divisions.Response>("/api/divisions", "GET");
			return response;
		}
		catch (err) {
			alert("Error loading list of divisions, check console for details");
			return {
				divisions: []
			};
		}
	}

	//List of fields cannot be retrieved directly from here due to CORS policies in TM, have to go through Express server
	async GetFieldList(request: TMAPI.API.Fields.Request): Promise<TMAPI.API.Fields.Response> {
		try {
			const expressURL = new URL("/tm/local/fields", this.expressAPIURL);
			expressURL.searchParams.append("fieldSetID", request.FieldSetID.toString());
			const expressRequest = await this.MakeExpressRequest<TMAPI.API.Fields.Response>(expressURL, "GET");
			return expressRequest;
		}
		catch (err) {
			alert(`Error loading list of fields for Field Set ${request.FieldSetID}, check console for details`);
			return {
				fields: []
			};
		}
	}

	async GetFieldSetList(): Promise<TMAPI.API.FieldSets.Response> {
		try {
			const response = await this.MakeTMAPIRequest<TMAPI.API.FieldSets.Response>("/api/fieldsets", "GET");
			return response;
		}
		catch (err) {
			alert("Error loading list of field sets, check console for details");
			return {
				fieldSets: []
			};
		}
	}

	async GetEvent(): Promise<TMAPI.API.Event.Response> {
		try {
			const response = await this.MakeTMAPIRequest<TMAPI.API.Event.Response>("/api/event", "GET");
			return response;
		}
		catch (err) {
			alert("Error loading event information, check console for details");
			return {
				event: {
					name: "",
					code: ""
				}
			};
		}
	}

	//List of matches cannot be retrieved directly from here due to CORS policies in TM, have to go through Express server
	async GetMatchList(request: TMAPI.API.Matches.Request): Promise<TMAPI.API.Matches.Response> {
		try {
			const expressURL = new URL("/tm/local/matches", this.expressAPIURL);
			expressURL.searchParams.append("divisionID", request.DivisionID.toString());
			const expressRequest = await this.MakeExpressRequest<TMAPI.API.Matches.Response>(expressURL, "GET");
			return expressRequest;
		}
		catch (err) {
			alert(`Error loading list of matches for Division ${request.DivisionID}, check console for details`);
			return {
				matches: []
			};
		}
	}
}

export default TM_API;
