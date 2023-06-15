import { GetRemoteModulesGithubDirectoryListing } from ".";

async function test() {
  const resp = await GetRemoteModulesGithubDirectoryListing(
    "jsbrittain/snakeshack"
  );
  console.log(resp);
}

test();
