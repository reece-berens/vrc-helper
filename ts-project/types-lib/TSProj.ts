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
}