"use client";
import {usePathname, useRouter} from "next/navigation";

import AppBar from "@mui/material/AppBar";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";

const Header: React.FC<{}> = () => {
	const pathName = usePathname();
	const router = useRouter();

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
					<Button color="inherit" style={{marginRight: "2%"}} onClick={() => navigate("/enhanced-emcee")}>Enhanced Emcee</Button>
					<Button color="inherit">Stream Plugins</Button>
				</Box>
			</Toolbar>
		</AppBar>
	)
};

export default Header;
