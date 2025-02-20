import RenderFromTemplateContext from "next/dist/client/components/render-from-template-context";
import {EC_EventInfo, REAPI, RECache, TSProj} from "types-lib";

interface HighestNumberEvent {
	Event: EC_EventInfo | null;
	Value: number;
}

interface WASP {
	WP: number;
	AP: number;
	SP: number;
}

interface WLT {
	Win: number;
	Loss: number;
	Tie: number;
}

interface AlliancePairingResults {
	Matches: number;
	Points: number;
	WLT: WLT;
}

interface HeaderWithTourneyDate {
	Header: TSProj.EnhancedEmcee.Common.HeaderItem;
	TournamentDate: Date;
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
			Skills results -
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
			data: [
				{
					label: "Season Results",
					value: []
				}
			]
		};
		const header_WithAlliance2: TSProj.EnhancedEmcee.Common.HeaderItem = {
			name: "With Alliance Partner 2",
			order: 3,
			data: [
				{
					label: "Season Results",
					value: []
				}
			]
		};
		const header_AgainstAlliance1: TSProj.EnhancedEmcee.Common.HeaderItem = {
			name: "Against Alliance Partner 1",
			order: 4,
			data: [
				{
					label: "Season Results",
					value: []
				}
			]
		};
		const header_AgainstAlliance2: TSProj.EnhancedEmcee.Common.HeaderItem = {
			name: "Against Alliance Partner 2",
			order: 5,
			data: [
				{
					label: "Season Results",
					value: []
				}
			]
		};
		const header_AgainstAlliance3: TSProj.EnhancedEmcee.Common.HeaderItem = {
			name: "Against Alliance Partner 3",
			order: 6,
			data: [
				{
					label: "Season Results",
					value: []
				}
			]
		};
		let headerOrder = 7;
		teamDataResponse.DataHeaders.push(header_SeasonCompiled);
		teamDataResponse.DataHeaders.push(header_WithAlliance1);
		teamDataResponse.DataHeaders.push(header_AgainstAlliance1);
		teamDataResponse.DataHeaders.push(header_AgainstAlliance2);

		if (blue.length === 2) {
			header_WithAlliance1.name = `With Alliance Partner ${blue[bIndex === 0 ? 1 : 0]}`;
			//if there are two blue teams, then there have to be two red teams
			header_AgainstAlliance1.name = `Against Opponent ${red[0]}`;
			header_AgainstAlliance2.name = `Against Opponent ${red[1]}`;
		}
		else if (blue.length === 3) {
			header_WithAlliance1.name = `With Alliance Partner ${blue[bIndex === 0 ? 1 : (bIndex === 1 ? 2 : 0)]}`;
			header_WithAlliance2.name = `With Alliance Partner ${blue[bIndex === 0 ? 2 : (bIndex === 1 ? 0 : 1)]}`;
			teamDataResponse.DataHeaders.push(header_WithAlliance2);
			//if there are three blue teams, then there have to be three red teams
			header_AgainstAlliance1.name = `Against Opponent ${red[0]}`;
			header_AgainstAlliance2.name = `Against Opponent ${red[1]}`;
			header_AgainstAlliance3.name = `Against Opponent ${red[2]}`;
			teamDataResponse.DataHeaders.push(header_AgainstAlliance3);
		}

		let withAlliance1: AlliancePairingResults = {
			Matches: 0,
			Points: 0,
			WLT: {Win: 0, Loss: 0, Tie: 0}
		};
		let withAlliance2: AlliancePairingResults = {
			Matches: 0,
			Points: 0,
			WLT: {Win: 0, Loss: 0, Tie: 0}
		};
		let againstAlliance1WLT: WLT = {Win: 0, Loss: 0, Tie: 0};
		let againstAlliance2WLT: WLT = {Win: 0, Loss: 0, Tie: 0};
		let againstAlliance3WLT: WLT = {Win: 0, Loss: 0, Tie: 0};

		//season compiled stats
		let tournamentCount = 0;
		let matchCountQuali = 0;
		let matchCountElim = 0;
		let driverSkillsAttempts = 0;
		let progSkillsAttempts = 0;
		let totalQualiRank = 0;
		let highestPPQM: HighestNumberEvent = {Event: null, Value: 0};
		let highestTPQM: HighestNumberEvent = {Event: null, Value: 0};
		let highestMatchScore: HighestNumberEvent = {Event: null, Value: 0};
		let highDriverSkills: HighestNumberEvent = {Event: null, Value: 0};
		let highProgSkills: HighestNumberEvent = {Event: null, Value: 0};
		let highCombinedSkills: HighestNumberEvent = {Event: null, Value: 0};
		let seasonQualiWLT: WLT = {Win: 0, Loss: 0, Tie: 0};
		let seasonElimWLT: WLT = {Win: 0, Loss: 0, Tie: 0};
		let seasonWASP: WASP = {WP: 0, AP: 0, SP: 0};
		let asColorWLT: WLT = {Win: 0, Loss: 0, Tie: 0};
		let tournamentHeaderList: HeaderWithTourneyDate[] = [];
		for (let regionKey of regionKeys) {
			for (let cachedEvent of seasonEventDict[regionKey]) {
				if (cachedEvent.EventInfo.awards_finalized && typeof cachedEvent.TeamResults[blueReverseLookup[bIndex]] !== "undefined") {
					//the team competed at this completed tournament, load their results
					tournamentCount++;
					const thisTeamResults = cachedEvent.TeamResults[blueReverseLookup[bIndex]];
					let tourneyDate = new Date(cachedEvent.EventInfo.start);
					tourneyDate.setHours(tourneyDate.getHours() + (tourneyDate.getTimezoneOffset() / 60));
					const tournamentHeader = `${cachedEvent.EventInfo.name} (${tourneyDate.toLocaleDateString()})`;
					const header_tournament: TSProj.EnhancedEmcee.Common.HeaderItem = {
						name: tournamentHeader,
						order: headerOrder++,
						data: []
					};
					tournamentHeaderList.push({Header: header_tournament, TournamentDate: tourneyDate});

					//#region Qualification Ranking Data

					const qualiResultsDisplay: TSProj.EnhancedEmcee.Common.DisplayElement = {
						label: "Qualification Results",
						value: []
					};
					header_tournament.data.push(qualiResultsDisplay);
					const qualiRank = thisTeamResults.QualiRanking;
					seasonQualiWLT.Win += qualiRank.wins;
					seasonQualiWLT.Loss += qualiRank.losses;
					seasonQualiWLT.Tie += qualiRank.ties;
					totalQualiRank += qualiRank.rank;
					seasonWASP.WP += qualiRank.wp;
					seasonWASP.AP += qualiRank.ap;
					seasonWASP.SP += qualiRank.sp;
					qualiResultsDisplay.value.push(`${qualiRank.wins}-${qualiRank.losses}-${qualiRank.ties}`);
					qualiResultsDisplay.value.push(`${qualiRank.wp} WP-${qualiRank.ap} AP-${qualiRank.sp} SP`);
					qualiResultsDisplay.value.push(`Rank ${qualiRank.rank}`);
					matchCountQuali += qualiRank.wins + qualiRank.losses + qualiRank.ties;

					const qualiPointsDisplay: TSProj.EnhancedEmcee.Common.DisplayElement = {
						label: "Qualification Points",
						value: []
					};
					header_tournament.data.push(qualiPointsDisplay);
					qualiPointsDisplay.value.push(`${qualiRank.average_points} average points/match`);
					qualiPointsDisplay.value.push(`${qualiRank.total_points} total points`);
					qualiPointsDisplay.value.push(`High score: ${qualiRank.high_score}`);
					if (highestPPQM.Value < qualiRank.average_points) {
						highestPPQM.Event = cachedEvent.EventInfo;
						highestPPQM.Value = qualiRank.average_points;
					}
					if (highestTPQM.Value < qualiRank.total_points) {
						highestTPQM.Event = cachedEvent.EventInfo;
						highestTPQM.Value = qualiRank.total_points;
					}

					//#endregion

					//#region Qualification Match Data

					for (let qualiMatch of thisTeamResults.QualiResults) {
						let teamAlliance = qualiMatch.alliances.find(x => x.teams.some(y => y.team.name === curBlueTeam));
						if (typeof teamAlliance !== "undefined") {
							if (highestMatchScore.Value < teamAlliance.score) {
								highestMatchScore.Event = cachedEvent.EventInfo;
								highestMatchScore.Value = teamAlliance.score;
							}
							let thisAllianceIndex = qualiMatch.alliances.indexOf(teamAlliance);
							let otherAlliance: REAPI.Objects.Alliance = {
								color: "red",
								score: 0,
								teams: []
							};
							if (thisAllianceIndex === 0) {
								otherAlliance = qualiMatch.alliances[1];
							}
							else {
								otherAlliance = qualiMatch.alliances[0];
							}
							let wltResult = 0;
							if (teamAlliance.score > otherAlliance.score) {
								wltResult = 1;
							}
							else if (teamAlliance.score < otherAlliance.score) {
								wltResult = 2;
							}
							else {
								wltResult = 3;
							}
							//see if the team was on their current color - update asColorWLT if so
							if (teamAlliance.color === "blue") {
								asColorWLT[wltResult === 1 ? "Win" : (wltResult === 2 ? "Loss" : "Tie")]++;
							}

							//see if they went with a current-match teammate or against a current-match opponent
							let alliancePartner = 1;
							for (let bIndexInner = 0; bIndexInner < blue.length; bIndexInner++) {
								if (bIndex !== bIndexInner && teamAlliance.teams.some(x => x.team.name === blue[bIndexInner])) { //don't check the team itself
									if (alliancePartner === 1) {
										//we have matched with alliance partner 1, so the data should go into header_WithAlliance1
										withAlliance1.WLT[wltResult === 1 ? "Win" : (wltResult === 2 ? "Loss" : "Tie")]++;
										withAlliance1.Matches++;
										withAlliance1.Points += teamAlliance.score;
										let existingDataObj = header_WithAlliance1.data.find(x => x.label === tournamentHeader);
										if (typeof existingDataObj === "undefined") {
											existingDataObj = {
												label: tournamentHeader,
												value: []
											};
											header_WithAlliance1.data.push(existingDataObj);
										}
										var dataString = `${qualiMatch.name} - `;
										teamAlliance.teams.forEach(x => dataString += `${x.team.name},`);
										dataString = dataString.substring(0, dataString.length - 1);
										dataString += ` ${teamAlliance.score} - ${otherAlliance.score} `;
										otherAlliance.teams.forEach(x => dataString += `${x.team.name},`);
										dataString = dataString.substring(0, dataString.length - 1);
										existingDataObj.value.push(dataString);
										alliancePartner++;
									}
									else {
										//we have matched with alliance partner 2, so the data should go into header_WithAlliance2
										withAlliance2.WLT[wltResult === 1 ? "Win" : (wltResult === 2 ? "Loss" : "Tie")]++;
										withAlliance2.Matches++;
										withAlliance2.Points += teamAlliance.score;
										let existingDataObj = header_WithAlliance2.data.find(x => x.label === tournamentHeader);
										if (typeof existingDataObj === "undefined") {
											existingDataObj = {
												label: tournamentHeader,
												value: []
											};
											header_WithAlliance2.data.push(existingDataObj);
										}
										var dataString = `${qualiMatch.name} - `;
										teamAlliance.teams.forEach(x => dataString += `${x.team.name},`);
										dataString = dataString.substring(0, dataString.length - 1);
										dataString += ` ${teamAlliance.score} - ${otherAlliance.score} `;
										otherAlliance.teams.forEach(x => dataString += `${x.team.name},`);
										dataString = dataString.substring(0, dataString.length - 1);
										existingDataObj.value.push(dataString);
									}
								}
							}
							for (let rIndex = 0; rIndex < red.length; rIndex++) {
								//basically do the same thing but for opp
								if (otherAlliance.teams.some(x => x.team.name === red[rIndex])) {
									const headerOpp = rIndex === 0 ? header_AgainstAlliance1 : (
										rIndex === 1 ? header_AgainstAlliance2 : header_AgainstAlliance3
									);
									const wlt = rIndex === 0 ? againstAlliance1WLT : (
										rIndex === 1 ? againstAlliance2WLT : againstAlliance3WLT
									);
									
									wlt[wltResult === 1 ? "Win" : (wltResult === 2 ? "Loss" : "Tie")]++;
									let existingDataObj = headerOpp.data.find(x => x.label === tournamentHeader);
									if (typeof existingDataObj === "undefined") {
										existingDataObj = {
											label: tournamentHeader,
											value: []
										};
										headerOpp.data.push(existingDataObj);
									}
									var dataString = `${qualiMatch.name} - `;
									teamAlliance.teams.forEach(x => dataString += `${x.team.name},`);
									dataString = dataString.substring(0, dataString.length - 1);
									dataString += ` ${teamAlliance.score} - ${otherAlliance.score} `;
									otherAlliance.teams.forEach(x => dataString += `${x.team.name},`);
									dataString = dataString.substring(0, dataString.length - 1);
									existingDataObj.value.push(dataString);
								}
							}
						}
					}

					//#endregion

					//Elimination results data
					if (thisTeamResults.EliminationPartner !== null && thisTeamResults.EliminationResults !== null) {
						//this team made the elimination round in this tournament
						let elimPartnerData: TSProj.EnhancedEmcee.Common.DisplayElement = {
							label: "Elimination Partner(s)",
							value: []
						};
						header_tournament.data.push(elimPartnerData);
						for (let elimPartner of thisTeamResults.EliminationPartner) {
							elimPartnerData.value.push(elimPartner.name);
						}

						let elimResultsData: TSProj.EnhancedEmcee.Common.DisplayElement = {
							label: "Elimination Results",
							value: []
						};
						header_tournament.data.push(elimResultsData);

						for (let elimMatch of thisTeamResults.EliminationResults) {
							//use the same logic as qualification matches
							matchCountElim++;
							let teamAlliance = elimMatch.alliances.find(x => x.teams.some(y => y.team.name === curBlueTeam));
							if (typeof teamAlliance !== "undefined") {
								let thisAllianceIndex = elimMatch.alliances.indexOf(teamAlliance);
								let otherAlliance: REAPI.Objects.Alliance = {
									color: "red",
									score: 0,
									teams: []
								};
								if (thisAllianceIndex === 0) {
									otherAlliance = elimMatch.alliances[1];
								}
								else {
									otherAlliance = elimMatch.alliances[0];
								}
								let elimResultDisplay = `${elimMatch.division.name}: ${elimMatch.name} - `;
								let wltResult = 0;
								if (teamAlliance.score > otherAlliance.score) {
									wltResult = 1;
									seasonElimWLT.Win++;
									elimResultDisplay += "WIN ";
								}
								else if (teamAlliance.score < otherAlliance.score) {
									wltResult = 2;
									seasonElimWLT.Loss++;
									elimResultDisplay += "LOSS ";
								}
								else {
									wltResult = 3;
									seasonElimWLT.Tie++;
									elimResultDisplay += "TIE ";
								}
								elimResultDisplay += `${teamAlliance.score}-${otherAlliance.score} vs. `;
								otherAlliance.teams.forEach(otherTeam => elimResultDisplay += `${otherTeam.team.name}, `);
								elimResultDisplay = elimResultDisplay.substring(0, elimResultDisplay.length - 2);
								elimResultsData.value.push(elimResultDisplay);
								
								//see if the team was on their current color - update asColorWLT if so
								if (teamAlliance.color === "blue") {
									asColorWLT[wltResult === 1 ? "Win" : (wltResult === 2 ? "Loss" : "Tie")]++;
								}

								//see if they went with a current-match teammate or against a current-match opponent
								let alliancePartner = 1;
								for (let bIndexInner = 0; bIndexInner < blue.length; bIndexInner++) {
									if (bIndex !== bIndexInner && teamAlliance.teams.some(x => x.team.name === blue[bIndexInner])) { //don't check the team itself
										if (alliancePartner === 1) {
											//we have matched with alliance partner 1, so the data should go into header_WithAlliance1
											withAlliance1.WLT[wltResult === 1 ? "Win" : (wltResult === 2 ? "Loss" : "Tie")]++;
											withAlliance1.Matches++;
											withAlliance1.Points += teamAlliance.score;
											let existingDataObj = header_WithAlliance1.data.find(x => x.label === tournamentHeader);
											if (typeof existingDataObj === "undefined") {
												existingDataObj = {
													label: tournamentHeader,
													value: []
												};
												header_WithAlliance1.data.push(existingDataObj);
											}
											var dataString = `${elimMatch.division.name}: ${elimMatch.name} - `;
											teamAlliance.teams.forEach(x => dataString += `${x.team.name},`);
											dataString = dataString.substring(0, dataString.length - 1);
											dataString += ` ${teamAlliance.score} - ${otherAlliance.score} `;
											otherAlliance.teams.forEach(x => dataString += `${x.team.name},`);
											dataString = dataString.substring(0, dataString.length - 1);
											existingDataObj.value.push(dataString);
											alliancePartner++;
										}
										else {
											//we have matched with alliance partner 2, so the data should go into header_WithAlliance2
											withAlliance2.WLT[wltResult === 1 ? "Win" : (wltResult === 2 ? "Loss" : "Tie")]++;
											withAlliance2.Matches++;
											withAlliance2.Points += teamAlliance.score;
											let existingDataObj = header_WithAlliance2.data.find(x => x.label === tournamentHeader);
											if (typeof existingDataObj === "undefined") {
												existingDataObj = {
													label: tournamentHeader,
													value: []
												};
												header_WithAlliance2.data.push(existingDataObj);
											}
											var dataString = `${elimMatch.division.name}: ${elimMatch.name} - `;
											teamAlliance.teams.forEach(x => dataString += `${x.team.name},`);
											dataString = dataString.substring(0, dataString.length - 1);
											dataString += ` ${teamAlliance.score} - ${otherAlliance.score} `;
											otherAlliance.teams.forEach(x => dataString += `${x.team.name},`);
											dataString = dataString.substring(0, dataString.length - 1);
											existingDataObj.value.push(dataString);
										}
									}
								}
								for (let rIndex = 0; rIndex < red.length; rIndex++) {
									//basically do the same thing but for opp
									if (otherAlliance.teams.some(x => x.team.name === red[rIndex])) {
										const headerOpp = rIndex === 0 ? header_AgainstAlliance1 : (
											rIndex === 1 ? header_AgainstAlliance2 : header_AgainstAlliance3
										);
										const wlt = rIndex === 0 ? againstAlliance1WLT : (
											rIndex === 1 ? againstAlliance2WLT : againstAlliance3WLT
										);
										
										wlt[wltResult === 1 ? "Win" : (wltResult === 2 ? "Loss" : "Tie")]++;
										let existingDataObj = headerOpp.data.find(x => x.label === tournamentHeader);
										if (typeof existingDataObj === "undefined") {
											existingDataObj = {
												label: tournamentHeader,
												value: []
											};
											headerOpp.data.push(existingDataObj);
										}
										var dataString = `${elimMatch.name} - `;
										teamAlliance.teams.forEach(x => dataString += `${x.team.name},`);
										dataString = dataString.substring(0, dataString.length - 1);
										dataString += ` ${teamAlliance.score} - ${otherAlliance.score} `;
										otherAlliance.teams.forEach(x => dataString += `${x.team.name},`);
										dataString = dataString.substring(0, dataString.length - 1);
										existingDataObj.value.push(dataString);
									}
								}
							}
						}
					}

					//#region Skills Results
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
								if (skillsDisplay.value[0].endsWith("Rank: ")) {
									skillsDisplay.value[0] += thisSkill.rank;
								}
								skillsDisplay.value[1] += `${thisSkill.score} pts, ${thisSkill.attempts} attempts`;
								driverSkillsAttempts += thisSkill.attempts;
								totalScore += thisSkill.score;
								if (highDriverSkills.Value < thisSkill.score) {
									highDriverSkills.Event = cachedEvent.EventInfo;
									highDriverSkills.Value = thisSkill.score;
								}
							}
							else if (thisSkill.type === "programming") {
								if (skillsDisplay.value[0].endsWith("Rank: ")) {
									skillsDisplay.value[0] += thisSkill.rank;
								}
								skillsDisplay.value[2] += `${thisSkill.score} pts, ${thisSkill.attempts} attempts`;
								progSkillsAttempts += thisSkill.attempts;
								totalScore += thisSkill.score;
								if (highProgSkills.Value < thisSkill.score) {
									highProgSkills.Event = cachedEvent.EventInfo;
									highProgSkills.Value = thisSkill.score;
								}
							}
						}
						skillsDisplay.value[3] += `${totalScore} pts`;
						if (highCombinedSkills.Value < totalScore) {
							highCombinedSkills.Event = cachedEvent.EventInfo;
							highCombinedSkills.Value = totalScore;
						}
					}
					//#endregion

					//#region Awards
					var teamAwards = cachedEvent.Awards.filter(award => (
						award.teamWinners.some(x => x.team.name === curBlueTeam)
					));
					if (teamAwards.length > 0) {
						var awardsDisplay: TSProj.EnhancedEmcee.Common.DisplayElement = {
							label: "Awards",
							value: []
						};
						header_tournament.data.push(awardsDisplay);
						for (let award of teamAwards) {
							var dataText = `${award.title}`;
							if (award.qualifications.length > 0) {
								dataText += " (Qualifications: ";
								award.qualifications.forEach(x => dataText += `${x}; `);
								dataText = dataText.substring(0, dataText.length - 2);
								dataText += ")";
							}
							awardsDisplay.value.push(dataText);
						}
					}
					//#endregion
				}
			}
		}
		tournamentHeaderList.sort((a, b) => a.TournamentDate < b.TournamentDate ? -1 : 1);
		teamDataResponse.DataHeaders.push(...tournamentHeaderList.map(x => x.Header));
		
		//we have gone through all matches that this team has been a part of, now build all the compiled stats
		//#region Compiled Season Data
		header_SeasonCompiled.data.push({
			label: "W-L-T",
			value: [
				`Season: ${seasonQualiWLT.Win + seasonElimWLT.Win}-${seasonQualiWLT.Loss + seasonElimWLT.Loss}-${seasonQualiWLT.Tie + seasonElimWLT.Tie}`,
				`Qualification Matches: ${seasonQualiWLT.Win}-${seasonQualiWLT.Loss}-${seasonQualiWLT.Tie}`,
				`Elimination Matches: ${seasonElimWLT.Win}-${seasonElimWLT.Loss}-${seasonElimWLT.Tie}`,
				`As Blue Alliance: ${asColorWLT.Win}-${asColorWLT.Loss}-${asColorWLT.Tie}`
			]
		});
		header_SeasonCompiled.data.push({
			label: "WP-AP-SP",
			value: [
				`Season Total: ${seasonWASP.WP} WP-${seasonWASP.AP} AP-${seasonWASP.SP} SP`,
				`Season Average: ${(seasonWASP.WP / tournamentCount).toPrecision(2)} WP-${(seasonWASP.AP / tournamentCount).toPrecision(2)} AP-${(seasonWASP.SP / tournamentCount).toPrecision(2)} SP`
			]
		});
		header_SeasonCompiled.data.push({
			label: "Match Count",
			value: [
				`Season: ${matchCountQuali + matchCountElim}`,
				`Qualifications: ${matchCountQuali}`,
				`Eliminations: ${matchCountElim}`
			]
		});
		header_SeasonCompiled.data.push({
			label: "Skills Attempts",
			value: [
				`Driver: ${driverSkillsAttempts}`,
				`Programming: ${progSkillsAttempts}`,
				`Total: ${driverSkillsAttempts + progSkillsAttempts}`
			]
		});
		header_SeasonCompiled.data.push({
			label: "Best Skills Results",
			value: [
				`Driver: ${highDriverSkills.Value} pts (${highDriverSkills.Event?.name} ${new Date(highDriverSkills.Event?.start || "").toLocaleDateString()})`,
				`Programming: ${highProgSkills.Value} pts (${highProgSkills.Event?.name} ${new Date(highProgSkills.Event?.start || "").toLocaleDateString()})`,
				`Total: ${highCombinedSkills.Value} pts (${highCombinedSkills.Event?.name} ${new Date(highCombinedSkills.Event?.start || "").toLocaleDateString()})`
			]
		});
		header_SeasonCompiled.data.push({
			label: "Best Qualification Performances",
			value: [
				`Highest Points per Quali Match: ${highestPPQM.Value} (${highestPPQM.Event?.name} ${new Date(highestPPQM.Event?.start || "").toLocaleDateString()})`,
				`Highest Total Points in Quali Matches: ${highestTPQM.Value} (${highestTPQM.Event?.name} ${new Date(highestTPQM.Event?.start || "").toLocaleDateString()})`,
			]
		});
		//#endregion
		
		//#region With Alliance Partner 1

		header_WithAlliance1.data[0].value.push(`Total Matches: ${withAlliance1.Matches}`);
		header_WithAlliance1.data[0].value.push(`W-L-T: ${withAlliance1.WLT.Win}-${withAlliance1.WLT.Loss}-${withAlliance1.WLT.Tie}`);
		header_WithAlliance1.data[0].value.push(`Average Points/Match: ${(withAlliance1.Points / withAlliance1.Matches).toPrecision(2)}`);
		header_WithAlliance1.data[0].value.push(`Total Points Scored: ${withAlliance1.Points}`);


		//#endregion

		//#region With Alliance Partner 2

		if (blue.length === 3) {
			header_WithAlliance2.data[0].value.push(`Total Matches: ${withAlliance2.Matches}`);
			header_WithAlliance2.data[0].value.push(`W-L-T: ${withAlliance2.WLT.Win}-${withAlliance2.WLT.Loss}-${withAlliance2.WLT.Tie}`);
			header_WithAlliance2.data[0].value.push(`Average Points/Match: ${(withAlliance2.Points / withAlliance2.Matches).toPrecision(2)}`);
			header_WithAlliance2.data[0].value.push(`Total Points Scored: ${withAlliance2.Points}`);
		}

		//#endregion

		//#region Against Opponent 1

		header_AgainstAlliance1.data[0].value.push(`Total Matches: ${againstAlliance1WLT.Win + againstAlliance1WLT.Loss + againstAlliance1WLT.Tie}`);
		header_AgainstAlliance1.data[0].value.push(`W-L-T: ${againstAlliance1WLT.Win}-${againstAlliance1WLT.Loss}-${againstAlliance1WLT.Tie}`);

		//#endregion

		//#region Against Opponent 2

		header_AgainstAlliance2.data[0].value.push(`Total Matches: ${againstAlliance2WLT.Win + againstAlliance2WLT.Loss + againstAlliance2WLT.Tie}`);
		header_AgainstAlliance2.data[0].value.push(`W-L-T: ${againstAlliance2WLT.Win}-${againstAlliance2WLT.Loss}-${againstAlliance2WLT.Tie}`);

		//#endregion

		//#region Against Opponent 3

		if (blue.length === 3) {
			header_AgainstAlliance3.data[0].value.push(`Total Matches: ${againstAlliance3WLT.Win + againstAlliance3WLT.Loss + againstAlliance3WLT.Tie}`);
			header_AgainstAlliance3.data[0].value.push(`W-L-T: ${againstAlliance3WLT.Win}-${againstAlliance3WLT.Loss}-${againstAlliance3WLT.Tie}`);
		}

		//#endregion
	}


	//eventually i should make a lot of this into condensed methods, but do that later after more features are built out
	for (let rIndex = 0; rIndex < red.length; rIndex++) {
		const curRedTeam = red[rIndex];
		response[curRedTeam] = {
			HeaderLine: "",
			SubHeaderLine: "",
			DataHeaders: []
		};
		const teamDataResponse = response[curRedTeam];
		const teamInformation = cache.Teams[seasonID][redReverseLookup[rIndex]];
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
			data: [
				{
					label: "Season Results",
					value: []
				}
			]
		};
		const header_WithAlliance2: TSProj.EnhancedEmcee.Common.HeaderItem = {
			name: "With Alliance Partner 2",
			order: 3,
			data: [
				{
					label: "Season Results",
					value: []
				}
			]
		};
		const header_AgainstAlliance1: TSProj.EnhancedEmcee.Common.HeaderItem = {
			name: "Against Alliance Partner 1",
			order: 4,
			data: [
				{
					label: "Season Results",
					value: []
				}
			]
		};
		const header_AgainstAlliance2: TSProj.EnhancedEmcee.Common.HeaderItem = {
			name: "Against Alliance Partner 2",
			order: 5,
			data: [
				{
					label: "Season Results",
					value: []
				}
			]
		};
		const header_AgainstAlliance3: TSProj.EnhancedEmcee.Common.HeaderItem = {
			name: "Against Alliance Partner 3",
			order: 6,
			data: [
				{
					label: "Season Results",
					value: []
				}
			]
		};
		let headerOrder = 7;
		teamDataResponse.DataHeaders.push(header_SeasonCompiled);
		teamDataResponse.DataHeaders.push(header_WithAlliance1);
		teamDataResponse.DataHeaders.push(header_AgainstAlliance1);
		teamDataResponse.DataHeaders.push(header_AgainstAlliance2);

		if (red.length === 2) {
			header_WithAlliance1.name = `With Alliance Partner ${red[rIndex === 0 ? 1 : 0]}`;
			//if there are two red teams, then there have to be two blue teams
			header_AgainstAlliance1.name = `Against Opponent ${blue[0]}`;
			header_AgainstAlliance2.name = `Against Opponent ${blue[1]}`;
		}
		else if (red.length === 3) {
			header_WithAlliance1.name = `With Alliance Partner ${red[rIndex === 0 ? 1 : (rIndex === 1 ? 2 : 0)]}`;
			header_WithAlliance2.name = `With Alliance Partner ${red[rIndex === 0 ? 2 : (rIndex === 1 ? 0 : 1)]}`;
			teamDataResponse.DataHeaders.push(header_WithAlliance2);
			//if there are three red teams, then there have to be three blue teams
			header_AgainstAlliance1.name = `Against Opponent ${blue[0]}`;
			header_AgainstAlliance2.name = `Against Opponent ${blue[1]}`;
			header_AgainstAlliance3.name = `Against Opponent ${blue[2]}`;
			teamDataResponse.DataHeaders.push(header_AgainstAlliance3);
		}

		let withAlliance1: AlliancePairingResults = {
			Matches: 0,
			Points: 0,
			WLT: {Win: 0, Loss: 0, Tie: 0}
		};
		let withAlliance2: AlliancePairingResults = {
			Matches: 0,
			Points: 0,
			WLT: {Win: 0, Loss: 0, Tie: 0}
		};
		let againstAlliance1WLT: WLT = {Win: 0, Loss: 0, Tie: 0};
		let againstAlliance2WLT: WLT = {Win: 0, Loss: 0, Tie: 0};
		let againstAlliance3WLT: WLT = {Win: 0, Loss: 0, Tie: 0};

		//season compiled stats
		let tournamentCount = 0;
		let matchCountQuali = 0;
		let matchCountElim = 0;
		let driverSkillsAttempts = 0;
		let progSkillsAttempts = 0;
		let totalQualiRank = 0;
		let highestPPQM: HighestNumberEvent = {Event: null, Value: 0};
		let highestTPQM: HighestNumberEvent = {Event: null, Value: 0};
		let highestMatchScore: HighestNumberEvent = {Event: null, Value: 0};
		let highDriverSkills: HighestNumberEvent = {Event: null, Value: 0};
		let highProgSkills: HighestNumberEvent = {Event: null, Value: 0};
		let highCombinedSkills: HighestNumberEvent = {Event: null, Value: 0};
		let seasonQualiWLT: WLT = {Win: 0, Loss: 0, Tie: 0};
		let seasonElimWLT: WLT = {Win: 0, Loss: 0, Tie: 0};
		let seasonWASP: WASP = {WP: 0, AP: 0, SP: 0};
		let asColorWLT: WLT = {Win: 0, Loss: 0, Tie: 0};
		let tournamentHeaderList: HeaderWithTourneyDate[] = [];
		for (let regionKey of regionKeys) {
			for (let cachedEvent of seasonEventDict[regionKey]) {
				if (cachedEvent.EventInfo.awards_finalized && typeof cachedEvent.TeamResults[redReverseLookup[rIndex]] !== "undefined") {
					//the team competed at this completed tournament, load their results
					tournamentCount++;
					const thisTeamResults = cachedEvent.TeamResults[redReverseLookup[rIndex]];
					let tourneyDate = new Date(cachedEvent.EventInfo.start);
					tourneyDate.setHours(tourneyDate.getHours() + (tourneyDate.getTimezoneOffset() / 60));
					const tournamentHeader = `${cachedEvent.EventInfo.name} (${tourneyDate.toLocaleDateString()})`;
					const header_tournament: TSProj.EnhancedEmcee.Common.HeaderItem = {
						name: tournamentHeader,
						order: headerOrder++,
						data: []
					};
					tournamentHeaderList.push({Header: header_tournament, TournamentDate: tourneyDate});

					//#region Qualification Ranking Data

					const qualiResultsDisplay: TSProj.EnhancedEmcee.Common.DisplayElement = {
						label: "Qualification Results",
						value: []
					};
					header_tournament.data.push(qualiResultsDisplay);
					const qualiRank = thisTeamResults.QualiRanking;
					seasonQualiWLT.Win += qualiRank.wins;
					seasonQualiWLT.Loss += qualiRank.losses;
					seasonQualiWLT.Tie += qualiRank.ties;
					totalQualiRank += qualiRank.rank;
					seasonWASP.WP += qualiRank.wp;
					seasonWASP.AP += qualiRank.ap;
					seasonWASP.SP += qualiRank.sp;
					qualiResultsDisplay.value.push(`${qualiRank.wins}-${qualiRank.losses}-${qualiRank.ties}`);
					qualiResultsDisplay.value.push(`${qualiRank.wp} WP-${qualiRank.ap} AP-${qualiRank.sp} SP`);
					qualiResultsDisplay.value.push(`Rank ${qualiRank.rank}`);
					matchCountQuali += qualiRank.wins + qualiRank.losses + qualiRank.ties;

					const qualiPointsDisplay: TSProj.EnhancedEmcee.Common.DisplayElement = {
						label: "Qualification Points",
						value: []
					};
					header_tournament.data.push(qualiPointsDisplay);
					qualiPointsDisplay.value.push(`${qualiRank.average_points} average points/match`);
					qualiPointsDisplay.value.push(`${qualiRank.total_points} total points`);
					qualiPointsDisplay.value.push(`High score: ${qualiRank.high_score}`);
					if (highestPPQM.Value < qualiRank.average_points) {
						highestPPQM.Event = cachedEvent.EventInfo;
						highestPPQM.Value = qualiRank.average_points;
					}
					if (highestTPQM.Value < qualiRank.total_points) {
						highestTPQM.Event = cachedEvent.EventInfo;
						highestTPQM.Value = qualiRank.total_points;
					}

					//#endregion

					//#region Qualification Match Data

					for (let qualiMatch of thisTeamResults.QualiResults) {
						let teamAlliance = qualiMatch.alliances.find(x => x.teams.some(y => y.team.name === curRedTeam));
						if (typeof teamAlliance !== "undefined") {
							if (highestMatchScore.Value < teamAlliance.score) {
								highestMatchScore.Event = cachedEvent.EventInfo;
								highestMatchScore.Value = teamAlliance.score;
							}
							let thisAllianceIndex = qualiMatch.alliances.indexOf(teamAlliance);
							let otherAlliance: REAPI.Objects.Alliance = {
								color: "blue",
								score: 0,
								teams: []
							};
							if (thisAllianceIndex === 0) {
								otherAlliance = qualiMatch.alliances[1];
							}
							else {
								otherAlliance = qualiMatch.alliances[0];
							}
							let wltResult = 0;
							if (teamAlliance.score > otherAlliance.score) {
								wltResult = 1;
							}
							else if (teamAlliance.score < otherAlliance.score) {
								wltResult = 2;
							}
							else {
								wltResult = 3;
							}
							//see if the team was on their current color - update asColorWLT if so
							if (teamAlliance.color === "red") {
								asColorWLT[wltResult === 1 ? "Win" : (wltResult === 2 ? "Loss" : "Tie")]++;
							}

							//see if they went with a current-match teammate or against a current-match opponent
							let alliancePartner = 1;
							for (let rIndexInner = 0; rIndexInner < red.length; rIndexInner++) {
								if (rIndex !== rIndexInner && teamAlliance.teams.some(x => x.team.name === red[rIndexInner])) { //don't check the team itself
									if (alliancePartner === 1) {
										//we have matched with alliance partner 1, so the data should go into header_WithAlliance1
										withAlliance1.WLT[wltResult === 1 ? "Win" : (wltResult === 2 ? "Loss" : "Tie")]++;
										withAlliance1.Matches++;
										withAlliance1.Points += teamAlliance.score;
										let existingDataObj = header_WithAlliance1.data.find(x => x.label === tournamentHeader);
										if (typeof existingDataObj === "undefined") {
											existingDataObj = {
												label: tournamentHeader,
												value: []
											};
											header_WithAlliance1.data.push(existingDataObj);
										}
										var dataString = `${qualiMatch.name} - `;
										teamAlliance.teams.forEach(x => dataString += `${x.team.name}, `);
										dataString = dataString.substring(0, dataString.length - 2);
										dataString += ` ${teamAlliance.score} - ${otherAlliance.score} `;
										otherAlliance.teams.forEach(x => dataString += `${x.team.name}, `);
										dataString = dataString.substring(0, dataString.length - 2);
										existingDataObj.value.push(dataString);
										alliancePartner++;
									}
									else {
										//we have matched with alliance partner 2, so the data should go into header_WithAlliance2
										withAlliance2.WLT[wltResult === 1 ? "Win" : (wltResult === 2 ? "Loss" : "Tie")]++;
										withAlliance2.Matches++;
										withAlliance2.Points += teamAlliance.score;
										let existingDataObj = header_WithAlliance2.data.find(x => x.label === tournamentHeader);
										if (typeof existingDataObj === "undefined") {
											existingDataObj = {
												label: tournamentHeader,
												value: []
											};
											header_WithAlliance2.data.push(existingDataObj);
										}
										var dataString = `${qualiMatch.name} - `;
										teamAlliance.teams.forEach(x => dataString += `${x.team.name}, `);
										dataString = dataString.substring(0, dataString.length - 2);
										dataString += ` ${teamAlliance.score} - ${otherAlliance.score} `;
										otherAlliance.teams.forEach(x => dataString += `${x.team.name}, `);
										dataString = dataString.substring(0, dataString.length - 2);
										existingDataObj.value.push(dataString);
									}
								}
							}
							for (let bIndex = 0; bIndex < blue.length; bIndex++) {
								//basically do the same thing but for opp
								if (otherAlliance.teams.some(x => x.team.name === blue[bIndex])) {
									const headerOpp = bIndex === 0 ? header_AgainstAlliance1 : (
										bIndex === 1 ? header_AgainstAlliance2 : header_AgainstAlliance3
									);
									const wlt = bIndex === 0 ? againstAlliance1WLT : (
										bIndex === 1 ? againstAlliance2WLT : againstAlliance3WLT
									);
									
									wlt[wltResult === 1 ? "Win" : (wltResult === 2 ? "Loss" : "Tie")]++;
									let existingDataObj = headerOpp.data.find(x => x.label === tournamentHeader);
									if (typeof existingDataObj === "undefined") {
										existingDataObj = {
											label: tournamentHeader,
											value: []
										};
										headerOpp.data.push(existingDataObj);
									}
									var dataString = `${qualiMatch.name} - `;
									teamAlliance.teams.forEach(x => dataString += `${x.team.name}, `);
									dataString = dataString.substring(0, dataString.length - 2);
									dataString += ` ${teamAlliance.score} - ${otherAlliance.score} `;
									otherAlliance.teams.forEach(x => dataString += `${x.team.name}, `);
									dataString = dataString.substring(0, dataString.length - 2);
									existingDataObj.value.push(dataString);
								}
							}
						}
					}

					//#endregion

					//Elimination results data
					if (thisTeamResults.EliminationPartner !== null && thisTeamResults.EliminationResults !== null) {
						//this team made the elimination round in this tournament
						let elimPartnerData: TSProj.EnhancedEmcee.Common.DisplayElement = {
							label: "Elimination Partner(s)",
							value: []
						};
						header_tournament.data.push(elimPartnerData);
						for (let elimPartner of thisTeamResults.EliminationPartner) {
							elimPartnerData.value.push(elimPartner.name);
						}

						let elimResultsData: TSProj.EnhancedEmcee.Common.DisplayElement = {
							label: "Elimination Results",
							value: []
						};
						header_tournament.data.push(elimResultsData);

						for (let elimMatch of thisTeamResults.EliminationResults) {
							//use the same logic as qualification matches
							matchCountElim++;
							let teamAlliance = elimMatch.alliances.find(x => x.teams.some(y => y.team.name === curRedTeam));
							if (typeof teamAlliance !== "undefined") {
								let thisAllianceIndex = elimMatch.alliances.indexOf(teamAlliance);
								let otherAlliance: REAPI.Objects.Alliance = {
									color: "blue",
									score: 0,
									teams: []
								};
								let elimResultDisplay = `${elimMatch.division.name}: ${elimMatch.name} - `;
								if (thisAllianceIndex === 0) {
									otherAlliance = elimMatch.alliances[1];
								}
								else {
									otherAlliance = elimMatch.alliances[0];
								}
								let wltResult = 0;
								if (teamAlliance.score > otherAlliance.score) {
									wltResult = 1;
									seasonElimWLT.Win++;
									elimResultDisplay += "WIN ";
								}
								else if (teamAlliance.score < otherAlliance.score) {
									wltResult = 2;
									seasonElimWLT.Loss++;
									elimResultDisplay += "LOSS ";
								}
								else {
									wltResult = 3;
									seasonElimWLT.Tie++;
									elimResultDisplay += "TIE ";
								}
								elimResultDisplay += `${teamAlliance.score}-${otherAlliance.score} vs. `;
								otherAlliance.teams.forEach(otherTeam => elimResultDisplay += `${otherTeam.team.name}, `);
								elimResultDisplay = elimResultDisplay.substring(0, elimResultDisplay.length - 2);
								elimResultsData.value.push(elimResultDisplay);

								//see if the team was on their current color - update asColorWLT if so
								if (teamAlliance.color === "red") {
									asColorWLT[wltResult === 1 ? "Win" : (wltResult === 2 ? "Loss" : "Tie")]++;
								}

								//see if they went with a current-match teammate or against a current-match opponent
								let alliancePartner = 1;
								for (let rIndexInner = 0; rIndexInner < red.length; rIndexInner++) {
									if (rIndex !== rIndexInner && teamAlliance.teams.some(x => x.team.name === red[rIndexInner])) { //don't check the team itself
										if (alliancePartner === 1) {
											//we have matched with alliance partner 1, so the data should go into header_WithAlliance1
											withAlliance1.WLT[wltResult === 1 ? "Win" : (wltResult === 2 ? "Loss" : "Tie")]++;
											withAlliance1.Matches++;
											withAlliance1.Points += teamAlliance.score;
											let existingDataObj = header_WithAlliance1.data.find(x => x.label === tournamentHeader);
											if (typeof existingDataObj === "undefined") {
												existingDataObj = {
													label: tournamentHeader,
													value: []
												};
												header_WithAlliance1.data.push(existingDataObj);
											}
											var dataString = `${elimMatch.division.name}: ${elimMatch.name} - `;
											teamAlliance.teams.forEach(x => dataString += `${x.team.name}, `);
											dataString = dataString.substring(0, dataString.length - 2);
											dataString += ` ${teamAlliance.score} - ${otherAlliance.score} `;
											otherAlliance.teams.forEach(x => dataString += `${x.team.name}, `);
											dataString = dataString.substring(0, dataString.length - 2);
											existingDataObj.value.push(dataString);
											alliancePartner++;
										}
										else {
											//we have matched with alliance partner 2, so the data should go into header_WithAlliance2
											withAlliance2.WLT[wltResult === 1 ? "Win" : (wltResult === 2 ? "Loss" : "Tie")]++;
											withAlliance2.Matches++;
											withAlliance2.Points += teamAlliance.score;
											let existingDataObj = header_WithAlliance2.data.find(x => x.label === tournamentHeader);
											if (typeof existingDataObj === "undefined") {
												existingDataObj = {
													label: tournamentHeader,
													value: []
												};
												header_WithAlliance2.data.push(existingDataObj);
											}
											var dataString = `${elimMatch.division.name}: ${elimMatch.name} - `;
											teamAlliance.teams.forEach(x => dataString += `${x.team.name}, `);
											dataString = dataString.substring(0, dataString.length - 2);
											dataString += ` ${teamAlliance.score} - ${otherAlliance.score} `;
											otherAlliance.teams.forEach(x => dataString += `${x.team.name}, `);
											dataString = dataString.substring(0, dataString.length - 2);
											existingDataObj.value.push(dataString);
										}
									}
								}
								for (let bIndex = 0; bIndex < blue.length; bIndex++) {
									//basically do the same thing but for opp
									if (otherAlliance.teams.some(x => x.team.name === blue[bIndex])) {
										const headerOpp = bIndex === 0 ? header_AgainstAlliance1 : (
											bIndex === 1 ? header_AgainstAlliance2 : header_AgainstAlliance3
										);
										const wlt = bIndex === 0 ? againstAlliance1WLT : (
											bIndex === 1 ? againstAlliance2WLT : againstAlliance3WLT
										);
										
										wlt[wltResult === 1 ? "Win" : (wltResult === 2 ? "Loss" : "Tie")]++;
										let existingDataObj = headerOpp.data.find(x => x.label === tournamentHeader);
										if (typeof existingDataObj === "undefined") {
											existingDataObj = {
												label: tournamentHeader,
												value: []
											};
											headerOpp.data.push(existingDataObj);
										}
										var dataString = `${elimMatch.name} - `;
										teamAlliance.teams.forEach(x => dataString += `${x.team.name}, `);
										dataString = dataString.substring(0, dataString.length - 2);
										dataString += ` ${teamAlliance.score} - ${otherAlliance.score} `;
										otherAlliance.teams.forEach(x => dataString += `${x.team.name}, `);
										dataString = dataString.substring(0, dataString.length - 2);
										existingDataObj.value.push(dataString);
									}
								}
							}
						}
					}

					//#region Skills Results
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
								if (skillsDisplay.value[0].endsWith("Rank: ")) {
									skillsDisplay.value[0] += thisSkill.rank;
								}
								skillsDisplay.value[1] += `${thisSkill.score} pts, ${thisSkill.attempts} attempts`;
								driverSkillsAttempts += thisSkill.attempts;
								totalScore += thisSkill.score;
								if (highDriverSkills.Value < thisSkill.score) {
									highDriverSkills.Event = cachedEvent.EventInfo;
									highDriverSkills.Value = thisSkill.score;
								}
							}
							else if (thisSkill.type === "programming") {
								if (skillsDisplay.value[0].endsWith("Rank: ")) {
									skillsDisplay.value[0] += thisSkill.rank;
								}
								skillsDisplay.value[2] += `${thisSkill.score} pts, ${thisSkill.attempts} attempts`;
								progSkillsAttempts += thisSkill.attempts;
								totalScore += thisSkill.score;
								if (highProgSkills.Value < thisSkill.score) {
									highProgSkills.Event = cachedEvent.EventInfo;
									highProgSkills.Value = thisSkill.score;
								}
							}
						}
						skillsDisplay.value[3] += `${totalScore} pts`;
						if (highCombinedSkills.Value < totalScore) {
							highCombinedSkills.Event = cachedEvent.EventInfo;
							highCombinedSkills.Value = totalScore;
						}
					}
					//#endregion

					//#region Awards
					var teamAwards = cachedEvent.Awards.filter(award => (
						award.teamWinners.some(x => x.team.name === curRedTeam)
					));
					if (teamAwards.length > 0) {
						var awardsDisplay: TSProj.EnhancedEmcee.Common.DisplayElement = {
							label: "Awards",
							value: []
						};
						header_tournament.data.push(awardsDisplay);
						for (let award of teamAwards) {
							var dataText = `${award.title}`;
							if (award.qualifications.length > 0) {
								dataText += " (Qualifications: ";
								award.qualifications.forEach(x => dataText += `${x}; `);
								dataText = dataText.substring(0, dataText.length - 2);
								dataText += ")";
							}
							awardsDisplay.value.push(dataText);
						}
					}
					//#endregion
				}
			}
		}
		tournamentHeaderList.sort((a, b) => a.TournamentDate < b.TournamentDate ? -1 : 1);
		teamDataResponse.DataHeaders.push(...tournamentHeaderList.map(x => x.Header));
		
		//we have gone through all matches that this team has been a part of, now build all the compiled stats
		//#region Compiled Season Data
		header_SeasonCompiled.data.push({
			label: "W-L-T",
			value: [
				`Season: ${seasonQualiWLT.Win + seasonElimWLT.Win}-${seasonQualiWLT.Loss + seasonElimWLT.Loss}-${seasonQualiWLT.Tie + seasonElimWLT.Tie}`,
				`Qualification Matches: ${seasonQualiWLT.Win}-${seasonQualiWLT.Loss}-${seasonQualiWLT.Tie}`,
				`Elimination Matches: ${seasonElimWLT.Win}-${seasonElimWLT.Loss}-${seasonElimWLT.Tie}`,
				`As Red Alliance: ${asColorWLT.Win}-${asColorWLT.Loss}-${asColorWLT.Tie}`
			]
		});
		header_SeasonCompiled.data.push({
			label: "WP-AP-SP",
			value: [
				`Season Total: ${seasonWASP.WP} WP-${seasonWASP.AP} AP-${seasonWASP.SP} SP`,
				`Season Average: ${(seasonWASP.WP / tournamentCount).toPrecision(2)} WP-${(seasonWASP.AP / tournamentCount).toPrecision(2)} AP-${(seasonWASP.SP / tournamentCount).toPrecision(2)} SP`
			]
		});
		header_SeasonCompiled.data.push({
			label: "Match Count",
			value: [
				`Season: ${matchCountQuali + matchCountElim}`,
				`Qualifications: ${matchCountQuali}`,
				`Eliminations: ${matchCountElim}`
			]
		});
		header_SeasonCompiled.data.push({
			label: "Skills Attempts",
			value: [
				`Driver: ${driverSkillsAttempts}`,
				`Programming: ${progSkillsAttempts}`,
				`Total: ${driverSkillsAttempts + progSkillsAttempts}`
			]
		});
		header_SeasonCompiled.data.push({
			label: "Best Skills Results",
			value: [
				`Driver: ${highDriverSkills.Value} pts (${highDriverSkills.Event?.name} ${new Date(highDriverSkills.Event?.start || "").toLocaleDateString()})`,
				`Programming: ${highProgSkills.Value} pts (${highProgSkills.Event?.name} ${new Date(highProgSkills.Event?.start || "").toLocaleDateString()})`,
				`Total: ${highCombinedSkills.Value} pts (${highCombinedSkills.Event?.name} ${new Date(highCombinedSkills.Event?.start || "").toLocaleDateString()})`
			]
		});
		header_SeasonCompiled.data.push({
			label: "Best Qualification Performances",
			value: [
				`Highest Points per Quali Match: ${highestPPQM.Value} (${highestPPQM.Event?.name} ${new Date(highestPPQM.Event?.start || "").toLocaleDateString()})`,
				`Highest Total Points in Quali Matches: ${highestTPQM.Value} (${highestTPQM.Event?.name} ${new Date(highestTPQM.Event?.start || "").toLocaleDateString()})`,
			]
		});
		//#endregion
		
		//#region With Alliance Partner 1

		header_WithAlliance1.data[0].value.push(`Total Matches: ${withAlliance1.Matches}`);
		header_WithAlliance1.data[0].value.push(`W-L-T: ${withAlliance1.WLT.Win}-${withAlliance1.WLT.Loss}-${withAlliance1.WLT.Tie}`);
		header_WithAlliance1.data[0].value.push(`Average Points/Match: ${(withAlliance1.Points / withAlliance1.Matches).toPrecision(2)}`);
		header_WithAlliance1.data[0].value.push(`Total Points Scored: ${withAlliance1.Points}`);


		//#endregion

		//#region With Alliance Partner 2

		if (blue.length === 3) {
			header_WithAlliance2.data[0].value.push(`Total Matches: ${withAlliance2.Matches}`);
			header_WithAlliance2.data[0].value.push(`W-L-T: ${withAlliance2.WLT.Win}-${withAlliance2.WLT.Loss}-${withAlliance2.WLT.Tie}`);
			header_WithAlliance2.data[0].value.push(`Average Points/Match: ${(withAlliance2.Points / withAlliance2.Matches).toPrecision(2)}`);
			header_WithAlliance2.data[0].value.push(`Total Points Scored: ${withAlliance2.Points}`);
		}

		//#endregion

		//#region Against Opponent 1

		header_AgainstAlliance1.data[0].value.push(`Total Matches: ${againstAlliance1WLT.Win + againstAlliance1WLT.Loss + againstAlliance1WLT.Tie}`);
		header_AgainstAlliance1.data[0].value.push(`W-L-T: ${againstAlliance1WLT.Win}-${againstAlliance1WLT.Loss}-${againstAlliance1WLT.Tie}`);

		//#endregion

		//#region Against Opponent 2

		header_AgainstAlliance2.data[0].value.push(`Total Matches: ${againstAlliance2WLT.Win + againstAlliance2WLT.Loss + againstAlliance2WLT.Tie}`);
		header_AgainstAlliance2.data[0].value.push(`W-L-T: ${againstAlliance2WLT.Win}-${againstAlliance2WLT.Loss}-${againstAlliance2WLT.Tie}`);

		//#endregion

		//#region Against Opponent 3

		if (blue.length === 3) {
			header_AgainstAlliance3.data[0].value.push(`Total Matches: ${againstAlliance3WLT.Win + againstAlliance3WLT.Loss + againstAlliance3WLT.Tie}`);
			header_AgainstAlliance3.data[0].value.push(`W-L-T: ${againstAlliance3WLT.Win}-${againstAlliance3WLT.Loss}-${againstAlliance3WLT.Tie}`);
		}

		//#endregion
	}

	return response;
}

export default GetMatchTeamData;
