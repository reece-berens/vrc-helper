import { REAPI, RECache, EventCacheObject, EC_TR_Ranking, EC_TR_SkillsResult, EC_Award, EC_EventInfo } from "../types-lib";
import API from "../re-api";
import { readFileSync, writeFileSync } from "fs";

export default class CacheController {
	private cache: RECache;
	private filePath: string;
	private saveWhitespace: boolean = true;
	
	private _defaultEC_TR_Ranking: EC_TR_Ranking = {
		id: 0,
		division: {id: 0, code: "", name: ""},
		rank: 0,
		wins: 0,
		losses: 0,
		ties: 0,
		wp: 0,
		ap: 0,
		sp: 0,
		high_score: 0,
		average_points: 0,
		total_points: 0,
	}

	constructor() {
		this.filePath = "./re-cache.json";
		try {
			const jsonData = readFileSync(this.filePath, {encoding: "utf-8"});
			this.cache = JSON.parse(jsonData);
		}
		catch (e) {
			console.warn("ERROR reading cache file, it may not exist yet", e);
			this.cache = {
				Programs: [],
				Seasons: [],
				TeamReverseLookup: {},
				Teams: {},
				Events: {}
			};
			this.UpdateCacheFile();
		}
	}

	private async LoadEventCacheObject(eventObj: EventCacheObject, seasonObj: REAPI.Objects.Season): Promise<void> {
		console.log(`CacheController.LoadEventCacheObject - Begin - ${eventObj.EventInfo.sku}`);
		//get all teams that were present at the event and add each of them to the Team cache and the eventObj team list
		console.log(`CacheController.LoadEventCacheObject - Teams`);
		if (typeof this.cache.Teams[seasonObj.id] === "undefined") {
			this.cache.Teams[seasonObj.id] = {};
		}
		let teamRequest: REAPI.API.Event.TeamsAtEvent.Request = {
			EventID: eventObj.EventInfo.id
		};
		let teamResponse = await API.Event.Teams(teamRequest);
		while (API.ValidResponse<REAPI.API.Event.TeamsAtEvent.Response>(teamResponse)) {
			//we have a valid list of teams that can go in the cache
			teamResponse.data.forEach(x => {
				//ensure the team is in the top-level cache
				if (typeof this.cache.Teams[seasonObj.id][x.id] === "undefined") {
					this.cache.Teams[seasonObj.id][x.id] = x;
				}
				if (typeof this.cache.TeamReverseLookup[seasonObj.id] === "undefined") {
					this.cache.TeamReverseLookup[seasonObj.id] = {};
				}
				if (typeof this.cache.TeamReverseLookup[seasonObj.id][x.number] === "undefined") {
					this.cache.TeamReverseLookup[seasonObj.id][x.number] = x.id;
				}
				//add the team to the event cache object, populate the data elements later
				eventObj.TeamResults[x.id] = {
					EliminationPartner: null,
					FinalistRanking: null,
					EliminationResults: null,
					QualiRanking: {...this._defaultEC_TR_Ranking, division: {...this._defaultEC_TR_Ranking.division}},
					QualiResults: [],
					SkillsResults: []
				}
			});

			if (teamResponse.meta.next_page_url === null) {
				//no more pages of data to load, break out of loop
				break;
			}
			else {
				teamResponse = await API.Event.Teams(null, teamResponse.meta.next_page_url);
			}
		}
		if (!API.ValidResponse<REAPI.API.Event.TeamsAtEvent.Response>(teamResponse)) {
			console.error("ERROR CacheController.LoadEventCacheObject[Teams] - Invalid response from RE", teamResponse);
			throw teamResponse;
		}

		//get all of the skills results from the event
		console.log(`CacheController.LoadEventCacheObject - Skills Results`);
		let skillsRequest: REAPI.API.Event.Skills.Request = {
			EventID: eventObj.EventInfo.id
		};
		let skillsResponse = await API.Event.Skills(skillsRequest);
		while (API.ValidResponse<REAPI.API.Event.Skills.Response>(skillsResponse)) {
			//skills results get converted to a smaller type
			
			skillsResponse.data.forEach(x => {
				//convert data to smaller format
				let cacheSkills: EC_TR_SkillsResult = {
					id: x.id,
					type: x.type,
					rank: x.rank,
					score: x.score,
					attempts: x.attempts
				};
				//smaller skills results go in the TeamResults object (already initialized when loading event)
				eventObj.TeamResults[x.team.id].SkillsResults.push(cacheSkills);
			});

			if (skillsResponse.meta.next_page_url === null) {
				//no more pages of data to load, break out of loop
				break;
			}
			else {
				skillsResponse = await API.Event.Skills(null, skillsResponse.meta.next_page_url);
			}
		}

		//get all of the awards from the event
		console.log(`CacheController.LoadEventCacheObject - Awards`);
		let awardsRequest: REAPI.API.Event.Awards.Request = {
			EventID: eventObj.EventInfo.id
		};
		let awardsResponse = await API.Event.Awards(awardsRequest);
		while (API.ValidResponse<REAPI.API.Event.Awards.Response>(awardsResponse)) {
			//awards get converted to a smaller type
			
			awardsResponse.data.forEach(x => {
				//convert data to smaller format
				let cacheAward: EC_Award = {
					id: x.id,
					title: x.title,
					qualifications: x.qualifications,
					designation: x.designation,
					classification: x.classification,
					teamWinners: x.teamWinners,
					individualWinners: x.individualWinners,
				};
				eventObj.Awards.push(cacheAward);
			});

			if (awardsResponse.meta.next_page_url === null) {
				//no more pages of data to load, break out of loop
				break;
			}
			else {
				awardsResponse = await API.Event.Awards(null, awardsResponse.meta.next_page_url);
			}
		}

		//get all of the division-based information (matches, rankings, etc.)
		for (let division of eventObj.EventInfo.divisions) {
			eventObj.QualiMatches[division.id] = [];
			eventObj.ElimMatches[division.id] = [];

			console.log(`CacheController.LoadEventCacheObject - Division Matches ${division.id}`);
			let matchesRequest: REAPI.API.Event.DivisionMatches.Request = {
				EventID: eventObj.EventInfo.id,
				DivisionID: division.id
			};
			let matchesResponse = await API.Event.Division.Matches(matchesRequest);
			while (API.ValidResponse<REAPI.API.Event.DivisionMatches.Response>(matchesResponse)) {
				//need to determine if the match is qualification or elimination, as well as which teams to associate it with
				matchesResponse.data.forEach(match => {
					//practice match is 1, ignore those for now
					if (match.round === 2) {
						//qualification match
						eventObj.QualiMatches[division.id].push(match);

						//insert this match into the TeamResults dictionary for each team in the match
						match.alliances.forEach(alliance => {
							alliance.teams.forEach(allianceTeam => {
								eventObj.TeamResults[allianceTeam.team.id].QualiResults.push(match);
							});
						});
					}
					else if (match.round > 2) {
						//elimination match
						eventObj.ElimMatches[division.id].push(match);

						//insert this match into the TeamResults dictionary for each team in the match
						match.alliances.forEach(alliance => {
							alliance.teams.forEach(allianceTeam => {
								if (eventObj.TeamResults[allianceTeam.team.id].EliminationResults === null) {
									eventObj.TeamResults[allianceTeam.team.id].EliminationResults = [];
								}
								eventObj.TeamResults[allianceTeam.team.id].EliminationResults?.push(match);
								//populate elimination partner(s) if not done already
								if (eventObj.TeamResults[allianceTeam.team.id].EliminationPartner === null) {
									eventObj.TeamResults[allianceTeam.team.id].EliminationPartner = alliance.teams.filter(x => x.team.id !== allianceTeam.team.id).map(x => x.team);
								}
							});
						});
					}
				});

				if (matchesResponse.meta.next_page_url === null) {
					//no more pages of data to load, break out of loop
					break;
				}
				else {
					matchesResponse = await API.Event.Division.Matches(null, matchesResponse.meta.next_page_url);
				}
			}

			//get finalist rankings from the event (elimination matches rankings i think)
			console.log(`CacheController.LoadEventCacheObject - Division Finalist Rankings ${division.id}`);
			let finalistRankingsRequest: REAPI.API.Event.DivisionFinalistRankings.Request = {
				EventID: eventObj.EventInfo.id,
				DivisionID: division.id
			};
			let finalistRankingsResponse = await API.Event.Division.FinalistRankings(finalistRankingsRequest);
			while (API.ValidResponse<REAPI.API.Event.DivisionFinalistRankings.Response>(finalistRankingsResponse)) {
				//finalist ranking just needs to be tied to the team
				finalistRankingsResponse.data.forEach(ranking => {
					//convert to the format to save
					let cacheRanking: EC_TR_Ranking = {
						id: ranking.id,
						division: ranking.division,
						rank: ranking.rank,
						wins: ranking.wins,
						losses: ranking.losses,
						ties: ranking.ties,
						wp: ranking.wp,
						ap: ranking.ap,
						sp: ranking.sp,
						high_score: ranking.high_score,
						average_points: ranking.average_points,
						total_points: ranking.total_points,
					};
					//not sure if there would ever be more than one finalist ranking, check later if i get some valid data
					eventObj.TeamResults[ranking.team.id].FinalistRanking = cacheRanking;
				});

				if (finalistRankingsResponse.meta.next_page_url === null) {
					//no more pages of data to load, break out of loop
					break;
				}
				else {
					finalistRankingsResponse = await API.Event.Division.FinalistRankings(null, finalistRankingsResponse.meta.next_page_url);
				}
			}

			//get rankings from the event (qualification matches rankings i think)
			console.log(`CacheController.LoadEventCacheObject - Division Rankings ${division.id}`);
			let rankingsRequest: REAPI.API.Event.DivisionRanking.Request = {
				EventID: eventObj.EventInfo.id,
				DivisionID: division.id
			};
			let rankingsResponse = await API.Event.Division.Rankings(rankingsRequest);
			while (API.ValidResponse<REAPI.API.Event.DivisionRanking.Response>(rankingsResponse)) {
				//finalist ranking just needs to be tied to the team
				rankingsResponse.data.forEach(ranking => {
					//convert to the format to save
					let cacheRanking: EC_TR_Ranking = {
						id: ranking.id,
						division: ranking.division,
						rank: ranking.rank,
						wins: ranking.wins,
						losses: ranking.losses,
						ties: ranking.ties,
						wp: ranking.wp,
						ap: ranking.ap,
						sp: ranking.sp,
						high_score: ranking.high_score,
						average_points: ranking.average_points,
						total_points: ranking.total_points,
					};
					eventObj.TeamResults[ranking.team.id].QualiRanking = cacheRanking;
				});

				if (rankingsResponse.meta.next_page_url === null) {
					//no more pages of data to load, break out of loop
					break;
				}
				else {
					rankingsResponse = await API.Event.Division.Rankings(null, rankingsResponse.meta.next_page_url);
				}
			}
		}
		console.log(`CacheController.LoadEventCacheObject - End - ${eventObj.EventInfo.sku}`);
	}
	
