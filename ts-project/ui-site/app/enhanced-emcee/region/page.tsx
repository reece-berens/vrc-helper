"use client";
import {Fragment, useEffect, useState} from "react";
import {TSProj} from "../../../../types-lib";

import Accordion from "@mui/material/Accordion";
import AccordionDetails from "@mui/material/AccordionDetails";
import AccordionSummary from "@mui/material/AccordionSummary";
import FormControl from "@mui/material/FormControl";
import Grid from "@mui/material/Grid2";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import Select, { SelectChangeEvent } from "@mui/material/Select";
import Typography from "@mui/material/Typography";

const tempProgram: TSProj.EnhancedEmcee.Region.DropdownResponse = {
	data: [
		{code: "1", display: "V5RC"}
	],
	defaultCode: "1"
};

const tempSeason: TSProj.EnhancedEmcee.Region.DropdownResponse = {
	data: [
		{code: "190", display: "VEX High Stakes"}
	],
	defaultCode: null
};

const tempRegion: TSProj.EnhancedEmcee.Region.DropdownResponse = {
	data: [
		{code: "Kansas", display: "Kansas"},
		{code: "Misery", display: "Misery"}
	],
	defaultCode: "Kansas"
};

const tempDisplay: TSProj.EnhancedEmcee.Region.DataResponse = [
	{
		name: "Overall Statistics",
		order: 1,
		data: [
			{label: "Total Matches", value: ["100 total", "80 Qualifications", "20 Eliminations"]},
			{label: "Total Points Scored", value: ["1k total", "800 HS", "200 MS"]},
			{label: "Registered Teams", value: ["80 HS", "20 MS"]},
			{label: "Autonomous Points Scored", value: ["13 HS-only meets", "32 MS-only meets", "12 Blended"]},
		]
	},
	{
		name: "Highest-Performing Teams",
		order: 2,
		data: [
			{label: "Highest Score", value: ["50", "7862D & 7862U", "Basehor Tournament", "January 25, 2025"]},
			{label: "Highest PPG", value: ["15.34", "15352A", "Basehor Tournament", "January 25, 2025"]},
			{label: "Highest Driver Skills", value: ["66666666", "15352A", "Basehor Tournament", "January 25, 2025"]},
			{label: "Highest Score", value: ["50", "7862D & 7862U this is testing a super long value to see how well data wraps when it may get too long to fit on a single line of text - maybe the event name decided to get real fancy-like, maybe one team has a lot of data that they want to share, who knows, anything can happen at vex tournaments", "Basehor Tournament", "January 25, 2025"]},
			{label: "Highest Score", value: ["50", "7862D & 7862U", "Basehor Tournament", "January 25, 2025"]},
			{label: "Highest PPG", value: ["15.34", "15352A", "Basehor Tournament", "January 25, 2025"]},
			{label: "Highest Driver Skills", value: ["66666666", "15352A", "Basehor Tournament", "January 25, 2025"]},
		]
	},
	{
		name: "Other Data Set",
		order: 3,
		data: [
			{label: "Highest Score", value: ["50", "7862D & 7862U", "Basehor Tournament", "January 25, 2025"]},
			{label: "Highest PPG", value: ["15.34", "15352A", "Basehor Tournament", "January 25, 2025"]},
			{label: "Highest Driver Skills", value: ["66666666", "15352A", "Basehor Tournament", "January 25, 2025"]},
			{label: "Highest Score", value: ["50", "7862D & 7862U", "Basehor Tournament", "January 25, 2025"]},
			{label: "Highest PPG", value: ["15.34", "15352A", "Basehor Tournament", "January 25, 2025"]},
			{label: "Highest Driver Skills", value: ["66666666", "15352A", "Basehor Tournament", "January 25, 2025"]},
			{label: "Highest Score", value: ["50", "7862D & 7862U", "Basehor Tournament", "January 25, 2025"]},
			{label: "Highest PPG", value: ["15.34", "15352A", "Basehor Tournament", "January 25, 2025"]},
			{label: "Highest Driver Skills", value: ["66666666", "15352A", "Basehor Tournament", "January 25, 2025"]},
			{label: "Highest Score", value: ["50", "7862D & 7862U", "Basehor Tournament", "January 25, 2025"]},
			{label: "Highest PPG", value: ["15.34", "15352A", "Basehor Tournament", "January 25, 2025"]},
			{label: "Highest Driver Skills", value: ["66666666", "15352A", "Basehor Tournament", "January 25, 2025"]},
		]
	}
]

