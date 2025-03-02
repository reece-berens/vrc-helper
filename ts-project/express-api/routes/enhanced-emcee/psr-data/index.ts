import {EC_EventInfo, REAPI, RECache, TSProj} from "types-lib";

interface CountByTeamID {
	[key: number]: number;
}

interface TeamEventCombo {
	Event: EC_EventInfo;
	Team: REAPI.Objects.Team;
}

interface MatchEventCombo {
	Event: EC_EventInfo;
	Match: REAPI.Objects.MatchObj;
	allianceColor: "blue" | "red";
}

interface HighestNumberEvent {
	Combos: TeamEventCombo[];
	Value: number;
}

interface HighestScores {
	Combos: MatchEventCombo[];
	Value: number;
}

interface QualiElim {
	Elim: number;
	Quali: number;
}

interface WLT {
	Quali: {
		Win: number;
		Loss: number;
		Tie: number;
	}
	Elim: {
		Win: number;
		Loss: number;
		Tie: number;
	}
}

interface SeasonTournamentType {
	TournamentCount: number;
	OrgNums: string[];
	RegionTeams: number[];
	NonRegionTeams: number[];
	MatchCount: QualiElim;
	PointsScored: QualiElim;
	BlueResults: WLT;
	RedResults: WLT;
	RegionSkillsRuns: number;
	NonRegionSkillsRuns: number;
	HighestAverageQualiScore: HighestNumberEvent;
	HighestAutonomousPoints: HighestNumberEvent;
	AwardCount: number;
}

