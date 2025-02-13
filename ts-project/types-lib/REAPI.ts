export namespace REAPI {
	export namespace API {
		interface EventID_Required {
			EventID: number;
		}

		interface EventID_DivisionID_Required extends EventID_Required {
			DivisionID: number;
		}

		interface TeamID_Required {
			TeamID: number;
		}

		export interface ResponseBase {
			meta: Objects.PageMeta;
			data: any[];
		}

		export interface Error {
			code: number;
			message: string;
		}

		export namespace Event {
			export namespace List {
				interface _Request {
					ID: number[];
					SKU: string[];
					TeamID: number[];
					SeasonID: number[];
					Start: Date;
					End: Date;
					Region: string;
					Level: REAPI.Objects.EventLevel[];
					Type: REAPI.Objects.EventType[];
				}
				export type Request = Partial<_Request>;

				export interface Response extends ResponseBase {
					data: Objects.Event[];
				};
			}

			export namespace Single {
				export type Request = EventID_Required;

				export type Response = Objects.Event;
			}

			export namespace TeamsAtEvent {
				interface _Request {
					TeamNumber: string[];
					TeamRegistered: boolean;
					TeamGrade: REAPI.Objects.Grade[];
					TeamCountry: string[];
				}
				export type Request = Partial<_Request> & EventID_Required;

				export interface Response extends ResponseBase {
					data: Objects.Team[];
				};
			}

			export namespace Skills {
				interface _Request {
					TeamID: number[];
					SkillsType: REAPI.Objects.SkillType[];
				}
				export type Request = Partial<_Request> & EventID_Required;

				export interface Response extends ResponseBase {
					data: Objects.Skill[];
				}
			}

			export namespace Awards {
				interface _Request {
					TeamID: number[];
				}
				export type Request = Partial<_Request> & EventID_Required;

				export interface Response extends ResponseBase {
					data: Objects.Award[];
				}
			}

			export namespace DivisionMatches {
				interface _Request {
					TeamID : number[];
					Round: REAPI.Objects.MatchRound[];
				}
				export type Request = Partial<_Request> & EventID_DivisionID_Required;

				export interface Response extends ResponseBase {
					data: Objects.MatchObj[];
				}
			}

			export namespace DivisionFinalistRankings {
				interface _Request {
					TeamID: number[];
					Rank: number[];
				}
				export type Request = Partial<_Request> & EventID_DivisionID_Required;

				export interface Response extends ResponseBase {
					data: Objects.Ranking[];
				}
			}

			export namespace DivisionRanking {
				interface _Request {
					TeamID: number[];
					Rank: number[];
				}
				export type Request = Partial<_Request> & EventID_DivisionID_Required;

				export interface Response extends ResponseBase {
					data: Objects.Ranking[];
				}
			}
		}

		export namespace Program {
			export namespace Single {
				export interface Request {
					ProgramID: number;
				}

				export type Response = Objects.Program;
			}

			export namespace List {
				interface _Request {
					ProgramID: number[];
				}
				export type Request = Partial<_Request>;

				export interface Response extends ResponseBase {
					data: Objects.Program[];
				}
			}
		}

		export namespace Team {
			export namespace List {
				interface _Request {
					TeamID: number[];
					TeamNumber: string[];
					AttendedEventID: number[];
					Registered: boolean;
					ProgramID: number[];
					Grade: Objects.Grade[];
					Country: string[];
				}
				export type Request = Partial<_Request>;

				export interface Response extends ResponseBase {
					data: Objects.Team[];
				};
			}

			export namespace Single {
				export type Request = TeamID_Required;

				export type Response = Objects.Team;
			}

			export namespace Events {
				interface _Request {
					EventSKU: string[];
					SeasonID: number[];
					Start: Date;
					End: Date;
					Level: Objects.EventLevel[];
				}
				export type Request = Partial<_Request> & TeamID_Required;

				export interface Response extends ResponseBase {
					data: Objects.Event[];
				}
			}

			export namespace Matches {
				interface _Request {
					EventID: number[];
					SeasonID: number[];
					Round: Objects.MatchRound[];
				}
				export type Request = Partial<_Request> & TeamID_Required;

				export interface Response extends ResponseBase {
					data: Objects.MatchObj[];
				}
			}

			export namespace Rankings {
				interface _Request {
					EventID: number[];
					Rank: number[];
					SeasonID: number[];
				}
				export type Request = Partial<_Request> & TeamID_Required;

				export interface Response extends ResponseBase {
					data: Objects.Ranking[];
				}
			}

			export namespace Skills {
				interface _Request {
					EventID: number[];
					Type: Objects.SkillType[];
					SeasonID: number[];
				}
				export type Request = Partial<_Request> & TeamID_Required;

				export interface Response extends ResponseBase {
					data: Objects.Skill[];
				}
			}

			export namespace Awards {
				interface _Request {
					EventID: number[];
					SeasonID: number[];
				}
				export type Request = Partial<_Request> & TeamID_Required;

				export interface Response extends ResponseBase {
					data: Objects.Award[];
				}
			}
		}

		export namespace Season {
			interface _Season_Single {
				SeasonID: number;
			}
			export namespace Single {
				export type Request = _Season_Single;

				export type Response = Objects.Season;
			}

			export namespace List {
				interface _Request {
					SeasonID: number[];
					ProgramID: number[];
					ActiveSeason: boolean;
				}
				export type Request = Partial<_Request>;

				export interface Response extends ResponseBase {
					data: Objects.Season[];
				}
			}

			export namespace Events {
				interface _Request {
					EventSKU: string[];
					ParticipatingTeamID: number[];
					Start: Date;
					End: Date;
					Level: REAPI.Objects.EventLevel[];
				}
				export type Request = Partial<_Request> & _Season_Single;

				export interface Response extends ResponseBase {
					data: Objects.Event[];
				}
			}
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
			divisions: Division[];
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

		export enum MatchRound {
			Practice = 1,
			Qualification = 2,
			QuarterFinal = 3,
			SemiFinal = 4,
			Final = 5,
			Round16 = 6,
			Round32 = 7,
			Round64 = 8,
			Round128 = 9
		}

		export interface PageMeta {
			current_page: number;
			first_page_url: string;
			from: number;
			last_page: number;
			last_page_url: string;
			next_page_url: string;
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
