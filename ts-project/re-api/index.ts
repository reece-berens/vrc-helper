import { REAPI } from "../types-lib";

const baseURL = process.env.RE_BASE_URL || "https://www.robotevents.com/api/v2";
const bearerToken = process.env.RE_BEARER_TOKEN;

//https://stackoverflow.com/a/33292942
async function Timeout(ms: number): Promise<void> {
	return new Promise(resolve => setTimeout(resolve, ms));
}

async function GetRequest<T>(url: URL): Promise<T | REAPI.API.Error> {
	await Timeout(1500); //being a good steward of the API and not making requests one right after the other
	console.log(`New Request in API - ${url}`);
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
		return resultJson;
	}
}

export function ValidResponse<T>(item: (T | REAPI.API.Error)): item is T {
	const item_err = item as REAPI.API.Error;
	if (typeof item_err.code === "number" && typeof item_err.message === "string") {
		return false;
	}
	else {
		return true;
	}
}

async function DoLogic<T, U>(urlPath: string, requestParam: T | null, requestPopulatorFunction: ((requestParam: T | null, url: URL) => void), urlOverride?: string): Promise<U | REAPI.API.Error> {
	var url: URL;
	if (typeof urlOverride === "string" && urlOverride !== "") {
		url = new URL(urlOverride);
	}
	else {
		url = new URL(baseURL);
		url.pathname += urlPath;
		requestPopulatorFunction(requestParam, url);
	}
	const fetchResponse = await GetRequest<U>(url);
	return fetchResponse;
	
}

//#region Event

export const Event_List = async (param: REAPI.API.Event.List.Request | null, urlOverride?: string): Promise<REAPI.API.Event.List.Response | REAPI.API.Error> => {
	const requestPopulator = (param: REAPI.API.Event.List.Request | null, url: URL) => {
		if (param !== null) {
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
		}
	}

	const returnVal = await DoLogic<REAPI.API.Event.List.Request, REAPI.API.Event.List.Response>(`/events`, param, requestPopulator, urlOverride);
	return returnVal;
}

export const Event_Single = async (param: REAPI.API.Event.Single.Request): Promise<REAPI.API.Event.Single.Response | REAPI.API.Error> => {
	const requestPopulator = (param: REAPI.API.Event.Single.Request | null, url: URL) => {
		
	}

	const returnVal = await DoLogic<REAPI.API.Event.Single.Request, REAPI.API.Event.Single.Response>(`/events/${param?.EventID}`, param, requestPopulator);
	return returnVal;
}

export const Event_TeamsAtEvent = async (param: REAPI.API.Event.TeamsAtEvent.Request | null, urlOverride?: string): Promise<REAPI.API.Event.TeamsAtEvent.Response | REAPI.API.Error> => {
	const requestPopulator = (param: REAPI.API.Event.TeamsAtEvent.Request | null, url: URL) => {
		if (param !== null) {
			param.TeamNumber?.forEach(x => url.searchParams.append("number", x));
			param.TeamGrade?.forEach(x => url.searchParams.append("grade", x));
			param.TeamCountry?.forEach(x => url.searchParams.append("country", x));
			if (typeof param.TeamRegistered === "boolean") {
				url.searchParams.append("registered", param.TeamRegistered ? "true" : "false");
			}
		}
	}

	const returnVal = await DoLogic<REAPI.API.Event.TeamsAtEvent.Request, REAPI.API.Event.TeamsAtEvent.Response>(`/events/${param?.EventID}/teams`, param, requestPopulator, urlOverride);
	return returnVal;
}

export const Event_Skills = async (param: REAPI.API.Event.Skills.Request | null, urlOverride?: string): Promise<REAPI.API.Event.Skills.Response | REAPI.API.Error> => {
	const requestPopulator = (param: REAPI.API.Event.Skills.Request | null, url: URL) => {
		if (param !== null) {
			param.TeamID?.forEach(x => url.searchParams.append("team", x.toString()));
			param.SkillsType?.forEach(x => url.searchParams.append("type", x));
		}
	}

	const returnVal = await DoLogic<REAPI.API.Event.Skills.Request, REAPI.API.Event.Skills.Response>(`/events/${param?.EventID}/skills`, param, requestPopulator, urlOverride);
	return returnVal;
}

