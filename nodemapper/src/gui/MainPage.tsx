import React from "react";
import Runner from "./Runner/Runner";
import Builder from "./Builder/Builder";

import { useState } from "react";

interface MenuChoiceRenderProps {
  selection: number;
}

const MenuChoiceRender: React.FC<MenuChoiceRenderProps> = (
  props: MenuChoiceRenderProps
) => {
  const selection = props.selection;
  if (selection == 0) {
    return <Builder />;
  } else if (selection == 1) {
    return <Runner />;
  }
};

function MainPage() {
  const [menuChoice, setMenuChoice] = useState(0);

  /*return (
    <>
      <div
        style={{
          display: "flex",
          height: "100%",
          width: "100%",
          flexFlow: "column",
        }}
      >
        <div
          className="header"
          style={{
            flex: "0 1 auto",
          }}
        >
          <link
            href="http://fonts.googleapis.com/css?family=Oswald"
            rel="stylesheet"
            type="text/css"
          />
          <div
            style={{
              fontSize: 18,
              marginLeft: 0,
            }}
          >
            PhyloFlow
            <button className="btn" onClick={() => setMenuChoice(0)}>
              BUILDER
            </button>
            <button className="btn" onClick={() => setMenuChoice(1)} disabled>
              RUNNER
            </button>
          </div>
        </div>*/
  return (
    <>
      <div
        style={{
          display: "flex",
          height: "100%",
          width: "100%",
          flexFlow: "column",
        }}
      >
        <div className="body" style={{ flex: "1 1 auto" }}>
          <MenuChoiceRender selection={menuChoice} />
        </div>
      </div>
    </>
  );
}

export default MainPage;
