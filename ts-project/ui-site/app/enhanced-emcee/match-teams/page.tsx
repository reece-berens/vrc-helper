"use client";
import {Dispatch, Fragment, SetStateAction, useEffect, useState} from "react";
import {TMAPI, TSProj} from "../../../../types-lib";

import {styled} from "@mui/material/styles";
import Accordion from "@mui/material/Accordion";
import AccordionDetails from "@mui/material/AccordionDetails";
import AccordionSummary from "@mui/material/AccordionSummary";
import Button from "@mui/material/Button";
import FormControl from "@mui/material/FormControl";
import Grid from "@mui/material/Grid2";
import IconButton from "@mui/material/IconButton";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import Select, { SelectChangeEvent } from "@mui/material/Select";
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";
import Typography from "@mui/material/Typography";

import Icon_Adjust from "@mui/icons-material/Adjust";
import Icon_ArrowForward from "@mui/icons-material/ArrowForwardIos";
import Icon_Refresh from "@mui/icons-material/Refresh";

import useTMAPI from "../../helpers/useTMAPI_Hook";

const baseExpressAPI = process.env.NEXT_PUBLIC_API_URL || "";
const expressUsername = process.env.NEXT_PUBLIC_API_USERNAME || "";
const expressPassword = process.env.NEXT_PUBLIC_API_PASSWORD || "";

const tm_defaultMatchTuple: TMAPI.Objects.Match.Tuple = {
	division: 0,
	session: 0,
	round: "",
	match: 0,
	instance: 0
};

const tm_defaultMatchObject: TMAPI.Objects.Match.Object = {
	finalScore: [],
	matchInfo: {
		alliances: [],
		matchTuple: tm_defaultMatchTuple,
		state: "",
		timeScheduled: 0
	},
	winningAlliance: 0
};

interface SeletedTabStylingProps {
	color: "blue" | "red";
	key: string;
	label: string;
}

const TabsStyling = styled(Tabs)({
	"& .MuiTabs-indicator": {
		backgroundColor: "#000000",
		height: "4px"
	}
})

const SelectedTabStyling = styled((props: SeletedTabStylingProps) => <Tab {...props} />)(({theme, ...other}) => ({
	backgroundColor: other.color === "red" ? "#dc004e" : "#1976d2",
	color: "white",
	"&.Mui-selected": {
		backgroundColor: "lightgray",
		color: "black"
	},
}));

