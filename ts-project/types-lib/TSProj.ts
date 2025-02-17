import {Request as Express_Request} from "express";

import { RECache } from "./RECache";

export namespace TSProj {
	export namespace EnhancedEmcee {
		export namespace Common {
			export interface DisplayElement {
				label: string;
				value: string[];
			}

			export interface HeaderItem {
				name: string;
				order: number;
				data: DisplayElement[];
			}
		}
		
		export namespace ProgramSeasonRegion {
			export type DataResponse = Common.HeaderItem[];

			export interface DropdownResponse {
				data: DropdownItem[];
				defaultCode: string | null;
			}

			export interface DropdownItem {
				code: string;
				display: string;
			}
		}
		export namespace MatchTeams {
			export interface DataResponse {
				//dictionary key is team number (12345Z)
				[key: string]: {
					HeaderLine: string;
					SubHeaderLine: string;
					DataHeaders: Common.HeaderItem[];
				}
			}
		}
	}
	export namespace Express {
		interface _Request {
			_RE_Cache: RECache;
			_TM_Auth_Token: TM.Auth.Response;
		}
		export type Request = Express_Request & _Request;

		export namespace TM {
			export namespace Auth {
				export interface Response {
					AccessToken: string;
					ExpiresAt: Date;
				}
			}
		}
	}
}
