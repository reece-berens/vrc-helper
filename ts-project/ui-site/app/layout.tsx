const RootLayout: React.FC<{children: React.ReactNode}> = ({children}) => {
	return (
		<html lang="en">
			<body>
				{children}
			</body>
		</html>
	);
}

export default RootLayout;
