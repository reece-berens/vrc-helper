import {REAPI, RECache} from "../types-lib";

export default class CacheController {
	private baseURL: string = "https://robotevents.com/api/v2";
	private cache: RECache;

	constructor() {
		//read cache from the file and update it
		this.cache = {
			Programs: [
				{
					id: 1,
					abbr: "VR5C",
					name: "VEX 5"
				}
			],
			Seasons: [],
			Teams: {},
			Events: {}
		};
	}

	private async UpdateCacheFile(): Promise<void> {
		//write new cache to the file
	}
	
	public ReturnCache(): RECache {
		return this.cache;
	}
}
