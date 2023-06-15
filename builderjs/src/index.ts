import yaml from "js-yaml";
import path from "path";
import fs from "fs";

//const yaml = require("js-yaml");
//const path = require("path");
//const fs = require("fs");

const GetModulesList = (url: Record<string, any>) => {
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

const GetFolders = (root_folder: string): Array<string> =>
  fs
    .readdirSync(root_folder, { withFileTypes: true })
    .filter((f: any) => f.isDirectory())
    .map((f: any) => f.name);

const GetLocalModules = (root_folder: string): Array<Record<string, any>> => {
  // static return for now
  const path_base = path.join(path.resolve(root_folder), "workflows");

  // Get list of local filesystem directories in path
  const orgs = GetFolders(path_base);

  // First-level (organisation) listing
  const modules = [];
  for (const org of orgs) {
    const org_path = path.join(path_base, org);
    const module_types = GetFolders(org_path).reverse();

    // Second-level (module type) listing
    for (const module_type of module_types) {
      const module_type_path = path.join(org_path, module_type);
      const workflows = GetFolders(module_type_path).sort();

      // Third-level (module/workflow) listing
      for (const workflow of workflows) {
        const url_workflow = path.join(
          path_base,
          org,
          module_type,
          workflow,
          "workflow/Snakefile"
        );
        const config_file = path.join(
          path_base,
          org,
          module_type,
          workflow,
          "config/config.yaml"
        );

        let params = {};
        try {
          params = yaml.load(fs.readFileSync(config_file, "utf8")) as Record<
            string,
            any
          >;
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
};

const GetRemoteModulesGithub = (
  repo: string,
  listing_type: string
): Array<Record<string, any>> => {
  switch (listing_type) {
    case "DirectoryListing":
      return GetRemoteModulesGithubDirectoryListing(repo);
    case "BranchListing":
      return GetRemoteModulesGithubBranchListing(repo);
    default:
      throw new Error("Invalid Github listing type.");
  }
};

const GetRemoteModulesGithubDirectoryListing = (
  repo: string
): Array<Record<string, any>> => {
  // static return for now
  const modules = [
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
  ];
  return modules;
};

const GetRemoteModulesGithubBranchListing = (
  repo: string
): Array<Record<string, any>> => {
  // static return for now
  const modules = [
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
  ];
  return modules;
};

const FormatName = (name: string): string => {
  return name;
};

// CommonJS export methods (not ES6)
//module.exports = { GetLocalModules, GetModulesList };
export { GetLocalModules, GetModulesList };
