import React from "react";
import { TrayWidget } from "./TrayWidget";
import { TrayItemWidget } from "./TrayItemWidget";
import { useAppSelector } from "redux/store/hooks";

import BuilderEngine from "../BuilderEngine";
import styles from "./styles.module.css";

const RepoBrowser = () => {
  const modules = useAppSelector((state) => state.builder.modules_list);
  const [filterSelection, setFilterSelection] = React.useState("");
  let modules_list = modules; // create a mutable copy

  // Check for a valid module list
  if (modules_list === undefined) {
    console.debug(
      "ALERT: Modules failed to load - check that the repository name is " +
        "correct and is reachable"
    );
    // Need a mechanism to queue messages back to the user (status bar is
    //  overwritten at the end of this render process)
    modules_list = "[]";
  }

  const updateTrayItems = (filter_org: string) =>
    JSON.parse(modules_list)
      .filter((m) => m["name"].startsWith(filter_org) || filter_org === "(all)")
      .map((m) => (
        <TrayItemWidget
          key={m["name"]}
          model={m}
          name={m["name"]}
          color={BuilderEngine.GetModuleTypeColor(m["type"])}
        />
      ));

  const [trayitems, setTrayitems] = React.useState(updateTrayItems("(all)"));
  React.useEffect(() => {
    setFilterSelection("(all)");
    setTrayitems(updateTrayItems("(all)"));
  }, [modules]);

  const onChangeOrgList = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setFilterSelection(event.target.value);
    setTrayitems(updateTrayItems(event.target.value));
  };

  // Extract unique organisations from the module names for a filter list
  const organisaton_list = JSON.parse(modules_list)
    .map((m) => m["name"].match(/\((.*?)\)/)[0]) // extract organisation name
    .filter((v, i, a) => a.indexOf(v) === i) // remove duplicates
    .sort(); // sort alphabetically
  organisaton_list.unshift("(all)"); // add "(all)" to the top of the list
  const organisaton_list_options = organisaton_list.map((m) => (
    <option key={m} value={m}>
      {m}
    </option>
  ));

  return (
    <>
      <select
        name="orglist"
        id="orglist"
        value={filterSelection}
        style={{
          color: "white",
          fontFamily: "Helvetica, Arial",
          padding: "5px",
          margin: "0px 10px",
          border: "solid 1px ${(p) => p.color}",
          borderRadius: "5px",
          marginBottom: "2px",
          marginTop: "2px",
          cursor: "pointer",
          width: "100%",
          background: "var(--background-color)",
          flexGrow: "0",
          flexShrink: "0",
          boxSizing: "border-box",
        }}
        onChange={onChangeOrgList}
      >
        {organisaton_list_options}
      </select>
      <TrayWidget>{trayitems}</TrayWidget>
    </>
  );
};

export default RepoBrowser;
