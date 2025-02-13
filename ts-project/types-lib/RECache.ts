import { REAPI } from "./REAPI";

export interface RECache {
	//list of programs (VRC, VEX IQ, etc.)
	Programs: REAPI.Objects.Program[];

	//list of seasons (High Stakes, Spin Up, etc.)
	Seasons: REAPI.Objects.Season[];

	TeamReverseLookup: {
		//first dictionary is by Season ID
		[key: number]: {
			//second dictionary is by team number
			[key: string]: number; //value is team ID
		}
	}
	
	Teams: {
		//first dictionary is by Season ID
		[key: number]: {
			//second dictionary is by team ID
			[key: number]: REAPI.Objects.Team;
		}
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
			//if division information is needed, it's included in the QualiRanking and EliminationRanking lists
			EliminationPartner: REAPI.Objects.IdInfo[] | null; //team may not have made eliminations, so allow null; may be more than 2 teams on an elimination alliance, so make a list
			EliminationResults: REAPI.Objects.MatchObj[] | null; //results from all divisions can go in here and we can filter on division if needed
			FinalistRanking: EC_TR_Ranking | null;
			QualiRanking: EC_TR_Ranking; //teams are only going to be in one qualification division (i hope)
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

export type EC_TR_Ranking = Omit<REAPI.Objects.Ranking, "event" | "team">;

export type EC_TR_SkillsResult = Omit<REAPI.Objects.Skill, "event" | "team" | "division" | "season">;

export type EC_Award = Omit<REAPI.Objects.Award, "event" | "order">;
