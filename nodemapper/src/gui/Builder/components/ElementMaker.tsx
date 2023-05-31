import React from "react";

/*
 * ElementMaker code modified from:
 * https://codesweetly.com/reactjs-double-click-to-edit-text
 */
interface ElementMakerProps {
  value: string | number;
  valueType: string;
  handleChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleDoubleClick: (e: React.MouseEvent<HTMLSpanElement>) => void;
  handleBlur: () => void;
  showInputEle: boolean;
}
export const ElementMaker: React.FC<ElementMakerProps> = (
  props: ElementMakerProps
) => {
  // Render a span or input element based on the state of showInputEle (switched
  // by a double-click in the parent component)
  return (
    <span>
      {props.showInputEle ? (
        <input
          type="text"
          value={props.value}
          onChange={props.handleChange}
          onBlur={props.handleBlur}
          autoFocus
        />
      ) : (
        <span
          className={props.valueType}
          onDoubleClick={props.handleDoubleClick}
          style={{
            display: "inline-block",
            height: "25px",
            minWidth: "300px",
          }}
        >
          {props.value}
        </span>
      )}
    </span>
  );
};

export default ElementMaker;
