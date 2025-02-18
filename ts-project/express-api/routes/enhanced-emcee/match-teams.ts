import {Express} from "express";

import {RECache, TSProj} from "types-lib";

import BuildMTData from "./match-teams-data";

const defaultProgramEnvVar = process.env.EXPRESS_EE_MT_PROGRAM_DEFAULT || "";
const defaultSeasonEnvVar = process.env.EXPRESS_EE_MT_SEASON_DEFAULT || "";

const BuildMatchTeamRoutes = (app: Express): void => {
	app.get("/enhanced-emcee/match-teams/data", (req, response) => {
		var request = req as TSProj.Express.Request;
		const cache = request._RE_Cache;
		var programID = 0;
		var seasonID = 0;
		var region: string | null = null;
		
		var eventSKU = request.query["sku"];
		var foundEvent = false;
		if (typeof eventSKU === "string") {
			//get season this way
			var programKeys = Object.keys(cache.Events);
			for (var pIndex = 0; pIndex < programKeys.length && !foundEvent; pIndex++) {
				var pKey = parseInt(programKeys[pIndex]);
				var seasonKeys = Object.keys(cache.Events[pKey]);
				for (var sIndex = 0; sIndex < seasonKeys.length && !foundEvent; sIndex++) {
					var sKey = parseInt(seasonKeys[sIndex]);
					var regionKeys = Object.keys(cache.Events[pKey][sKey]);
					for (var rIndex = 0; rIndex < regionKeys.length && !foundEvent; rIndex++) {
						var rKey = regionKeys[rIndex];
						var eventList = cache.Events[pKey][sKey][rKey];
						for (var eIndex = 0; eIndex < eventList.length && !foundEvent; eIndex++) {
							var curEvent = eventList[eIndex];
							if (curEvent.EventInfo.sku === eventSKU) {
								//this is the event that we're looking for, so get the program/season
								console.log("found the event in cache");
								console.log(curEvent.EventInfo);
								programID = pKey;
								seasonID = sKey;
								region = rKey;
								foundEvent = true;
							}
						}
					}
				}
			}
		}
		//if we've gone through all the events in the cache and don't have program and season,
		//the current event wasn't in the cache
		//use the defaults at this point
		if (foundEvent === false) {
			if (defaultProgramEnvVar === "" || defaultSeasonEnvVar === "") {
				response.status(400);
				response.send("Event SKU not provided and default program/season not set on server");
				return;
			}
			else {
				programID = parseInt(defaultProgramEnvVar);
				seasonID = parseInt(defaultSeasonEnvVar);
			}
		}

		//parse out team numbers
		var blueArr: string[] = [];
		var redArr: string[] = [];
		const blueParam = request.query["blue"];
		if (Array.isArray(blueParam)) {
			blueParam.forEach(x => blueArr.push(x.toString()));
		}
		const redParam = request.query["red"];
		if (Array.isArray(redParam)) {
			redParam.forEach(x => redArr.push(x.toString()));
		}

		if (blueArr.length === 0 || redArr.length === 0) {
			console.log(`Don't have enough teams to proceed with building data - ${blueArr.length} ${redArr.length}`);
			response.status(400);
			response.send("Not enough teams defined in the request - should have 2-3 \"blue\" and 2-3 \"red\" teams");
		}
		else {
			//we have all the data that we can possibly get, now go get the list of data
			const responseData = BuildMTData(programID, seasonID, region, blueArr, redArr, cache);
			response.send(responseData);
		}
	});
};

export default BuildMatchTeamRoutes;