	//Call the RE API to get a single event by ID
	public async LoadEventByID(eventID: number, allowNonFinal?: boolean, forceRefresh?: boolean): Promise<void> {
		console.log(`CacheController.LoadEventByID - Begin - ${eventID}`);
		let addedEvent: boolean = false;
		const request: REAPI.API.Event.Single.Request = {
			EventID: eventID
		};
		let thisResponse = await API.Event.Single(request);
		if (API.ValidResponse<REAPI.API.Event.Single.Response>(thisResponse)) {
			//check if the season needs to be loaded into the cache
			let event = thisResponse;
			let cachedSeason = this.cache.Seasons.find(x => x.id === event.season.id);
			if (typeof cachedSeason === "undefined") {
				console.log(`CacheController.LoadEventByID - Loading Season`);
				await this.LoadSeasonList([], [event.season.id]);
				cachedSeason = this.cache.Seasons.find(x => x.id === event.season.id);
				if (typeof cachedSeason === "undefined") {
					//we tried to load the requested season from RE but it doesn't exist... return out of this method
					console.warn("WARN CacheController.LoadEventByID - season tied to selected event doesn't exist in RE API");
					return;
				}
			}
			//load the program that this season belongs to if we don't have it already
			let cachedProgram = this.cache.Programs.find(x => x.id === cachedSeason.program.id);
			if (typeof cachedProgram === "undefined") {
				console.log(`CacheController.LoadEventByID - Loading Program`);
				await this.LoadProgramList([cachedSeason.program.id]);
				cachedProgram = this.cache.Programs.find(x => x.id === cachedSeason.program.id);
				if (typeof cachedProgram === "undefined") { 
					//we tried to load the program tied to the season from RE but it doesn't exist... return out of this method
					console.warn("WARN CacheController.LoadEventByID - program tied to season tied to selected event doesn't exist in RE API");
					return;
				}
			}
			
			//set up the cache object for this request
			if (typeof this.cache.Events[cachedProgram.id] === "undefined") {
				this.cache.Events[cachedProgram.id] = {};
				addedEvent = true;
			}
			if (typeof this.cache.Events[cachedProgram.id][cachedSeason.id] === "undefined") {
				this.cache.Events[cachedProgram.id][cachedSeason.id] = {};
				addedEvent = true;
			}
			if (typeof this.cache.Events[cachedProgram.id][cachedSeason.id][event.location.region] === "undefined") {
				this.cache.Events[cachedProgram.id][cachedSeason.id][event.location.region] = [];
				addedEvent = true;
			}

			if (forceRefresh) {
				console.log(`CacheController.LoadEventByID - Removing existing cache item if it exists - ${eventID}`);
				this.cache.Events[cachedProgram.id][cachedSeason.id][event.location.region] = this.cache.Events[cachedProgram.id][cachedSeason.id][event.location.region].filter(x => x.EventInfo.id !== event.id);
			}
			
			//for this application, we only care about finalized events (unless specifically checking for incomplete event)
			if (event.awards_finalized || allowNonFinal === true) {
				let existingEvent = this.cache.Events[cachedProgram.id][cachedSeason.id][event.location.region].find(y => y.EventInfo.id === event.id && y.EventInfo.sku === event.sku);
				//if the event is cached but it has been completed since the cache, update the cache to get all information
				if (typeof existingEvent === "undefined" || existingEvent.EventInfo.awards_finalized !== event.awards_finalized) {
					console.log(`CacheController.LoadEventByID - Creating cache for event - ${eventID}`);
					//this event doesn't exist in the cache yet - add it
					const cacheEventObject: EC_EventInfo = {
						id: event.id,
						sku: event.sku,
						name: event.name,
						start: event.start,
						end: event.end,
						location: event.location,
						divisions: event.divisions,
						level: event.level,
						ongoing: event.ongoing,
						awards_finalized: event.awards_finalized,
						event_type: event.event_type
					};
					let cacheObject: EventCacheObject = {
						EventInfo: cacheEventObject,
						TeamResults: {},
						QualiMatches: {},
						ElimMatches: {},
						Awards: []
					};
					//if cached event exists and we are still creating cache (in the event the tournament is finalized), remove the old cache
					if (typeof existingEvent !== "undefined") {
						this.cache.Events[cachedProgram.id][cachedSeason.id][event.location.region] = this.cache.Events[cachedProgram.id][cachedSeason.id][event.location.region].filter(x => x.EventInfo.id !== existingEvent.EventInfo.id);
					}
					this.cache.Events[cachedProgram.id][cachedSeason.id][event.location.region].push(cacheObject);
					await this.LoadEventCacheObject(cacheObject, cachedSeason);
					addedEvent = true;
				}
			}
		}
		else {
			console.error("ERROR CacheController.LoadEventByID - Invalid response from RE", thisResponse);
		}
		if (addedEvent) {
			this.UpdateCacheFile();
		}
		console.log(`CacheController.LoadEventByID - End - ${eventID}`);
	}

