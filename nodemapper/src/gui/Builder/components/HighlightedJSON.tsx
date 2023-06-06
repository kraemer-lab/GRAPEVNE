import React from "react";
import ElementMaker from "./ElementMaker";

import { useState } from "react";

/*
 * HighlightedJSON code modified from:
 * https://codepen.io/benshope/pen/BxVpjo
 */

const addQuotesIfString = (value: string, isString: boolean) => {
  if (isString) {
    return `"${value}"`;
  }
  return value;
};

// TODO: Placeholder for editable fields
const setValue = (value: string) => {
  return;
};

const setShowInputEle = (showInputEle: boolean) => {
  return;
};

const highlightJSON = (jsonObj) =>
  Object.keys(jsonObj).map((key) => {
    //const [value, setValue] = useState(jsonObj[key]);
    //const [showInputEle, setShowInputEle] = useState(false);

    const value = jsonObj[key];
    const showInputEle = false;

    let valueType = typeof value;
    const isSimpleValue =
      ["string", "number", "boolean"].includes(valueType) || !value;
    if (isSimpleValue && valueType === "object") {
      valueType = "null" as undefined;
    }

    return (
      <div key={key} className="line">
        <span className="key">{key}:</span>
        {isSimpleValue ? (
          <ElementMaker
            value={value}
            valueType={valueType}
            handleChange={(e) => setValue(e.target.value)}
            handleDoubleClick={(e) => setShowInputEle(true)}
            handleBlur={() => setShowInputEle(false)}
            showInputEle={showInputEle}
          />
        ) : (
          highlightJSON(value)
        )}
      </div>
    );
  });

const HighlightedJSON = (json_obj) => {
  const json: string = json_obj.json;
  if (json === "" || json === undefined || json === JSON.stringify({}))
    return <div className="json"></div>;

  return <div className="json">{highlightJSON(JSON.parse(json))}</div>;
};

export default HighlightedJSON;
