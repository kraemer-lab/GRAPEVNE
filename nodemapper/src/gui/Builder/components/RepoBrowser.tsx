import React from "react";
import styled from "@emotion/styled";
import { TrayWidget } from "./TrayWidget";
import { TrayItemWidget } from "./TrayItemWidget";
import { useAppDispatch } from "redux/store/hooks";
import { useAppSelector } from "redux/store/hooks";
import { builderUpdateStatusText } from "redux/actions";

import BuilderEngine from "../BuilderEngine";
import styles from "./styles.module.css";

const InputStyled = styled.input({
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
});

const SelectStyled = styled.select({
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
});

const hash = (s: string) => {
  let hash = 0, i, chr;
  if (s.length === 0) return hash;
  for (i = 0; i < s.length; i++) {
    chr = s.charCodeAt(i);
    hash = ((hash << 5) - hash) + chr;
    hash |= 0; // Convert to 32bit integer
  }
  return hash;
}

const RepoBrowser = () => {
  const dispatch = useAppDispatch();
  const modules = useAppSelector((state) => state.builder.modules_list);
  const [filterSelection, setFilterSelection] = React.useState("");
  const [searchterm, setSearchterm] = React.useState("");
  let modules_list = modules; // create a mutable copy

  // Check for a valid module list
  if (modules_list === undefined) {
    dispatch(
      builderUpdateStatusText(
        "ERROR: Module list failed to load - check that the repository name is " +
          "correct and is reachable"
      )
    );
    modules_list = "[]";
  }

  const updateTrayItems = (filterSelection: string, searchterm: string) =>
    JSON.parse(modules_list)
      .filter(
        (m) =>
          m["name"].startsWith(filterSelection) || filterSelection === "(all)"
      )
      .filter(
        (m) =>
          m["name"].toLowerCase().includes(searchterm.toLowerCase()) ||
          searchterm === ""
      )
      .map((m) => (
        <TrayItemWidget
          key={hash(JSON.stringify(m))}
          model={m}
          name={m["name"]}
          color={BuilderEngine.GetModuleTypeColor(m["type"])}
        />
      ));

  const [trayitems, setTrayitems] = React.useState(
    updateTrayItems("(all)", "")
  );
  React.useEffect(() => {
    setFilterSelection("(all)");
    setTrayitems(updateTrayItems("(all)", ""));
  }, [modules]);

  const onChangeOrgList = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setFilterSelection(event.target.value);
    setTrayitems(updateTrayItems(event.target.value, searchterm));
  };

  const onChangeSearchTerm = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchterm(event.target.value);
    setTrayitems(updateTrayItems(filterSelection, event.target.value));
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
      <InputStyled
        type="text"
        id="repo-searchterm"
        name="repo-searchterm"
        placeholder="Search"
        value={searchterm}
        onChange={onChangeSearchTerm}
      />

      <SelectStyled
        name="orglist"
        id="orglist"
        value={filterSelection}
        onChange={onChangeOrgList}
      >
        {organisaton_list_options}
      </SelectStyled>

      <TrayWidget>{trayitems}</TrayWidget>
    </>
  );
};

export default RepoBrowser;
