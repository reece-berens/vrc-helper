import { REAPI } from "../types-lib";

const baseURL = process.env.RE_BASE_URL || "https://www.robotevents.com/api/v2";
const bearerToken = process.env.RE_BEARER_TOKEN;

const defaultResponse: REAPI.API.ResponseBase = {
	meta: {
		current_page: 0,
		first_page_url: "",
		from: 0,
		last_page: 0,
		last_page_url: 0,
		next_page_url: 0,
		path: "",
		per_page: 0,
		prev_page_url: "",
		to: 0,
		total: 0,
	},
	data: []
};

async function GetRequest<T>(url: URL): Promise<T> {
	const request = new Request(url, {
		method: "GET",
		headers: {
			"Accept": "application/json"
		}
	});
	if (typeof bearerToken === "string" && bearerToken !== "") {
		request.headers.append("Authorization", `Bearer ${bearerToken}`);
	}
	const response = await fetch(request);
	if (response.status === 200) {
		//Data received correctly, format it as expected
		const resultJson = await response.json() as T;
		return resultJson;
	}
	else {
		//Some error occurred when receiving data, see if the json can be parsed into an error
		//If not, return the status code and some message in the error object
		var resultJson: REAPI.API.Error = await response.json() as REAPI.API.Error;
		if (typeof resultJson === "undefined" || resultJson === null || typeof resultJson.code === "undefined" || typeof resultJson.message === "undefined") {
			//Body isn't in correct form, return my version
			resultJson = {
				code: response.status,
				message: `UNHANDLED ERROR: ${response.statusText}`
			};
		}
		throw resultJson;
	}
}

//#region Event

export async function Event_List(param: REAPI.API.Event.List.Request): Promise<REAPI.API.Event.List.Response> {
	const url: URL = new URL(`/events`, baseURL);
	param.ID?.forEach(x => url.searchParams.append("id", x.toString()));
	param.SKU?.forEach(x => url.searchParams.append("sku", x));
	param.TeamID?.forEach(x => url.searchParams.append("team", x.toString()));
	param.SeasonID?.forEach(x => url.searchParams.append("season", x.toString()));
	if (param.Start instanceof Date) {
		url.searchParams.append("start", param.Start.toISOString());
	}
	if (param.End instanceof Date) {
		url.searchParams.append("end", param.End.toISOString());
	}
	if (typeof param.Region !== "undefined" && param.Region !== "") {
		url.searchParams.append("region", param.Region);
	}
	param.Level?.forEach(x => url.searchParams.append("level", x));
	param.Type?.forEach(x => url.searchParams.append("eventTypes", x));

	try {
		const fetchResponse = await GetRequest<REAPI.API.Event.List.Response>(url);
		return fetchResponse;
	}
	catch(e: any) {
		console.log("ERROR - Event.List", e);
		return {...defaultResponse};
	}
}

export async function Event_Single(param: REAPI.API.Event.Single.Request): Promise<REAPI.API.Event.Single.Response> {
	const url: URL = new URL(`/events/${param.EventID}`, baseURL);

	try {
		const fetchResponse = await GetRequest<REAPI.API.Event.Single.Response>(url);
		return fetchResponse;
	}
	catch(e: any) {
		console.log("ERROR - Event.Single", e);
		return {
			id: 0,
			sku: "",
			name: "",
			start: new Date(),
			end: new Date(),
			season: {
				code: null,
				id: 0,
				name: ""
			},
			program: {
				code: null,
				id: 0,
				name: ""
			},
			location: {
				venue: "",
				address_1: "",
				address_2: "",
				city: "",
				region: "",
				postcode: "",
				country: "",
				coordinates: {
					lat: 0,
					lon: 0
				}
			},
			locations: {},
			division: [],
			level: "Other",
			ongoing: false,
			awards_finalized: false,
			event_type: "tournament",
		};
	}
}

export async function Event_TeamsAtEvent(param: REAPI.API.Event.TeamsAtEvent.Request): Promise<REAPI.API.Event.TeamsAtEvent.Response> {
	const url: URL = new URL(`/events/${param.EventID}/teams`, baseURL);
	param.TeamNumber?.forEach(x => url.searchParams.append("number", x));
	param.TeamGrade?.forEach(x => url.searchParams.append("grade", x));
	param.TeamCountry?.forEach(x => url.searchParams.append("country", x));
	if (typeof param.TeamRegistered === "boolean") {
		url.searchParams.append("registered", param.TeamRegistered ? "true" : "false");
	}

	try {
		const fetchResponse = await GetRequest<REAPI.API.Event.TeamsAtEvent.Response>(url);
		return fetchResponse;
	}
	catch(e: any) {
		console.log("ERROR - Event.TeamsAtEvent", e);
		return {...defaultResponse};
	}
}

