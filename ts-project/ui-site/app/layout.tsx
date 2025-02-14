"use client";
import '@fontsource/roboto/300.css';
import '@fontsource/roboto/400.css';
import '@fontsource/roboto/500.css';
import '@fontsource/roboto/700.css';

import Header from "./header";

const RootLayout: React.FC<{children: React.ReactNode}> = ({children}) => {
	return (
		<html lang="en">
			<head>
				<meta name="viewport" content="initial-scale=1, width=device-width" />
				<meta name="format-detection" content="telephone=no, date=no, email=no, address=no" />
			</head>
			<body style={{margin: "0"}}>
				<Header />
				{children}
			</body>
		</html>
	);
}

export default RootLayout;
