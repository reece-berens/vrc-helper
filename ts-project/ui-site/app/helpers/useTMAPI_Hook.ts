import { useState } from "react";
import TMAPI from "./tmAPI";

const useTMAPI = (): TMAPI => {
	const [tmAPI, _tmAPI] = useState(new TMAPI());

	return tmAPI;
}

export default useTMAPI;