const EnhancedEmcee_MatchTeams: React.FC<{}> = () => {
	const tmAPI = useTMAPI();
	const [mounted, _mounted] = useState<boolean>(false);
	const [tmEvent, _tmEvent] = useState<TMAPI.Objects.Event>({name: "", code: ""});
	const [tmDivisionList, _tmDivisionList] = useState<TMAPI.Objects.IDNamePair[]>([]);
	const [tmMatchList, _tmMatchList] = useState<TMAPI.Objects.Match.Object[]>([]);
	const [tmFieldSetList, _tmFieldSetList] = useState<TMAPI.Objects.IDNamePair[]>([]);
	const [tmFieldList, _tmFieldList] = useState<TMAPI.Objects.IDNamePair[]>([]);

	const [tmFieldMatchAssignment, _tmFieldMatchAssignment] = useState<TMAPI.Objects.FieldMatchAssignment>({});

	const [selectedDivision, _selectedDivision] = useState<number>(-1);
	const [selectedFieldSet, _selectedFieldSet] = useState<number>(-1);
	const [teamTabSelected, _teamTabSelected] = useState<number>(0); //this is the tab selected (must be an index number per MUI)
	const [displayMatch, _displayMatch] = useState<TMAPI.Objects.Match.Object>(tm_defaultMatchObject);
	const [displayData, _displayData] = useState<TSProj.EnhancedEmcee.MatchTeams.DataResponse>({});
	const [tmActiveMatch, _tmActiveMatch] = useState<TMAPI.Objects.Match.Tuple>(tm_defaultMatchTuple);
	const [wsConnectionActive, _wsConnectionActive] = useState<boolean>(false);

	const [openAccordion, _openAccordion] = useState<string>("_filter");

	useEffect(() => {
		_mounted(true);
		//ensure TM credentials are valid
		tmAPI.GetDivisionList().then(x => {
			console.log("division list below");
			console.log(x);
			_tmDivisionList(x.divisions);
			if (x.divisions.length > 0) {
				_selectedDivision(x.divisions[0].id);
			}
			/*tmAPI.GetMatchList({DivisionID: 1}).then(y => {
				console.log("match list for division 1 below");
				console.log(y);
			});*/
		});

		tmAPI.GetEvent().then(x => {
			console.log("event information below");
			console.log(x);
			_tmEvent(x.event);
		});
		
		tmAPI.GetFieldSetList().then(x => {
			console.log("field set list below");
			console.log(x);
			_tmFieldSetList(x.fieldSets);
			if (x.fieldSets.length > 0) {
				_selectedFieldSet(x.fieldSets[0].id);
			}
			/*tmAPI.GetFieldList({FieldSetID: 1}).then(y => {
				console.log("field list for field set id 1 below");
				console.log(y);
			});*/
		});
		
		//get list of divisions and field sets from TM
	}, []);

	useEffect(() => {
		//clear the cache since we have a new division now
		if (selectedDivision > 0) {
			_tmMatchList([]);
			_displayMatch(tm_defaultMatchObject);
			_displayData({});
			//load all matches that are in this division
			tmAPI.GetMatchList({DivisionID: selectedDivision}).then(x => {
				_tmMatchList(x.matches);
			});
		}
	}, [selectedDivision]);

	useEffect(() => {
		//load list of fields, populate tmFieldMatchAssignment keys
	}, [selectedFieldSet]);

	useEffect(() => {
		//initialize the web socket connection
	}, [wsConnectionActive]);

	useEffect(() => {
		//call the express API for all data about each team on each alliance (/enhanced-emcee/mt?blue=4101K&blue=7862D&red=67101X&red=15352A or something like that)

		//also auto-set the teamTabSelected variable to the first team on the first alliance
		if (displayMatch.matchInfo.alliances.length !== 0) {
			const url: URL = new URL("/enhanced-emcee/match-teams/data", baseExpressAPI);
			if (tmEvent.code !== "") {
				url.searchParams.append("sku", tmEvent.code);
			}
			if (displayMatch.matchInfo.alliances.length === 2) {
				//alliance 0 is red
				displayMatch.matchInfo.alliances[0].teams.forEach(x => url.searchParams.append("red", x.number));
				//alliance 1 is blue
				displayMatch.matchInfo.alliances[1].teams.forEach(x => url.searchParams.append("blue", x.number));
			}
			const request: Request = new Request(url);
			if (expressUsername !== "" && expressPassword !== "") {
				request.headers.append("Authorization", "Basic " + btoa(`${expressUsername}:${expressPassword}`));
			}
			fetch(request).then(data => {
				if (data.status === 200) {
					data.json().then((respObj: TSProj.EnhancedEmcee.MatchTeams.DataResponse) => {
						_teamTabSelected(0);
						_displayData(respObj);
					});
				}
				else {
					data.text().then(dataText => {
						console.error(`ERROR invalid response when getting list of data - ${data.status}`, dataText);
					}).catch(e => {
						console.error(`ERROR exception reading body of response when an error occurred ${data.status}`);
					});
				}
			}).catch(error => {
				console.error(`ERROR exception getting list of data`, error)
			});
		}
	}, [displayMatch]);

	const BuildMatchTupleDisplay = (tuple: TMAPI.Objects.Match.Tuple): string => {
		return `${tuple.round} ${tuple.match}-${tuple.instance}-${tuple.session}`;
	};

	const BuildMatchTupleIdentifier = (tuple: TMAPI.Objects.Match.Tuple): string => {
		return `${tuple.round}~${tuple.match}~${tuple.instance}~${tuple.session}~${tuple.division}`;
	};

	const onChangeDisplayMatch = (tupleIdentifier: string): void => {
		const newDisplayMatch = tmMatchList.find(x => BuildMatchTupleIdentifier(x.matchInfo.matchTuple) === tupleIdentifier);
		if (typeof newDisplayMatch !== "undefined") {
			_displayMatch(newDisplayMatch);
		}
	}
	
	const onChangeTeamTab = (event: React.SyntheticEvent, newTabOrder: number) => {
		_teamTabSelected(newTabOrder);
	}

	const onClickCurrentMatch = () => {
		const firstMatch = tmMatchList[0];
		_displayMatch(firstMatch);
	}

	const onClickRefreshMatchList = () => {
		tmAPI.GetMatchList({DivisionID: selectedDivision}).then(x => {
			_tmMatchList(x.matches);
		});
	}

	const onClickNextMatch = () => {
		if (displayMatch.matchInfo.matchTuple.division !== 0) {
			const curMatchTupleID = BuildMatchTupleIdentifier(displayMatch.matchInfo.matchTuple);
			const curMatch = tmMatchList.findIndex(x => BuildMatchTupleIdentifier(x.matchInfo.matchTuple) === curMatchTupleID);
			if (curMatch > -1 && curMatch < tmMatchList.length - 1) {
				_displayMatch(tmMatchList[curMatch + 1]);
			}
		}
	}

	if (!mounted) {
		return <></>;
	}

	return (
		<div style={{width: "96%", margin: "4% auto 0 auto"}}>
			<Grid container spacing={2} style={{marginBottom: "15px"}} sx={{display: {xs: "none", sm: "flex"}}}>
				{
					[
						{label: "Division", value: selectedDivision, dropdownList: tmDivisionList, onChange: (e: SelectChangeEvent<string>) => _selectedDivision(parseInt(e.target.value))},
						{label: "Field Set", value: selectedFieldSet, dropdownList: tmFieldSetList, onChange: (e: SelectChangeEvent<string>) => _selectedFieldSet(parseInt(e.target.value))}
					].map((x, x_i) => (
						<Grid size={4} key={x_i}>
							<FormControl fullWidth>
								<InputLabel id={`dropdown-label-${x.label}`} style={{fontWeight: "bold"}}>{x.label}</InputLabel>
								<Select
									labelId={`dropdown-label-${x.label}`}
									label={x.label}
									value={x.value.toString()}
									onChange={x.onChange}
								>
									{x.dropdownList.map((y, y_i) => (
										<MenuItem key={y_i} value={y.id}>{y.name}</MenuItem>
									))}
								</Select>
							</FormControl>
						</Grid>
					))
				}
			</Grid>
			<Accordion sx={{display: {xs: "inherit", sm: "none"}}} expanded={openAccordion === "_filter"} style={{marginBottom: "15px"}} onChange={() => _openAccordion(old => old === "_filter" ? "" : "_filter")}>
				<AccordionSummary>
					<Typography component="span" fontWeight="bold">TM Filter</Typography>
				</AccordionSummary>
				<AccordionDetails>
					<Grid container spacing={2} style={{marginBottom: "15px"}}>
						{
							[
								{label: "Division", value: selectedDivision, dropdownList: tmDivisionList, onChange: (e: SelectChangeEvent<string>) => _selectedDivision(parseInt(e.target.value))},
								{label: "Field Set", value: selectedFieldSet, dropdownList: tmFieldSetList, onChange: (e: SelectChangeEvent<string>) => _selectedFieldSet(parseInt(e.target.value))}
							].map((x, x_i) => (
								<Grid size={12} key={x_i}>
									<FormControl fullWidth>
										<InputLabel id={`dropdown-label-${x.label}`} style={{fontWeight: "bold"}}>{x.label}</InputLabel>
										<Select
											labelId={`dropdown-label-${x.label}`}
											label={x.label}
											value={x.value.toString()}
											onChange={x.onChange}
										>
											{x.dropdownList.map((y, y_i) => (
												<MenuItem key={y_i} value={y.id}>{y.name}</MenuItem>
											))}
										</Select>
									</FormControl>
								</Grid>
							))
						}
					</Grid>
				</AccordionDetails>
			</Accordion>
			<Grid container spacing={2} style={{marginBottom: "15px"}}>
				<Grid size={6}>
					<FormControl fullWidth>
						<InputLabel id={`dropdown-label-match`} style={{fontWeight: "bold"}}>Select Match</InputLabel>
						<Select
							labelId={`dropdown-label-match`}
							label="Select Match"
							value={BuildMatchTupleIdentifier(displayMatch.matchInfo.matchTuple)}
							onChange={e => onChangeDisplayMatch(e.target.value)}
						>
							{tmMatchList.map((y, y_i) => (
								<MenuItem key={y_i} value={BuildMatchTupleIdentifier(y.matchInfo.matchTuple)}>{BuildMatchTupleDisplay(y.matchInfo.matchTuple)}</MenuItem>
							))}
						</Select>
					</FormControl>
				</Grid>
				{/* Hide this control until I get full TM integrations working
				<Grid size={3} display={{xs: "none", sm: "none"}}>
					<IconButton size="large" onClick={onClickCurrentMatch}>
						<Icon_Adjust fontSize="inherit" />
					</IconButton>
				</Grid>
				*/}
				<Grid size={3} display={{xs: "inherit", sm: "inherit"}}>
					<IconButton size="large" onClick={onClickRefreshMatchList}>
						<Icon_Refresh fontSize="inherit" />
					</IconButton>
				</Grid>
				<Grid size={3} display={{xs: "inherit", sm: "inherit"}}>
					<IconButton size="large" onClick={onClickNextMatch}>
						<Icon_ArrowForward fontSize="inherit" />
					</IconButton>
				</Grid>
			</Grid>
			<TabsStyling variant="scrollable" value={teamTabSelected} onChange={onChangeTeamTab}>
				{displayMatch.matchInfo.alliances.map((alliance, a_i) => {
					return alliance.teams.map((team, t_i) => (
						<SelectedTabStyling key={`${a_i}-${t_i}`} color={a_i === 0 ? "red" : "blue"} label={team.number} />
					));
				})}
			</TabsStyling>
			{displayMatch.matchInfo.alliances.map((alliance, a_i) => {
				return alliance.teams.map((team, t_i) => (
					<TeamDisplayData key={(a_i * alliance.teams.length) + t_i} MatchData={displayData} MyTeamNumber={team.number} SelectedTabIndex={teamTabSelected} ThisTabIndex={(a_i * alliance.teams.length) + t_i} />
				))
			})}
		</div>
	);
};