	//Call the RE API to get a list of events that is filtered by the season and region and populate it in the cache
	public async LoadEventListBySeasonRegion(seasonID: number, region: string, allowNonFinal?: boolean): Promise<void> {
		console.log(`CacheController.LoadEventListBySeasonRegion - Begin - ${seasonID} ${region}`);
		const request: REAPI.API.Event.List.Request = {
			SeasonID: [seasonID],
			Region: region
		};
		//check if the season needs to be loaded into the cache
		let cachedSeason = this.cache.Seasons.find(x => x.id === seasonID);
		if (typeof cachedSeason === "undefined") {
			console.log(`CacheController.LoadEventListBySeasonRegion - Loading Season`);
			await this.LoadSeasonList([], [seasonID]);
			cachedSeason = this.cache.Seasons.find(x => x.id === seasonID);
			if (typeof cachedSeason === "undefined") {
				//we tried to load the requested season from RE but it doesn't exist... return out of this method
				console.warn("WARN CacheController.LoadEventListBySeasonRegion - selected season doesn't exist in RE API");
				return;
			}
		}
		//load the program that this season belongs to if we don't have it already
		let cachedProgram = this.cache.Programs.find(x => x.id === cachedSeason.program.id);
		if (typeof cachedProgram === "undefined") {
			console.log(`CacheController.LoadEventListBySeasonRegion - Loading Program`);
			await this.LoadProgramList([cachedSeason.program.id]);
			cachedProgram = this.cache.Programs.find(x => x.id === cachedSeason.program.id);
			if (typeof cachedProgram === "undefined") { 
				//we tried to load the program tied to the season from RE but it doesn't exist... return out of this method
				console.warn("WARN CacheController.LoadEventListBySeasonRegion - program tied to selected season doesn't exist in RE API");
				return;
			}
		}
		let addedEvent: boolean = false;
		//set up the cache object for this request
		if (typeof this.cache.Events[cachedProgram.id] === "undefined") {
			this.cache.Events[cachedProgram.id] = {};
			addedEvent = true;
		}
		if (typeof this.cache.Events[cachedProgram.id][cachedSeason.id] === "undefined") {
			this.cache.Events[cachedProgram.id][cachedSeason.id] = {};
			addedEvent = true;
		}
		if (typeof this.cache.Events[cachedProgram.id][cachedSeason.id][region] === "undefined") {
			this.cache.Events[cachedProgram.id][cachedSeason.id][region] = [];
			addedEvent = true;
		}
		console.log(`CacheController.LoadEventListBySeasonRegion - Events`);
		let thisResponse: REAPI.API.Event.List.Response | REAPI.API.Error = await API.Event.List(request);
		while (API.ValidResponse<REAPI.API.Event.List.Response>(thisResponse)) {
			//we have a valid list of events that can go in the cache (if they aren't there already)
			for (let x of thisResponse.data) {
				//for this application, we only care about finalized events
				if (x.awards_finalized || allowNonFinal) {
					let existingEvent = this.cache.Events[cachedProgram.id][cachedSeason.id][region].find(y => y.EventInfo.id === x.id && y.EventInfo.sku === x.sku);
					//if the event is cached but it has been completed since the cache, update the cache to get all information
					if (typeof existingEvent === "undefined" || existingEvent.EventInfo.awards_finalized !== x.awards_finalized) {
						//this event doesn't exist in the cache yet - add it
						const cacheEventObject: EC_EventInfo = {
							id: x.id,
							sku: x.sku,
							name: x.name,
							start: x.start,
							end: x.end,
							location: x.location,
							divisions: x.divisions,
							level: x.level,
							ongoing: x.ongoing,
							awards_finalized: x.awards_finalized,
							event_type: x.event_type
						};
						let cacheObject: EventCacheObject = {
							EventInfo: cacheEventObject,
							TeamResults: {},
							QualiMatches: {},
							ElimMatches: {},
							Awards: []
						};
						//if cached event exists and we are still creating cache (in the event the tournament is finalized), remove the old cache
						if (typeof existingEvent !== "undefined") {
							this.cache.Events[cachedProgram.id][cachedSeason.id][x.location.region] = this.cache.Events[cachedProgram.id][cachedSeason.id][x.location.region].filter(y => y.EventInfo.id !== existingEvent.EventInfo.id);
						}
						this.cache.Events[cachedProgram.id][cachedSeason.id][region].push(cacheObject);
						await this.LoadEventCacheObject(cacheObject, cachedSeason);
						addedEvent = true;
					}
				}
			}

			if (thisResponse.meta.next_page_url === null) {
				//no more pages of data to load, break out of loop
				break;
			}
			else {
				thisResponse = await API.Event.List(null, thisResponse.meta.next_page_url);
			}
		}
		if (!API.ValidResponse<REAPI.API.Event.List.Response>(thisResponse)) {
			console.error("ERROR CacheController.LoadProgramList - Invalid response from RE", thisResponse);
		}
		if (addedEvent) {
			this.UpdateCacheFile();
		}
		console.log(`CacheController.LoadEventListBySeasonRegion - End - ${seasonID} ${region}`);
	}