const EnhancedEmcee_Region: React.FC<{}> = () => {
	const [currentProgram, _currentProgram] = useState<string>("");
	const [currentSeason, _currentSeason] = useState<string>("");
	const [currentRegion, _currentRegion] = useState<string>("");

	const [programList, _programList] = useState<TSProj.EnhancedEmcee.Region.DropdownItem[]>([]);
	const [seasonList, _seasonList] = useState<TSProj.EnhancedEmcee.Region.DropdownItem[]>([]);
	const [regionList, _regionList] = useState<TSProj.EnhancedEmcee.Region.DropdownItem[]>([]);

	const [displayData, _displayData] = useState<TSProj.EnhancedEmcee.Region.DataResponse>([]);

	const [openAccordion, _openAccordion] = useState<string>("_filter"); //default for showing filter on phones

	useEffect(() => {
		//load the list of programs - when returned, set currentProgram to defaultCode if present
		console.log("loading list of programs");
		setTimeout(() => {
			_programList(tempProgram.data);
			if (tempProgram.defaultCode !== null) {
				_currentProgram(tempProgram.defaultCode);
			}
		}, 3000);
	}, []);

	useEffect(() => {
		//load the list of seasons filtered by the selected program - when returned, set currentSeason to defaultCode if present
		setTimeout(() => {
			_seasonList(tempSeason.data);
			if (tempSeason.defaultCode !== null) {
				_currentSeason(tempSeason.defaultCode);
			}
		}, 3000);
	}, [programList, currentProgram]);

	useEffect(() => {
		//load the list of regions filtered by the selected program - when returned, set currentRegion to defaultCode if present
		setTimeout(() => {
			_regionList(tempRegion.data);
			if (tempRegion.defaultCode !== null) {
				_currentRegion(tempRegion.defaultCode);
			}
		}, 3000);
	}, [seasonList, currentSeason]);

	useEffect(() => {
		//load all data for the current region - put result in displayData
		setTimeout(() => {
			_displayData(tempDisplay);
		}, 3000);
	}, [regionList, currentRegion]);

	return (
		<div style={{width: "96%", margin: "4% auto 0 auto"}}>
			<Grid container spacing={2} style={{marginBottom: "15px"}} sx={{display: {xs: "none", sm: "flex"}}}>
				{
					[
						{label: "Program", value: currentProgram, dropdownList: programList, onChange: (e: SelectChangeEvent<string>) => _currentProgram(e.target.value)},
						{label: "Season", value: currentSeason, dropdownList: seasonList, onChange: (e: SelectChangeEvent<string>) => _currentSeason(e.target.value)},
						{label: "Region", value: currentRegion, dropdownList: regionList, onChange: (e: SelectChangeEvent<string>) => _currentRegion(e.target.value)}
					].map((x, x_i) => (
						<Grid size={4} key={x_i}>
							<FormControl fullWidth>
								<InputLabel id={`dropdown-label-${x.label}`} style={{fontWeight: "bold"}}>{x.label}</InputLabel>
								<Select
									labelId={`dropdown-label-${x.label}`}
									label={x.label}
									value={x.value}
									onChange={x.onChange}
								>
									{x.dropdownList.map((y, y_i) => (
										<MenuItem key={y_i} value={y.code}>{y.display}</MenuItem>
									))}
								</Select>
							</FormControl>
						</Grid>
					))
				}
			</Grid>
			<Accordion sx={{display: {xs: "inherit", sm: "none"}}} expanded={openAccordion === "_filter"} onChange={() => _openAccordion(old => old === "_filter" ? "" : "_filter")}>
				<AccordionSummary>
					<Typography component="span" fontWeight="bold">Region Filter</Typography>
				</AccordionSummary>
				<AccordionDetails>
					<Grid container spacing={2} style={{marginBottom: "15px"}}>
						{
							[
								{label: "Program", value: currentProgram, dropdownList: programList, onChange: (e: SelectChangeEvent<string>) => _currentProgram(e.target.value)},
								{label: "Season", value: currentSeason, dropdownList: seasonList, onChange: (e: SelectChangeEvent<string>) => _currentSeason(e.target.value)},
								{label: "Region", value: currentRegion, dropdownList: regionList, onChange: (e: SelectChangeEvent<string>) => _currentRegion(e.target.value)}
							].map((x, x_i) => (
								<Grid size={12} key={x_i}>
									<FormControl fullWidth>
										<InputLabel id={`dropdown-label-${x.label}`} style={{fontWeight: "bold"}}>{x.label}</InputLabel>
										<Select
											labelId={`dropdown-label-${x.label}`}
											label={x.label}
											value={x.value}
											onChange={x.onChange}
										>
											{x.dropdownList.map((y, y_i) => (
												<MenuItem key={y_i} value={y.code}>{y.display}</MenuItem>
											))}
										</Select>
									</FormControl>
								</Grid>
							))
						}
					</Grid>
				</AccordionDetails>
			</Accordion>
			{
				displayData.map((x, x_i) => (
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

		</div>
	);
};

export default EnhancedEmcee_Region;