export async function Event_Skills(param: REAPI.API.Event.Skills.Request): Promise<REAPI.API.Event.Skills.Response> {
	const url: URL = new URL(`/events/${param.EventID}/skills`, baseURL);
	param.TeamID?.forEach(x => url.searchParams.append("team", x.toString()));
	param.SkillsType?.forEach(x => url.searchParams.append("type", x));

	try {
		const fetchResponse = await GetRequest<REAPI.API.Event.Skills.Response>(url);
		return fetchResponse;
	}
	catch(e: any) {
		console.log("ERROR - Event.Skills", e);
		return {...defaultResponse};
	}
}

export async function Event_Awards(param: REAPI.API.Event.Awards.Request): Promise<REAPI.API.Event.Awards.Response> {
	const url: URL = new URL(`/events/${param.EventID}/awards`, baseURL);
	param.TeamID?.forEach(x => url.searchParams.append("team", x.toString()));

	try {
		const fetchResponse = await GetRequest<REAPI.API.Event.Awards.Response>(url);
		return fetchResponse;
	}
	catch(e: any) {
		console.log("ERROR - Event.Awards", e);
		return {...defaultResponse};
	}
}

export async function Event_Division_Matches(param: REAPI.API.Event.DivisionMatches.Request): Promise<REAPI.API.Event.DivisionMatches.Response> {
	const url: URL = new URL(`/events/${param.EventID}/divisions/${param.DivisionID}/matches`, baseURL);
	param.TeamID?.forEach(x => url.searchParams.append("team", x.toString()));
	param.Round?.forEach(x => url.searchParams.append("round", REAPI.Objects.MatchRound[x]));

	try {
		const fetchResponse = await GetRequest<REAPI.API.Event.DivisionMatches.Response>(url);
		return fetchResponse;
	}
	catch(e: any) {
		console.log("ERROR - Event.DivisionMatches", e);
		return {...defaultResponse};
	}
}

export async function Event_Division_FinalistRankings(param: REAPI.API.Event.DivisionFinalistRankings.Request): Promise<REAPI.API.Event.DivisionFinalistRankings.Response> {
	const url: URL = new URL(`/events/${param.EventID}/divisions/${param.DivisionID}/finalistRankings`, baseURL);
	param.TeamID?.forEach(x => url.searchParams.append("team", x.toString()));
	param.Rank?.forEach(x => url.searchParams.append("rank", x.toString()));

	try {
		const fetchResponse = await GetRequest<REAPI.API.Event.DivisionFinalistRankings.Response>(url);
		return fetchResponse;
	}
	catch(e: any) {
		console.log("ERROR - Event.DivisionFinalistRanking", e);
		return {...defaultResponse};
	}
}

export async function Event_Division_Rankings(param: REAPI.API.Event.DivisionRanking.Request): Promise<REAPI.API.Event.DivisionRanking.Response> {
	const url: URL = new URL(`/events/${param.EventID}/divisions/${param.DivisionID}/rankings`, baseURL);
	param.TeamID?.forEach(x => url.searchParams.append("team", x.toString()));
	param.Rank?.forEach(x => url.searchParams.append("rank", x.toString()));

	try {
		const fetchResponse = await GetRequest<REAPI.API.Event.DivisionRanking.Response>(url);
		return fetchResponse;
	}
	catch(e: any) {
		console.log("ERROR - Event.DivisionRanking", e);
		return {...defaultResponse};
	}
}

//#endregion

//#region Teams

export async function Team_List(param: REAPI.API.Team.List.Request, urlOverride: string | undefined): Promise<REAPI.API.Team.List.Response> {
	var url: URL;
	if (typeof urlOverride === "string" && urlOverride !== "") {
		url = new URL(urlOverride);
	}
	else {
		url = new URL(`/teams`, baseURL);
		param.TeamID?.forEach(x => url.searchParams.append("id", x.toString()));
		param.TeamNumber?.forEach(x => url.searchParams.append("number", x));
		param.AttendedEventID?.forEach(x => url.searchParams.append("event", x.toString()));
		param.ProgramID?.forEach(x => url.searchParams.append("program", x.toString()));
		if (typeof param.Registered === "boolean") {
			url.searchParams.append("registered", param.Registered ? "true" : "false");
		}
		param.Grade?.forEach(x => url.searchParams.append("grade", x));
		param.Country?.forEach(x => url.searchParams.append("country", x));
	}

	try {
		const fetchResponse = await GetRequest<REAPI.API.Team.List.Response>(url);
		return fetchResponse;
	}
	catch(e: any) {
		console.log("ERROR - Team.List", e);
		return {...defaultResponse};
	}
}

