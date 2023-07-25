import React from "react";
import EasyEdit from "react-easy-edit";
import { Types } from "react-easy-edit";
import { faCheck } from "@fortawesome/free-solid-svg-icons";
import { faTimes } from "@fortawesome/free-solid-svg-icons";
import { useAppDispatch } from "redux/store/hooks";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { builderUpdateNodeInfoKey } from "redux/actions";

import "./HighlightedJSON.css"

/*
 * HighlightedJSON code modified from:
 * https://codepen.io/benshope/pen/BxVpjo
 */

const protectedNames = [
  "input_namespace",
  "output_namespace",
];

interface IHighlightJSONProps {
  keylist: string[];
}

const addQuotesIfString = (value: string, isString: boolean) => {
  if (isString) return `"${value}"`;
  return value;
};


const HighlightedJSON = (json_obj) => {
  const dispatch = useAppDispatch();

  // Parse JSON string
  const json_str: string = json_obj.json;
  if (json_str === "" || json_str === undefined || json_str === JSON.stringify({}))
    return <div className="json"></div>;
  const json = JSON.parse(json_str);

  // Recursive function to render the JSON tree
  const HighlightJSON = ({keylist}: IHighlightJSONProps) => {
    // Isolate current branch in the json tree (indexed by keylist)
    let jsonObj = json;
    for(let i = 0; i < keylist.length; i++) {
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
      if (isProtectedValue && (valueType === "null")) {
        value = "(null)";
        valueType = null;
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
          ) : (
            isSimpleValue ? (
              <span
                className={valueType}
                style={{
                  display: "inline-block",
                  height: "25px",
                  minWidth: "150px",
                }}
              >
                <EasyEdit
                  type={Types.TEXT}
                  onHoverCssClass="easyEditHover"
                  // cancelOnBlur={true} // TODO: won't let you click 'save'!! //
                  saveButtonLabel={<FontAwesomeIcon icon={faCheck} />}
                  cancelButtonLabel={<FontAwesomeIcon icon={faTimes} />}
                  value={value}
                  onSave={(value) => setValue(value)}
                />
              </span>
            ) : (
              <HighlightJSON keylist={[...keylist, key]} />
            )
          )}
        </div>
      );
    });
    return <>{fieldlist}</>;
  };

  // Render the JSON tree
  return (
    <div className="json">
      <HighlightJSON keylist={[]} />
    </div>
  );
};

export default HighlightedJSON;