	//Call the RE API to get a list of events that a team has participated in for a given season
	public async LoadEventListBySeasonTeam(seasonID: number, teamID: number): Promise<void> {
		console.log(`CacheController.LoadEventListBySeasonTeam - Begin - ${seasonID} ${teamID}`);
		//check if the season needs to be loaded into the cache
		let cachedSeason = this.cache.Seasons.find(x => x.id === seasonID);
		if (typeof cachedSeason === "undefined") {
			console.log(`CacheController.LoadEventListBySeasonTeam - Load Season`);
			await this.LoadSeasonList([], [seasonID]);
			cachedSeason = this.cache.Seasons.find(x => x.id === seasonID);
			if (typeof cachedSeason === "undefined") {
				//we tried to load the requested season from RE but it doesn't exist... return out of this method
				console.warn("WARN CacheController.LoadEventListBySeasonTeam - selected season doesn't exist in RE API");
				return;
			}
		}
		//load the program that this season belongs to if we don't have it already
		let cachedProgram = this.cache.Programs.find(x => x.id === cachedSeason.program.id);
		if (typeof cachedProgram === "undefined") {
			console.log(`CacheController.LoadEventListBySeasonTeam - Load Program`);
			await this.LoadProgramList([cachedSeason.program.id]);
			cachedProgram = this.cache.Programs.find(x => x.id === cachedSeason.program.id);
			if (typeof cachedProgram === "undefined") { 
				//we tried to load the program tied to the season from RE but it doesn't exist... return out of this method
				console.warn("WARN CacheController.LoadEventListBySeasonTeam - program tied to selected season doesn't exist in RE API");
				return;
			}
		}
		if (typeof this.cache.Teams[seasonID] === "undefined") {
			this.cache.Teams[seasonID] = {};
		}
		//check if the team needs to be loaded into the cache
		let cachedTeam = this.cache.Teams[seasonID][teamID];
		if (typeof cachedTeam === "undefined") {
			console.log(`CacheController.LoadEventListBySeasonTeam - Load Team`);
			//load for the current season based on TeamID
			const teamRequest: REAPI.API.Team.Single.Request = {
				TeamID: teamID
			};
			const teamResponse = await API.Team.Single(teamRequest);
			if (API.ValidResponse<REAPI.API.Team.Single.Response>(teamResponse)) {
				cachedTeam = teamResponse;
				this.cache.Teams[seasonID][teamID] = teamResponse;
				if (typeof this.cache.TeamReverseLookup[cachedSeason.id] === "undefined") {
					this.cache.TeamReverseLookup[cachedSeason.id] = {};
				}
				if (typeof this.cache.TeamReverseLookup[cachedSeason.id][teamResponse.number] === "undefined") {
					this.cache.TeamReverseLookup[cachedSeason.id][teamResponse.number] = teamResponse.id;
				}
			}
			else {
				//we tried to load the team from RE but it doesn't exist... return out of this method
				console.warn("WARN CacheController.LoadEventListBySeasonTeam - selected team doesn't exist in RE API");
				return;
			}
		}

		//get a list of all events the team has attended this season
		console.log(`CacheController.LoadEventListBySeasonTeam - Events`);
		const eventRequest: REAPI.API.Team.Events.Request = {
			TeamID: teamID,
			SeasonID: [seasonID]
		};
		let addedEvent: boolean = false;
		//set up the cache object for this request
		if (typeof this.cache.Events[cachedProgram.id] === "undefined") {
			this.cache.Events[cachedProgram.id] = {};
			addedEvent = true;
		}
		if (typeof this.cache.Events[cachedProgram.id][cachedSeason.id] === "undefined") {
			this.cache.Events[cachedProgram.id][cachedSeason.id] = {};
			addedEvent = true;
		}
		let eventResponse = await API.Team.Events(eventRequest);
		while (API.ValidResponse<REAPI.API.Team.Events.Response>(eventResponse)) {
			//we have a valid list of events that can go in the cache (if they aren't there already)
			for (let x of eventResponse.data) {
				//for this application, we only care about finalized events
				if (x.awards_finalized) {
					//region is going to be x.location.region for now
					if (typeof this.cache.Events[cachedProgram.id][cachedSeason.id][x.location.region] === "undefined") {
						this.cache.Events[cachedProgram.id][cachedSeason.id][x.location.region] = [];
					}
					let existingEvent = this.cache.Events[cachedProgram.id][cachedSeason.id][x.location.region].find(y => y.EventInfo.id === x.id && y.EventInfo.sku === x.sku);
					//if the event is cached but it has been completed since the cache, update the cache to get all information
					if (typeof existingEvent === "undefined" || existingEvent.EventInfo.awards_finalized !== x.awards_finalized) {
						//this event doesn't exist in the cache yet - add it
						const cacheEventObject: EC_EventInfo = {
							id: x.id,
							sku: x.sku,
							name: x.name,
							start: x.start,
							end: x.end,
							location: x.location,
							divisions: x.divisions,
							level: x.level,
							ongoing: x.ongoing,
							awards_finalized: x.awards_finalized,
							event_type: x.event_type
						};
						let cacheObject: EventCacheObject = {
							EventInfo: cacheEventObject,
							TeamResults: {},
							QualiMatches: {},
							ElimMatches: {},
							Awards: []
						};
						//if cached event exists and we are still creating cache (in the event the tournament is finalized), remove the old cache
						if (typeof existingEvent !== "undefined") {
							this.cache.Events[cachedProgram.id][cachedSeason.id][x.location.region] = this.cache.Events[cachedProgram.id][cachedSeason.id][x.location.region].filter(y => y.EventInfo.id !== existingEvent.EventInfo.id);
						}
						this.cache.Events[cachedProgram.id][cachedSeason.id][x.location.region].push(cacheObject);
						await this.LoadEventCacheObject(cacheObject, cachedSeason);
						addedEvent = true;
					}
				}
			}

			if (eventResponse.meta.next_page_url === null) {
				//no more pages of data to load, break out of loop
				break;
			}
			else {
				eventResponse = await API.Event.List(null, eventResponse.meta.next_page_url);
			}
		}
		if (!API.ValidResponse<REAPI.API.Event.List.Response>(eventResponse)) {
			console.error("ERROR CacheController.LoadProgramList - Invalid response from RE", eventResponse);
		}
		if (addedEvent) {
			this.UpdateCacheFile();
		}
		console.log(`CacheController.LoadEventListBySeasonTeam - End - ${seasonID} ${teamID}`);
	}