export async function Team_Single(param: REAPI.API.Team.Single.Request): Promise<REAPI.API.Team.Single.Response> {
	const url: URL = new URL(`/teams/${param.TeamID}`, baseURL);

	try {
		const fetchResponse = await GetRequest<REAPI.API.Team.Single.Response>(url);
		return fetchResponse;
	}
	catch(e: any) {
		console.log("ERROR - Team.Single", e);
		return {
			id: 0,
			number: "",
			team_name: "",
			robot_name: "",
			organization: "",
			location: {
				venue: "",
				address_1: "",
				address_2: "",
				city: "",
				region: "",
				postcode: "",
				country: "",
				coordinates: {
					lat: 0,
					lon: 0
				}
			},
			registered: false,
			program: {
				id: 0,
				name: "",
				code: null
			},
			grade: "College",
		};
	}
}

export async function Team_Events(param: REAPI.API.Team.Events.Request): Promise<REAPI.API.Team.Events.Response> {
	const url: URL = new URL(`/teams/${param.TeamID}/events`, baseURL);
	param.EventSKU?.forEach(x => url.searchParams.append("sku", x));
	param.SeasonID?.forEach(x => url.searchParams.append("season", x.toString()));
	if (param.Start instanceof Date) {
		url.searchParams.append("start", param.Start.toISOString());
	}
	if (param.End instanceof Date) {
		url.searchParams.append("end", param.End.toISOString());
	}
	param.Level?.forEach(x => url.searchParams.append("level", x));

	try {
		const fetchResponse = await GetRequest<REAPI.API.Team.Events.Response>(url);
		return fetchResponse;
	}
	catch(e: any) {
		console.log("ERROR - Team.Events", e);
		return {...defaultResponse};
	}
}

export async function Team_Matches(param: REAPI.API.Team.Matches.Request): Promise<REAPI.API.Team.Matches.Response> {
	const url: URL = new URL(`/teams/${param.TeamID}/matches`, baseURL);
	param.EventID?.forEach(x => url.searchParams.append("event", x.toString()));
	param.SeasonID?.forEach(x => url.searchParams.append("season", x.toString()));
	param.Round?.forEach(x => url.searchParams.append("round", REAPI.Objects.MatchRound[x]));

	try {
		const fetchResponse = await GetRequest<REAPI.API.Team.Matches.Response>(url);
		return fetchResponse;
	}
	catch(e: any) {
		console.log("ERROR - Team.Matches", e);
		return {...defaultResponse};
	}
}

export async function Team_Rankings(param: REAPI.API.Team.Rankings.Request): Promise<REAPI.API.Team.Rankings.Response> {
	const url: URL = new URL(`/teams/${param.TeamID}/rankings`, baseURL);
	param.EventID?.forEach(x => url.searchParams.append("event", x.toString()));
	param.SeasonID?.forEach(x => url.searchParams.append("season", x.toString()));
	param.Rank?.forEach(x => url.searchParams.append("rank", x.toString()));

	try {
		const fetchResponse = await GetRequest<REAPI.API.Team.Rankings.Response>(url);
		return fetchResponse;
	}
	catch(e: any) {
		console.log("ERROR - Team.Rankings", e);
		return {...defaultResponse};
	}
}

export async function Team_Skills(param: REAPI.API.Team.Skills.Request): Promise<REAPI.API.Team.Skills.Response> {
	const url: URL = new URL(`/teams/${param.TeamID}/skills`, baseURL);
	param.EventID?.forEach(x => url.searchParams.append("event", x.toString()));
	param.SeasonID?.forEach(x => url.searchParams.append("season", x.toString()));
	param.Type?.forEach(x => url.searchParams.append("type", x));

	try {
		const fetchResponse = await GetRequest<REAPI.API.Team.Skills.Response>(url);
		return fetchResponse;
	}
	catch(e: any) {
		console.log("ERROR - Team.Skills", e);
		return {...defaultResponse};
	}
}

export async function Team_Awards(param: REAPI.API.Team.Awards.Request): Promise<REAPI.API.Team.Awards.Response> {
	const url: URL = new URL(`/teams/${param.TeamID}/awards`, baseURL);
	param.EventID?.forEach(x => url.searchParams.append("event", x.toString()));
	param.SeasonID?.forEach(x => url.searchParams.append("season", x.toString()));

	try {
		const fetchResponse = await GetRequest<REAPI.API.Team.Awards.Response>(url);
		return fetchResponse;
	}
	catch(e: any) {
		console.log("ERROR - Team.Awards", e);
		return {...defaultResponse};
	}
}

//#endregion

//#region Program

