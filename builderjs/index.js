const yaml = require("js-yaml");
const path = require("path");
const fs = require("fs");

GetModulesList = function (url) {
  console.log("GetModulesList", url);
  switch (url["type"]) {
    case "github":
      return GetRemoteModulesGithub(url["repo"], url["listing_type"]);
    case "local":
      return GetLocalModules(url["repo"]);
    default:
      throw new Error("Invalid url type.");
  }
};

const GetFolders = (root_folder) =>
  fs
    .readdirSync(root_folder, { withFileTypes: true })
    .filter((f) => f.isDirectory())
    .map((f) => f.name);

function GetLocalModules(root_folder) {
  // static return for now
  const path_base = path.join(path.resolve(root_folder), "workflows");

  // Get list of local filesystem directories in path
  orgs = GetFolders(path_base);

  // First-level (organisation) listing
  modules = [];
  for (const org of orgs) {
    org_path = path.join(path_base, org);
    module_types = GetFolders(org_path).reverse();

    // Second-level (module type) listing
    for (const module_type of module_types) {
      module_type_path = path.join(org_path, module_type);
      workflows = GetFolders(module_type_path).sort();

      // Third-level (module/workflow) listing
      for (const workflow of workflows) {
        url_workflow = path.join(
          path_base,
          org,
          module_type,
          workflow,
          "workflow/Snakefile"
        );
        config_file = path.join(
          path_base,
          org,
          module_type,
          workflow,
          "config/config.yaml"
        );

        params = {};
        try {
          params = yaml.load(fs.readFileSync(config_file, "utf8"));
        } catch (err) {
          console.log("No (or invalid YAML) config file found.");
        }
        modules.push({
          name: "(" + org + ") " + FormatName(workflow),
          type: module_type.slice(0, -1), // remove plural
          config: {
            url: url_workflow,
            params: params,
          },
        });
      }
    }
  }
  return modules;
}

function GetRemoteModulesGithub(repo, listing_type) {
  console.log(repo);
  console.log(listing_type);
  switch (listing_type) {
    case "DirectoryListing":
      return GetRemoteModulesGithubDirectoryListing(repo);
    case "BranchListing":
      return GetRemoteModulesGithubBranchListing(repo);
    default:
      throw new Error("Invalid Github listing type.");
  }
}

function GetRemoteModulesGithubDirectoryListing(repo) {
  // static return for now
  const response = {
    query: "builder/get-remote-modules",
    body: [
      {
        name: "(Test) Dir Listing",
        type: "module",
        config: {
          url: "some url",
          params: {},
        },
      },
      {
        name: "(Test) Module2",
        type: "module",
        config: {
          url: "some url",
          params: {},
        },
      },
    ],
  };
  return response;
}

function GetRemoteModulesGithubBranchListing(repo) {
  // static return for now
  const response = {
    query: "builder/get-remote-modules",
    body: [
      {
        name: "(Test) Branch Listing",
        type: "module",
        config: {
          url: "some url",
          params: {},
        },
      },
      {
        name: "(Test) Module2",
        type: "module",
        config: {
          url: "some url",
          params: {},
        },
      },
    ],
  };
  return response;
}

function FormatName(name) {
  return name;
}

// CommonJS export methods (not ES6)
module.exports = { GetLocalModules, GetModulesList };
