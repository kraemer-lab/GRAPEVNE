import React from "react";
import EasyEdit from "react-easy-edit";
import BuilderEngine from "../BuilderEngine";
import ParameterList from "./ParameterList";

import { useState } from "react";
import { Types } from "react-easy-edit";
import { faCheck } from "@fortawesome/free-solid-svg-icons";
import { faTimes } from "@fortawesome/free-solid-svg-icons";
import { getNodeByName } from "./Flow";
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

const lookupKey = (json, keylist: string[], key: string) => {
  // If key is the empty string, return the last key in the keylist
  if (key === "") {
    key = keylist[keylist.length - 1];
    keylist = keylist.slice(0, keylist.length - 1);
  }
  for (let i = 0; i < keylist.length; i++) {
    if (json[keylist[i]] === undefined) return undefined;
    json = json[keylist[i]];
  }
  if (json[key] === undefined) return undefined;
  return json[key];
}

const lookupKeyGlobal = (json, node_name: string, keylist: string[], key: string) => {
  // TODO: This is a placeholder function that should look up a key value in ANY
  // module, not just the one currently being rendered. At present the function
  // returns the same value as lookupKey.
  
  // If key is the empty string, return the last key in the keylist
  if (key === "") {
    key = keylist[keylist.length - 1];
    keylist = keylist.slice(0, keylist.length - 1);
  }
  
  // First, determine which module to look up the key in
  const nodes = useAppSelector((state) => state.builder.nodes);
  const node = getNodeByName(node_name, nodes);
  
  // Obtain the module's config
  const config = node.data.config.config;

  // Return the value
  console.log("Lookup key global: ", config, keylist, key);
  return lookupKey(config, keylist, key);
}

export const getParameterPairs = (json) => {
  // Recursively identify all parameter_map dictionaries, relative to the root
  const parameter_maps = [];
  const findParameterMaps = (jsonObj, keylist: string[]) => {
    for (const key in jsonObj) {
      if (key === "parameter_map") {
        parameter_maps.push([...keylist, key]);
      } else if (typeof jsonObj[key] === "object") {
        findParameterMaps(jsonObj[key], [...keylist, key]);
      }
    }
  };
  findParameterMaps(json, []);

  // Expand parameter maps into a list of parameter pairs
  const parameter_pairs = [];
  parameter_maps.forEach((param_map) => {
    const param_map_obj = lookupKey(json, param_map, "");
    if (param_map_obj === undefined || param_map_obj === null) return;
    param_map_obj.forEach((pair) => {
      parameter_pairs.push({
        from: [...pair["from"]],
        to: [...pair["to"]],
        root: param_map.slice(0, param_map.length - 1),
      });
    });
  });
  console.log("Parameter pairs: ", parameter_pairs);
  return parameter_pairs;
}

const ParameterLink = (props: {connectParameter}) => {
  return (
    <span
      style={{
        cursor: "pointer",
        fontSize: "0.8em",
      }}
      onClick={() => props.connectParameter()}
    >
      {' '}🔗
    </span>
  );
}

const HighlightedJSON = (props: HighlightedJSONProps) => {
  const dispatch = useAppDispatch();
  const display_module_settings = useAppSelector(
    (state) => state.builder.display_module_settings
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
  const parameter_pairs = getParameterPairs(json);

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
        return <div key={key}></div>;
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

      // TODO: Check whether setting is a connectable parameter
      const canConnectParameter = true;

      // Check whether parameter is connected to another parameter
      let isParameterConnected = false;
      let parameterValue = "(link)";
      for (const pair of parameter_pairs) {
        let pair_to = [];
        pair_to = [...pair["root"], "config", ...pair["to"]];
        if (pair_to.join("/") === [...keylist, key].join("/")) {
          isParameterConnected = true;
          let pair_from = pair["from"];
          if (pair_from[0] === "config") {
            // Parameter is connected to a parameter in the same module
            parameterValue = lookupKey(json, pair_from, "");
          } else {
            // Parameter is connected to a parameter in a different module
            const pair_node = pair_from[0];
            pair_from = pair_from.slice(1, pair_from.length);
            parameterValue = lookupKeyGlobal(json, pair_node, pair_from, "");
          }
          break;
        }
      }

      // Callback to update field in central state (triggers re-render)
      const setValue = (value) => {
        dispatch(
          builderUpdateNodeInfoKey({ keys: [...keylist, key], value: value })
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
        <div style={{cursor: "default"}} key={key} className="line">
          <span className="key">
            {key}:
          </span>
          {isProtectedValue ? (
            <span
              className="protected"
              style={{
                display: "inline-block",
                height: "25px",
              }}
            >
              {value}
            </span>
          ) : isParameterConnected ? (
            <span>
              <span
                className="linked"
                style={{
                  display: "inline-block",
                  height: "25px",
                }}
              >
                <EasyEdit
                  type={Types.TEXT}
                  style={{ cursor: "text" }}
                  onHoverCssClass="easyedit-hover"
                  value={parameterValue}
                  onSave={(value) => {return}}
                  allowEdit={false}
                />
              </span>
              <ParameterLink connectParameter={connectParameter} />
            </span>
          ) : isSimpleValue ? (
            <span>
              <span
                className={valueType}
                style={{
                  display: "inline-block",
                  height: "25px",
                }}
              >
                {valueType === "boolean" ? (
                  <EasyEdit
                    type={Types.SELECT}
                    style={{ cursor: "text" }}
                    onHoverCssClass="easyedit-hover"
                    saveButtonLabel={<FontAwesomeIcon icon={faCheck} />}
                    cancelButtonLabel={<FontAwesomeIcon icon={faTimes} />}
                    value={value ? "true" : "false"}
                    options={[
                      { label: "true", value: true },
                      { label: "false", value: false },
                    ]}
                    onSave={(value) => {
                      setValue(value === "true");
                    }}
                    saveOnBlur={true}
                  />
                ) : (valueType === "select") ? (
                  <EasyEdit
                    type={Types.SELECT}
                    style={{ cursor: "text" }}
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
                    style={{ cursor: "text" }}
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
              { canConnectParameter ? (
                <ParameterLink connectParameter={connectParameter} />
              ) : null }
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
