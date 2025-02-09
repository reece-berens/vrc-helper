export namespace REAPI {
	export namespace API {
		interface Base {
			meta: Objects.PageMeta;
			data: any[];
		}

		export interface Award extends Base {
			data: Objects.Award[];
		}

		export interface Event extends Base {
			data: Objects.Event[];
		}

		export interface Match extends Base {
			data: Objects.MatchObj[];
		}

		export interface Program extends Base {
			data: Objects.Program[];
		}

		export interface Season extends Base {
			data: Objects.Season[];
		}

		export interface Ranking extends Base {
			data: Objects.Ranking[];
		}

		export interface Skill extends Base {
			data: Objects.Skill[];
		}

		export interface Team extends Base {
			data: Objects.Team[];
		}
	}
	export namespace Objects {
		export interface Alliance {
			color: "blue" | "red";
			score: number;
			teams: AllianceTeam[];
		}

		export interface AllianceTeam {
			team: IdInfo;
			sitting: boolean;
		}

		export interface Award {
			id: number;
			event: IdInfo;
			order: number;
			title: string;
			qualifications: string[];
			designation: "division" | "tournament" | null;
			classification: "champion" | "finalist" | "semifinalist" | "quarterfinalist" | null;
			teamWinners: TeamAwardWinner[];
			individualWinners: string[];
		}

		export interface Coordinates {
			lat: number;
			lon: number;
		}

		export interface Division {
			id: number;
			name: string;
			order: number;
		}

		export interface Error {
			code: number;
			message: string;
		}
		
		export interface Event {
			id: number;
			sku: string;
			name: string;
			start: Date;
			end: Date;
			season: IdInfo;
			program: IdInfo;
			location: Location;
			locations: Locations;
			division: Division[];
			level: EventLevel;
			ongoing: boolean;
			awards_finalized: boolean;
			event_type: EventType;
		}

		export type EventLevel = "World" | "National" | "Regional" | "State" | "Signature" | "Other";
		
		export type EventType = "tournament" | "league" | "workshop" | "virtual";

		export type Grade = "College" | "High School" | "Middle School" | "Elementary School";

		export interface IdInfo {
			id: number;
			name: string;
			code: string | null;
		}

		export interface Location {
			venue: string;
			address_1: string;
			address_2: string;
			city: string;
			region: string;
			postcode: string;
			country: string;
			coordinates: Coordinates;
		}

		export interface Locations {
			[key: string]: Location;
		}

		export interface MatchObj {
			id: number;
			event: IdInfo;
			division: IdInfo;
			round: number;
			instance: number;
			matchnum: number;
			scheduled: Date;
			started: Date;
			field: string;
			scored: true;
			name: string;
			alliances: Alliance[];
		}

		export interface PageMeta {
			current_page: number;
			first_page_url: string;
			from: number;
			last_page: number;
			last_page_url: number;
			next_page_url: number;
			path: string;
			per_page: number;
			prev_page_url: string;
			to: number;
			total: number;
		}

		export interface Program {
			id: number;
			abbr: string;
			name: string;
		}

		export interface Ranking {
			id: number;
			event: IdInfo;
			division: IdInfo;
			rank: number;
			team: IdInfo;
			wins: number;
			losses: number;
			ties: number;
			wp: number;
			ap: number;
			sp: number;
			high_score: number;
			average_points: number;
			total_points: number;
		}

		export interface Season {
			id: number;
			name: string;
			program: IdInfo;
			start: Date;
			end: Date;
			years_start: number;
			years_end: number;
		}

		export interface Skill {
			id: number;
			event: IdInfo;
			team: IdInfo;
			type: SkillType;
			season: IdInfo;
			division: IdInfo;
			rank: number;
			score: number;
			attempts: number;
		}

		export type SkillType = "driver" | "package_delivery_time" | "programming";

		export interface Team {
			id: number;
			number: string;
			team_name: string;
			robot_name: string;
			organization: string;
			location: Location;
			registered: boolean;
			program: IdInfo;
			grade: Grade;
		}

		export interface TeamAwardWinner {
			division: IdInfo;
			team: IdInfo;
		}
	}
}
