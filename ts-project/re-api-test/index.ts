import {REAPI} from "../types-lib";
import API from "../re-api";

API.Program.List({}).then(x => {
	console.log("Good value from the list function call");
	console.log(x);
}).catch(x => {
	console.log("Bad value from the list function call");
	console.log(x);
});