	//Call the RE API to get a list of programs to populate in the cache
	public async LoadProgramList(idFilter?: number[]): Promise<void> {
		const request: REAPI.API.Program.List.Request = {
			ProgramID: idFilter
		};
		let addedPrograms: boolean = false;
		let thisResponse: REAPI.API.Program.List.Response | REAPI.API.Error = await API.Program.List(request);
		while (API.ValidResponse<REAPI.API.Program.List.Response>(thisResponse)) {
			//we have a valid list of programs that can go in the cache (if they aren't there already)
			thisResponse.data.forEach(x => {
				let existingProgram = this.cache.Programs.find(y => y.id === x.id && y.name === x.name && y.abbr === x.abbr);
				if (typeof existingProgram === "undefined") {
					//this program doesn't exist in the cache yet - add it
					this.cache.Programs.push(x);
					addedPrograms = true;
				}
			});

			if (thisResponse.meta.next_page_url === null) {
				//no more pages of data to load, break out of loop
				break;
			}
			else {
				thisResponse = await API.Program.List(null, thisResponse.meta.next_page_url);
			}
		}
		if (!API.ValidResponse<REAPI.API.Program.List.Response>(thisResponse)) {
			console.error("ERROR CacheController.LoadProgramList - Invalid response from RE", thisResponse);
		}
		if (addedPrograms) {
			this.UpdateCacheFile();
		}
	}

