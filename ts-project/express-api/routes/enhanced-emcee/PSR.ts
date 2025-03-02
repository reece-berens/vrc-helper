import {Express} from "express";

import {TSProj} from "types-lib";

import GetPSRData from "./psr-data";

const BuildRegionRoutes = (app: Express): void => {
	app.get("/enhanced-emcee/psr/dd/programs", (req, response) => {
		var request = req as TSProj.Express.Request;

		var returnList: TSProj.EnhancedEmcee.ProgramSeasonRegion.DropdownResponse = {
			data: [],
			defaultCode: null
		};
		let envVarDefault = process.env.EXPRESS_EE_PSR_PROGRAM_DEFAULT || "";
		if (envVarDefault !== "") {
			returnList.defaultCode = envVarDefault;
		}
		returnList.data = request._RE_Cache.Programs.map(x => ({code: x.id.toString(), display: x.name}));

		response.json(returnList);
	});

	app.get("/enhanced-emcee/psr/dd/seasons", (req, response) => {
		var request = req as TSProj.Express.Request;

		var programReq = request.query["programID"];
		var programID: number = 0;
		if (typeof programReq === "string") {
			programID = parseInt(programReq);
			if (isNaN(programID)) {
				response.status(400).send("Invalid Program ID parameter");
			}
			else {
				var returnList: TSProj.EnhancedEmcee.ProgramSeasonRegion.DropdownResponse = {
					data: [],
					defaultCode: null
				};
				returnList.data = request._RE_Cache.Seasons.filter(x => x.program.id === programID).map(x => ({code: x.id.toString(), display: x.name}));

				let envVarDefault = process.env.EXPRESS_EE_PSR_SEASON_DEFAULT || "";
				if (envVarDefault !== "" && returnList.data.some(x => x.code === envVarDefault)) {
					returnList.defaultCode = envVarDefault;
				}

				response.json(returnList);
			}
		}
		else {
			response.status(400).send("Invalid Program ID parameter");
		}
	});

	app.get("/enhanced-emcee/psr/dd/regions", (req, response) => {
		var request = req as TSProj.Express.Request;
		var programReq = request.query["programID"];
		var seasonReq = request.query["seasonID"];
		var programID: number = 0;
		var seasonID: number = 0;
		if (typeof programReq === "string" && typeof seasonReq === "string") {
			programID = parseInt(programReq);
			seasonID = parseInt(seasonReq);
			if (isNaN(programID) || isNaN(seasonID)) {
				response.status(400).send("Invalid Program ID and/or Season ID parameter");
			}
			else {
				var returnList: TSProj.EnhancedEmcee.ProgramSeasonRegion.DropdownResponse = {
					data: [],
					defaultCode: null
				};
				if (typeof request._RE_Cache.Events[programID] !== "undefined" && typeof request._RE_Cache.Events[programID][seasonID] !== "undefined") {
					returnList.data = Object.keys(request._RE_Cache.Events[programID][seasonID]).map(x => ({code: x, display: x}));
				}

				let envVarDefault = process.env.EXPRESS_EE_PSR_REGION_DEFAULT || "";
				if (envVarDefault !== "" && returnList.data.some(x => x.code === envVarDefault)) {
					returnList.defaultCode = envVarDefault;
				}
				
				response.json(returnList);
			}
		}
		else {
			response.status(400).send("Invalid Program ID and/or Season ID parameter");
		}
	});

	app.get("/enhanced-emcee/psr/data", (req, response) => {
		var request = req as TSProj.Express.Request;
		var programReq = request.query["programID"];
		var seasonReq = request.query["seasonID"];
		var regionReq = request.query["region"];
		var programID: number = 0;
		var seasonID: number = 0;
		if (typeof programReq === "string" && typeof seasonReq === "string" && typeof regionReq === "string") {
			programID = parseInt(programReq);
			seasonID = parseInt(seasonReq);
			if (isNaN(programID) || isNaN(seasonID) || regionReq === "") {
				response.status(400).send("Invalid Program ID, Season ID, and/or Region parameter");
			}
			else {
				//probably call some method to populate the list that uses the cache object from the request
				/*
				var returnData: TSProj.EnhancedEmcee.ProgramSeasonRegion.DataResponse = [];
				returnData.push({
					data: [
						{
							label: "Number of tournaments",
							value: ["10 total", "6 HS Only", "3 MS Only", "1 Blended HS/MS"]
						},
						{
							label: "Total organizations",
							value: ["12", "5 of them are HS"]
						},
						{
							label: "Total number of qualification matches",
							value: ["500", "300 in HS tournaments", "200 in MS tournaments"]
						},
					],
					name: "Data from entire region",
					order: 1
				});
				returnData.push({
					data: [
						{
							label: "Number of teams participating",
							value: ["23"]
						}
					],
					name: "Data from HS tournaments",
					order: 1
				});
				*/
				const returnData = GetPSRData(programID, seasonID, regionReq, request._RE_Cache);
				response.json(returnData);
			}
		}
		else {
			response.status(400).send("Invalid Program ID, Season ID, and/or Region parameter");
		}
	});
};

export default BuildRegionRoutes;
