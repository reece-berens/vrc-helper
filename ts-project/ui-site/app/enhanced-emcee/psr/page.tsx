"use client";
import {Dispatch, Fragment, SetStateAction, useEffect, useState} from "react";
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

const baseAPI = process.env.NEXT_PUBLIC_API_URL || "";
const apiUsername = process.env.NEXT_PUBLIC_API_USERNAME || "";
const apiPassword = process.env.NEXT_PUBLIC_API_PASSWORD || "";

const EnhancedEmcee_Region: React.FC<{}> = () => {
	const [currentProgram, _currentProgram] = useState<string>("");
	const [currentSeason, _currentSeason] = useState<string>("");
	const [currentRegion, _currentRegion] = useState<string>("");

	const [programList, _programList] = useState<TSProj.EnhancedEmcee.ProgramSeasonRegion.DropdownItem[]>([]);
	const [seasonList, _seasonList] = useState<TSProj.EnhancedEmcee.ProgramSeasonRegion.DropdownItem[]>([]);
	const [regionList, _regionList] = useState<TSProj.EnhancedEmcee.ProgramSeasonRegion.DropdownItem[]>([]);

	const [displayData, _displayData] = useState<TSProj.EnhancedEmcee.ProgramSeasonRegion.DataResponse>([]);

	const [openAccordion, _openAccordion] = useState<string>("_filter"); //default for showing filter on phones

	const LoadDropdownList = (url: URL, updateList: Dispatch<SetStateAction<TSProj.EnhancedEmcee.ProgramSeasonRegion.DropdownItem[]>>, updateSelected: Dispatch<SetStateAction<string>>) => {
		const request: Request = new Request(url);
		if (apiUsername !== "" && apiPassword !== "") {
			request.headers.append("Authorization", "Basic " + btoa(`${apiUsername}:${apiPassword}`));
		}
		fetch(request).then(data => {
			if (data.status === 200) {
				data.json().then((respObj: TSProj.EnhancedEmcee.ProgramSeasonRegion.DropdownResponse) => {
					updateList(respObj.data);
					if (respObj.defaultCode !== null) {
						updateSelected(respObj.defaultCode);
					}
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

	useEffect(() => {
		//load the list of programs - when returned, set currentProgram to defaultCode if present
		console.log("Loading Program List");
		//when the list of programs changes, reset selected season and region
		if (baseAPI === "") {
			//invalid configuration
			console.error(`No valid Base API environment variable is present - cannot load programs`);
		}
		else {
			const url: URL = new URL("/enhanced-emcee/psr/dd/programs", baseAPI);
			LoadDropdownList(url, _programList, _currentProgram);
		}
	}, []);

	useEffect(() => {
		//load the list of seasons filtered by the selected program - when returned, set currentSeason to defaultCode if present
		_currentSeason("");
		_seasonList([]);
		if (currentProgram !== "") {
			console.log("Loading Season List");
			if (baseAPI === "") {
				//invalid configuration
				console.error(`No valid Base API environment variable is present - cannot load seasons`);
			}
			else {
				const url: URL = new URL("/enhanced-emcee/psr/dd/seasons", baseAPI);
				url.searchParams.append("programID", currentProgram);
				LoadDropdownList(url, _seasonList, _currentSeason);
			}
		}
	}, [programList, currentProgram]);

	useEffect(() => {
		//load the list of regions filtered by the selected program - when returned, set currentRegion to defaultCode if present
		_currentRegion("");
		_regionList([]);
		if (currentProgram !== "" && currentSeason !== "") {
			console.log("Loading Region List");
			if (baseAPI === "") {
				//invalid configuration
				console.error(`No valid Base API environment variable is present - cannot load regions`);
			}
			else {
				const url: URL = new URL("/enhanced-emcee/psr/dd/regions", baseAPI);
				url.searchParams.append("programID", currentProgram);
				url.searchParams.append("seasonID", currentSeason);
				LoadDropdownList(url, _regionList, _currentRegion);
			}
		}
	}, [seasonList, currentSeason]);

	useEffect(() => {
		//load all data for the current region - put result in displayData
		_displayData([]);
		if (currentProgram !== "" && currentSeason !== "" && currentRegion !== "") {
			console.log("Loading Display Data");
			if (baseAPI === "") {
				//invalid configuration
				console.error(`No valid Base API environment variable is present - cannot load data`);
			}
			else {
				const url: URL = new URL("/enhanced-emcee/psr/data", baseAPI);
				url.searchParams.append("programID", currentProgram);
				url.searchParams.append("seasonID", currentSeason);
				url.searchParams.append("region", currentRegion);
				const request: Request = new Request(url);
				if (apiUsername !== "" && apiPassword !== "") {
					request.headers.append("Authorization", "Basic " + btoa(`${apiUsername}:${apiPassword}`));
				}
				fetch(request).then(data => {
					if (data.status === 200) {
						data.json().then((respObj: TSProj.EnhancedEmcee.ProgramSeasonRegion.DataResponse) => {
							respObj.sort((a, b) => a.order < b.order ? -1 : 1);
							_displayData(respObj);
							if (respObj.length > 0) {
								_openAccordion(respObj[0].name);
							}
						});
					}
					else {
						data.text().then(dataText => {
							console.error(`ERROR invalid response when getting list of display data - ${data.status}`, dataText);
						}).catch(e => {
							console.error(`ERROR exception reading body of response when an error occurred ${data.status}`);
						});
					}
				}).catch(error => {
					console.error(`ERROR exception getting list of display data`, error)
				});
			}
		}
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