const GetPSRData = (programID: number, seasonID: number, region: string, cache: RECache): TSProj.EnhancedEmcee.ProgramSeasonRegion.DataResponse => {
	/*
		Data points per region (all of them split by MS or HS, blended counts as both)
			Number of tournaments
			Total teams participating in tournaments
			Total organizations participating in tournaments (by team number since casing is weird on some)
			Total matches
				Break by quali and elim
			Win percentage for blue and red alliance
				Break by quali and elim
			Total points scored
				Break by quali and elim
			Total number of skills runs
			Teams participating in the most tournaments in the region
			Highest average score in quali matches in a single tournament
			Highest autonomous points in a single tournament
			Highest total score in quali matches in a single tournament
			Team with best average ranking in quali matches in region tournaments
			Most common alliance pairing in quali matches between MS and HS teams
		
		Assume that all the tournaments we want to record data for are already loaded into cache
	*/
	const msTournaments: SeasonTournamentType = {
		TournamentCount: 0,
		OrgNums: [],
		RegionTeams: [],
		NonRegionTeams: [],
		MatchCount: {Quali: 0, Elim: 0},
		PointsScored: {Quali: 0, Elim: 0},
		BlueResults: {Quali: {Win: 0, Loss: 0, Tie: 0}, Elim: {Win: 0, Loss: 0, Tie: 0}},
		RedResults: {Quali: {Win: 0, Loss: 0, Tie: 0}, Elim: {Win: 0, Loss: 0, Tie: 0}},
		RegionSkillsRuns: 0,
		NonRegionSkillsRuns: 0,
		HighestAutonomousPoints: {Combos: [], Value: 0},
		HighestAverageQualiScore: {Combos: [], Value: 0},
		AwardCount: 0,
	};

	const hsTournaments: SeasonTournamentType = {
		TournamentCount: 0,
		OrgNums: [],
		RegionTeams: [],
		NonRegionTeams: [],
		MatchCount: {Quali: 0, Elim: 0},
		PointsScored: {Quali: 0, Elim: 0},
		BlueResults: {Quali: {Win: 0, Loss: 0, Tie: 0}, Elim: {Win: 0, Loss: 0, Tie: 0}},
		RedResults: {Quali: {Win: 0, Loss: 0, Tie: 0}, Elim: {Win: 0, Loss: 0, Tie: 0}},
		RegionSkillsRuns: 0,
		NonRegionSkillsRuns: 0,
		HighestAutonomousPoints: {Combos: [], Value: 0},
		HighestAverageQualiScore: {Combos: [], Value: 0},
		AwardCount: 0,
	};

	const blendedTournaments: SeasonTournamentType = {
		TournamentCount: 0,
		OrgNums: [],
		RegionTeams: [],
		NonRegionTeams: [],
		MatchCount: {Quali: 0, Elim: 0},
		PointsScored: {Quali: 0, Elim: 0},
		BlueResults: {Quali: {Win: 0, Loss: 0, Tie: 0}, Elim: {Win: 0, Loss: 0, Tie: 0}},
		RedResults: {Quali: {Win: 0, Loss: 0, Tie: 0}, Elim: {Win: 0, Loss: 0, Tie: 0}},
		RegionSkillsRuns: 0,
		NonRegionSkillsRuns: 0,
		HighestAutonomousPoints: {Combos: [], Value: 0},
		HighestAverageQualiScore: {Combos: [], Value: 0},
		AwardCount: 0,
	};

	const msv_highestSkillsDriver: HighestNumberEvent = {
		Combos: [],
		Value: 0
	};
	const msv_highestSkillsProgram: HighestNumberEvent = {
		Combos: [],
		Value: 0
	};
	const msv_highestSkillsCombined: HighestNumberEvent = {
		Combos: [],
		Value: 0
	};
	const msv_highestAllianceScore: HighestScores = {
		Combos: [],
		Value: 0
	};
	const msv_highestAvgQualiPoints: HighestNumberEvent = {
		Combos: [],
		Value: 0
	};
	const msv_matchCountTeams: CountByTeamID = {};
	const msv_tournamentCountTeams: CountByTeamID = {};

	const hsv_highestSkillsDriver: HighestNumberEvent = {
		Combos: [],
		Value: 0
	};
	const hsv_highestSkillsProgram: HighestNumberEvent = {
		Combos: [],
		Value: 0
	};
	const hsv_highestSkillsCombined: HighestNumberEvent = {
		Combos: [],
		Value: 0
	};
	const hsv_highestAllianceScore: HighestScores = {
		Combos: [],
		Value: 0
	};
	const hsv_highestAvgQualiPoints: HighestNumberEvent = {
		Combos: [],
		Value: 0
	};
	const hsv_matchCountTeams: CountByTeamID = {};
	const hsv_tournamentCountTeams: CountByTeamID = {};
	
	

	if (typeof cache.Events !== "undefined" && typeof cache.Events[programID] !== "undefined" && typeof cache.Events[programID][seasonID] !== "undefined" && typeof cache.Events[programID][seasonID][region] !== "undefined" &&
		typeof cache.TeamReverseLookup !== "undefined" && typeof cache.TeamReverseLookup[seasonID] !== "undefined" && typeof cache.Teams !== "undefined" && typeof cache.Teams[seasonID] !== "undefined"
	) {
		//we have a valid list of events for this program, season, and region
		const eventList = cache.Events[programID][seasonID][region];
		for (let curEvent of eventList) {
			const thisRegionTeams: number[] = [];
			const thisNonRegionTeams: number[] = [];
			const thisOrgNums: string[] = [];
			const thisMatchCount: QualiElim = {Quali: 0, Elim: 0};
			const thisPointsScored: QualiElim = {Quali: 0, Elim: 0};
			const thisBlueResults: WLT = {Quali: {Win: 0, Loss: 0, Tie: 0}, Elim: {Win: 0, Loss: 0, Tie: 0}};
			const thisRedResults: WLT = {Quali: {Win: 0, Loss: 0, Tie: 0}, Elim: {Win: 0, Loss: 0, Tie: 0}};
			const thisHighestAutoPointAvg: HighestNumberEvent = {Combos: [], Value: 0};
			const thisHighestAvgQualiScore: HighestNumberEvent = {Combos: [], Value: 0};

			let isHSEvent: boolean = false;
			let isMSEvent: boolean = false;
			let isBlendedEvent: boolean = false;
			//for the moment, if a tournament has both MS and HS teams, aka a blended tournament, it's considered both. Blended tournaments may get split into their own section later, idk
			for (let teamParticipatingID of Object.keys(curEvent.TeamResults)) {
				const teamIDInt = parseInt(teamParticipatingID);
				const teamInfo = cache.Teams[seasonID][teamIDInt];
				if (teamInfo.grade === "High School") {
					isHSEvent = true;
					if (isMSEvent) {
						isBlendedEvent = true;
					}
				}
				else if (teamInfo.grade === "Middle School") {
					isMSEvent = true;
					if (isHSEvent) {
						isBlendedEvent = true;
					}
				}
				if (teamInfo.location.region === region) {
					//make the list large, then filter distinct ones later
					thisRegionTeams.push(teamIDInt);
					for (let i = 0; i < teamInfo.number.length; i++) {
						if (/[A-Z]/.test(teamInfo.number[i])) {
							thisOrgNums.push(teamInfo.number.substring(0, i));
							break;
						}
					}
					if (isBlendedEvent) {
						for (let skillResult of curEvent.TeamResults[teamIDInt].SkillsResults) {
							blendedTournaments.RegionSkillsRuns += skillResult.attempts;
						}
					}
					else if (isHSEvent) {
						for (let skillResult of curEvent.TeamResults[teamIDInt].SkillsResults) {
							hsTournaments.RegionSkillsRuns += skillResult.attempts;
						}
						if (typeof hsv_tournamentCountTeams[teamIDInt] === "undefined") {
							console.log(`first load of HS team tourney count - ${cache.Teams[seasonID][teamIDInt].number}`);
							hsv_tournamentCountTeams[teamIDInt] = 0;
						}
						hsv_tournamentCountTeams[teamIDInt] = hsv_tournamentCountTeams[teamIDInt] + 1;
					}
					else if (isMSEvent) {
						for (let skillResult of curEvent.TeamResults[teamIDInt].SkillsResults) {
							msTournaments.RegionSkillsRuns += skillResult.attempts;
						}
						if (typeof msv_tournamentCountTeams[teamIDInt] === "undefined") {
							console.log(`first load of MS team tourney count - ${cache.Teams[seasonID][teamIDInt].number}`);
							msv_tournamentCountTeams[teamIDInt] = 0;
						}
						msv_tournamentCountTeams[teamIDInt] = msv_tournamentCountTeams[teamIDInt] + 1;
					}
				}
				else {
					thisNonRegionTeams.push(teamIDInt);
					if (isBlendedEvent) {
						for (let skillResult of curEvent.TeamResults[teamIDInt].SkillsResults) {
							blendedTournaments.NonRegionSkillsRuns += skillResult.attempts;
						}
					}
					else if (isHSEvent) {
						for (let skillResult of curEvent.TeamResults[teamIDInt].SkillsResults) {
							hsTournaments.NonRegionSkillsRuns += skillResult.attempts;
						}
					}
					else if (isMSEvent) {
						for (let skillResult of curEvent.TeamResults[teamIDInt].SkillsResults) {
							msTournaments.NonRegionSkillsRuns += skillResult.attempts;
						}
					}
				}

				if (teamInfo.grade === "Middle School") {
					let totalScore = 0;
					const driverSkills = curEvent.TeamResults[teamIDInt].SkillsResults.find(x => x.type === "driver");
					if (typeof driverSkills !== "undefined") {
						totalScore += driverSkills.score;
						if (driverSkills.score === msv_highestSkillsDriver.Value) {
							msv_highestSkillsDriver.Combos.push({Event: curEvent.EventInfo, Team: teamInfo});
						}
						else if (driverSkills.score > msv_highestSkillsDriver.Value) {
							msv_highestSkillsDriver.Combos = [{Event: curEvent.EventInfo, Team: teamInfo}];
							msv_highestSkillsDriver.Value = driverSkills.score;
						}
					}
					const programSkills = curEvent.TeamResults[teamIDInt].SkillsResults.find(x => x.type === "programming");
					if (typeof programSkills !== "undefined") {
						totalScore += programSkills.score;
						if (programSkills.score === msv_highestSkillsProgram.Value) {
							msv_highestSkillsProgram.Combos.push({Event: curEvent.EventInfo, Team: teamInfo});
						}
						else if (programSkills.score > msv_highestSkillsProgram.Value) {
							msv_highestSkillsProgram.Combos = [{Event: curEvent.EventInfo, Team: teamInfo}];
							msv_highestSkillsProgram.Value = programSkills.score;
						}
					}
					if (totalScore === msv_highestSkillsCombined.Value) {
						msv_highestSkillsCombined.Combos.push({Event: curEvent.EventInfo, Team: teamInfo});
					}
					else if (totalScore > msv_highestSkillsCombined.Value) {
						msv_highestSkillsCombined.Combos = [{Event: curEvent.EventInfo, Team: teamInfo}];
						msv_highestSkillsCombined.Value = totalScore;
					}
				}
				else if (teamInfo.grade === "High School") {
					let totalScore = 0;
					const driverSkills = curEvent.TeamResults[teamIDInt].SkillsResults.find(x => x.type === "driver");
					if (typeof driverSkills !== "undefined") {
						totalScore += driverSkills.score;
						if (driverSkills.score === hsv_highestSkillsDriver.Value) {
							hsv_highestSkillsDriver.Combos.push({Event: curEvent.EventInfo, Team: teamInfo});
						}
						else if (driverSkills.score > hsv_highestSkillsDriver.Value) {
							hsv_highestSkillsDriver.Combos = [{Event: curEvent.EventInfo, Team: teamInfo}];
							hsv_highestSkillsDriver.Value = driverSkills.score;
						}
					}
					const programSkills = curEvent.TeamResults[teamIDInt].SkillsResults.find(x => x.type === "programming");
					if (typeof programSkills !== "undefined") {
						totalScore += programSkills.score;
						if (programSkills.score === hsv_highestSkillsProgram.Value) {
							hsv_highestSkillsProgram.Combos.push({Event: curEvent.EventInfo, Team: teamInfo});
						}
						else if (programSkills.score > hsv_highestSkillsProgram.Value) {
							hsv_highestSkillsProgram.Combos = [{Event: curEvent.EventInfo, Team: teamInfo}];
							hsv_highestSkillsProgram.Value = programSkills.score;
						}
					}
					if (totalScore === hsv_highestSkillsCombined.Value) {
						hsv_highestSkillsCombined.Combos.push({Event: curEvent.EventInfo, Team: teamInfo});
					}
					else if (totalScore > hsv_highestSkillsCombined.Value) {
						hsv_highestSkillsCombined.Combos = [{Event: curEvent.EventInfo, Team: teamInfo}];
						hsv_highestSkillsCombined.Value = totalScore;
					}
				}

				const qualiRank = curEvent.TeamResults[teamIDInt].QualiRanking;
				if (qualiRank.average_points === thisHighestAvgQualiScore.Value) {
					thisHighestAvgQualiScore.Combos.push({Event: curEvent.EventInfo, Team: teamInfo});
				}
				else if (qualiRank.average_points > thisHighestAvgQualiScore.Value) {
					thisHighestAvgQualiScore.Combos = [{Event: curEvent.EventInfo, Team: teamInfo}];
					thisHighestAvgQualiScore.Value = qualiRank.average_points;
				}
				let apAvg = qualiRank.ap / (qualiRank.losses + qualiRank.ties + qualiRank.wins);
				if (apAvg === thisHighestAutoPointAvg.Value) {
					thisHighestAutoPointAvg.Combos.push({Event: curEvent.EventInfo, Team: teamInfo});
				}
				else if (apAvg > thisHighestAutoPointAvg.Value) {
					thisHighestAutoPointAvg.Combos = [{Event: curEvent.EventInfo, Team: teamInfo}];
					thisHighestAutoPointAvg.Value = apAvg;
				}

				if (!isBlendedEvent) {
					if (isMSEvent) {
						if (qualiRank.average_points === msv_highestAvgQualiPoints.Value) {
							msv_highestAvgQualiPoints.Combos.push({Event: curEvent.EventInfo, Team: teamInfo});
						}
						else if (qualiRank.average_points > msv_highestAvgQualiPoints.Value) {
							msv_highestAvgQualiPoints.Combos = [{Event: curEvent.EventInfo, Team: teamInfo}];
							msv_highestAvgQualiPoints.Value = qualiRank.average_points;
						}
					}
					else if (isHSEvent) {
						if (qualiRank.average_points === hsv_highestAvgQualiPoints.Value) {
							hsv_highestAvgQualiPoints.Combos.push({Event: curEvent.EventInfo, Team: teamInfo});
						}
						else if (qualiRank.average_points > hsv_highestAvgQualiPoints.Value) {
							hsv_highestAvgQualiPoints.Combos = [{Event: curEvent.EventInfo, Team: teamInfo}];
							hsv_highestAvgQualiPoints.Value = qualiRank.average_points;
						}
					}
				}
			}
			for (let curQualiDiv of Object.keys(curEvent.QualiMatches)) {
				const qualiDivInt = parseInt(curQualiDiv);
				for (let curQualiMatch of curEvent.QualiMatches[qualiDivInt]) {
					thisMatchCount.Quali++;
					//we are only going to have 2 alliances per match
					const a1 = curQualiMatch.alliances[0];
					const a2 = curQualiMatch.alliances[1]
					thisPointsScored.Quali += a1.score;
					thisPointsScored.Quali += a2.score;
					if (a1.score < a2.score) {
						thisBlueResults.Quali.Loss += (a1.color === "blue" ? 1 : 0);
						thisRedResults.Quali.Loss += (a1.color === "red" ? 1 : 0);

						thisBlueResults.Quali.Win += (a1.color === "blue" ? 0 : 1);
						thisRedResults.Quali.Win += (a1.color === "red" ? 0 : 1);
					}
					else if (a1.score > a2.score) {
						thisBlueResults.Quali.Win += (a1.color === "blue" ? 1 : 0);
						thisRedResults.Quali.Win += (a1.color === "red" ? 1 : 0);

						thisBlueResults.Quali.Loss += (a1.color === "blue" ? 0 : 1);
						thisRedResults.Quali.Loss += (a1.color === "red" ? 0 : 1);
					}
					else {
						thisBlueResults.Quali.Tie++;
						thisRedResults.Quali.Tie++;
					}

					const a1t1 = a1.teams[0].team.id;
					const a1t2 = a1.teams[1].team.id;
					const a2t1 = a2.teams[0].team.id;
					const a2t2 = a2.teams[1].team.id;
					if (cache.Teams[seasonID][a1t1].grade === "Middle School" && cache.Teams[seasonID][a1t2].grade === "Middle School" &&
						cache.Teams[seasonID][a2t1].grade === "Middle School" && cache.Teams[seasonID][a2t2].grade === "Middle School"
					) {
						//this is an all-MS match, do the comparison on stuff
						if (a1.score === msv_highestAllianceScore.Value) {
							//only add a match once - it may already be added by the alliance partner's results
							const existingMatch = msv_highestAllianceScore.Combos.find(x => x.Match.id === curQualiMatch.id);
							if (typeof existingMatch === "undefined") {
								msv_highestAllianceScore.Combos.push({Event: curEvent.EventInfo, allianceColor: a1.color, Match: curQualiMatch});
							}
						}
						else if (a1.score > msv_highestAllianceScore.Value) {
							msv_highestAllianceScore.Combos = [{Event: curEvent.EventInfo, allianceColor: a1.color, Match: curQualiMatch}];
							msv_highestAllianceScore.Value = a1.score;
						}

						if (a2.score === msv_highestAllianceScore.Value) {
							//only add a match once - it may already be added by the alliance partner's results
							const existingMatch = msv_highestAllianceScore.Combos.find(x => x.Match.id === curQualiMatch.id);
							if (typeof existingMatch === "undefined") {
								msv_highestAllianceScore.Combos.push({Event: curEvent.EventInfo, allianceColor: a2.color, Match: curQualiMatch});
							}
							msv_highestAllianceScore.Combos.push({Event: curEvent.EventInfo, allianceColor: a2.color, Match: curQualiMatch});
						}
						else if (a2.score > msv_highestAllianceScore.Value) {
							msv_highestAllianceScore.Combos = [{Event: curEvent.EventInfo, allianceColor: a2.color, Match: curQualiMatch}];
							msv_highestAllianceScore.Value = a2.score;
						}
					}
					else if (cache.Teams[seasonID][a1t1].grade === "High School" && cache.Teams[seasonID][a1t2].grade === "High School" &&
						cache.Teams[seasonID][a2t1].grade === "High School" && cache.Teams[seasonID][a2t2].grade === "High School"
					) {
						//this is an all-HS match, do the comparison on stuff
						if (a1.score === hsv_highestAllianceScore.Value) {
							//only add a match once - it may already be added by the alliance partner's results
							const existingMatch = hsv_highestAllianceScore.Combos.find(x => x.Match.id === curQualiMatch.id);
							if (typeof existingMatch === "undefined") {
								hsv_highestAllianceScore.Combos.push({Event: curEvent.EventInfo, allianceColor: a1.color, Match: curQualiMatch});
							}
							hsv_highestAllianceScore.Combos.push({Event: curEvent.EventInfo, allianceColor: a1.color, Match: curQualiMatch});
						}
						else if (a1.score > hsv_highestAllianceScore.Value) {
							hsv_highestAllianceScore.Combos = [{Event: curEvent.EventInfo, allianceColor: a1.color, Match: curQualiMatch}];
							hsv_highestAllianceScore.Value = a1.score;
						}

						if (a2.score === hsv_highestAllianceScore.Value) {
							//only add a match once - it may already be added by the alliance partner's results
							const existingMatch = hsv_highestAllianceScore.Combos.find(x => x.Match.id === curQualiMatch.id);
							if (typeof existingMatch === "undefined") {
								hsv_highestAllianceScore.Combos.push({Event: curEvent.EventInfo, allianceColor: a2.color, Match: curQualiMatch});
							}
							hsv_highestAllianceScore.Combos.push({Event: curEvent.EventInfo, allianceColor: a2.color, Match: curQualiMatch});
						}
						else if (a2.score > hsv_highestAllianceScore.Value) {
							hsv_highestAllianceScore.Combos = [{Event: curEvent.EventInfo, allianceColor: a2.color, Match: curQualiMatch}];
							hsv_highestAllianceScore.Value = a2.score;
						}
					}

					if (cache.Teams[seasonID][a1t1].grade === "Middle School" && cache.Teams[seasonID][a1t1].location.region === region) {
						if (typeof msv_matchCountTeams[a1t1] === "undefined") {
							msv_matchCountTeams[a1t1] = 0;
						}
						msv_matchCountTeams[a1t1]++;
					}
					else if (cache.Teams[seasonID][a1t1].grade === "High School" && cache.Teams[seasonID][a1t1].location.region === region) {
						if (typeof hsv_matchCountTeams[a1t1] === "undefined") {
							hsv_matchCountTeams[a1t1] = 0;
						}
						hsv_matchCountTeams[a1t1]++;
					}
					if (cache.Teams[seasonID][a1t2].grade === "Middle School" && cache.Teams[seasonID][a1t2].location.region === region) {
						if (typeof msv_matchCountTeams[a1t2] === "undefined") {
							msv_matchCountTeams[a1t2] = 0;
						}
						msv_matchCountTeams[a1t2]++;
					}
					else if (cache.Teams[seasonID][a1t2].grade === "High School" && cache.Teams[seasonID][a1t2].location.region === region) {
						if (typeof hsv_matchCountTeams[a1t2] === "undefined") {
							hsv_matchCountTeams[a1t2] = 0;
						}
						hsv_matchCountTeams[a1t2]++;
					}
					if (cache.Teams[seasonID][a2t1].grade === "Middle School" && cache.Teams[seasonID][a2t1].location.region === region) {
						if (typeof msv_matchCountTeams[a2t1] === "undefined") {
							msv_matchCountTeams[a2t1] = 0;
						}
						msv_matchCountTeams[a2t1]++;
					}
					else if (cache.Teams[seasonID][a2t1].grade === "High School" && cache.Teams[seasonID][a2t1].location.region === region) {
						if (typeof hsv_matchCountTeams[a2t1] === "undefined") {
							hsv_matchCountTeams[a2t1] = 0;
						}
						hsv_matchCountTeams[a2t1]++;
					}
					if (cache.Teams[seasonID][a2t2].grade === "Middle School" && cache.Teams[seasonID][a2t2].location.region === region) {
						if (typeof msv_matchCountTeams[a2t2] === "undefined") {
							msv_matchCountTeams[a2t2] = 0;
						}
						msv_matchCountTeams[a2t2]++;
					}
					else if (cache.Teams[seasonID][a2t2].grade === "High School" && cache.Teams[seasonID][a2t2].location.region === region) {
						if (typeof hsv_matchCountTeams[a2t2] === "undefined") {
							hsv_matchCountTeams[a2t2] = 0;
						}
						hsv_matchCountTeams[a2t2]++;
					}
				}
			}
			for (let curElimDiv of Object.keys(curEvent.ElimMatches)) {
				const elimDivInt = parseInt(curElimDiv);
				for (let curElimMatch of curEvent.ElimMatches[elimDivInt]) {
					thisMatchCount.Elim++;
					//we are only going to have 2 alliances per match
					const a1 = curElimMatch.alliances[0];
					const a2 = curElimMatch.alliances[1]
					thisPointsScored.Elim += a1.score;
					thisPointsScored.Elim += a2.score;
					if (a1.score < a2.score) {
						thisBlueResults.Elim.Loss += (a1.color === "blue" ? 1 : 0);
						thisRedResults.Elim.Loss += (a1.color === "red" ? 1 : 0);

						thisBlueResults.Elim.Win += (a1.color === "blue" ? 0 : 1);
						thisRedResults.Elim.Win += (a1.color === "red" ? 0 : 1);
					}
					else if (a1.score > a2.score) {
						thisBlueResults.Elim.Win += (a1.color === "blue" ? 1 : 0);
						thisRedResults.Elim.Win += (a1.color === "red" ? 1 : 0);

						thisBlueResults.Elim.Loss += (a1.color === "blue" ? 0 : 1);
						thisRedResults.Elim.Loss += (a1.color === "red" ? 0 : 1);
					}
					else {
						thisBlueResults.Elim.Tie++;
						thisRedResults.Elim.Tie++;
					}

					const a1t1 = a1.teams[0].team.id;
					const a1t2 = a1.teams[1].team.id;
					const a2t1 = a2.teams[0].team.id;
					const a2t2 = a2.teams[1].team.id;
					if (cache.Teams[seasonID][a1t1].grade === "Middle School" && cache.Teams[seasonID][a1t2].grade === "Middle School" &&
						cache.Teams[seasonID][a2t1].grade === "Middle School" && cache.Teams[seasonID][a2t2].grade === "Middle School"
					) {
						//this is an all-MS match, do the comparison on stuff
						if (a1.score === msv_highestAllianceScore.Value) {
							//only add a match once - it may already be added by the alliance partner's results
							const existingMatch = msv_highestAllianceScore.Combos.find(x => x.Match.id === curElimMatch.id);
							if (typeof existingMatch === "undefined") {
								msv_highestAllianceScore.Combos.push({Event: curEvent.EventInfo, allianceColor: a1.color, Match: curElimMatch});
							}
							msv_highestAllianceScore.Combos.push({Event: curEvent.EventInfo, allianceColor: a1.color, Match: curElimMatch});
						}
						else if (a1.score > msv_highestAllianceScore.Value) {
							msv_highestAllianceScore.Combos = [{Event: curEvent.EventInfo, allianceColor: a1.color, Match: curElimMatch}];
							msv_highestAllianceScore.Value = a1.score;
						}

						if (a2.score === msv_highestAllianceScore.Value) {
							//only add a match once - it may already be added by the alliance partner's results
							const existingMatch = msv_highestAllianceScore.Combos.find(x => x.Match.id === curElimMatch.id);
							if (typeof existingMatch === "undefined") {
								msv_highestAllianceScore.Combos.push({Event: curEvent.EventInfo, allianceColor: a2.color, Match: curElimMatch});
							}
							msv_highestAllianceScore.Combos.push({Event: curEvent.EventInfo, allianceColor: a2.color, Match: curElimMatch});
						}
						else if (a2.score > msv_highestAllianceScore.Value) {
							msv_highestAllianceScore.Combos = [{Event: curEvent.EventInfo, allianceColor: a2.color, Match: curElimMatch}];
							msv_highestAllianceScore.Value = a2.score;
						}
					}
					else if (cache.Teams[seasonID][a1t1].grade === "High School" && cache.Teams[seasonID][a1t2].grade === "High School" &&
						cache.Teams[seasonID][a2t1].grade === "High School" && cache.Teams[seasonID][a2t2].grade === "High School"
					) {
						//this is an all-HS match, do the comparison on stuff
						if (a1.score === hsv_highestAllianceScore.Value) {
							//only add a match once - it may already be added by the alliance partner's results
							const existingMatch = hsv_highestAllianceScore.Combos.find(x => x.Match.id === curElimMatch.id);
							if (typeof existingMatch === "undefined") {
								hsv_highestAllianceScore.Combos.push({Event: curEvent.EventInfo, allianceColor: a1.color, Match: curElimMatch});
							}
							hsv_highestAllianceScore.Combos.push({Event: curEvent.EventInfo, allianceColor: a1.color, Match: curElimMatch});
						}
						else if (a1.score > hsv_highestAllianceScore.Value) {
							hsv_highestAllianceScore.Combos = [{Event: curEvent.EventInfo, allianceColor: a1.color, Match: curElimMatch}];
							hsv_highestAllianceScore.Value = a1.score;
						}

						if (a2.score === hsv_highestAllianceScore.Value) {
							//only add a match once - it may already be added by the alliance partner's results
							const existingMatch = hsv_highestAllianceScore.Combos.find(x => x.Match.id === curElimMatch.id);
							if (typeof existingMatch === "undefined") {
								hsv_highestAllianceScore.Combos.push({Event: curEvent.EventInfo, allianceColor: a2.color, Match: curElimMatch});
							}
							hsv_highestAllianceScore.Combos.push({Event: curEvent.EventInfo, allianceColor: a2.color, Match: curElimMatch});
						}
						else if (a2.score > hsv_highestAllianceScore.Value) {
							hsv_highestAllianceScore.Combos = [{Event: curEvent.EventInfo, allianceColor: a2.color, Match: curElimMatch}];
							hsv_highestAllianceScore.Value = a2.score;
						}
					}

					if (cache.Teams[seasonID][a1t1].grade === "Middle School" && cache.Teams[seasonID][a1t1].location.region === region) {
						if (typeof msv_matchCountTeams[a1t1] === "undefined") {
							msv_matchCountTeams[a1t1] = 0;
						}
						msv_matchCountTeams[a1t1]++;
					}
					else if (cache.Teams[seasonID][a1t1].grade === "High School" && cache.Teams[seasonID][a1t1].location.region === region) {
						if (typeof hsv_matchCountTeams[a1t1] === "undefined") {
							hsv_matchCountTeams[a1t1] = 0;
						}
						hsv_matchCountTeams[a1t1]++;
					}
					if (cache.Teams[seasonID][a1t2].grade === "Middle School" && cache.Teams[seasonID][a1t2].location.region === region) {
						if (typeof msv_matchCountTeams[a1t2] === "undefined") {
							msv_matchCountTeams[a1t2] = 0;
						}
						msv_matchCountTeams[a1t2]++;
					}
					else if (cache.Teams[seasonID][a1t2].grade === "High School" && cache.Teams[seasonID][a1t2].location.region === region) {
						if (typeof hsv_matchCountTeams[a1t2] === "undefined") {
							hsv_matchCountTeams[a1t2] = 0;
						}
						hsv_matchCountTeams[a1t2]++;
					}
					if (cache.Teams[seasonID][a2t1].grade === "Middle School" && cache.Teams[seasonID][a2t1].location.region === region) {
						if (typeof msv_matchCountTeams[a2t1] === "undefined") {
							msv_matchCountTeams[a2t1] = 0;
						}
						msv_matchCountTeams[a2t1]++;
					}
					else if (cache.Teams[seasonID][a2t1].grade === "High School" && cache.Teams[seasonID][a2t1].location.region === region) {
						if (typeof hsv_matchCountTeams[a2t1] === "undefined") {
							hsv_matchCountTeams[a2t1] = 0;
						}
						hsv_matchCountTeams[a2t1]++;
					}
					if (cache.Teams[seasonID][a2t2].grade === "Middle School" && cache.Teams[seasonID][a2t2].location.region === region) {
						if (typeof msv_matchCountTeams[a2t2] === "undefined") {
							msv_matchCountTeams[a2t2] = 0;
						}
						msv_matchCountTeams[a2t2]++;
					}
					else if (cache.Teams[seasonID][a2t2].grade === "High School" && cache.Teams[seasonID][a2t2].location.region === region) {
						if (typeof hsv_matchCountTeams[a2t2] === "undefined") {
							hsv_matchCountTeams[a2t2] = 0;
						}
						hsv_matchCountTeams[a2t2]++;
					}
				}
			}
			//load data from this tournament to the final things
			let typeToUpdate: SeasonTournamentType = blendedTournaments;
			if (isBlendedEvent) {
				typeToUpdate = blendedTournaments;
			}
			else if (isHSEvent) {
				typeToUpdate = hsTournaments;
			}
			else if (isMSEvent) {
				typeToUpdate = msTournaments;
			}
			typeToUpdate.TournamentCount++;
			typeToUpdate.BlueResults.Elim.Loss += thisBlueResults.Elim.Loss;
			typeToUpdate.BlueResults.Elim.Tie += thisBlueResults.Elim.Tie;
			typeToUpdate.BlueResults.Elim.Win += thisBlueResults.Elim.Win;
			typeToUpdate.BlueResults.Quali.Loss += thisBlueResults.Quali.Loss;
			typeToUpdate.BlueResults.Quali.Tie += thisBlueResults.Quali.Tie;
			typeToUpdate.BlueResults.Quali.Win += thisBlueResults.Quali.Win;
			typeToUpdate.MatchCount.Elim += thisMatchCount.Elim;
			typeToUpdate.MatchCount.Quali += thisMatchCount.Quali;
			typeToUpdate.NonRegionTeams.push(...thisNonRegionTeams);
			typeToUpdate.OrgNums.push(...thisOrgNums);
			typeToUpdate.PointsScored.Elim += thisPointsScored.Elim;
			typeToUpdate.PointsScored.Quali += thisPointsScored.Quali;
			typeToUpdate.RedResults.Elim.Loss += thisRedResults.Elim.Loss;
			typeToUpdate.RedResults.Elim.Tie += thisRedResults.Elim.Tie;
			typeToUpdate.RedResults.Elim.Win += thisRedResults.Elim.Win;
			typeToUpdate.RedResults.Quali.Loss += thisRedResults.Quali.Loss;
			typeToUpdate.RedResults.Quali.Tie += thisRedResults.Quali.Tie;
			typeToUpdate.RedResults.Quali.Win += thisRedResults.Quali.Win;
			typeToUpdate.RegionTeams.push(...thisRegionTeams);
			typeToUpdate.AwardCount += curEvent.Awards.filter(x => Array.isArray(x.teamWinners) && x.teamWinners.length > 0).length;
			if (thisHighestAutoPointAvg.Value === typeToUpdate.HighestAutonomousPoints.Value) {
				typeToUpdate.HighestAutonomousPoints.Combos.push(...thisHighestAutoPointAvg.Combos);
			}
			else if (thisHighestAutoPointAvg.Value > typeToUpdate.HighestAutonomousPoints.Value) {
				typeToUpdate.HighestAutonomousPoints.Combos = [...thisHighestAutoPointAvg.Combos];
				typeToUpdate.HighestAutonomousPoints.Value = thisHighestAutoPointAvg.Value;
			}
			if (thisHighestAvgQualiScore.Value === typeToUpdate.HighestAverageQualiScore.Value) {
				typeToUpdate.HighestAverageQualiScore.Combos.push(...thisHighestAvgQualiScore.Combos);
			}
			else if (thisHighestAvgQualiScore.Value > typeToUpdate.HighestAverageQualiScore.Value) {
				typeToUpdate.HighestAverageQualiScore.Combos = [...thisHighestAvgQualiScore.Combos];
				typeToUpdate.HighestAverageQualiScore.Value = thisHighestAvgQualiScore.Value;
			}
		}
	}
	hsTournaments.NonRegionTeams = hsTournaments.NonRegionTeams.filter((x, i, arr) => arr.findIndex(y => y === x) === i);
	hsTournaments.RegionTeams = hsTournaments.RegionTeams.filter((x, i, arr) => arr.findIndex(y => y === x) === i);
	hsTournaments.OrgNums = hsTournaments.OrgNums.filter((x, i, arr) => arr.findIndex(y => y === x) === i);

	msTournaments.NonRegionTeams = msTournaments.NonRegionTeams.filter((x, i, arr) => arr.findIndex(y => y === x) === i);
	msTournaments.RegionTeams = msTournaments.RegionTeams.filter((x, i, arr) => arr.findIndex(y => y === x) === i);
	msTournaments.OrgNums = msTournaments.OrgNums.filter((x, i, arr) => arr.findIndex(y => y === x) === i);

	blendedTournaments.NonRegionTeams = blendedTournaments.NonRegionTeams.filter((x, i, arr) => arr.findIndex(y => y === x) === i);
	blendedTournaments.RegionTeams = blendedTournaments.RegionTeams.filter((x, i, arr) => arr.findIndex(y => y === x) === i);
	blendedTournaments.OrgNums = blendedTournaments.OrgNums.filter((x, i, arr) => arr.findIndex(y => y === x) === i);

	/*
	console.log("HS TOURNAMENTS BELOW");
	console.log(hsTournaments);

	console.log("MS TOURNAMENTS BELOW");
	console.log(msTournaments);

	console.log("BLENDED TOURNAMENTS BELOW");
	console.log(blendedTournaments);
	*/
	
	//for now, just do the MS and HS tabs
	const msHeader: TSProj.EnhancedEmcee.Common.HeaderItem = {
		name: "Middle School Results",
		order: 1,
		data: []
	};
	const hsHeader: TSProj.EnhancedEmcee.Common.HeaderItem = {
		name: "High School Results",
		order: 2,
		data: []
	};

	const ms_driverSkillsDisplay: TSProj.EnhancedEmcee.Common.DisplayElement = {
		label: "Highest Driver Skills at Region Tournament",
		value: [`${msv_highestSkillsDriver.Value}`]
	};
	msv_highestSkillsDriver.Combos.forEach(x => {
		const dateObj = new Date(x.Event.start);
		dateObj.setHours(dateObj.getHours() + (dateObj.getTimezoneOffset() / 60));
		ms_driverSkillsDisplay.value.push(`${x.Team.number} at ${x.Event.name} on ${dateObj.toLocaleDateString()}`);
	});
	msHeader.data.push(ms_driverSkillsDisplay);
	const ms_programSkillsDisplay: TSProj.EnhancedEmcee.Common.DisplayElement = {
		label: "Highest Programmer Skills at Region Tournament",
		value: [`${msv_highestSkillsProgram.Value}`]
	};
	msv_highestSkillsProgram.Combos.forEach(x => {
		const dateObj = new Date(x.Event.start);
		dateObj.setHours(dateObj.getHours() + (dateObj.getTimezoneOffset() / 60));
		ms_programSkillsDisplay.value.push(`${x.Team.number} at ${x.Event.name} on ${dateObj.toLocaleDateString()}`);
	});
	msHeader.data.push(ms_programSkillsDisplay);
	const ms_CombinedSkillsDisplay: TSProj.EnhancedEmcee.Common.DisplayElement = {
		label: "Highest Skills Score at Region Tournament (Driver + Program)",
		value: [`${msv_highestSkillsCombined.Value}`]
	};
	msv_highestSkillsCombined.Combos.forEach(x => {
		const dateObj = new Date(x.Event.start);
		dateObj.setHours(dateObj.getHours() + (dateObj.getTimezoneOffset() / 60));
		ms_CombinedSkillsDisplay.value.push(`${x.Team.number} at ${x.Event.name} on ${dateObj.toLocaleDateString()}`);
	});
	msHeader.data.push(ms_CombinedSkillsDisplay);
	const ms_allianceDisplay: TSProj.EnhancedEmcee.Common.DisplayElement = {
		label: "Highest Score of MS Alliance vs. MS Opponents at Region Tournament",
		value: [`${msv_highestAllianceScore.Value}`]
	};
	msv_highestAllianceScore.Combos.forEach(x => {
		const dateObj = new Date(x.Event.start);
		dateObj.setHours(dateObj.getHours() + (dateObj.getTimezoneOffset() / 60));
		var highAlliance: REAPI.Objects.Alliance = x.Match.alliances[0];
		var lowAlliance: REAPI.Objects.Alliance = x.Match.alliances[1];
		if (x.allianceColor === "blue") {
			highAlliance = x.Match.alliances.find(x => x.color === "blue") || highAlliance;
			lowAlliance = x.Match.alliances.find(x => x.color === "red") || lowAlliance;
		}
		else if (x.allianceColor === "red") {
			highAlliance = x.Match.alliances.find(x => x.color === "red") || highAlliance;
			lowAlliance = x.Match.alliances.find(x => x.color === "blue") || lowAlliance;
		}
		var displayString = `${highAlliance.teams[0].team.name}, ${highAlliance.teams[1].team.name} ${x.allianceColor.toUpperCase()} ${highAlliance.score}-${lowAlliance.score} ${lowAlliance.color.toUpperCase()} ${lowAlliance.teams[0].team.name}, ${lowAlliance.teams[1].team.name}`;
		ms_allianceDisplay.value.push(`${displayString} at ${x.Event.name} on ${dateObj.toLocaleDateString()}`);
	});
	msHeader.data.push(ms_allianceDisplay);
	const ms_avgPointsDisplay: TSProj.EnhancedEmcee.Common.DisplayElement = {
		label: "Highest Average Points in Quali Matches of Regional Tournament",
		value: [`${msv_highestAvgQualiPoints.Value}`]
	};
	msv_highestAvgQualiPoints.Combos.forEach(x => {
		const dateObj = new Date(x.Event.start);
		dateObj.setHours(dateObj.getHours() + (dateObj.getTimezoneOffset() / 60));
		ms_avgPointsDisplay.value.push(`${x.Team.number} at ${x.Event.name} on ${dateObj.toLocaleDateString()}`);
	});
	const ms_matchCountDisplay: TSProj.EnhancedEmcee.Common.DisplayElement = {
		label: "Most Matches Played by Team In Region",
		value: [],
	};
	let ms_mostMatchesNum = 0;
	let ms_mostMatchesTeams: number[] = [];
	for (let teamNum of Object.keys(msv_matchCountTeams)) {
		let teamNumIDInt = parseInt(teamNum);
		if (msv_matchCountTeams[teamNumIDInt] === ms_mostMatchesNum) {
			ms_mostMatchesTeams.push(teamNumIDInt);
		}
		else if (msv_matchCountTeams[teamNumIDInt] > ms_mostMatchesNum) {
			ms_mostMatchesTeams = [teamNumIDInt];
			ms_mostMatchesNum = msv_matchCountTeams[teamNumIDInt];
		}
	}
	ms_matchCountDisplay.value.push(ms_mostMatchesNum.toString());
	ms_mostMatchesTeams.sort((a, b) => cache.Teams[seasonID][a].number < cache.Teams[seasonID][b].number ? -1 : 1);
	ms_mostMatchesTeams.forEach(x => ms_matchCountDisplay.value.push(`${cache.Teams[seasonID][x].number} - ${cache.Teams[seasonID][x].team_name}`));
	msHeader.data.push(ms_matchCountDisplay);
	const ms_tourneyCountDisplay: TSProj.EnhancedEmcee.Common.DisplayElement = {
		label: "Most Tournaments Attended by Team In Region",
		value: [],
	};
	let ms_mostTourneysNum = 0;
	let ms_mostTourneysTeams: number[] = [];
	for (let teamNum of Object.keys(msv_tournamentCountTeams)) {
		let teamNumIDInt = parseInt(teamNum);
		if (msv_tournamentCountTeams[teamNumIDInt] === ms_mostTourneysNum) {
			ms_mostTourneysTeams.push(teamNumIDInt);
		}
		else if (msv_tournamentCountTeams[teamNumIDInt] > ms_mostTourneysNum) {
			ms_mostTourneysTeams = [teamNumIDInt];
			ms_mostTourneysNum = msv_tournamentCountTeams[teamNumIDInt];
		}
	}
	ms_tourneyCountDisplay.value.push(ms_mostTourneysNum.toString());
	ms_mostTourneysTeams.sort((a, b) => cache.Teams[seasonID][a].number < cache.Teams[seasonID][b].number ? -1 : 1);
	ms_mostTourneysTeams.forEach(x => ms_tourneyCountDisplay.value.push(`${cache.Teams[seasonID][x].number} - ${cache.Teams[seasonID][x].team_name}`));
	msHeader.data.push(ms_tourneyCountDisplay);


	const hs_driverSkillsDisplay: TSProj.EnhancedEmcee.Common.DisplayElement = {
		label: "Highest Driver Skills at Region Tournament",
		value: [`${hsv_highestSkillsDriver.Value}`]
	};
	hsv_highestSkillsDriver.Combos.forEach(x => {
		const dateObj = new Date(x.Event.start);
		dateObj.setHours(dateObj.getHours() + (dateObj.getTimezoneOffset() / 60));
		hs_driverSkillsDisplay.value.push(`${x.Team.number} at ${x.Event.name} on ${dateObj.toLocaleDateString()}`);
	});
	hsHeader.data.push(hs_driverSkillsDisplay);
	const hs_programSkillsDisplay: TSProj.EnhancedEmcee.Common.DisplayElement = {
		label: "Highest Programmer Skills at Region Tournament",
		value: [`${hsv_highestSkillsProgram.Value}`]
	};
	hsv_highestSkillsProgram.Combos.forEach(x => {
		const dateObj = new Date(x.Event.start);
		dateObj.setHours(dateObj.getHours() + (dateObj.getTimezoneOffset() / 60));
		hs_programSkillsDisplay.value.push(`${x.Team.number} at ${x.Event.name} on ${dateObj.toLocaleDateString()}`);
	});
	hsHeader.data.push(hs_programSkillsDisplay);
	const hs_CombinedSkillsDisplay: TSProj.EnhancedEmcee.Common.DisplayElement = {
		label: "Highest Skills Score at Tournament (Driver + Program)",
		value: [`${hsv_highestSkillsCombined.Value}`]
	};
	hsv_highestSkillsCombined.Combos.forEach(x => {
		const dateObj = new Date(x.Event.start);
		dateObj.setHours(dateObj.getHours() + (dateObj.getTimezoneOffset() / 60));
		hs_CombinedSkillsDisplay.value.push(`${x.Team.number} at ${x.Event.name} on ${dateObj.toLocaleDateString()}`);
	});
	hsHeader.data.push(hs_CombinedSkillsDisplay);
	const hs_allianceDisplay: TSProj.EnhancedEmcee.Common.DisplayElement = {
		label: "Highest Score of HS Alliance vs. HS Opponents at Region Tournament",
		value: [`${hsv_highestAllianceScore.Value}`]
	};
	hsv_highestAllianceScore.Combos.forEach(x => {
		const dateObj = new Date(x.Event.start);
		dateObj.setHours(dateObj.getHours() + (dateObj.getTimezoneOffset() / 60));
		var highAlliance: REAPI.Objects.Alliance = x.Match.alliances[0];
		var lowAlliance: REAPI.Objects.Alliance = x.Match.alliances[1];
		if (x.allianceColor === "blue") {
			highAlliance = x.Match.alliances.find(x => x.color === "blue") || highAlliance;
			lowAlliance = x.Match.alliances.find(x => x.color === "red") || lowAlliance;
		}
		else if (x.allianceColor === "red") {
			highAlliance = x.Match.alliances.find(x => x.color === "red") || highAlliance;
			lowAlliance = x.Match.alliances.find(x => x.color === "blue") || lowAlliance;
		}
		var displayString = `${highAlliance.teams[0].team.name}, ${highAlliance.teams[1].team.name} ${x.allianceColor.toUpperCase()} ${highAlliance.score}-${lowAlliance.score} ${lowAlliance.color.toUpperCase()} ${lowAlliance.teams[0].team.name}, ${lowAlliance.teams[1].team.name}`;
		hs_allianceDisplay.value.push(`${displayString} at ${x.Event.name} on ${dateObj.toLocaleDateString()}`);
	});
	hsHeader.data.push(hs_allianceDisplay);
	const hs_avgPointsDisplay: TSProj.EnhancedEmcee.Common.DisplayElement = {
		label: "Highest Average Points in Quali Matches of Regional Tournament",
		value: [`${hsv_highestAvgQualiPoints.Value}`]
	};
	hsv_highestAvgQualiPoints.Combos.forEach(x => {
		const dateObj = new Date(x.Event.start);
		dateObj.setHours(dateObj.getHours() + (dateObj.getTimezoneOffset() / 60));
		hs_avgPointsDisplay.value.push(`${x.Team.number} at ${x.Event.name} on ${dateObj.toLocaleDateString()}`);
	});
	const hs_matchCountDisplay: TSProj.EnhancedEmcee.Common.DisplayElement = {
		label: "Most Matches Played by Team In Region",
		value: [],
	};
	let hs_mostMatchesNum = 0;
	let hs_mostMatchesTeams: number[] = [];
	for (let teamNum of Object.keys(hsv_matchCountTeams)) {
		let teamNumIDInt = parseInt(teamNum);
		if (hsv_matchCountTeams[teamNumIDInt] === hs_mostMatchesNum) {
			hs_mostMatchesTeams.push(teamNumIDInt);
		}
		else if (hsv_matchCountTeams[teamNumIDInt] > hs_mostMatchesNum) {
			hs_mostMatchesTeams = [teamNumIDInt];
			hs_mostMatchesNum = hsv_matchCountTeams[teamNumIDInt];
		}
	}
	hs_matchCountDisplay.value.push(hs_mostMatchesNum.toString());
	hs_mostMatchesTeams.sort((a, b) => cache.Teams[seasonID][a].number < cache.Teams[seasonID][b].number ? -1 : 1);
	hs_mostMatchesTeams.forEach(x => hs_matchCountDisplay.value.push(`${cache.Teams[seasonID][x].number} - ${cache.Teams[seasonID][x].team_name}`));
	hsHeader.data.push(hs_matchCountDisplay);
	const hs_tourneyCountDisplay: TSProj.EnhancedEmcee.Common.DisplayElement = {
		label: "Most Tournaments Attended by Team In Region",
		value: [],
	};
	let hs_mostTourneysNum = 0;
	let hs_mostTourneysTeams: number[] = [];
	for (let teamNum of Object.keys(hsv_tournamentCountTeams)) {
		let teamNumIDInt = parseInt(teamNum);
		if (hsv_tournamentCountTeams[teamNumIDInt] === hs_mostTourneysNum) {
			hs_mostTourneysTeams.push(teamNumIDInt);
		}
		else if (hsv_tournamentCountTeams[teamNumIDInt] > hs_mostTourneysNum) {
			hs_mostTourneysTeams = [teamNumIDInt];
			hs_mostTourneysNum = hsv_tournamentCountTeams[teamNumIDInt];
		}
	}
	hs_tourneyCountDisplay.value.push(hs_mostTourneysNum.toString());
	hs_mostTourneysTeams.sort((a, b) => cache.Teams[seasonID][a].number < cache.Teams[seasonID][b].number ? -1 : 1);
	hs_mostTourneysTeams.forEach(x => hs_tourneyCountDisplay.value.push(`${cache.Teams[seasonID][x].number} - ${cache.Teams[seasonID][x].team_name}`));
	hsHeader.data.push(hs_tourneyCountDisplay);

	const retVal: TSProj.EnhancedEmcee.ProgramSeasonRegion.DataResponse = [msHeader, hsHeader];
	return retVal;
}

export default GetPSRData;