export const Event_Awards = async (param: REAPI.API.Event.Awards.Request | null, urlOverride?: string): Promise<REAPI.API.Event.Awards.Response | REAPI.API.Error> => {
	const requestPopulator = (param: REAPI.API.Event.Awards.Request | null, url: URL) => {
		if (param !== null) {
			param.TeamID?.forEach(x => url.searchParams.append("team", x.toString()));
		}
	}

	const returnVal = await DoLogic<REAPI.API.Event.Awards.Request, REAPI.API.Event.Awards.Response>(`/events/${param?.EventID}/awards`, param, requestPopulator, urlOverride);
	return returnVal;
}

export const Event_Division_Matches = async (param: REAPI.API.Event.DivisionMatches.Request | null, urlOverride?: string): Promise<REAPI.API.Event.DivisionMatches.Response | REAPI.API.Error> => {
	const requestPopulator = (param: REAPI.API.Event.DivisionMatches.Request | null, url: URL) => {
		if (param !== null) {
			param.TeamID?.forEach(x => url.searchParams.append("team", x.toString()));
			param.Round?.forEach(x => url.searchParams.append("round", REAPI.Objects.MatchRound[x]));
		}
	}

	const returnVal = await DoLogic<REAPI.API.Event.DivisionMatches.Request, REAPI.API.Event.DivisionMatches.Response>(`/events/${param?.EventID}/divisions/${param?.DivisionID}/matches`, param, requestPopulator, urlOverride);
	return returnVal;
}

export const Event_Division_FinalistRankings = async (param: REAPI.API.Event.DivisionFinalistRankings.Request | null, urlOverride?: string): Promise<REAPI.API.Event.DivisionFinalistRankings.Response | REAPI.API.Error> => {
	const requestPopulator = (param: REAPI.API.Event.DivisionFinalistRankings.Request | null, url: URL) => {
		if (param !== null) {
			param.TeamID?.forEach(x => url.searchParams.append("team", x.toString()));
			param.Rank?.forEach(x => url.searchParams.append("rank", x.toString()));
		}
	}

	const returnVal = await DoLogic<REAPI.API.Event.DivisionFinalistRankings.Request, REAPI.API.Event.DivisionFinalistRankings.Response>(`/events/${param?.EventID}/divisions/${param?.DivisionID}/finalistRankings`, param, requestPopulator, urlOverride);
	return returnVal;
}

export const Event_Division_Rankings = async (param: REAPI.API.Event.DivisionRanking.Request | null, urlOverride?: string): Promise<REAPI.API.Event.DivisionRanking.Response | REAPI.API.Error> => {
	const requestPopulator = (param: REAPI.API.Event.DivisionRanking.Request | null, url: URL) => {
		if (param !== null) {
			param.TeamID?.forEach(x => url.searchParams.append("team", x.toString()));
			param.Rank?.forEach(x => url.searchParams.append("rank", x.toString()));
		}
	}

	const returnVal = await DoLogic<REAPI.API.Event.DivisionRanking.Request, REAPI.API.Event.DivisionRanking.Response>(`/events/${param?.EventID}/divisions/${param?.DivisionID}/rankings`, param, requestPopulator, urlOverride);
	return returnVal;
}

//#endregion

//#region Teams

