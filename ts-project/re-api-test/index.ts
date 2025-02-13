import {REAPI} from "../types-lib";
import API from "../re-api";


API.Program.List(null).then(x => {
	console.log("Good value from the list function call");
	if (API.ValidResponse<REAPI.API.Program.List.Response>(x)) {
		console.log("this is a valid response from RE");
	}
	else {
		console.log("this is an INVALID response from RE");
	}
	console.log(x);
}).catch(x => {
	console.log("ERROR from Program.List");
	console.log(x);
});

