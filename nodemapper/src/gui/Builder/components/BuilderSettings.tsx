import React from "react";
import { useState } from "react";
import { useAppDispatch } from "redux/store/hooks";
import { useAppSelector } from "redux/store/hooks";
import { builderSetSnakemakeArgs } from "redux/actions";
import { builderSetEnvironmentVars } from "redux/actions";
import { builderSetRepositoryTarget } from "redux/actions";
import { builderSelectSnakemakeBackend } from "redux/actions";
import { builderSetAutoValidateConnections } from "redux/actions";

const default_input_size = 35;

const RepoOptions: React.FC = () => {
  const dispatch = useAppDispatch();
  const repoSettings = JSON.parse(
    useAppSelector((state) => state.builder.repo)
  );
  const listingType = repoSettings.listing_type;
  const [repoURL, setRepoURL] = useState(repoSettings.repo);

  const selectRepositoryTarget = (target) => {
    let repo = {};
    switch (target) {
      case "LocalFilesystem":
        repo = {
          type: "local",
          listing_type: "DirectoryListing",
          repo: "/",
        };
        break;
      case "DirectoryListing":
        repo = {
          type: "github",
          listing_type: "DirectoryListing",
          repo: "kraemer-lab/vneyard",
        };
        break;
      case "BranchListing":
        repo = {
          type: "github",
          listing_type: "BranchListing",
          repo: "jsbrittain/snakeshack",
        };
        break;
      default:
        console.error("Unknown repository type selected: ", target);
    }
    setRepoURL(repo["repo"]);
    dispatch(builderSetRepositoryTarget(repo));
  };

  const handleChange = (url) => {
    const repo_settings = { ...repoSettings };
    repo_settings.repo = url;
    setRepoURL(url);
    dispatch(builderSetRepositoryTarget(repo_settings));
  };

  return (
    <>
      <div>
        <select
          id="selectBuilderSettingsRepositoryType"
          defaultValue={listingType}
          onChange={(e) => selectRepositoryTarget(e.target.value)}
          style={{ width: "100%" }}
        >
          <option value="LocalFilesystem">Local filesystem</option>
          <option value="DirectoryListing">Directory Listing (Github)</option>
          <option value="BranchListing">Branch Listing (Github)</option>
        </select>
      </div>
      <input
        id="inputBuilderSettingsRepositoryURL"
        type="text"
        size={default_input_size}
        value={repoURL}
        onChange={(e) => handleChange(e.target.value)}
        style={{ width: "100%" }}
      />
    </>
  );
};

const BuilderSettings = () => {
  const dispatch = useAppDispatch();
  const isvisible = useAppSelector((state) => state.builder.settings_visible);
  const snakemake_backend = useAppSelector(
    (state) => state.builder.snakemake_backend
  );
  const snakemake_args = useAppSelector(
    (state) => state.builder.snakemake_args
  );
  const environment_vars = useAppSelector(
    (state) => state.builder.environment_variables
  );
  const auto_validate_connections = useAppSelector(
    (state) => state.builder.auto_validate_connections
  );

  const SetSnakemakeArgs = (args: string) => {
    dispatch(builderSetSnakemakeArgs(args));
  };

  const SetEnvironmentVars = (args: string) => {
    dispatch(builderSetEnvironmentVars(args));
  };

  const selectSnakemakeBackend = (value: string) => {
    dispatch(builderSelectSnakemakeBackend(value));
  };

  const SetAutoValidateConnections = (value: boolean) => {
    dispatch(builderSetAutoValidateConnections(value));
  };

  return (
    <>
      <div
        style={{
          display: "flex",
          width: "100%",
          flexDirection: "column",
          justifyContent: "flex-start",
          alignSelf: "flex-start",
          padding: "10px",
          gap: "10px",
        }}
      >
        <div>
          <p>Repository</p>
          <RepoOptions />
        </div>
        <div>
          <p>Snakemake</p>
          <p>backend</p>
          <p>
            <select
              defaultValue={snakemake_backend}
              onChange={(e) => selectSnakemakeBackend(e.target.value)}
              style={{ width: "100%" }}
            >
              <option value="builtin">Built-in</option>
              <option value="system">System</option>
            </select>
          </p>
          <p>arguments</p>
          <p>
            <input
              id="inputBuilderSettingsSnakemakeArgs"
              type="text"
              size={default_input_size}
              value={snakemake_args}
              onChange={(e) => SetSnakemakeArgs(e.target.value)}
              style={{ width: "100%" }}
            />
          </p>
        </div>
        <div>
          <p>Environment</p>
          <p>variables</p>
          <p>
            <input
              id="inputBuilderSettingsEnvironmentVars"
              type="text"
              size={default_input_size}
              value={environment_vars}
              onChange={(e) => SetEnvironmentVars(e.target.value)}
              style={{ width: "100%" }}
            />
          </p>
        </div>
        <div>
          <p>Validation</p>
          <p>
            <input
              type="checkbox"
              id="auto_validate_connections"
              checked={auto_validate_connections}
              onChange={(e) => SetAutoValidateConnections(e.target.checked)}
            />
            <label htmlFor="auto_validate_connections">
              {" "}
              Auto-validate connections
            </label>
          </p>
        </div>
      </div>
    </>
  );
};

export default BuilderSettings;
