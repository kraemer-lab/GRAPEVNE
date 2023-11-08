import React from "react";
import { useState } from "react";
import { useAppDispatch } from "redux/store/hooks";
import { useAppSelector } from "redux/store/hooks";
import { builderSetRepositoryTarget } from "redux/actions";

const default_input_size = 35;
const panel_background_color = "#2e3746";

const RepoOptions: React.FC = () => {
  const dispatch = useAppDispatch();
  const repoSettings = JSON.parse(
    useAppSelector((state) => state.builder.repo)
  );
  const listingType = repoSettings.listing_type;
  const [repoURL, setRepoURL] = useState(repoSettings.repo);
  const [RepoListSelectItems, SetRepoListSelectedItems] = useState([]);

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
  };

  const OnChangeURL = (url) => {
    setRepoURL(url);
  };

  const OnChangeRepoListSelectItems = (e) => {
    console.log("OnChangeRepoListSelectItems: ", e);
    //setState({values: value});
    //SetRepoListSelectedItems(value);
  }

  const OnClickAddItem = () => {
    console.log("Add item:");
    console.log("repoSettings: ", repoSettings);
    const select = document.getElementById(
      "selectBuilderSettingsRepositoryList"
    ) as HTMLSelectElement;
    const repo_settings = { ...repoSettings };
    repo_settings.repo.push({
      label: repoURL,
      repo: repoURL,
      type: listingType,
    });
    console.log("Add new:");
    console.log("repoSettings: ", repoSettings);
    console.log("repo_settings: ", repo_settings);
    dispatch(builderSetRepositoryTarget(repo_settings));
  };

  const OnClickRemoveItem = () => {
    console.log("Remove item:");
    console.log("repoSettings: ", repoSettings);
    const select = document.getElementById(
      "selectBuilderSettingsRepositoryList"
    ) as HTMLSelectElement;
    const repo_settings = { ...repoSettings };
    const new_repo_list = [];
    for (let i = 0; i < repo_settings.repo.length; i++) {
      if (!RepoListSelectItems.includes(i.toString())) {
        new_repo_list.push(repo_settings.repo[i]);
      }
    }
    repo_settings.repo = new_repo_list;
    console.log("Remove new:");
    console.log("repoSettings: ", repoSettings);
    console.log("repo_settings: ", repo_settings);
    dispatch(builderSetRepositoryTarget(repo_settings));
  };

  return (
    <div
      style={{
        backgroundColor: panel_background_color,
        padding: "5px",
      }}
    >
      <select
        id="selectBuilderSettingsRepositoryList"
        size={8}
        // multiple={true}
        style={{ width: "100%" }}
        onChange={(e) => OnChangeRepoListSelectItems(e.target.value)}
      >
        {repoSettings.map((repo) => (
          <option key={repo.label}>
            {repo.label} [{repo.repo}]
          </option>
        ))}
      </select>
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          width: "100%",
        }}
      >
        <div
          style={{
            width: "50%",
          }}
        >
          Add repository
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            width: "100%",
            justifyContent: "flex-end",
          }}
        >
          <button
            id="buttonBuilderSettingsRepositoryListAddItem"
            onClick={() => OnClickAddItem()}
          >
            ADD
          </button>
          <button
            id="buttonBuilderSettingsRepositoryListRemoveItem"
            onClick={() => OnClickRemoveItem()}
          >
            REMOVE
          </button>
        </div>
      </div>
      <div
        style={{
          display: "flex",
          gap: "10px",
          flexDirection: "row",
        }}
      >
        <div
          style={{
            width: "15%",
            textAlign: "right",
          }}
        >
          Label:
        </div>
        <input
          id="inputBuilderSettingsRepositoryLabel"
          type="text"
          size={default_input_size}
          style={{ width: "100%" }}
        />
      </div>
      <div
        style={{
          display: "flex",
          gap: "10px",
          flexDirection: "row",
        }}
      >
        <div
          style={{
            width: "15%",
            textAlign: "right",
          }}
        >
          Type:
        </div>
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
      <div
        style={{
          display: "flex",
          gap: "10px",
          flexDirection: "row",
        }}
      >
        <div
          style={{
            width: "15%",
            textAlign: "right",
          }}
        >
          URL:
        </div>
        <input
          id="inputBuilderSettingsRepositoryURL"
          type="text"
          size={default_input_size}
          value={repoURL}
          onChange={(e) => OnChangeURL(e.target.value)}
          style={{ width: "100%" }}
        />
      </div>
    </div>
  );
};

export default RepoOptions;
