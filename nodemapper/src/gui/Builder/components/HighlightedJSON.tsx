import React from "react";
import EasyEdit from "react-easy-edit";
import { Types } from "react-easy-edit";
import { faCheck } from "@fortawesome/free-solid-svg-icons";
import { faTimes } from "@fortawesome/free-solid-svg-icons";
import { useState } from "react";
import { useAppDispatch } from "redux/store/hooks";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { builderUpdateNodeInfoKey } from "redux/actions";

/*
 * HighlightedJSON code modified from:
 * https://codepen.io/benshope/pen/BxVpjo
 */

const addQuotesIfString = (value: string, isString: boolean) => {
  if (isString) return `"${value}"`;
  return value;
};

interface Props {
  jsonObj: any;
  keylist: string[];
}
const HighlightJSON = ({ jsonObj, keylist }: Props) => {
  const dispatch = useAppDispatch();
  const fieldlist = Object.keys(jsonObj).map((key) => {
    const [value, setValue] = useState(jsonObj[key]);
    let valueType = typeof value;
    const isSimpleValue =
      ["string", "number", "boolean"].includes(valueType) || !value;
    if (isSimpleValue && valueType === "object") {
      valueType = "null" as undefined;
    }
    React.useEffect(() => {
      dispatch(
        builderUpdateNodeInfoKey({ keys: [...keylist, key], value: value })
      );
    }, [value]);

    return (
      <div key={key} className="line">
        <span className="key">{key}:</span>
        {isSimpleValue ? (
          <span
            className={value}
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
          <HighlightJSON jsonObj={value} keylist={[...keylist, key]} />
        )}
      </div>
    );
  });
  return <>{fieldlist}</>;
};

const HighlightedJSON = (json_obj) => {
  const json: string = json_obj.json;
  if (json === "" || json === undefined || json === JSON.stringify({}))
    return <div className="json"></div>;
  const json_parsed = JSON.parse(json);

  return (
    <div className="json">
      <HighlightJSON jsonObj={json_parsed} keylist={[]} />
    </div>
  );
};

export default HighlightedJSON;
