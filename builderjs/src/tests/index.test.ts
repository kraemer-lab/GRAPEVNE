import { GetRemoteModulesGithubDirectoryListing } from "./../index";

async function test() {
  const resp = await GetRemoteModulesGithubDirectoryListing(
    "jsbrittain/snakeshack"
  );
  console.log(resp);
}

test();
