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

export const HighlightedJSON = (json_obj) => {
  const json = json_obj.json;
  if (json === "" || json === undefined || json === JSON.stringify({}))
    return <div className="json"></div>;

  const highlightedJSON = (jsonObj) =>
    Object.keys(jsonObj).map((key) => {
      const [value, setValue] = useState(jsonObj[key]);
      const [showInputEle, setShowInputEle] = useState(false);

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
            highlightedJSON(value)
          )}
        </div>
      );
    });
  return <div className="json">{highlightedJSON(JSON.parse(json))}</div>;
};

export default HighlightedJSON;
