import { REAPI } from "./REAPI";

export interface RECache {
	//list of programs (VRC, VEX IQ, etc.)
	Programs: REAPI.Objects.Program[];

	//list of seasons (High Stakes, Spin Up, etc.)
	Seasons: REAPI.Objects.Season[];

	//dictionary key is the Season ID
	Teams: {
		[key: number]: REAPI.Objects.Team[];
	}

	//completed events in RE
	Events: {
		//first dictionary is by Program ID
		[key: number]: {
			//second dictionary is by Season ID
			[key: number]: {
				//third dictionary is by region
				[key: string]: EventCacheObject[];
			}
		}
	}
}

export interface EventCacheObject {
	//information about the event from RE
	EventInfo: EC_EventInfo;

	//results in a team-oriented format
	TeamResults: {
		//dictionary is based on team ID
		[key: number]: {
			EliminationPartner: REAPI.Objects.IdInfo | null; //team may not have made eliminations, so allow null
			QualiRanking: EC_TR_QualiRanking;
			QualiResults: REAPI.Objects.MatchObj[];
			SkillsResults: EC_TR_SkillsResult[];
		}
	}

	//list of all qualification match results
	QualiMatches: {
		//dictionary key is division ID
		[key: number]: REAPI.Objects.MatchObj[];
	}

	//list of all elimination match results
	ElimMatches: {
		//dictionary key is division ID
		[key: number]: REAPI.Objects.MatchObj[];
	}

	Awards: EC_Award[];
}

export type EC_EventInfo = Omit<REAPI.Objects.Event, "season" | "program" | "locations">;

export type EC_TR_QualiRanking = Omit<REAPI.Objects.Ranking, "event" | "team">;

export type EC_TR_SkillsResult = Omit<REAPI.Objects.Skill, "event" | "team" | "division" | "season">;

export type EC_Award = Omit<REAPI.Objects.Award, "event" | "order">;
