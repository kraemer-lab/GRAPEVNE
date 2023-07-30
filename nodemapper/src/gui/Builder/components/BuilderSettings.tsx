import React from "react";
import { useState } from "react";
import { useAppDispatch } from "redux/store/hooks";
import { useAppSelector } from "redux/store/hooks";
import { builderSetRepositoryTarget } from "redux/actions";
import { builderSetSnakemakeArgs } from "redux/actions";

const default_input_size = 35;

const RepoOptions: React.FC = () => {
  const dispatch = useAppDispatch();
  const repoSettings = JSON.parse(
    useAppSelector((state) => state.builder.repo)
  );
  const [repoURL, setRepoURL] = useState(repoSettings.repo);

  const handleChange = (url) => {
    const repo_settings = { ...repoSettings };
    repo_settings.repo = url;
    setRepoURL(url);
    dispatch(builderSetRepositoryTarget(repo_settings));
  };

  return (
    <input
      type="text"
      size={default_input_size}
      value={repoURL}
      onChange={(e) => handleChange(e.target.value)}
    />
  );
};

const BuilderSettings = () => {
  const dispatch = useAppDispatch();
  const isvisible = useAppSelector((state) => state.builder.settings_visible);
  const listing_type = JSON.parse(
    useAppSelector((state) => state.builder.repo)
  ).listing_type;
  const snakemake_args = useAppSelector((state) => state.builder.snakemake_args);
  
  const selectRepositoryTarget = (target) => {
    let repo = {};
    switch (target) {
      case "LocalFilesystem":
        repo = {
          type: "local",
          listing_type: "DirectoryListing",
          repo: "../../snakeshack",
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
    dispatch(builderSetRepositoryTarget(repo));
  };

  const SetSnakemakeArgs = (args: string) => {
    dispatch(builderSetSnakemakeArgs(args));
  };

  return (
    <>
        <div style={{
          display: isvisible ? "block" : "none",
        }}
        >
          <p>Repository</p>
          <div>
            <select
              defaultValue={listing_type}
              onChange={(e) => selectRepositoryTarget(e.target.value)}
              style={{width: "100%"}}
            >
              <option value="LocalFilesystem">Local filesystem</option>
              <option value="DirectoryListing">Directory Listing (Github)</option>
              <option value="BranchListing">Branch Listing (Github)</option>
            </select>
          </div>
          <div>
            <RepoOptions />
          </div>
          <br />
          <p>Snakemake arguments</p>
          <input
            type="text"
            size={default_input_size}
            value={snakemake_args}
            onChange={(e) => SetSnakemakeArgs(e.target.value)}
          />
        </div>
    </>
  );
};

export default BuilderSettings;
