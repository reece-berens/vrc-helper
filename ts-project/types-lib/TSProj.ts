import {Request as Express_Request} from "express";

import { RECache } from "./RECache";

export namespace TSProj {
	export namespace EnhancedEmcee {
		export namespace Region {
			export type DataResponse = HeaderItem[];

			export interface DropdownResponse {
				data: DropdownItem[];
				defaultCode: string | null;
			}

			export interface DisplayElement {
				label: string;
				value: string[];
			}
			
			export interface DropdownItem {
				code: string;
				display: string;
			}

			export interface HeaderItem {
				name: string;
				order: number;
				data: DisplayElement[];
			}
		}
		export namespace Team {

		}
	}
	export namespace Express {
		interface _Request {
			_RE_Cache: RECache;
		}
		export type Request = Express_Request & _Request;
	}
}
