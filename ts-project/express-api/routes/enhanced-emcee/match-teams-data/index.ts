import {EC_EventInfo, RECache, TSProj} from "types-lib";

interface HighestNumberEvent {
	Event: EC_EventInfo | null;
	Value: number;
}

interface WLT {
	Win: number;
	Loss: number;
	Tie: number;
}

const GetMatchTeamData = (programID: number, seasonID: number, region: string | null, blue: string[], red: string[], cache: RECache): TSProj.EnhancedEmcee.MatchTeams.DataResponse => {
	const response: TSProj.EnhancedEmcee.MatchTeams.DataResponse = {};
	/*
		Header line - team number and name
		Subheader line - organization info, city, state
		Season data
			Highest points per quali match at tournament
			Highest points in quali matches at tournament
			Total matches participated in
			Total skills attempts
			Highest skills result
			W-L-T as alliance color (quali, elim, overall)
		With alliance mate(s)
			Win rate
			Points scored
			Average points per match
			Tournaments
				Match result
		Against alliance opponents
			Tournament
			Match result
		Per Tournament data
			Qualification W-L-T -
			Qualification WP/AP/SP -
			Qualification rank -
			Points per quali match -
			Total quali points -
			Elimination results
			Elimination partner
			Skills results
			Awards (and where they qualified for if possible)
	*/
	const seasonEventDict = cache.Events[programID][seasonID];
	const regionKeys = Object.keys(seasonEventDict);
	const blueReverseLookup: number[] = [];
	const redReverseLookup: number[] = [];
	blue.forEach(x => blueReverseLookup.push(cache.TeamReverseLookup[seasonID][x]));
	red.forEach(x => redReverseLookup.push(cache.TeamReverseLookup[seasonID][x]));

	for (let bIndex = 0; bIndex < blue.length; bIndex++) {
		const curBlueTeam = blue[bIndex];
		response[curBlueTeam] = {
			HeaderLine: "",
			SubHeaderLine: "",
			DataHeaders: []
		};
		const teamDataResponse = response[curBlueTeam];
		const teamInformation = cache.Teams[seasonID][blueReverseLookup[bIndex]];
		teamDataResponse.HeaderLine = `${teamInformation.number} - ${teamInformation.team_name}`;
		teamDataResponse.SubHeaderLine = `${teamInformation.organization} (${teamInformation.location.region}) - ${teamInformation.grade}`;

		const header_SeasonCompiled: TSProj.EnhancedEmcee.Common.HeaderItem = {
			name: "Season Stats",
			order: 1,
			data: []
		};
		const header_WithAlliance1: TSProj.EnhancedEmcee.Common.HeaderItem = {
			name: "With Alliance Partner 1",
			order: 2,
			data: []
		};
		const header_WithAlliance2: TSProj.EnhancedEmcee.Common.HeaderItem = {
			name: "With Alliance Partner 2",
			order: 3,
			data: []
		};
		const header_AgainstAlliance1: TSProj.EnhancedEmcee.Common.HeaderItem = {
			name: "Against Alliance Partner 1",
			order: 4,
			data: []
		};
		const header_AgainstAlliance2: TSProj.EnhancedEmcee.Common.HeaderItem = {
			name: "Against Alliance Partner 2",
			order: 5,
			data: []
		};
		const header_AgainstAlliance3: TSProj.EnhancedEmcee.Common.HeaderItem = {
			name: "Against Alliance Partner 3",
			order: 6,
			data: []
		};
		let headerOrder = 7;
		teamDataResponse.DataHeaders.push(header_SeasonCompiled);
		teamDataResponse.DataHeaders.push(header_WithAlliance1);
		teamDataResponse.DataHeaders.push(header_AgainstAlliance1);
		teamDataResponse.DataHeaders.push(header_AgainstAlliance2);

		//season compiled stats
		let tournamentCount = 0;
		let matchCountQuali = 0;
		let matchCountElim = 0;
		let driverSkillsAttempts = 0;
		let progSkillsAttempts = 0;
		let totalQualiRank = 0;
		let highestPPQM: HighestNumberEvent = {Event: null, Value: 0};
		let highestTPQM: HighestNumberEvent = {Event: null, Value: 0};
		let highDriverSkills: HighestNumberEvent = {Event: null, Value: 0};
		let highProgSkills: HighestNumberEvent = {Event: null, Value: 0};
		let highCombinedSkills: HighestNumberEvent = {Event: null, Value: 0};
		let seasonQualiWLT: WLT = {Win: 0, Loss: 0, Tie: 0};
		let seasonElimWLT: WLT = {Win: 0, Loss: 0, Tie: 0};
		for (let regionKey of regionKeys) {
			for (let cachedEvent of seasonEventDict[regionKey]) {
				if (cachedEvent.EventInfo.awards_finalized && typeof cachedEvent.TeamResults[blueReverseLookup[bIndex]] !== "undefined") {
					//the team competed at this completed tournament, load their results
					tournamentCount++;
					const thisTeamResults = cachedEvent.TeamResults[blueReverseLookup[bIndex]];
					let tourneyDate = new Date(cachedEvent.EventInfo.start);
					const header_tournament: TSProj.EnhancedEmcee.Common.HeaderItem = {
						name: `${cachedEvent.EventInfo.name} (${tourneyDate.toDateString()})`,
						order: headerOrder++,
						data: []
					};
					teamDataResponse.DataHeaders.push(header_tournament);

					//get qualification rankings data
					const qualiResultsDisplay: TSProj.EnhancedEmcee.Common.DisplayElement = {
						label: "Qualification Results",
						value: []
					};
					header_tournament.data.push(qualiResultsDisplay);
					const qualiRank = thisTeamResults.QualiRanking;
					seasonQualiWLT.Win += qualiRank.wins;
					seasonQualiWLT.Loss += qualiRank.losses;
					seasonQualiWLT.Tie += qualiRank.ties;
					totalQualiRank += qualiRank.ties;
					qualiResultsDisplay.value.push(`${qualiRank.wins}-${qualiRank.losses}-${qualiRank.ties}`);
					qualiResultsDisplay.value.push(`${qualiRank.wp} WP/${qualiRank.ap} AP/${qualiRank.sp} SP`);
					qualiResultsDisplay.value.push(`Rank ${qualiRank.rank}`);
					matchCountQuali += qualiRank.wins + qualiRank.losses + qualiRank.ties;

					const qualiPointsDisplay: TSProj.EnhancedEmcee.Common.DisplayElement = {
						label: "Qualification Points",
						value: []
					};
					header_tournament.data.push(qualiResultsDisplay);
					qualiPointsDisplay.value.push(`${qualiRank.average_points} average points/match`);
					qualiPointsDisplay.value.push(`${qualiRank.total_points} total points`);
					qualiPointsDisplay.value.push(`High score: ${qualiRank.high_score}`);
					if (highestPPQM.Value < qualiRank.average_points) {
						highestPPQM.Event = cachedEvent.EventInfo;
						highestPPQM.Value = qualiRank.average_points;
					}
					if (highestTPQM.Value < qualiRank.total_points) {
						highestTPQM.Event = cachedEvent.EventInfo;
						highestTPQM.Value = qualiRank.average_points;
					}

					//get elimination results (if any)


					//get skills results
					if (thisTeamResults.SkillsResults.length > 0) {
						const skillsDisplay: TSProj.EnhancedEmcee.Common.DisplayElement = {
							label: "Skills Results",
							value: []
						};
						header_tournament.data.push(skillsDisplay);
						skillsDisplay.value.push("Rank: ");
						skillsDisplay.value.push("Driver: ");
						skillsDisplay.value.push("Programming: ");
						skillsDisplay.value.push("Total: ");
						let totalScore = 0;
						for (let thisSkill of thisTeamResults.SkillsResults) {
							if (thisSkill.type === "driver") {
								driverSkillsAttempts += thisSkill.attempts;
								totalScore += thisSkill.score;
								if (highDriverSkills.Value < thisSkill.score) {
									highDriverSkills.Event = cachedEvent.EventInfo;
									highDriverSkills.Value = thisSkill.score;
								}
							}
							else if (thisSkill.type === "programming") {
								progSkillsAttempts += thisSkill.attempts;
								totalScore += thisSkill.score;
								if (highProgSkills.Value < thisSkill.score) {
									highProgSkills.Event = cachedEvent.EventInfo;
									highProgSkills.Value = thisSkill.score;
								}
							}
						}
					}
				}
			}
		}
	}




	return response;
}

export default GetMatchTeamData;
