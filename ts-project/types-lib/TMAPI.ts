export namespace TMAPI {
	export interface TokenResponse {
		access_token: string;
		expires_in: number;
		token_type: string;
	}

	export namespace API {
		export interface DataCache {
			//dictionary key is the URL
			[key: string]: {
				Data: any;
				LastModified: string;
			}
		}

		export namespace Divisions {
			export interface Response {
				divisions: Objects.IDNamePair[];
			}
		}

		export namespace Fields {
			export interface Request {
				FieldSetID: number;
			}

			export interface Response {
				fields: Objects.IDNamePair[];
			}
		}

		export namespace FieldSets {
			export interface Response {
				fieldSets: Objects.IDNamePair[];
			}
		}

		export namespace Matches {
			export interface Request {
				DivisionID: number;
			}

			export interface Response {
				matches: Objects.Match.Object[];
			}
		}

		export namespace Websocket {
			export namespace Receive {
				export interface Base {
					type: "fieldMatchAssigned" | "fieldActivated" | "matchStarted" | "matchStopped" | "audienceDisplayChanged";
				}

				export interface AudienceDisplayChanged extends Base {
					type: "audienceDisplayChanged";
					display: string;
				}

				export interface FieldActivated extends Base {
					type: "fieldActivated";
					fieldID: number;
				}

				export interface MatchAssignedToField extends Base {
					type: "fieldMatchAssigned";
					fieldID: number;
					match: Objects.Match.Tuple;
				}

				export interface MatchStarted extends Base {
					type: "matchStarted";
					fieldID: number;
				}

				export interface MatchStopped extends Base {
					type: "matchStopped";
					fieldID: number;
				}
			}

			export namespace Send {
				export interface Base {
					cmd: "start" | "endEarly" | "abort" | "reset" | "queuePrevMatch" | "queueNextMatch" | "queueSkills" | "setAudienceDisplay";
				}

				export interface QueueSkills extends Base {
					cmd: "queueSkills";
					skillsID: number;
				}
				
				export interface SetAudienceDisplay extends Base {
					cmd: "setAudienceDisplay";
					display: string;
				}
			}
		}
	}
	export namespace Objects {
		export interface FieldMatchAssignment {
			//key is by field ID - if a field set ID key is needed, define it somewhere else
			[key: number]: Match.Tuple;
		}

		export interface IDNamePair {
			id: number;
			name: string;
		}
		
		export namespace Match {
			export interface Alliance {
				teams: AllianceTeam[];
			}

			export interface AllianceTeam {
				number: string;
			}

			export interface Info {
				alliances: Alliance[];
				state: string;
				timeScheduled: number;
			}
			
			export interface Object {
				finalScore: number[];
				matchInfo: Info;
				matchTuple: Tuple;
				winningAlliance: number;
			}

			export interface Tuple  {
				session: number;
				division: number;
				round: string;
				instance: number;
				match: number;
			}
		}
	}
}
