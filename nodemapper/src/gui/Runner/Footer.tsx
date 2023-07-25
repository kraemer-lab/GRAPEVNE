import React from "react";

import { useState, useEffect } from "react";
import { useAppSelector } from "redux/store/hooks";
import { useAppDispatch } from "redux/store/hooks";

import "./Footer.css";

const Footer = () => {
  const linter = useAppSelector((state) => state.runner.linter);
  const dispatch = useAppDispatch();

  let body = "";
  if (linter !== "" && linter !== undefined) {
    const json = JSON.parse(linter);
    if (json["error"]) {
      body = "Linter Error:\n" + json["error"];
    } else if (json["rules"].length == 0) {
      // No linter comments
      body = " 😊 There are no linter messages!\n" + linter;
    } else {
      body = linter;
    }
  }

  return (
    <>
      <div className="footer">
        <p>
          <textarea
            id="linter"
            style={{
              width: "100%",
              height: "100%",
              color: "#cccccc",
              background: "#555555",
              borderColor: "#333333",
            }}
            value={body}
            readOnly
          />
        </p>
      </div>
    </>
  );
};

export default Footer;
