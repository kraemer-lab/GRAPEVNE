import React from "react";
import EasyEdit from "react-easy-edit";
import BuilderEngine from "../BuilderEngine";
import ParameterList from "./ParameterList";

import { useState } from "react";
import { Types } from "react-easy-edit";
import { faCheck } from "@fortawesome/free-solid-svg-icons";
import { faTimes } from "@fortawesome/free-solid-svg-icons";
import { useAppSelector } from "redux/store/hooks";
import { useAppDispatch } from "redux/store/hooks";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { builderUpdateNodeInfoKey } from "redux/actions";

import "./HighlightedJSON.css";

/*
 * HighlightedJSON code modified from:
 * https://codepen.io/benshope/pen/BxVpjo
 */

const protectedNames = [
  "input_namespace",
  "output_namespace",
  "snakefile",
  "parameter_map",
];

interface IHighlightJSONProps {
  keylist: string[];
}

const addQuotesIfString = (value: string, isString: boolean) => {
  if (isString) return `"${value}"`;
  return value;
};

interface HighlightedJSONProps {
  nodeid: string;
  json: string;
}

const lookupKey = (jsonObj, keylist: string[], key: string) => {
  for (let i = 0; i < keylist.length; i++) {
    if (jsonObj[keylist[i]] === undefined) return undefined;
    jsonObj = jsonObj[keylist[i]];
  }
  if (jsonObj[key] === undefined) return undefined;
  return jsonObj[key];
}

const HighlightedJSON = (props: HighlightedJSONProps) => {
  const dispatch = useAppDispatch();
  const display_module_settings = useAppSelector(
    (state) => state.builder.display_module_settings,
  );
  const [menu, setMenu] = useState(null);

  // Parse JSON string
  const json_str: string = props.json;
  if (
    json_str === "" ||
    json_str === undefined ||
    json_str === JSON.stringify({})
  )
    return <div className="json"></div>;
  const json = JSON.parse(json_str);
  
  // Recursive function to render the JSON tree
  const HighlightJSON = ({ keylist }: IHighlightJSONProps) => {
    // Isolate current branch in the json tree (indexed by keylist)
    let jsonObj = json;
    for (let i = 0; i < keylist.length; i++) {
      jsonObj = jsonObj[keylist[i]];
    }
    // Map the JSON sub-fields to a list of rendered elements
    const fieldlist = Object.keys(jsonObj).map((key) => {
      let value = jsonObj[key];
      let valueType: string = typeof value;
      const isSimpleValue =
        ["string", "number", "boolean"].includes(valueType) || !value;
      if (isSimpleValue && valueType === "object") {
        valueType = "null" as undefined;
      }
      let isProtectedValue = false;
      if (isSimpleValue) {
        isProtectedValue = protectedNames.includes(key);
      }
      if (isProtectedValue && valueType === "null") {
        value = "(null)";
        valueType = null;
      }
      const isHiddenValue =
        !display_module_settings && (protectedNames.includes(key) || key.startsWith(":"));
      if (isHiddenValue) {
        return <></>;
      }

      // Check whether parameter has a corresponding settings dictionary
      const keylist_lookup = [...keylist];
      keylist_lookup[keylist_lookup.length - 1] = ":params";
      const settings = lookupKey(json, keylist_lookup, key);
      const valueOptions = [];
      if (settings !== undefined) {
        if (settings["type"] === "select") {
          valueType = "select";
          for (const option of settings["options"]) {
            valueOptions.push({
              label: option,
              value: option,
            });
          }
        }
      }

      // Callback to update field in central state (triggers re-render)
      const setValue = (value) => {
        dispatch(
          builderUpdateNodeInfoKey({ keys: [...keylist, key], value: value }),
        );
      };

      // Callback to connect parameters between modules
      const connectParameter = () => {
        console.log("Connect parameter: ", key);
        setMenu({
          id: props.nodeid,
          keylist: keylist,
          keyitem: key,
          top: 100,
          bottom: 100,
          left: 100,
          right: 100,
          onclose: () => {
            setMenu(null);
          }
        });
      };

      return (
        <div key={key} className="line">
          <span className="key">
            <button
              style={{borderRadius: "50%", borderStyle: "solid", width: "15px", height: "15px"}}
              onClick={() => connectParameter()}
            />
            {'  '}{key}:
          </span>
          {isProtectedValue ? (
            <span
              className="protected"
              style={{
                display: "inline-block",
                height: "25px",
                minWidth: "150px",
              }}
            >
              {value}
            </span>
          ) : isSimpleValue ? (
            <span
              className={valueType}
              style={{
                display: "inline-block",
                height: "25px",
                minWidth: "150px",
              }}
            >
              {valueType === "boolean" ? (
                <EasyEdit
                  type={Types.SELECT}
                  onHoverCssClass="easyedit-hover"
                  saveButtonLabel={<FontAwesomeIcon icon={faCheck} />}
                  cancelButtonLabel={<FontAwesomeIcon icon={faTimes} />}
                  value={value}
                  options={[
                    { label: "true", value: true },
                    { label: "false", value: false },
                  ]}
                  onSave={(value) => {
                    setValue(value);
                  }}
                  saveOnBlur={true}
                />
              ) : (valueType === "select") ? (
                <EasyEdit
                  type={Types.SELECT}
                  onHoverCssClass="easyedit-hover"
                  saveButtonLabel={<FontAwesomeIcon icon={faCheck} />}
                  cancelButtonLabel={<FontAwesomeIcon icon={faTimes} />}
                  value={value}
                  options={valueOptions}
                  onSave={(value) => {
                    setValue(value);
                  }}
                  saveOnBlur={true}
                />
              ) : (
                <EasyEdit
                  type={Types.TEXT}
                  onHoverCssClass="easyedit-hover"
                  saveButtonLabel={<FontAwesomeIcon icon={faCheck} />}
                  cancelButtonLabel={<FontAwesomeIcon icon={faTimes} />}
                  value={value}
                  onSave={(value) => {
                    setValue(value);
                  }}
                  saveOnBlur={true}
                />
              )}
            </span>
          ) : (
            <HighlightJSON keylist={[...keylist, key]} />
          )}
        </div>
      );
    });
    return <>{fieldlist}</>;
  };

  // Render the JSON tree
  return (
    <div
      className="json"
      style={{
        borderStyle: "solid",
        borderWidth: "1px 0px 0px 0px",
      }}
    >
      <HighlightJSON keylist={[]} />
      {menu && <ParameterList {...menu} />}
    </div>
  );
};

export default HighlightedJSON;
