"use client";
import {Dispatch, Fragment, SetStateAction, useEffect, useState} from "react";
import {TMAPI, TSProj} from "../../../../types-lib";

import Accordion from "@mui/material/Accordion";
import AccordionDetails from "@mui/material/AccordionDetails";
import AccordionSummary from "@mui/material/AccordionSummary";
import FormControl from "@mui/material/FormControl";
import Grid from "@mui/material/Grid2";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import Select, { SelectChangeEvent } from "@mui/material/Select";
import Typography from "@mui/material/Typography";

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
		state: "",
		timeScheduled: 0
	},
	matchTuple: tm_defaultMatchTuple,
	winningAlliance: 0
};

interface MatchDisplayInfo {
	//key is going to be some combination of the TMAPI.Objects.Match.Tuple object
	[key: string]: any
}

const EnhancedEmcee_MatchTeams: React.FC<{}> = () => {
	const [tmDivisionList, _tmDivisionList] = useState<TMAPI.Objects.IDNamePair[]>([]);
	const [tmMatchList, _tmMatchList] = useState<TMAPI.Objects.Match.Object[]>([]);
	const [tmFieldSetList, _tmFieldSetList] = useState<TMAPI.Objects.IDNamePair[]>([]);
	const [tmFieldList, _tmFieldList] = useState<TMAPI.Objects.IDNamePair[]>([]);

	const [tmFieldMatchAssignment, _tmFieldMatchAssignment] = useState<TMAPI.Objects.FieldMatchAssignment>({});

	const [selectedDivision, _selectedDivision] = useState<number>(-1);
	const [selectedFieldSet, _selectedFieldSet] = useState<number>(-1);
	const [teamTabSelected, _teamTabSelected] = useState<string>(""); //this is the team number of the team selected on the tab bar
	const [displayMatch, _displayMatch] = useState<TMAPI.Objects.Match.Object>(tm_defaultMatchObject);
	const [matchDataCache, _matchDataCache] = useState<MatchDisplayInfo>({});
	const [tmActiveMatch, _tmActiveMatch] = useState<TMAPI.Objects.Match.Tuple>(tm_defaultMatchTuple);
	const [wsConnectionActive, _wsConnectionActive] = useState<boolean>(false);

	useEffect(() => {
		//ensure TM credentials are valid

		//get list of divisions and field sets from TM
	}, []);

	useEffect(() => {
		//clear the cache since we have a new division now
		_matchDataCache({});
		//load all matches that are in this division
	}, [selectedDivision]);

	useEffect(() => {
		//load list of fields, populate tmFieldMatchAssignment keys
	}, [selectedFieldSet]);

	useEffect(() => {
		//initialize the web socket connection
	}, [wsConnectionActive]);

	useEffect(() => {
		//if the matchDataCache object doesn't have the match data in it, call the API to load the data and store it in the cache
		//call the express API for all data about each team on each alliance (/enhanced-emcee/mt?blue=4101K&blue=7862D&red=67101X&red=15352A or something like that)
		//once that's loaded, populate all that data in the cache object

		//also auto-set the teamTabSelected variable to the first team on the first alliance
	}, [displayMatch]);

	return (
		<div style={{width: "96%", margin: "4% auto 0 auto"}}>

		</div>
	);
};

export default EnhancedEmcee_MatchTeams;