export async function Program_List(param: REAPI.API.Program.List.Request, urlOverride?: string): Promise<REAPI.API.Program.List.Response> {
	var url: URL;
	if (typeof urlOverride === "string" && urlOverride !== "") {
		url = new URL(urlOverride);
	}
	else {
		url = new URL(baseURL);
		url.pathname += "/programs";
		//url = new URL(`/programs`, baseURL);
		param.ProgramID?.forEach(x => url.searchParams.append("program", x.toString()));
	}
	
	try {
		const fetchResponse = await GetRequest<REAPI.API.Program.List.Response>(url);
		return fetchResponse;
	}
	catch(e: any) {
		console.log("ERROR - Program.List", e);
		return {...defaultResponse};
	}
}

export async function Program_Single(param: REAPI.API.Program.Single.Request, urlOverride?: string): Promise<REAPI.API.Program.Single.Response> {
	var url: URL;
	if (typeof urlOverride === "string" && urlOverride !== "") {
		url = new URL(urlOverride);
	}
	else {
		url = new URL(`/programs/${param.ProgramID}`, baseURL);
	}
	
	try {
		const fetchResponse = await GetRequest<REAPI.API.Program.Single.Response>(url);
		return fetchResponse;
	}
	catch(e: any) {
		console.log("ERROR - Program.List", e);
		return {
			id: 0,
			name: "",
			abbr: ""
		}
	}
}

//#endregion

//#region Season

export async function Season_List(param: REAPI.API.Season.List.Request, urlOverride: string | undefined): Promise<REAPI.API.Season.List.Response> {
	var url: URL;
	if (typeof urlOverride === "string" && urlOverride !== "") {
		url = new URL(urlOverride);
	}
	else {
		url = new URL(`/seasons`, baseURL);
		param.SeasonID?.forEach(x => url.searchParams.append("season", x.toString()));
		param.ProgramID?.forEach(x => url.searchParams.append("program", x.toString()));
	}
	
	try {
		const fetchResponse = await GetRequest<REAPI.API.Season.List.Response>(url);
		return fetchResponse;
	}
	catch(e: any) {
		console.log("ERROR - Season.List", e);
		return {...defaultResponse};
	}
}

export async function Season_Single(param: REAPI.API.Season.Single.Request, urlOverride: string | undefined): Promise<REAPI.API.Season.Single.Response> {
	var url: URL;
	if (typeof urlOverride === "string" && urlOverride !== "") {
		url = new URL(urlOverride);
	}
	else {
		url = new URL(`/seasoms/${param.SeasonID}`, baseURL);
	}
	
	try {
		const fetchResponse = await GetRequest<REAPI.API.Season.Single.Response>(url);
		return fetchResponse;
	}
	catch(e: any) {
		console.log("ERROR - Season.Single", e);
		return {
			id: 0,
			name: "",
			program: {
				code: "",
				name: "",
				id: 0
			},
			years_end: 0,
			years_start: 0,
			start: new Date(),
			end: new Date(),
		}
	}
}

export async function Season_Events(param: REAPI.API.Season.Events.Request, urlOverride: string | undefined): Promise<REAPI.API.Season.Events.Response> {
	var url: URL;
	if (typeof urlOverride === "string" && urlOverride !== "") {
		url = new URL(urlOverride);
	}
	else {
		url = new URL(`/seasons`, baseURL);
		param.EventSKU?.forEach(x => url.searchParams.append("sku", x));
		param.ParticipatingTeamID?.forEach(x => url.searchParams.append("team", x.toString()));
		param.Level?.forEach(x => url.searchParams.append("level", x));
		if (param.Start instanceof Date) {
			url.searchParams.append("start", param.Start.toISOString());
		}
		if (param.End instanceof Date) {
			url.searchParams.append("end", param.End.toISOString());
		}
	}
	
	try {
		const fetchResponse = await GetRequest<REAPI.API.Season.Events.Response>(url);
		return fetchResponse;
	}
	catch(e: any) {
		console.log("ERROR - Season.Events", e);
		return {...defaultResponse};
	}
}

//#endregion

export default {
	Event: {
		List: Event_List,
		Single: Event_Single,
		Teams: Event_TeamsAtEvent,
		Skills: Event_Skills,
		Awards: Event_Awards,
		Division: {
			Matches: Event_Division_Matches,
			FinalistRankings: Event_Division_FinalistRankings,
			Rankings: Event_Division_Rankings
		}
	},
	Program: {
		List: Program_List,
		Single: Program_Single
	},
	Season: {
		List: Season_List,
		Single: Season_Single,
		Events: Season_Events
	},
	Team: {
		List: Team_List,
		Single: Team_Single,
		Events: Team_Events,
		Matches: Team_Matches,
		Rankings: Team_Rankings,
		Skills: Team_Skills,
		Awards: Team_Awards
	}
};
