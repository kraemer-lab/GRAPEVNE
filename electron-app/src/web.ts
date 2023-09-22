import yaml from "js-yaml";
import path from "path";
import fs from "fs";
import axios from "axios";

const load_config = true;

const GetModuleConfig = async (
  repo: Record<string, unknown>,
  snakefile: Record<string, unknown> | string
) => {
  console.log("GetModuleConfig: ", repo);
  let workflow_url = "";
  let config_url = "";
  let snakefile_str = "";
  switch (repo["type"]) {
    case "github":
      snakefile_str = (snakefile as Record<string, Record<string, string>>)[
        "kwargs"
      ]["path"];
      workflow_url =
        "https://raw.githubusercontent.com/" +
        (repo.repo as string) +
        "/main/" +
        snakefile_str;
      // Strip 'workflow/Snakefile' and replace with 'config/config.yaml'
      // TODO: Read Snakefile and look for config file at relative path
      config_url = workflow_url;
      config_url = config_url.substring(0, config_url.lastIndexOf("/"));
      config_url = config_url.substring(0, config_url.lastIndexOf("/"));
      config_url += "/config/config.yaml";
      return await axios
        .get(config_url)
        .then((response) => {
          return yaml.load(response.data) as Record<string, unknown>;
        })
        .catch(() => {
          console.log("No (or invalid YAML) config file found.");
          return {};
        });
      break;
    case "local":
      workflow_url = snakefile as string;
      config_url = workflow_url;
      config_url = config_url.substring(0, config_url.lastIndexOf(path.sep));
      config_url = config_url.substring(0, config_url.lastIndexOf(path.sep));
      config_url = path.join(config_url, "config", "config.yaml");
      try {
        return yaml.load(fs.readFileSync(config_url, "utf8")) as Record<
          string,
          unknown
        >;
      } catch (err) {
        console.log("No (or invalid YAML) config file found.");
      }
      break;
    default:
      throw new Error("Invalid url type: " + repo["type"]);
  }
};

const GetModulesList = async (url: Record<string, unknown>) => {
  console.log("GetModulesList: ", url);
  switch (url["type"]) {
    case "github":
      return GetRemoteModulesGithub(
        url["repo"] as string,
        url["listing_type"] as string
      );
    case "local":
      return GetLocalModules(url["repo"] as string);
    default:
      throw new Error("Invalid url type: " + url["type"]);
  }
};

const GetFolders = (root_folder: string): Array<string> =>
  fs
    .readdirSync(root_folder, { withFileTypes: true })
    .filter((f) => f.isDirectory())
    .map((f) => f.name);

const GetLocalModules = (
  root_folder: string
): Array<Record<string, unknown>> => {
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

        let config = {};
        let module_classification = module_type.slice(0, -1); // remove plural
        if (load_config) {
          try {
            config = yaml.load(fs.readFileSync(config_file, "utf8")) as Record<
              string,
              unknown
            >;
          } catch (err) {
            console.log("No (or invalid YAML) config file found.");
          }
          module_classification = GetModuleClassification(config);
        }
        modules.push({
          name: "(" + org + ") " + FormatName(workflow),
          type: module_classification,
          config: {
            snakefile: url_workflow,
            config: config,
          },
        });
      }
    }
  }
  return modules;
};

const GetRemoteModulesGithub = async (
  repo: string,
  listing_type: string
): Promise<Record<string, unknown>[]> => {
  switch (listing_type) {
    case "DirectoryListing":
      return GetRemoteModulesGithubDirectoryListing(repo);
    case "BranchListing":
      return GetRemoteModulesGithubBranchListing(repo);
    default:
      throw new Error("Invalid Github listing type.");
  }
};

