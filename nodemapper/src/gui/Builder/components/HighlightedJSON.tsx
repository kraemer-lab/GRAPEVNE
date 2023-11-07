import React from "react";
import EasyEdit from "react-easy-edit";
import BuilderEngine from "../BuilderEngine";

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

const protectedNames = ["input_namespace", "output_namespace", "snakefile"];

interface IHighlightJSONProps {
  keylist: string[];
}

const addQuotesIfString = (value: string, isString: boolean) => {
  if (isString) return `"${value}"`;
  return value;
};

interface HighlightedJSONProps {
  json: string;
  onEditFocus: () => void;
  onEditBlur: () => void;
}

const HighlightedJSON = (props: HighlightedJSONProps) => {
  const dispatch = useAppDispatch();
  const display_module_settings = useAppSelector((state) => state.builder.display_module_settings);

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
      const isHiddenValue = (!display_module_settings && protectedNames.includes(key));
      if (isHiddenValue) {
        return <></>;
      }

      // Callback to update field in central state (triggers re-render)
      const setValue = (value) => {
        dispatch(
          builderUpdateNodeInfoKey({ keys: [...keylist, key], value: value })
        );
      };

      return (
        <div key={key} className="line">
          <span className="key">{key}:</span>
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
                  onFocus={(e) => props.onEditFocus()}
                  onBlur={(e) => props.onEditBlur()}
                  onSave={(value) => {
                    setValue(value);
                    props.onEditBlur();
                  }}
                  onCancel={() => props.onEditBlur()}
                  saveOnBlur={true}
                />
              ) : (
                <EasyEdit
                  type={Types.TEXT}
                  onHoverCssClass="easyedit-hover"
                  saveButtonLabel={<FontAwesomeIcon icon={faCheck} />}
                  cancelButtonLabel={<FontAwesomeIcon icon={faTimes} />}
                  value={value}
                  onFocus={(e) => props.onEditFocus()}
                  onBlur={(e) => props.onEditBlur()}
                  onSave={(value) => {
                    setValue(value);
                    props.onEditBlur();
                  }}
                  onCancel={() => props.onEditBlur()}
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
    <div className="json"
      style={{
        borderStyle: "solid",
        borderWidth: "1px 0px 0px 0px",
      }}
    >
      <HighlightJSON keylist={[]} />
    </div>
  );
};

export default HighlightedJSON;
