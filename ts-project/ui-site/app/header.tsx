"use client";
import {useRef, useState} from "react";
import {usePathname, useRouter} from "next/navigation";

import AppBar from "@mui/material/AppBar";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";

const Header: React.FC<{}> = () => {
	const pathName = usePathname();
	const router = useRouter();

	const eeMenuButton = useRef<HTMLButtonElement | null>(null);
	const [eeMenuOpen, _eeMenuOpen] = useState<boolean>(false);

	const navigate = (newPath: string) => {
		if (newPath !== pathName) {
			router.push(newPath);
		}
	}

	return (
		<AppBar position="static">
			<Toolbar>
				<Typography variant="h6" component="div" style={{marginRight: "4%"}}>VEX Helpers</Typography>
				<Box sx={{flexGrow: 1, display: {xs: "flex", md: "flex"}}}>
					<Button color="inherit" style={{marginRight: "2%"}} onClick={() => navigate("/")}>Home</Button>
					<Button color="inherit" style={{marginRight: "2%"}} onClick={() => _eeMenuOpen(true)} ref={eeMenuButton}>Enhanced Emcee</Button>
					<Button color="inherit">Stream Plugins</Button>
				</Box>
			</Toolbar>
			<Menu
				anchorEl={eeMenuButton?.current}
				open={eeMenuOpen}
				onClose={() => _eeMenuOpen(false)}
			>
				<MenuItem onClick={() => {navigate("/enhanced-emcee"); _eeMenuOpen(false);}}>Landing Page</MenuItem>
				<MenuItem onClick={() => {navigate("/enhanced-emcee/match-teams"); _eeMenuOpen(false);}}>Match Teams Data</MenuItem>
				<MenuItem onClick={() => {navigate("/enhanced-emcee/psr"); _eeMenuOpen(false);}}>Program/Season/Region Data</MenuItem>
			</Menu>
		</AppBar>
	)
};

export default Header;
