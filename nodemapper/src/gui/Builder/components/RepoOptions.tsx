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

  const [repoLabel, setRepoLabel] = useState("");
  const [repoURL, setRepoURL] = useState("");
  // Repo type is (type, listing_type)
  const [repoFormType, setRepoFormType] = useState("GithubDirectory");
  const [repoLocale, setRepoLocale] = useState("github");
  const [repoListingType, setRepoListingType] = useState("DirectoryListing");

  const [repoListSelectedItems, setRepoListSelectedItems] = useState("");

  const selectRepositoryTarget = (target) => {
    console.log(target);
    let repo = {};
    switch (target) {
      case "LocalFilesystem":
        repo = {
          type: "local",
          listing_type: "DirectoryListing",
        };
        break;
      case "GithubDirectory":
        repo = {
          type: "github",
          listing_type: "DirectoryListing",
        };
        break;
      case "GithubBranch":
        repo = {
          type: "github",
          listing_type: "BranchListing",
        };
        break;
      default:
        console.error("Unknown repository type selected: ", target);
    }
    setRepoListingType(repo["listing_type"]);
    setRepoLocale(repo["type"]);
    setRepoFormType(target);
  };

  const OnClickAddItem = () => {
    repoSettings.push({
      type: repoLocale, // github | local
      label: repoLabel, // user label for the repo
      listing_type: "DirectoryListing", // LocalFilesystem | DirectoryListing | BranchListing
      repo: repoURL, // github repo or local path
    });
    dispatch(builderSetRepositoryTarget(repoSettings));
  };

  const OnClickRemoveItem = () => {
    console.log("Remove item:", repoListSelectedItems);
    const newRepoSettings = repoSettings.filter(
      (repo) => repo.label !== repoListSelectedItems
    );
    dispatch(builderSetRepositoryTarget(newRepoSettings));
  };

  const RepoListSelectItem = (value) => {
    console.log("RepoListSelectItem:", value);
    const selected_repo = repoSettings.filter(
      (repo) => repo.label !== repoListSelectedItems
    )[0];
    // Display repo settings On form
    setRepoLocale(selected_repo.type);
    setRepoLabel(selected_repo.label);
    setRepoListingType(selected_repo.listing_type);
    if (selected_repo.type === "local") {
      setRepoFormType("LocalFilesystem");
    } else {
      setRepoFormType("GithubDirectory");
    }
    setRepoURL(selected_repo.repo);
    // Set the selected item
    setRepoListSelectedItems(value);
  };

  return (
    <div
      style={{
        backgroundColor: panel_background_color,
        padding: "5px",
      }}
    >
      <p>
        <b>Repository list</b>
      </p>
      <select
        id="selectBuilderSettingsRepositoryList"
        size={8}
        // multiple={true}
        style={{ width: "100%" }}
        onChange={(e) => RepoListSelectItem(e.target.value)}
      >
        {repoSettings.map((repo) => (
          <option key={repo.label}>{repo.label}</option>
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
            style={{ marginRight: "5px" }}
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
          value={repoLabel}
          onChange={(e) => setRepoLabel(e.target.value)}
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
          value={repoFormType}
          onChange={(e) => selectRepositoryTarget(e.target.value)}
          style={{ width: "100%" }}
        >
          <option value="GithubDirectory">Github (Directory Listing)</option>
          <option value="LocalFilesystem">Local filesystem</option>
          {/*<option value="GithubBranch">Github (Branch Listing)</option>*/}
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
          onChange={(e) => setRepoURL(e.target.value)}
          style={{ width: "100%" }}
        />
      </div>
    </div>
  );
};

export default RepoOptions;
