import yaml from "js-yaml";
import path from "path";
import fs from "fs";
import axios from "axios";

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
  const url_github: string = "https://api.github.com/repos";
  const url_base: string = path.join(url_github, repo, "contents/workflows");
  const branch = "main";
  const modules: Array<Record<string, any>> = [];

  async function get(url: string) {
    const response = await axios.get(url);
    return await response.data;
  }

  get(url_base).then((data) => {
    data
      .filter((org: any) => org["type"] == "dir")
      .map((org: any) => org["name"])
      .forEach((org: any) => {
        // First-level (organisation) listing
        const url_org = path.join(url_base, org);
        get(url_org).then((data) => {
          data
            .filter((module_type: any) => module_type["type"] == "dir")
            .map((module_type: any) => module_type["name"])
            .forEach((module_type: any) => {
              // Second-level (module type) listing
              const url_workflow = path.join(url_org, module_type);
              get(url_workflow).then((data) => {
                data
                  .filter((workflow: any) => workflow["type"] == "dir")
                  .map((workflow: any) => workflow["name"])
                  .forEach((workflow: any) => {
                    // Third-level (module/workflow) listing
                    const url_workflow = path.join(
                      repo,
                      "workflows",
                      org,
                      module_type,
                      workflow,
                      "workflow/Snakefile"
                    );
                    const url_config = path.join(
                      "https://raw.githubusercontent.com",
                      repo,
                      branch,
                      "workflows",
                      org,
                      module_type,
                      workflow,
                      "config/config.yaml"
                    );
                    let params = {};
                    get(url_config)
                      .then((data) => {
                        params = yaml.load(data) as Record<string, any>;
                      })
                      .catch((err) => {
                        console.log("No (or invalid YAML) config file found.");
                      })
                      .finally(() => {
                        const module = {
                          name: "(" + org + ") " + FormatName(workflow),
                          type: module_type.slice(0, -1), // remove plural
                          config: {
                            url: {
                              function: "github",
                              args: [repo],
                              kwargs: {
                                path: path.join(
                                  "workflows",
                                  org,
                                  module_type,
                                  workflow,
                                  "workflow/Snakefile"
                                ),
                                branch: branch,
                              },
                            },
                            params: params,
                          },
                        };
                        console.log(module);
                        modules.push(module);
                      }); // end get(url_config)
                  }); // end forEach workflow
              }); // end get(url_workflow)
            }); // end forEach module_type
        }); // end get(url_org)
      }); // end forEach org
  }); // end get(url_base)
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

export {
  GetLocalModules,
  GetModulesList,
  GetRemoteModulesGithubDirectoryListing,
};