export const Team_List = async (param: REAPI.API.Team.List.Request | null, urlOverride?: string): Promise<REAPI.API.Team.List.Response | REAPI.API.Error> => {
	const requestPopulator = (param: REAPI.API.Team.List.Request | null, url: URL) => {
		if (param !== null) {
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
	}

	const returnVal = await DoLogic<REAPI.API.Team.List.Request, REAPI.API.Team.List.Response>(`/teams`, param, requestPopulator, urlOverride);
	return returnVal;
}

export const Team_Single = async (param: REAPI.API.Team.Single.Request): Promise<REAPI.API.Team.Single.Response | REAPI.API.Error> => {
	const requestPopulator = (param: REAPI.API.Team.Single.Request | null, url: URL) => {
		
	}

	const returnVal = await DoLogic<REAPI.API.Team.Single.Request, REAPI.API.Team.Single.Response>(`/teams/${param?.TeamID}`, param, requestPopulator);
	return returnVal;
}

export const Team_Events = async (param: REAPI.API.Team.Events.Request | null, urlOverride?: string): Promise<REAPI.API.Team.Events.Response | REAPI.API.Error> => {
	const requestPopulator = (param: REAPI.API.Team.Events.Request | null, url: URL) => {
		if (param !== null) {
			param.EventSKU?.forEach(x => url.searchParams.append("sku", x));
			param.SeasonID?.forEach(x => url.searchParams.append("season", x.toString()));
			if (param.Start instanceof Date) {
				url.searchParams.append("start", param.Start.toISOString());
			}
			if (param.End instanceof Date) {
				url.searchParams.append("end", param.End.toISOString());
			}
			param.Level?.forEach(x => url.searchParams.append("level", x));
		}
	}

	const returnVal = await DoLogic<REAPI.API.Team.Events.Request, REAPI.API.Team.Events.Response>(`/teams/${param?.TeamID}/events`, param, requestPopulator, urlOverride);
	return returnVal;
}

export const Team_Matches = async (param: REAPI.API.Team.Matches.Request | null, urlOverride?: string): Promise<REAPI.API.Team.Matches.Response | REAPI.API.Error> => {
	const requestPopulator = (param: REAPI.API.Team.Matches.Request | null, url: URL) => {
		if (param !== null) {
			param.EventID?.forEach(x => url.searchParams.append("event", x.toString()));
			param.SeasonID?.forEach(x => url.searchParams.append("season", x.toString()));
			param.Round?.forEach(x => url.searchParams.append("round", REAPI.Objects.MatchRound[x]));
		}
	}

	const returnVal = await DoLogic<REAPI.API.Team.Matches.Request, REAPI.API.Team.Matches.Response>(`/teams${param?.TeamID}/matches`, param, requestPopulator, urlOverride);
	return returnVal;
}

export const Team_Rankings = async (param: REAPI.API.Team.Rankings.Request | null, urlOverride?: string): Promise<REAPI.API.Team.Rankings.Response | REAPI.API.Error> => {
	const requestPopulator = (param: REAPI.API.Team.Rankings.Request | null, url: URL) => {
		if (param !== null) {
			param.EventID?.forEach(x => url.searchParams.append("event", x.toString()));
			param.SeasonID?.forEach(x => url.searchParams.append("season", x.toString()));
			param.Rank?.forEach(x => url.searchParams.append("rank", x.toString()));
		}
	}

	const returnVal = await DoLogic<REAPI.API.Team.Rankings.Request, REAPI.API.Team.Rankings.Response>(`/teams${param?.TeamID}/rankings`, param, requestPopulator, urlOverride);
	return returnVal;
}

export const Team_Skills = async (param: REAPI.API.Team.Skills.Request | null, urlOverride?: string): Promise<REAPI.API.Team.Skills.Response | REAPI.API.Error> => {
	const requestPopulator = (param: REAPI.API.Team.Skills.Request | null, url: URL) => {
		if (param !== null) {
			param.EventID?.forEach(x => url.searchParams.append("event", x.toString()));
			param.SeasonID?.forEach(x => url.searchParams.append("season", x.toString()));
			param.Type?.forEach(x => url.searchParams.append("type", x));
		}
	}

	const returnVal = await DoLogic<REAPI.API.Team.Skills.Request, REAPI.API.Team.Skills.Response>(`/teams${param?.TeamID}/skills`, param, requestPopulator, urlOverride);
	return returnVal;
}

export const Team_Awards = async (param: REAPI.API.Team.Awards.Request | null, urlOverride?: string): Promise<REAPI.API.Team.Awards.Response | REAPI.API.Error> => {
	const requestPopulator = (param: REAPI.API.Team.Awards.Request | null, url: URL) => {
		if (param !== null) {
			param.EventID?.forEach(x => url.searchParams.append("event", x.toString()));
			param.SeasonID?.forEach(x => url.searchParams.append("season", x.toString()));
		}
	}

	const returnVal = await DoLogic<REAPI.API.Team.Awards.Request, REAPI.API.Team.Awards.Response>(`/teams${param?.TeamID}/awards`, param, requestPopulator, urlOverride);
	return returnVal;
}

//#endregion

//#region Program

export const Program_List = async (param: REAPI.API.Program.List.Request | null, urlOverride?: string): Promise<REAPI.API.Program.List.Response | REAPI.API.Error> => {
	const requestPopulator = (param: REAPI.API.Program.List.Request | null, url: URL) => {
		if (param !== null) {
			param.ProgramID?.forEach(x => url.searchParams.append("id", x.toString()));
		}
	}

	const returnVal = await DoLogic<REAPI.API.Program.List.Request, REAPI.API.Program.List.Response>(`/programs`, param, requestPopulator, urlOverride);
	return returnVal;
}

export const Program_Single = async (param: REAPI.API.Program.Single.Request | null, urlOverride?: string): Promise<REAPI.API.Program.Single.Response | REAPI.API.Error> => {
	const requestPopulator = (param: REAPI.API.Program.Single.Request | null, url: URL) => {
		
	}

	const returnVal = await DoLogic<REAPI.API.Program.Single.Request, REAPI.API.Program.Single.Response>(`/programs/${param?.ProgramID}`, param, requestPopulator, urlOverride);
	return returnVal;
}

//#endregion

//#region Season

export const Season_List = async (param: REAPI.API.Season.List.Request | null, urlOverride?: string): Promise<REAPI.API.Season.List.Response | REAPI.API.Error> => {
	const requestPopulator = (param: REAPI.API.Season.List.Request | null, url: URL) => {
		if (param !== null) {
			param.SeasonID?.forEach(x => url.searchParams.append("id", x.toString()));
			param.ProgramID?.forEach(x => url.searchParams.append("program", x.toString()));
			if (typeof param.ActiveSeason === "boolean") {
				url.searchParams.append("active", param.ActiveSeason ? "true" : "false");
			}
		}
	}

	const returnVal = await DoLogic<REAPI.API.Season.List.Request, REAPI.API.Season.List.Response>(`/seasons`, param, requestPopulator, urlOverride);
	return returnVal;
}

export const Season_Single = async (param: REAPI.API.Season.Single.Request | null, urlOverride?: string): Promise<REAPI.API.Season.Single.Response | REAPI.API.Error> => {
	const requestPopulator = (param: REAPI.API.Season.Single.Request | null, url: URL) => {
		
	}

	const returnVal = await DoLogic<REAPI.API.Season.Single.Request, REAPI.API.Season.Single.Response>(`/seasons/${param?.SeasonID}`, param, requestPopulator, urlOverride);
	return returnVal;
}

export const Season_Events = async (param: REAPI.API.Season.Events.Request | null, urlOverride?: string): Promise<REAPI.API.Season.Events.Response | REAPI.API.Error> => {
	const requestPopulator = (param: REAPI.API.Season.Events.Request | null, url: URL) => {
		if (param !== null) {
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
	}

	const returnVal = await DoLogic<REAPI.API.Season.Events.Request, REAPI.API.Season.Events.Response>(`/seasons${param?.SeasonID}/events`, param, requestPopulator, urlOverride);
	return returnVal;
}

//#endregion

export default {
	ValidResponse,
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
