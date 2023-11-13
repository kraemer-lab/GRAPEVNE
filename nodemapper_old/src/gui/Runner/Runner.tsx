import React from "react";
import Header from "./Header";
import MainPanel from "./MainPanel";

// Layout for main window, including sliding-pane support
const Runner = () => {
  return (
    <>
      <div className="header">
        <Header />
      </div>

      <div className="main">
        <MainPanel />
      </div>
    </>
  );
};

export default Runner;