const GetRemoteModulesGithubDirectoryListing = async (
  repo: string
): Promise<Record<string, unknown>[]> => {
  const url_github = "https://api.github.com/repos";
  const url_base: string = path.join(url_github, repo, "contents/workflows");
  const branch = "main";
  const modules: Array<Record<string, unknown>> = [];

  async function get(url: string) {
    const response = await axios.get(url);
    return await response.data;
  }

  // First-level (organisation) listing
  const orgs = await get(url_base).then((data) => {
    return data
      .filter((org: Record<string, unknown>) => org["type"] == "dir")
      .map((org: Record<string, unknown>) => org["name"]);
  });
  for (const org of orgs) {
    const url_org = path.join(url_base, org);
    const module_types = await get(url_org).then((data) => {
      return data
        .filter(
          (module_type: Record<string, unknown>) => module_type["type"] == "dir"
        )
        .map((module_type: Record<string, unknown>) => module_type["name"])
        .reverse();
    });

    // Second-level (module type) listing
    for (const module_type of module_types) {
      const url_workflow = path.join(url_org, module_type);
      const workflows = await get(url_workflow).then((data) => {
        return data
          .filter(
            (workflow: Record<string, unknown>) => workflow["type"] == "dir"
          )
          .map((workflow: Record<string, unknown>) => workflow["name"]);
      });

      // Third-level (module/workflow) listing
      for (const workflow of workflows) {
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

        let config = {};
        let module_classification = module_type.slice(0, -1);
        if (load_config) {
          config = await get(url_config)
            .then((data) => {
              return yaml.load(data) as Record<string, unknown>;
            })
            .catch(() => {
              console.log("No (or invalid YAML) config file found.");
              return {};
            });
          module_classification = GetModuleClassification(config);
        }
        const module = {
          name: "(" + org + ") " + FormatName(workflow),
          type: module_classification,
          config: {
            snakefile: {
              function: "github",
              args: [repo],
              kwargs: {
                path: `workflows/${org}/${module_type}/${workflow}/workflow/Snakefile`,
                branch: branch,
              },
            },
            config: config,
          },
        };
        modules.push(module);
      }
    }
  }
  return modules;
};

const GetRemoteModulesGithubBranchListing = async (
  repo: string
): Promise<Record<string, unknown>[]> => {
  const url_github = "https://api.github.com/repos";
  const url_base = path.join(url_github, repo, "branches");
  const modules: Array<Record<string, unknown>> = [];

  async function get(url: string) {
    const response = await axios.get(url);
    return await response.data;
  }

  // Branch listing
  const module_types = {
    m: "module",
    c: "connector",
    s: "source",
    t: "terminal",
  };
  const branches = await get(url_base).then((data) => {
    return data
      .filter((branch: Record<string, unknown>) => branch["name"] !== "main")
      .map((branch: Record<string, unknown>) => branch["name"]);
  });
  for (const branch of branches) {
    const [module_type, module_org, module_name] = branch.split("/");
    if (!Object.keys(module_types).includes(module_type)) {
      throw new Error(
        `Invalid module type '${module_type}' in branch '${branch}'.`
      );
    }
    const url_config = path.join(
      "https://raw.githubusercontent.com",
      repo,
      branch,
      "config/config.yaml"
    );
    let config = {};
    let module_classification =
      module_types[module_type as keyof typeof module_types];
    if (load_config) {
      config = await get(url_config)
        .then((data) => {
          return yaml.load(data) as Record<string, unknown>;
        })
        .catch(() => {
          console.log("No (or invalid YAML) config file found.");
          return {};
        });
      module_classification = GetModuleClassification(config);
    }
    const module = {
      name: "(" + module_org + ") " + FormatName(module_name),
      type: module_classification,
      config: {
        snakefile: {
          function: "github",
          args: [repo],
          kwargs: {
            path: "workflow/Snakefile",
            branch: branch,
          },
        },
        config: config,
      },
    };
    modules.push(module);
  }
  return modules;
};

const FormatName = (name: string): string => {
  return name;
};

const GetModuleClassification = (config: Record<string, unknown>): string => {
  // If config is None, then default to module
  if (config === null || config === undefined) {
    return "module";
  }
  // If the input namespace exists and is anything other than null, then it is
  // a module
  if (!Object.hasOwn(config, "input_namespace"))
    // Missing input_namespace is treated as an empty string
    return "module";
  if (config["input_namespace"] === null) return "source";
  return "module";
};

export {
  GetModuleConfig,
  GetLocalModules,
  GetModulesList,
  GetRemoteModulesGithubDirectoryListing,
};
module.exports = {
  GetModuleConfig,
  GetLocalModules,
  GetModulesList,
  GetRemoteModulesGithubDirectoryListing,
};
export default module.exports;