interface TeamDisplayDataProps {
	MatchData: TSProj.EnhancedEmcee.MatchTeams.DataResponse;
	MyTeamNumber: string;
	SelectedTabIndex: number;
	ThisTabIndex: number;
}

const TeamDisplayData: React.FC<TeamDisplayDataProps> = (props) => {
	const [openAccordion, _openAccordion] = useState<string>("Season Stats");

	useEffect(() => {
		_openAccordion("Season Stats");
	}, [props.SelectedTabIndex, props.MatchData]);

	return (
		<>
			{
				props.SelectedTabIndex === props.ThisTabIndex && props.MatchData[props.MyTeamNumber] && (
					<>
						<Typography variant="h5">{props.MatchData[props.MyTeamNumber].HeaderLine || ""}</Typography>
						<Typography variant="subtitle1">{props.MatchData[props.MyTeamNumber].SubHeaderLine || ""}</Typography>

						{
							props.MatchData[props.MyTeamNumber].DataHeaders.map((x, x_i) => (
								<Accordion key={x_i} expanded={openAccordion === x.name} onChange={() => _openAccordion(old => x.name === old ? "" : x.name)}>
									<AccordionSummary>
										<Typography component="span" fontWeight="bold">{x.name}</Typography>
									</AccordionSummary>
									<AccordionDetails>
										<Grid container spacing={2}>
											{
												x.data.map((y, y_i) => (
													<Grid key={y_i} size={{xs: 12, sm: 6, md: 4}}>
														<Typography variant="h6">
															{y.label}
														</Typography>
														<ul>
															{
																y.value.map((z, z_i) => (<li key={z_i}><Typography variant="body2">{z}</Typography></li>))
															}
														</ul>
													</Grid>
												))
											}
										</Grid>
									</AccordionDetails>
								</Accordion>
							
							))
						}
					</>
				)
			}
		</>
	);
}

export default EnhancedEmcee_MatchTeams;