	//Call the RE API to get a list of seasons to populate in the cache
	public async LoadSeasonList(programIDFilter?: number[], seasonIDFilter?: number[], activeFilter?: boolean): Promise<void> {
		const request: REAPI.API.Season.List.Request = {
			ProgramID: programIDFilter,
			SeasonID: seasonIDFilter,
			ActiveSeason: activeFilter
		};
		let addedSeasons: boolean = false;
		let thisResponse: REAPI.API.Season.List.Response | REAPI.API.Error = await API.Season.List(request);
		while (API.ValidResponse<REAPI.API.Season.List.Response>(thisResponse)) {
			//we have a valid list of seasons that can go in the cache (if they aren't there already)
			thisResponse.data.forEach(x => {
				let existingSeason = this.cache.Seasons.find(y => y.id === x.id && y.name === x.name && y.program === x.program);
				if (typeof existingSeason === "undefined") {
					//this program doesn't exist in the cache yet - add it
					this.cache.Seasons.push(x);
					addedSeasons = true;
				}
			});

			if (thisResponse.meta.next_page_url === null) {
				//no more pages of data to load, break out of loop
				break;
			}
			else {
				thisResponse = await API.Season.List(null, thisResponse.meta.next_page_url);
			}
		}
		if (!API.ValidResponse<REAPI.API.Season.List.Response>(thisResponse)) {
			console.error("ERROR CacheController.LoadSeasonList - Invalid response from RE", thisResponse);
		}
		if (addedSeasons) {
			this.UpdateCacheFile();
		}
	}

	public ReturnCache(): RECache {
		return this.cache;
	}

	private UpdateCacheFile(): void {
		try {
			const jsonData = JSON.stringify(this.cache, null, this.saveWhitespace ? 2 : 0);
			writeFileSync(this.filePath, jsonData, {encoding: "utf-8"});
		}
		catch (e) {
			console.error("ERROR CacheController.UpdateCacheFile() - Cannot access or write cache file", e);
			throw e;
		}
	}
}
