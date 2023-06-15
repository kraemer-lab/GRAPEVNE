//import { GetLocalModules } from "./index";
const { GetRemoteModulesGithubDirectoryListing } = require("../dist/index");

/*test('Placeholder', () => {
    expect(true).toBe(true);
});*/

//console.log(GetLocalModules("../../snakeshack"));
console.log(GetRemoteModulesGithubDirectoryListing("jsbrittain/snakeshack"));
